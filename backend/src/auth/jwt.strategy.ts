// src/auth/strategies/jwt.strategy.ts
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: 'secretKey', // ⚠️ Usar .env en producción
//     });
//   }

//   async validate(payload: any) {
//     console.log('🎯 JWT payload recibido en validate():', payload);
//     return { id: payload.sub, email: payload.email };
//   }
// }

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretKey',
    });
  }

  async validate(payload: any) {
    console.log('🎯 JWT payload recibido en validate():', payload);
    // 👇 Acá es clave que devuelvas el `id`
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }

}
