import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
  Get,
  Query,
  ValidationPipe,
  Body,
  Post,
  Delete,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../../auth/guards/admin.guard.js';

import { UsersManagementService } from './users-management.service.js';

import { UpdateUserDto } from './dto/update-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { DeleteUsersDto } from './dto/delete-users.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersManagementController {
    constructor(private readonly usersManagementService: UsersManagementService) {}

    @Patch(':id/approve')
    approve(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.changeStatus(
            id,
            'approve',
            request.currentUser.id,
        );
    }

    @Patch(':id/reject')
    reject(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.changeStatus(
            id,
            'reject',
            request.currentUser.id,
        );
    }

    @Patch(':id/suspend')
    suspend(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.changeStatus(
            id,
            'suspend',
            request.currentUser.id,
        );
    }

    @Patch(':id/reactivate')
    reactivate(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.changeStatus(
            id,
            'reactivate',
            request.currentUser.id,
        );
    }

    @Get()
    findAll(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        )
        query: ListUsersQueryDto,
    ) {
        return this.usersManagementService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
    ) {
        return this.usersManagementService.findOne(id);
    }

    @Post()
    create(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true }))
        createUserDto: CreateUserDto,
    ) {
        return this.usersManagementService.create(createUserDto);
    }

    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true }),)
                dto: UpdateUserDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.update(
            id,
            dto,
            request.currentUser.id,
        );
    }

    @Delete('bulk')
    removeMany(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true }),)
                dto: DeleteUsersDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.removeMany(
            dto.ids,
            request.currentUser.id,
        );
    }

    @Delete(':id')
    remove(
        @Param('id', new ParseUUIDPipe({ version: '4' }))
        id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersManagementService.remove(
            id,
            request.currentUser.id,
        );
    }

}