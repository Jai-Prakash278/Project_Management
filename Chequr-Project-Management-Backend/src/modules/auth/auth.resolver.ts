import {
  Resolver,
  Mutation,
  Args,
  Query,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginUser } from './dto/login-user.dto';
import { CompleteRegistrationInput } from './dto/complete-registration.input';
import { Response, Request } from 'express';


@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  /* ---------------------------
     LOGIN (UNCHANGED)
  ---------------------------- */
  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ): Promise<LoginResponse> {
    const user = await this.authService.validateLogin(email, password);
    const result = await this.authService.login(user);

    if (context.res) {
      context.res.setHeader('Authorization', `Bearer ${result.token}`);

      // Set the Refresh Token as an HttpOnly Cookie
      context.res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return {
      message: result.message,
      user: result.user,
    };
  }

  @Mutation(() => LoginResponse)
  async refreshToken(@Context() context: any): Promise<LoginResponse> {
    const req: Request = context.req;
    const res: Response = context.res;
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new Error('No refresh token found');
    }

    const result = await this.authService.refreshAccessToken(token);

    if (res) {
      res.setHeader('Authorization', `Bearer ${result.token}`);
    }

    return {
      message: result.message,
      user: result.user,
    };
  }

  @Mutation(() => String)
  async logout(@Context() context: any): Promise<string> {
    if (context.res) {
      context.res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    return "Logged out successfully";
  }

  /* ---------------------------
     ME (UNCHANGED)
  ---------------------------- */
  @Query(() => LoginUser)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context): Promise<LoginUser> {
    const user = context.req.user;
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      phone: user.phone,
    };
  }

  @Mutation(() => String)
  async forgotPassword(@Args('email') email: string) {
    const res = await this.authService.forgotPassword(email);
    return res.message;
  }

  @Mutation(() => String)
  async verifyResetOtp(
    @Args('email') email: string,
    @Args('otp') otp: string,
  ) {
    const res = await this.authService.verifyResetOtp(email, otp);
    return res.message;
  }

  @Mutation(() => String)
  async resetPassword(
    @Args('email') email: string,
    @Args('newPassword') newPassword: string,
  ) {
    const res = await this.authService.resetPassword(email, newPassword);
    return res.message;
  }



  /* ---------------------------
     COMPLETE REGISTRATION ✅ NEW
  ---------------------------- */
  /* ---------------------------
     COMPLETE REGISTRATION ✅ FIXED WITH DTO
  ---------------------------- */
  @Mutation(() => String)
  async completeRegistration(
    @Args('input') input: CompleteRegistrationInput,
  ): Promise<string> {
    return this.authService.completeRegistration(input);
  }
}