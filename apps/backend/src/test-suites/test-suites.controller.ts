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
import { Permission } from '@app/shared';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TestSuitesService } from './test-suites.service';
import { CreateTestSuiteDto } from './dto/create-test-suite.dto';
import { UpdateTestSuiteDto } from './dto/update-test-suite.dto';

@ApiTags('test-suites')
@Controller('projects/:projectId/suites')
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Post()
  @RequirePermission(Permission.EDIT_SUITES)
  @ApiOperation({ summary: 'Create a test suite (root or nested)' })
  @ApiResponse({ status: 201, description: 'Suite created' })
  @ApiResponse({ status: 404, description: 'Project or parent suite not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestSuiteDto,
  ) {
    return this.testSuitesService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all suites for a project (flat list)' })
  @ApiResponse({ status: 200, description: 'Array of suites' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findAll(@Param('projectId') projectId: string) {
    return this.testSuitesService.findAllByProject(projectId);
  }

  @Patch(':id')
  @RequirePermission(Permission.EDIT_SUITES)
  @ApiOperation({ summary: 'Update a test suite (rename, move, change description)' })
  @ApiResponse({ status: 200, description: 'Suite updated' })
  @ApiResponse({ status: 404, description: 'Suite or parent not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestSuiteDto,
  ) {
    return this.testSuitesService.update(projectId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.MANAGE_SUITES)
  @ApiOperation({ summary: 'Soft-delete a suite and all its descendants' })
  @ApiResponse({ status: 200, description: 'Suite(s) deleted' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testSuitesService.softDelete(projectId, id);
  }
}
