import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import {
  CreateTestCaseStepDto,
  UpdateTestCaseStepDto,
  ReorderStepsDto,
} from './dto/test-case-step.dto';
import { CopyMoveTestCaseDto } from './dto/copy-move-test-case.dto';
import {
  BulkUpdateCasesDto,
  BulkMoveCasesDto,
  BulkDeleteCasesDto,
} from './dto/bulk-operations.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('test-cases')
@Controller('projects/:projectId')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  // ── Bulk Operations ──

  @Patch('cases/bulk')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Bulk update fields on multiple test cases' })
  @ApiResponse({ status: 200, description: 'Cases updated with count' })
  @ApiResponse({ status: 404, description: 'One or more cases not found' })
  bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() dto: BulkUpdateCasesDto,
  ) {
    return this.testCasesService.bulkUpdate(projectId, dto.caseIds, dto.fields);
  }

  @Post('cases/bulk-move')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Bulk move test cases to another suite' })
  @ApiResponse({ status: 201, description: 'Cases moved with count' })
  @ApiResponse({ status: 404, description: 'Cases or target suite not found' })
  bulkMove(
    @Param('projectId') projectId: string,
    @Body() dto: BulkMoveCasesDto,
  ) {
    return this.testCasesService.bulkMove(
      projectId,
      dto.caseIds,
      dto.targetSuiteId,
    );
  }

  @Delete('cases/bulk')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Bulk soft-delete multiple test cases' })
  @ApiResponse({ status: 200, description: 'Cases deleted with count' })
  @ApiResponse({ status: 404, description: 'One or more cases not found' })
  bulkDelete(
    @Param('projectId') projectId: string,
    @Body() dto: BulkDeleteCasesDto,
  ) {
    return this.testCasesService.bulkDelete(projectId, dto.caseIds);
  }

  // ── CSV Export / Import ──

  @Get('cases/export')
  @ApiOperation({ summary: 'Export all test cases for a project as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv'] })
  async exportCases(
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const csv = await this.testCasesService.exportCasesCsv(projectId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="test-cases-${projectId}.csv"`,
    );
    res.send(csv);
  }

  @Post('cases/import')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import test cases from a CSV file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Import results with count and errors' })
  @ApiResponse({ status: 400, description: 'Invalid CSV file' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async importCases(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    return this.testCasesService.importCasesCsv(projectId, file.buffer);
  }

  // ── Test Case CRUD ──

  @Post('suites/:suiteId/cases')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a test case in a suite' })
  @ApiResponse({ status: 201, description: 'Test case created' })
  @ApiResponse({ status: 404, description: 'Project or suite not found' })
  create(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.testCasesService.create(projectId, suiteId, dto);
  }

  @Get('suites/:suiteId/cases')
  @ApiOperation({ summary: 'List test cases in a suite with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of test cases' })
  @ApiResponse({ status: 404, description: 'Project or suite not found' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'reference', required: false, type: String, description: 'Filter by reference (partial match)' })
  findAllBySuite(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('reference') reference?: string,
  ) {
    return this.testCasesService.findAllBySuite(projectId, suiteId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      priority,
      type,
      search,
      reference,
    });
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a single test case with steps' })
  @ApiResponse({ status: 200, description: 'Test case details' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testCasesService.findOne(projectId, id);
  }

  @Patch('cases/:id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a test case' })
  @ApiResponse({ status: 200, description: 'Test case updated' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestCaseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testCasesService.update(projectId, id, dto, req.user.id);
  }

  @Get('cases/:caseId/history')
  @ApiOperation({ summary: 'Get change history for a test case' })
  @ApiResponse({ status: 200, description: 'Array of history entries' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  findHistory(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
  ) {
    return this.testCasesService.findHistory(projectId, caseId);
  }

  @Delete('cases/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Soft-delete a test case' })
  @ApiResponse({ status: 200, description: 'Test case deleted' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testCasesService.softDelete(projectId, id);
  }

  // ── Copy / Move ──

  @Post('cases/:id/copy')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Copy a test case to another suite' })
  @ApiResponse({ status: 201, description: 'Test case copied' })
  @ApiResponse({ status: 404, description: 'Test case or target suite not found' })
  copy(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: CopyMoveTestCaseDto,
  ) {
    return this.testCasesService.copyToSuite(projectId, id, dto.targetSuiteId);
  }

  @Post('cases/:id/move')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Move a test case to another suite' })
  @ApiResponse({ status: 200, description: 'Test case moved' })
  @ApiResponse({ status: 404, description: 'Test case or target suite not found' })
  move(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: CopyMoveTestCaseDto,
  ) {
    return this.testCasesService.moveToSuite(projectId, id, dto.targetSuiteId);
  }

  // ── Steps CRUD ──

  @Post('cases/:caseId/steps')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Add a step to a test case' })
  @ApiResponse({ status: 201, description: 'Step created' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  createStep(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Body() dto: CreateTestCaseStepDto,
  ) {
    return this.testCasesService.createStep(projectId, caseId, dto);
  }

  @Get('cases/:caseId/steps')
  @ApiOperation({ summary: 'List all steps of a test case' })
  @ApiResponse({ status: 200, description: 'Array of steps' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  findAllSteps(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
  ) {
    return this.testCasesService.findAllSteps(projectId, caseId);
  }

  @Patch('cases/:caseId/steps/:stepId')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a test case step' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  updateStep(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateTestCaseStepDto,
  ) {
    return this.testCasesService.updateStep(projectId, caseId, stepId, dto);
  }

  @Delete('cases/:caseId/steps/:stepId')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Delete a test case step' })
  @ApiResponse({ status: 200, description: 'Step deleted' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  deleteStep(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.testCasesService.deleteStep(projectId, caseId, stepId);
  }

  @Post('cases/:caseId/steps/reorder')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Reorder steps within a test case' })
  @ApiResponse({ status: 200, description: 'Steps reordered' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  reorderSteps(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Body() dto: ReorderStepsDto,
  ) {
    return this.testCasesService.reorderSteps(projectId, caseId, dto.stepIds);
  }
}
