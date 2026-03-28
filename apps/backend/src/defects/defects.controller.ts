import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { DefectsService } from './defects.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';

@ApiTags('defects')
@Controller()
export class DefectsController {
  constructor(private readonly defectsService: DefectsService) {}

  @Post('projects/:projectId/defects')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a defect reference for a project' })
  @ApiResponse({ status: 201, description: 'Defect created' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN, LEAD, or TESTER role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDefectDto,
  ) {
    return this.defectsService.create(projectId, dto);
  }

  @Get('projects/:projectId/defects')
  @ApiOperation({ summary: 'List all defect references for a project' })
  @ApiResponse({ status: 200, description: 'Paginated list of defects' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by reference or description' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Param('projectId') projectId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.defectsService.findAllByProject(projectId, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('results/:resultId/defects')
  @ApiOperation({ summary: 'List defects linked to a specific test result' })
  @ApiResponse({ status: 200, description: 'Array of defects linked to the result' })
  findByTestResult(@Param('resultId') resultId: string) {
    return this.defectsService.findByTestResultId(resultId);
  }

  @Get('defects/:id')
  @ApiOperation({ summary: 'Get a defect by ID' })
  @ApiResponse({ status: 200, description: 'The defect with linked test result context' })
  @ApiResponse({ status: 404, description: 'Defect not found' })
  findOne(@Param('id') id: string) {
    return this.defectsService.findOne(id);
  }

  @Patch('defects/:id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a defect reference' })
  @ApiResponse({ status: 200, description: 'Defect updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN, LEAD, or TESTER role' })
  @ApiResponse({ status: 404, description: 'Defect not found' })
  update(@Param('id') id: string, @Body() dto: UpdateDefectDto) {
    return this.defectsService.update(id, dto);
  }

  @Delete('defects/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Remove (soft delete) a defect reference' })
  @ApiResponse({ status: 200, description: 'Defect removed' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Defect not found' })
  remove(@Param('id') id: string) {
    return this.defectsService.softDelete(id);
  }
}
