import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev_secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.roles) {
      throw new UnauthorizedException('Invalid token');
    }

    /**
     * Whatever is returned here becomes `req.user`
     */
    return {
      id: payload.sub,
      roles: payload.roles,
      email: payload.email,          
      organizationId: payload.organizationId ?? null,
    };
  }
}
