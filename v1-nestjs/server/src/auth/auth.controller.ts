import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    const users = await this.authService.getUsers();
    return { code: 0, data: users };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any) {
    const user = await this.authService.validateUser({
      sub: req.user.id,
      email: req.user.email,
    });
    return { code: 0, data: user };
  }

  @Post('switch-team')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch current team' })
  @ApiResponse({ status: 200, description: 'Team switched successfully' })
  async switchTeam(@Req() req: any, @Body() body: { teamId: string }) {
    const team = await this.authService.switchTeam(req.user.id, body.teamId);
    return { code: 0, data: team };
  }

  @Public()
  @Get('teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: 200, description: 'List of teams' })
  async getTeams() {
    const teams = await this.authService.getTeams();
    return { code: 0, data: teams };
  }
}
