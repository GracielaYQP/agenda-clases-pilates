import { Controller, Post, Body, BadRequestException, NotFoundException, Param, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InvitacionesService } from 'src/invitaciones/invitaciones.service';
import { RegisterInvitacionDto } from './register-invitacion.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, 
              private readonly invitacionesService: InvitacionesService) {}

  @Post('register')
  register(@Body() dto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() body: { usuario: string; password: string }) {
    return this.authService.loginFlexible(body.usuario, body.password);
  }

  @Post('register-invitacion')
  async registerInvitacion(@Body() dto: RegisterInvitacionDto) {
    const invitacion = await this.invitacionesService.findByToken(dto.token);

    if (!invitacion || invitacion.estado !== 'pendiente') {
      throw new BadRequestException('Invitación inválida o ya usada.');
    }

    // Aquí creas el usuario, usando el nivel asignado en la invitación
    await this.authService.createUser({
      email: dto.email,
      nombre: dto.nombre,
      apellido: dto.apellido,  
      dni: dto.dni,
      telefono: invitacion.telefono,
      password: dto.password,
      nivel: invitacion.nivel_asignado,
    });

    // Marcar la invitación como usada para que no se pueda reutilizar
    await this.invitacionesService.marcarComoUsada(invitacion.id);

    return { success: true, message: 'Registro exitoso' };
  }

  @Post('invitar')
  async invitar(@Body() dto: { telefono: string; nivel: string }) {
    if (!dto.telefono || !dto.nivel) {
      throw new BadRequestException('Teléfono y nivel son requeridos');
    }

    // Generar un token único para la invitación
    const token = uuidv4();

    // Guardar la invitación en la DB (usa tu servicio)
    await this.invitacionesService.crearInvitacion(dto.telefono, dto.nivel, token);

    // Retornar el token para que el frontend genere el link
    return { token };
  }

  @Get('validar/:token')
    async validar(@Param('token') token: string) {
      const invitacion = await this.invitacionesService.findByToken(token);

      if (!invitacion || invitacion.estado !== 'pendiente') {
        throw new NotFoundException('Invitación inválida o expirada.');
      }

      return {
        telefono: invitacion.telefono,
        nivel: invitacion.nivel_asignado,
      };
    }
    
  @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
      return this.authService.sendResetPasswordEmail(body.email);
    }

  @Post('reset-password')
    resetPassword(@Body() body: { token: string; newPassword: string }) {
      return this.authService.resetPassword(body.token, body.newPassword);
  }
}



