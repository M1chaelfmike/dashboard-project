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
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async createByEmail(email: string, passwordHash: string) {
        return this.prisma.user.create({
            data: {
                email,  
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

}
