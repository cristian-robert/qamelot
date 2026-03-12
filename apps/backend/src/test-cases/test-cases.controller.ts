import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@ApiTags('test-cases')
@Controller('projects/:projectId')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

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
  @ApiOperation({ summary: 'List all test cases in a suite' })
  @ApiResponse({ status: 200, description: 'Array of test cases' })
  @ApiResponse({ status: 404, description: 'Project or suite not found' })
  findAllBySuite(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
  ) {
    return this.testCasesService.findAllBySuite(projectId, suiteId);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a single test case' })
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
  ) {
    return this.testCasesService.update(projectId, id, dto);
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
}
