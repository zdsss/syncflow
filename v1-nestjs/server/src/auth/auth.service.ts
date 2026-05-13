import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { addToBlacklist, isTokenBlacklisted } from './token-blacklist';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getCurrentUser() {
    return this.prisma.user.findFirst({
      include: {
        department: true,
        roles: { include: { role: true } },
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        departmentId: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTeams() {
    return this.prisma.team.findMany();
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const defaultDept = await this.prisma.department.findFirst({ orderBy: { sortOrder: 'asc' } });
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        departmentId: defaultDept?.id || 'd1',
      },
    });

    const { password, ...userWithoutPassword } = user as any;
    return { code: 0, data: userWithoutPassword };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      (user as any).password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await (this.prisma as any).refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const { password, ...userWithoutPassword } = user as any;
    return { code: 0, data: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    const storedToken = await (this.prisma as any).refreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }

  async logout(userId: string, accessToken?: string) {
    await (this.prisma as any).refreshToken.deleteMany({
      where: { userId },
    });
    if (accessToken) {
      addToBlacklist(accessToken);
    }
    return { code: 0, message: 'Logged out successfully' };
  }

  isTokenBlacklisted(token: string): boolean {
    return isTokenBlacklisted(token);
  }

  async switchTeam(userId: string, teamId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) {
      throw new NotFoundException('User is not a member of this team');
    }
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    return team;
  }

  async validateUser(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
