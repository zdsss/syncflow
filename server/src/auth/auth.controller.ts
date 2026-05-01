import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('auth/me')
  async getMe() {
    const user = await this.authService.getCurrentUser();
    return { code: 0, data: user };
  }

  @Get('teams')
  async getTeams() {
    const teams = await this.authService.getTeams();
    return { code: 0, data: teams };
  }
}
