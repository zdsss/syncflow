import {
  Controller,
  Get,
  INestApplication,
  Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/* ---- Fake JWT strategy for tests ---- */
@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'test-secret',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}

/* ---- Test controllers ---- */
@Controller('test-protected')
class ProtectedController {
  @Get()
  findAll() {
    return { code: 0, data: ['protected'] };
  }
}

@Controller('test-public')
class PublicController {
  @Public()
  @Get()
  findAll() {
    return { code: 0, data: ['public'] };
  }
}

/* ---- Test module ---- */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ProtectedController, PublicController],
  providers: [
    TestJwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
class TestModule {}

describe('Global JwtAuthGuard', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 for unauthenticated request to protected endpoint', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/test-protected',
    );
    expect(response.status).toBe(401);
  });

  it('should return 200 for unauthenticated request to @Public() endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/test-public');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0, data: ['public'] });
  });

  it('should return 200 for authenticated request with valid token', async () => {
    const token = jwtService.sign({ sub: 'user-1', email: 'test@example.com' });
    const response = await request(app.getHttpServer())
      .get('/api/test-protected')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0, data: ['protected'] });
  });
});
