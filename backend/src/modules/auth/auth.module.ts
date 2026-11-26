import { Module } from '@nestjs/common';
import { SessionTokenService } from '../../common/services/session-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RateLimitService, SessionTokenService],
  exports: [AuthService, SessionTokenService],
})
export class AuthModule {}
