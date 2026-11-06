import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status:true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async createByEmail(name:string, email: string, passwordHash: string) {
        return this.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role:'MEMBER',
                status:'PENDING_APPROVAL'
            },
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
    }

    async updateMyProfile(
        id: string,
        name: string,
        email: string,
    ) {
        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                name,
                email,
            },
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
    }

}
