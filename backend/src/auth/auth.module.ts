// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { InvitacionesModule } from 'src/invitaciones/invitaciones.module';


@Module({
  imports: [
    UsersModule,
    InvitacionesModule,
    JwtModule.register({
      secret: 'secretKey', // ⚠️ Usar .env
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}


