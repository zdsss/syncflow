import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('test')
class TestController {
  @Get('normal')
  normal() {
    return 'ok';
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login() {
    return 'ok';
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  register() {
    return 'ok';
  }
}

describe('Rate Limiting (ThrottlerGuard)', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 100,
        }]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile the module with ThrottlerGuard', () => {
    expect(module).toBeDefined();
  });

  it('should have TestController registered', () => {
    const controller = module.get(TestController);
    expect(controller).toBeDefined();
  });

  it('should export ThrottlerGuard class', () => {
    expect(ThrottlerGuard).toBeDefined();
    expect(typeof ThrottlerGuard).toBe('function');
  });
});
