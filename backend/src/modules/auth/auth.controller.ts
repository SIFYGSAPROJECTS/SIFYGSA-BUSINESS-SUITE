import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SessionTokenService } from '../../common/services/session-token.service';
import { NOMBRE_COOKIE_SESION, type PayloadSesion } from '../../common/types/erp.types';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionToken: SessionTokenService
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Autentica al usuario y emite cookie JWT httpOnly' })
  async login(
    @Body() cuerpo: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const resultado = await this.authService.iniciarSesion(cuerpo, req.ip);
    if (!resultado.exito) {
      res.status(resultado.status);
      return {
        exito: false,
        error: resultado.error,
      };
    }

    res.cookie(
      NOMBRE_COOKIE_SESION,
      resultado.token,
      this.sessionToken.construirOpcionesCookie()
    );

    return {
      exito: true,
      mensaje: 'Autenticación exitosa',
      datos: {
        usuario: resultado.usuario,
        rutaDestino: resultado.rutaDestino,
      },
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Cierra sesión y limpia la cookie sfg_erp_session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = req.cookies?.[NOMBRE_COOKIE_SESION] as string | undefined;
    const verificacion = await this.sessionToken.verificarTokenSesion(cookieToken);
    if (verificacion.valida && verificacion.sesion) {
      await this.authService.cerrarSesion(verificacion.sesion, req.ip);
    }

    res.clearCookie(NOMBRE_COOKIE_SESION, { path: '/' });
    return {
      exito: true,
      mensaje: 'Sesión cerrada exitosamente.',
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna el payload de la sesión JWT activa' })
  me(@CurrentUser() sesion: PayloadSesion) {
    return {
      exito: true,
      datos: sesion,
    };
  }
}
