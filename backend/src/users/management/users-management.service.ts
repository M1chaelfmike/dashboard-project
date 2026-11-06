
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,

} from '@nestjs/common';

import type {
  UserRole,
  UserStatus,
} from '../../generated/prisma/client.js';

import argon2 from 'argon2';

import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const statusTransitions = {
  approve: {
    from: 'PENDING_APPROVAL',
    to: 'ACTIVE',
    message: 'User approved successfully.',
  },
  reject: {
    from: 'PENDING_APPROVAL',
    to: 'REJECTED',
    message: 'User rejected successfully.',
  },
  suspend: {
    from: 'ACTIVE',
    to: 'SUSPENDED',
    message: 'User suspended successfully.',
  },
  reactivate: {
    from: 'SUSPENDED',
    to: 'ACTIVE',
    message: 'User reactivated successfully.',
  },
} as const;

type StatusAction = keyof typeof statusTransitions;

@Injectable()
export class UsersManagementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async changeStatus(
    userId: string,
    action: StatusAction,
    operatorId: string,
  ) {
    const transition = statusTransitions[action];

    // Prevent administrator self-suspension.
    if (
      action === 'suspend' &&
      userId.toLowerCase() === operatorId.toLowerCase()
    ) {
      throw new ForbiddenException(
        'You cannot suspend your own account.',
      );
    }

    try {
      const user = await this.prisma.$transaction(
        async (tx) => {
          // 1. Find target user.
          const target = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              role: true,
              status: true,
            },
          });

          if (!target) {
            throw new NotFoundException(
              'User not found.',
            );
          }

          // 2. Validate allowed status transition.
          if (target.status !== transition.from) {
            throw new ConflictException(
              `Cannot ${action} user with status ${target.status}.`,
            );
          }

          // 3. Protect the last active administrator.
          if (
            action === 'suspend' &&
            target.role === 'ADMIN'
          ) {
            const activeAdminCount =
              await tx.user.count({
                where: {
                  role: 'ADMIN',
                  status: 'ACTIVE',
                },
              });

            if (activeAdminCount <= 1) {
              throw new ConflictException(
                'Cannot suspend the last active administrator.',
              );
            }
          }

          // 4. Update only if status still matches.
          const result = await tx.user.updateMany({
            where: {
              id: userId,
              status: transition.from,
            },
            data: {
              status: transition.to,
            },
          });

          if (result.count !== 1) {
            throw new ConflictException(
              'User status has changed. Please retry.',
            );
          }

          // 5. Return safe user information.
          return tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        message: transition.message,
        user,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Concurrent user update detected. Please retry.',
        );
      }

      throw error;
    }
  }

  async findAll(query: ListUsersQueryDto) {

    const page = query.page ? Number(query.page) : 1;

    const pageSize = query.pageSize
      ? Number(query.pageSize)
      : 20;

      const skip = (page - 1) * pageSize;

      if(
        !Number.isSafeInteger(page) ||
        !Number.isSafeInteger(pageSize) ||
        !Number.isSafeInteger(skip) ||
        page < 1 ||
        pageSize < 1 ||
        pageSize > 100
      ){
        throw new BadRequestException('Invalid pagination parameters.');
      }

      const search = query.search?.trim() ?? '';

      const escapedSearch = search.replace(
        /[\\%_]/g,
          '\\$&',
        );
      const roles: UserRole[] = query.roles
        ? [...new Set(
            query.roles.split(',') as UserRole[],
          )]
        : [];

      const statuses: UserStatus[] = query.statuses
        ? [...new Set(
            query.statuses.split(',') as UserStatus[],
          )]
        : [];

        const where: Prisma.UserWhereInput = {
            ...(escapedSearch
                ?{
                    name:{
                        contains: escapedSearch,
                        mode: 'insensitive' as const,
                    },
                }
                : {}
            ),
            ...(roles.length > 0
                ? {
                    role: {
                        in: roles,
                    },
                }
                : {}
            ),
            ...(statuses.length > 0
                ? {
                    status: {
                        in: statuses,
                    },
                }
                : {}
            ),
        };

        const [total,users] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),

            this.prisma.user.findMany({
                where,
                orderBy: [
                    {createdAt: 'desc'},
                    {id: 'desc'},
                ],
                skip,
                take:pageSize,

                select :{
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        return {
            items: users,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async findOne(userId:string){
        const user = await this.prisma.user.findUnique({
            where:{
                id:userId,
            },
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                status:true,
                createdAt:true,
                updatedAt:true,
            },
        });

        if(!user){
            throw new NotFoundException(`User ${userId} not found.`);
        }
        return user;
    }

    async create(createUserDto: CreateUserDto){
      const name = createUserDto.name.trim();
      const email = createUserDto.email.trim().toLowerCase();

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select:{id:true},
      });

      if(existingUser){
        throw new ConflictException(
          'Email already exists.',
        );
      }

      const passwordHash = await argon2.hash(
        createUserDto.password,
        {
          type: argon2.argon2id,
        },
      );

      try{
        const user = await this.prisma.user.create({
          data:{
            name,
            email,
            passwordHash,
            role: createUserDto.role ?? 'MEMBER',
            status: 'ACTIVE',
          },
          select:{
            id:true,
            name:true,
            email:true,
            role:true,
            status:true,
            createdAt:true,
            updatedAt:true,
          },
        });

        return {
          message: 'User created successfully.',
          user,
        };
      }catch(error:unknown){
        if(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ){
          throw new ConflictException(
            'Email already exists.',
          );
        }

        throw error;
      }
    }

    async update(
      userId: string,
      dto: UpdateUserDto,
      operatorId: string,
    ){

      if(
        dto.name === undefined &&
        dto.email === undefined &&
        dto.role === undefined
      ){
        throw new BadRequestException(
          'At least one field must be provided.',
        );
      }

      try{
        return await this.prisma.$transaction(
          async (tx) => {
            const target = await tx.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            });

            if(!target){
              throw new NotFoundException(
                'User not found.',
              );
            }

            if(
              dto.role !== undefined &&
              dto.role !== target.role &&
              target.id === operatorId.toLowerCase()
            ){
              throw new ForbiddenException(
                'You cannot change your own role.',
              );
            }

            const normalizedEmail = dto.email?.trim().toLowerCase();

            if(
              normalizedEmail &&
              normalizedEmail !== target.email
            ){
              const existingUser = await tx.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
              });

              if(existingUser){
                throw new ConflictException(
                  'Email already exists.',
                );
              }
            }

            if(
              dto.role === 'MEMBER' &&
              target.role === 'ADMIN' &&
              target.status === 'ACTIVE'
            ){
              const activeAdminCount = await tx.user.count({
                where: {
                  role: 'ADMIN',
                  status: 'ACTIVE',
                },
              });
              if(activeAdminCount <= 1){
                throw new ConflictException(
                  'Cannot demote the last active administrator.',
                );
              }
            }

            const data: Prisma.UserUpdateInput = {};

            if(dto.name !== undefined){
              data.name = dto.name.trim();
            }

            if(normalizedEmail !== undefined){
              data.email = normalizedEmail;
            }

            if(dto.role !== undefined){
              data.role = dto.role as UserRole;
            }

            const user = await tx.user.update({
              where: { id: userId },
              data,
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            });

            return {
              message: 'User updated successfully.',
              user,
            };
          },{
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
            },
        );
      }catch(error:unknown){
        if(
          error instanceof Prisma.PrismaClientKnownRequestError
        ){
          if(error.code === 'P2002'){
            throw new ConflictException(
              'Email already exists.',
            );
          }

          if(error.code === 'P2034'){
            throw new ConflictException(
              'Concurrent user update detected. Please retry.',
            );
          }

          if(error.code === 'P2025'){
            throw new NotFoundException(
              'User not found.',
            );
          }
        }

        throw error;
      }
    }

    async remove(userId: string, operatorId: string) {
      try{
        return await this.prisma.$transaction(
          async (tx) => {
            const target = await tx.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            });

            if(!target){
              throw new NotFoundException(
                'User not found.',
              );
            }

            if(target.id === operatorId.toLowerCase()){
              throw new ForbiddenException(
                'You cannot delete your own account.',
              );
            }
            if(
              target.role === 'ADMIN' &&
              target.status === 'ACTIVE'
            ){
              const activeAdminCount = await tx.user.count({
                where: {
                  role: 'ADMIN',
                  status: 'ACTIVE',
                },
              });

                if(activeAdminCount <= 1){
                  throw new ConflictException(
                    'Cannot delete the last active administrator.',
                  );
                }
            }

            await tx.user.delete({
              where: { id: userId },
            });

            return {
              message: 'User deleted successfully.',
              userId,
            };
          },{
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
            },
        );
      }catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
        ) {
          if (error.code === 'P2025') {
            throw new NotFoundException(
              'User not found.',
            );
          }

          if (error.code === 'P2003') {
            throw new ConflictException(
              'User is referenced by other records and cannot be deleted.',
            );
          }

          if (error.code === 'P2034') {
            throw new ConflictException(
              'Concurrent user deletion detected. Please retry.',
            );
          }
        }

        throw error;
      }

    }

    async removeMany(userIds: string[], operatorId: string) {

      // PostgreSQL UUID identity is case-insensitive; normalize before deduplication.
      const ids = [...new Set(userIds.map((id) => id.toLowerCase()))];

      if (ids.length === 0) {
        throw new BadRequestException(
          'At least one user ID must be provided.',
        );
      }

      if (ids.length > 100) {
        throw new BadRequestException(
          'Cannot delete more than 100 users at once.',
        );
      }

      if (ids.includes(operatorId.toLowerCase())) {
        throw new ForbiddenException(
          'You cannot delete your own account.',
        );
      }

      try {
        return await this.prisma.$transaction(
          async (tx) => {

            // 1. Find all target users
            const targets = await tx.user.findMany({
              where: {
                id: {
                  in: ids,
                },
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            });

            // 2. Validate all users exist
            if (targets.length !== ids.length) {
              throw new NotFoundException(
                'One or more users not found.',
              );
            }

            // 3. Count active administrators
            const activeAdminsCount =
              await tx.user.count({
                where: {
                  role: 'ADMIN',
                  status: 'ACTIVE',
                },
              });

            // 4. Count selected active administrators
            const selectedActiveAdminsCount =
              targets.filter(
                (user) =>
                  user.role === 'ADMIN' &&
                  user.status === 'ACTIVE',
              ).length;

            // 5. Protect the last active administrator
            if (
              activeAdminsCount -
                selectedActiveAdminsCount < 1
            ) {
              throw new ConflictException(
                'Cannot delete all active administrators.',
              );
            }

            // 6. Delete all users atomically
            const result = await tx.user.deleteMany({
              where: {
                id: {
                  in: ids,
                },
              },
            });

            if (result.count !== ids.length) {
              throw new ConflictException(
                'User records changed during deletion. Please retry.',
              );
            }

            return {
              message: 'Users deleted successfully.',
              deletedCount: result.count,
              deletedIds: ids,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

      } catch (error: unknown) {

        // 7. Handle Prisma errors
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
        ) {

          if (error.code === 'P2034') {
            throw new ConflictException(
              'Concurrent user deletion detected. Please retry.',
            );
          }

          if (error.code === 'P2003') {
            throw new ConflictException(
              'One or more users are referenced by other records.',
            );
          }
        }

        // 8. IMPORTANT:
        // Preserve NestJS exceptions such as 400, 403, 404, 409.
        throw error;
      }
    }
}
