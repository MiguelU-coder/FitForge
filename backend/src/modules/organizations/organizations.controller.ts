import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.GLOBAL_ADMIN)
  create(@Body() body: any) {
    return this.organizationsService.create(body);
  }

  @Get()
  @Roles(UserRole.GLOBAL_ADMIN)
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ORG_ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; logoUrl?: string; planId?: string }
  ) {
    return this.organizationsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_ADMIN)
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/users')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  addUser(
    @Param('id') organizationId: string,
    @Body() body: { userId: string; role: UserRole },
  ) {
    return this.organizationsService.addUser(organizationId, body.userId, body.role);
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  removeUser(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeUser(organizationId, userId);
  }

  @Post(':id/portal-session')
  @Roles(UserRole.GLOBAL_ADMIN)
  createPortalSession(@Param('id') id: string) {
    return this.organizationsService.createPortalSession(id);
  }
}
