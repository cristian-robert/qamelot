import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestResultStatus } from '@app/shared';
import type {
  CoverageReportDto,
  ProgressReportDto,
  ActivityReportDto,
  DashboardSummaryDto,
  ProjectStatsDto,
  StatusCount,
  RunProgressEntry,
  ReferenceCoverageDto,
  ReferenceCoverageEntry,
  ComparisonReportDto,
  DefectSummaryReportDto,
  UserWorkloadReportDto,
  DateRangeFilter,
} from '@app/shared';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCoverage(projectId: string): Promise<CoverageReportDto> {
    await this.verifyProject(projectId);

    const runCases = await this.prisma.testRunCase.findMany({
      where: {
        testRun: { projectId, deletedAt: null },
      },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const totalCases = runCases.length;
    const statusMap = new Map<TestResultStatus, number>();

    for (const status of Object.values(TestResultStatus)) {
      statusMap.set(status, 0);
    }

    let covered = 0;
    for (const rc of runCases) {
      const latestStatus = rc.testResults[0]?.status as TestResultStatus | undefined;
      const status = latestStatus ?? TestResultStatus.UNTESTED;
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
      if (status !== TestResultStatus.UNTESTED) {
        covered++;
      }
    }

    const byStatus: StatusCount[] = [];
    for (const [status, count] of statusMap.entries()) {
      if (count > 0) {
        byStatus.push({ status, count });
      }
    }

    const coveragePercent = totalCases > 0
      ? Math.round((covered / totalCases) * 10000) / 100
      : 0;

    return { totalCases, covered, coveragePercent, byStatus };
  }

  async getProgress(projectId: string): Promise<ProgressReportDto> {
    await this.verifyProject(projectId);

    const runs = await this.prisma.testRun.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        testRunCases: {
          include: {
            testResults: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
    });

    const entries: RunProgressEntry[] = runs.map((run: { id: string; name: string; createdAt: Date; testRunCases: { testResults: { status: string }[] }[] }) => {
      const summary = { passed: 0, failed: 0, blocked: 0, retest: 0, untested: 0 };
      for (const trc of run.testRunCases) {
        const status = trc.testResults[0]?.status;
        switch (status) {
          case TestResultStatus.PASSED: summary.passed++; break;
          case TestResultStatus.FAILED: summary.failed++; break;
          case TestResultStatus.BLOCKED: summary.blocked++; break;
          case TestResultStatus.RETEST: summary.retest++; break;
          default: summary.untested++; break;
        }
      }
      return {
        runId: run.id,
        runName: run.name,
        createdAt: run.createdAt.toISOString(),
        total: run.testRunCases.length,
        ...summary,
      };
    });

    return { runs: entries };
  }

  async getActivity(projectId: string, dateRange?: DateRangeFilter): Promise<ActivityReportDto> {
    await this.verifyProject(projectId);

    const dateFilter = this.buildDateFilter(dateRange);

    const results = await this.prisma.testResult.findMany({
      where: {
        testRun: { projectId, deletedAt: null },
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
        executedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMap = new Map<string, { userId: string; userName: string; count: number }>();
    for (const r of results) {
      const dateStr = r.createdAt.toISOString().slice(0, 10);
      const key = `${dateStr}|${r.executedBy.id}`;
      const existing = bucketMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        bucketMap.set(key, {
          userId: r.executedBy.id,
          userName: r.executedBy.name,
          count: 1,
        });
      }
    }

    const entries = Array.from(bucketMap.entries()).map(([key, val]) => ({
      date: key.split('|')[0],
      userId: val.userId,
      userName: val.userName,
      count: val.count,
    }));

    return { entries };
  }

  async getSummary(): Promise<DashboardSummaryDto> {
    const [totalProjects, activeRuns, recentResults] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.testRun.count({
        where: { status: 'IN_PROGRESS', deletedAt: null },
      }),
      this.prisma.testResult.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          executedBy: { select: { name: true } },
          testRun: { select: { name: true } },
          testRunCase: {
            select: { testCase: { select: { title: true } } },
          },
        },
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivityCount = await this.prisma.testResult.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const passRate = await this.calculateOverallPassRate();

    return {
      totalProjects,
      activeRuns,
      overallPassRate: passRate,
      recentActivityCount,
      recentResults: recentResults.map((r: { id: string; status: string; executedBy: { name: string }; testRun: { name: string }; testRunCase: { testCase: { title: string } }; createdAt: Date }) => ({
        id: r.id,
        status: r.status as TestResultStatus,
        userName: r.executedBy.name,
        runName: r.testRun.name,
        caseName: r.testRunCase.testCase.title,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async getProjectsStats(): Promise<ProjectStatsDto[]> {
    const projects = await this.prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    return Promise.all(
      projects.map(async (project) => {
        const [caseCount, activeRunCount, lastResult] = await Promise.all([
          this.prisma.testCase.count({
            where: { projectId: project.id, deletedAt: null },
          }),
          this.prisma.testRun.count({
            where: {
              status: 'IN_PROGRESS',
              deletedAt: null,
              projectId: project.id,
            },
          }),
          this.prisma.testResult.findFirst({
            where: {
              testRun: { projectId: project.id, deletedAt: null },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        const totalResults = await this.prisma.testResult.count({
          where: {
            testRun: { projectId: project.id, deletedAt: null },
          },
        });
        const passedResults = totalResults > 0
          ? await this.prisma.testResult.count({
              where: {
                status: 'PASSED',
                testRun: { projectId: project.id, deletedAt: null },
              },
            })
          : 0;

        return {
          projectId: project.id,
          caseCount,
          activeRunCount,
          passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
          lastActivityAt: lastResult?.createdAt?.toISOString() ?? null,
        };
      }),
    );
  }

  async getReferenceCoverage(projectId: string): Promise<ReferenceCoverageDto> {
    await this.verifyProject(projectId);

    // Get all test cases with references in this project
    const casesWithRefs = await this.prisma.testCase.findMany({
      where: {
        projectId,
        deletedAt: null,
        references: { not: null },
      },
      select: {
        id: true,
        references: true,
        suiteId: true,
      },
    });

    // Get all test run cases (run+suite junctions) for this project
    // with their latest result
    const runCases = await this.prisma.testRunCase.findMany({
      where: {
        testRun: { projectId, deletedAt: null },
      },
      select: {
        testCaseId: true,
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    // Build a map: testCaseId -> latest status from all run cases
    const caseStatusMap = new Map<string, TestResultStatus>();
    for (const rc of runCases) {
      const status = ((rc as { testResults: { status: string }[] }).testResults[0]?.status as TestResultStatus) ?? TestResultStatus.UNTESTED;
      const existing = caseStatusMap.get(rc.testCaseId);
      if (!existing || status !== TestResultStatus.UNTESTED) {
        caseStatusMap.set(rc.testCaseId, status);
      }
    }

    // Parse references and aggregate results per reference
    const refMap = new Map<string, ReferenceCoverageEntry>();

    for (const tc of casesWithRefs) {
      if (!tc.references) continue;

      const refs = tc.references.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0);
      const status = caseStatusMap.get(tc.id) ?? TestResultStatus.UNTESTED;

      for (const ref of refs) {
        const entry = refMap.get(ref) ?? {
          reference: ref,
          totalCases: 0,
          passed: 0,
          failed: 0,
          blocked: 0,
          retest: 0,
          untested: 0,
          coveragePercent: 0,
        };
        entry.totalCases++;

        switch (status) {
          case TestResultStatus.PASSED: entry.passed++; break;
          case TestResultStatus.FAILED: entry.failed++; break;
          case TestResultStatus.BLOCKED: entry.blocked++; break;
          case TestResultStatus.RETEST: entry.retest++; break;
          default: entry.untested++; break;
        }

        refMap.set(ref, entry);
      }
    }

    // Calculate coverage percent for each reference
    const references = Array.from(refMap.values()).map((entry) => ({
      ...entry,
      coveragePercent: entry.totalCases > 0
        ? Math.round(((entry.totalCases - entry.untested) / entry.totalCases) * 10000) / 100
        : 0,
    }));

    // Sort by reference name
    references.sort((a, b) => a.reference.localeCompare(b.reference));

    return { references };
  }

  async getComparison(
    projectId: string,
    runIdA: string,
    runIdB: string,
  ): Promise<ComparisonReportDto> {
    await this.verifyProject(projectId);

    const [runA, runB] = await Promise.all([
      this.prisma.testRun.findFirst({
        where: { id: runIdA, projectId, deletedAt: null },
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.testRun.findFirst({
        where: { id: runIdB, projectId, deletedAt: null },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    if (!runA) throw new NotFoundException(`Test run ${runIdA} not found`);
    if (!runB) throw new NotFoundException(`Test run ${runIdB} not found`);

    const [casesA, casesB] = await Promise.all([
      this.getRunCaseStatuses(runIdA),
      this.getRunCaseStatuses(runIdB),
    ]);

    const newPasses: ComparisonReportDto['newPasses'] = [];
    const newFailures: ComparisonReportDto['newFailures'] = [];
    const fixed: ComparisonReportDto['fixed'] = [];
    const regressions: ComparisonReportDto['regressions'] = [];
    let unchanged = 0;

    const allCaseIds = new Set([...casesA.keys(), ...casesB.keys()]);

    for (const caseId of allCaseIds) {
      const entryA = casesA.get(caseId);
      const entryB = casesB.get(caseId);
      const statusA = entryA?.status ?? TestResultStatus.UNTESTED;
      const statusB = entryB?.status ?? TestResultStatus.UNTESTED;
      const title = entryB?.title ?? entryA?.title ?? 'Unknown';

      if (statusA === statusB) {
        unchanged++;
        continue;
      }

      const entry = { testCaseId: caseId, testCaseTitle: title, statusInA: statusA, statusInB: statusB };

      if (statusA === TestResultStatus.FAILED && statusB === TestResultStatus.PASSED) {
        fixed.push(entry);
      } else if (statusA === TestResultStatus.PASSED && statusB === TestResultStatus.FAILED) {
        regressions.push(entry);
      } else if (statusB === TestResultStatus.PASSED && statusA !== TestResultStatus.PASSED) {
        newPasses.push(entry);
      } else if (statusB === TestResultStatus.FAILED && statusA !== TestResultStatus.FAILED) {
        newFailures.push(entry);
      } else {
        unchanged++;
      }
    }

    const countByStatus = (cases: Map<string, { status: TestResultStatus }>, status: TestResultStatus) =>
      Array.from(cases.values()).filter((c) => c.status === status).length;

    return {
      runA: {
        id: runA.id,
        name: runA.name,
        createdAt: runA.createdAt.toISOString(),
        total: casesA.size,
        passed: countByStatus(casesA, TestResultStatus.PASSED),
        failed: countByStatus(casesA, TestResultStatus.FAILED),
      },
      runB: {
        id: runB.id,
        name: runB.name,
        createdAt: runB.createdAt.toISOString(),
        total: casesB.size,
        passed: countByStatus(casesB, TestResultStatus.PASSED),
        failed: countByStatus(casesB, TestResultStatus.FAILED),
      },
      newPasses,
      newFailures,
      fixed,
      regressions,
      unchanged,
    };
  }

  async getDefectSummary(
    projectId: string,
    dateRange?: DateRangeFilter,
  ): Promise<DefectSummaryReportDto> {
    await this.verifyProject(projectId);

    const dateFilter = this.buildDateFilter(dateRange);

    const defects = await this.prisma.defect.findMany({
      where: {
        projectId,
        deletedAt: null,
        createdAt: dateFilter,
      },
      include: {
        testResult: {
          select: {
            id: true,
            status: true,
            testRunCase: {
              select: { testCase: { select: { title: true } } },
            },
            testRun: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const entries = defects.map((d: {
      id: string;
      reference: string;
      description: string | null;
      testResultId: string | null;
      createdAt: Date;
      testResult: {
        id: string;
        status: string;
        testRunCase: { testCase: { title: string } };
        testRun: { name: string };
      } | null;
    }) => {
      const ageInDays = Math.floor(
        (now.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: d.id,
        reference: d.reference,
        description: d.description,
        testResultId: d.testResultId,
        testCaseTitle: d.testResult?.testRunCase.testCase.title ?? null,
        testRunName: d.testResult?.testRun.name ?? null,
        resultStatus: (d.testResult?.status as TestResultStatus) ?? null,
        createdAt: d.createdAt.toISOString(),
        ageInDays,
      };
    });

    const ageBuckets = this.buildAgeBuckets(entries.map((e) => e.ageInDays));

    return {
      totalDefects: entries.length,
      defects: entries,
      byAge: ageBuckets,
    };
  }

  async getUserWorkload(
    projectId: string,
    dateRange?: DateRangeFilter,
  ): Promise<UserWorkloadReportDto> {
    await this.verifyProject(projectId);

    const dateFilter = this.buildDateFilter(dateRange);

    const results = await this.prisma.testResult.findMany({
      where: {
        testRun: { projectId, deletedAt: null },
        createdAt: dateFilter,
      },
      select: {
        status: true,
        executedBy: { select: { id: true, name: true } },
      },
    });

    const userMap = new Map<string, {
      userName: string;
      total: number;
      passed: number;
      failed: number;
      blocked: number;
      retest: number;
      untested: number;
    }>();

    for (const r of results) {
      const existing = userMap.get(r.executedBy.id) ?? {
        userName: r.executedBy.name,
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        retest: 0,
        untested: 0,
      };
      existing.total++;

      switch (r.status as TestResultStatus) {
        case TestResultStatus.PASSED: existing.passed++; break;
        case TestResultStatus.FAILED: existing.failed++; break;
        case TestResultStatus.BLOCKED: existing.blocked++; break;
        case TestResultStatus.RETEST: existing.retest++; break;
        default: existing.untested++; break;
      }

      userMap.set(r.executedBy.id, existing);
    }

    const users = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalAssigned: data.total,
      passed: data.passed,
      failed: data.failed,
      blocked: data.blocked,
      retest: data.retest,
      untested: data.untested,
      completionPercent: data.total > 0
        ? Math.round(((data.total - data.untested) / data.total) * 10000) / 100
        : 0,
    }));

    users.sort((a, b) => b.totalAssigned - a.totalAssigned);

    return { users };
  }

  private buildDateFilter(
    dateRange?: DateRangeFilter,
  ): { gte?: Date; lte?: Date } | undefined {
    if (!dateRange?.startDate && !dateRange?.endDate) {
      // Default to last 30 days if no range specified
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { gte: thirtyDaysAgo };
    }

    const filter: { gte?: Date; lte?: Date } = {};
    if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
    if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
    return filter;
  }

  private async getRunCaseStatuses(
    runId: string,
  ): Promise<Map<string, { status: TestResultStatus; title: string }>> {
    const runCases = await this.prisma.testRunCase.findMany({
      where: { testRunId: runId },
      select: {
        testCaseId: true,
        testCase: { select: { title: true } },
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const map = new Map<string, { status: TestResultStatus; title: string }>();
    for (const rc of runCases) {
      const status = (rc.testResults[0]?.status as TestResultStatus) ?? TestResultStatus.UNTESTED;
      map.set(rc.testCaseId, { status, title: rc.testCase.title });
    }
    return map;
  }

  private buildAgeBuckets(ages: number[]): { bucket: string; count: number }[] {
    const buckets = [
      { bucket: '0-7 days', min: 0, max: 7 },
      { bucket: '8-30 days', min: 8, max: 30 },
      { bucket: '31-90 days', min: 31, max: 90 },
      { bucket: '90+ days', min: 91, max: Infinity },
    ];

    return buckets
      .map((b) => ({
        bucket: b.bucket,
        count: ages.filter((a) => a >= b.min && a <= b.max).length,
      }))
      .filter((b) => b.count > 0);
  }

  private async calculateOverallPassRate(): Promise<number> {
    const allRunCases = await this.prisma.testRunCase.findMany({
      where: { testRun: { deletedAt: null } },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const withResults = allRunCases.filter((rc: { testResults: { status: string }[] }) => rc.testResults.length > 0);
    if (withResults.length === 0) return 0;

    const passed = withResults.filter(
      (rc: { testResults: { status: string }[] }) => rc.testResults[0].status === TestResultStatus.PASSED,
    ).length;

    return Math.round((passed / withResults.length) * 10000) / 100;
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
