import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUser() {
    return this.prisma.user.findFirst({
      include: {
        department: true,
        roles: { include: { role: true } },
      },
    });
  }

  async getTeams() {
    return this.prisma.team.findMany();
  }
}
