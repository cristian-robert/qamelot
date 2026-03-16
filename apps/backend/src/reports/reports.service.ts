import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestResultStatus } from '@app/shared';
import type {
  CoverageReportDto,
  ProgressReportDto,
  ActivityReportDto,
  DashboardSummaryDto,
  StatusCount,
  RunProgressEntry,
  ReferenceCoverageDto,
  ReferenceCoverageEntry,
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

  async getActivity(projectId: string): Promise<ActivityReportDto> {
    await this.verifyProject(projectId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await this.prisma.testResult.findMany({
      where: {
        testRun: { projectId, deletedAt: null },
        createdAt: { gte: thirtyDaysAgo },
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
