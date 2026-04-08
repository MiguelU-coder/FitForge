import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.GLOBAL_ADMIN)
  async create(@Body() body: any) {
    const org = await this.organizationsService.create(body);
    return { success: true, data: org };
  }

  @Get()
  @Roles(UserRole.GLOBAL_ADMIN)
  async findAll() {
    const orgs = await this.organizationsService.findAll();
    return { success: true, data: orgs };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const org = await this.organizationsService.findOne(id);
    return { success: true, data: org };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ORG_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; logoUrl?: string; planId?: string },
  ) {
    const org = await this.organizationsService.update(id, body);
    return { success: true, data: org };
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_ADMIN)
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(id);
    return { success: true, message: 'Organization removed successfully' };
  }

  @Post(':id/users')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  async addUser(
    @Param('id') organizationId: string,
    @Body() body: { userId: string; role: UserRole },
  ) {
    const userOrg = await this.organizationsService.addUser(organizationId, body.userId, body.role);
    return { success: true, data: userOrg };
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  removeUser(@Param('id') organizationId: string, @Param('userId') userId: string) {
    return this.organizationsService.removeUser(organizationId, userId);
  }

  @Post(':id/portal-session')
  @Roles(UserRole.GLOBAL_ADMIN)
  createPortalSession(@Param('id') id: string) {
    return this.organizationsService.createPortalSession(id);
  }
}
