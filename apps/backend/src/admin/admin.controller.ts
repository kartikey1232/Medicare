import { Controller, Get, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UserRole } from '@medidesk/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all platform users with profile and suspension status' })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Put('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspend(@Param('id') id: string, @CurrentUser() requester: any) {
    return this.adminService.suspendUser(id, requester.id);
  }

  @Put('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user account' })
  reactivate(@Param('id') id: string, @CurrentUser() requester: any) {
    return this.adminService.reactivateUser(id, requester.id);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Change a user role (Admin only)' })
  changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser() requester: any,
  ) {
    return this.adminService.updateUserRole(id, role, requester.id);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'List all registered doctors with ticket workload count' })
  listDoctors() {
    return this.adminService.listDoctors();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Retrieve recent security and administrative audit trail' })
  getAuditLogs(@Query('limit') limit: string) {
    return this.adminService.getAuditLogs(parseInt(limit) || 100);
  }
}
