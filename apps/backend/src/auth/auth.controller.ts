import { Controller, Post, Body, Req, Res, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema, RegisterInput, LoginInput } from '@medidesk/shared';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new patient, doctor, or moderator' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  async register(@Body() body: any) {
    // Validate request schema using Zod
    const parsed = RegisterSchema.parse(body) as RegisterInput;
    return this.authService.register(parsed);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and set tokens' })
  @ApiResponse({ status: 200, description: 'Successful login.' })
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = LoginSchema.parse(body) as LoginInput;
    const ip = req.ip;
    const device = req.headers['user-agent'];

    const result = await this.authService.login(parsed, ip, device);

    // Set cookie
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { user: result.user, token: result.accessToken };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and clear session' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || req.body.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || req.body.refreshToken;
    const result = await this.authService.refresh(refreshToken);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { token: result.accessToken };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Retrieve currently logged-in user details' })
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.patient?.name || user.doctor?.name || user.moderator?.name || 'Admin',
      profile: user.patient || user.doctor || user.moderator,
    };
  }
}
