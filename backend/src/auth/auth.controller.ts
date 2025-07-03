import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
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
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register-invitacion')
  async registerInvitacion(@Body() dto: RegisterInvitacionDto) {
    const invitacion = await this.invitacionesService.findByToken(dto.token);

    if (!invitacion || invitacion.estado !== 'pendiente') {
      throw new BadRequestException('Invitación inválida o ya usada.');
    }

    // Aquí creas el usuario, usando el nivel asignado en la invitación
    await this.authService.createUser({
      email: invitacion.email,
      nombre: dto.nombre,
      password: dto.password,
      nivel: invitacion.nivel_asignado,
    });

    // Marcar la invitación como usada para que no se pueda reutilizar
    await this.invitacionesService.marcarComoUsada(invitacion.id);

    return { success: true, message: 'Registro exitoso' };
  }

  @Post('invitar')
  async invitar(@Body() dto: { email: string; nivel: string }) {
    if (!dto.email || !dto.nivel) {
      throw new BadRequestException('Email y nivel son requeridos');
    }

    // Generar un token único para la invitación
    const token = uuidv4();

    // Guardar la invitación en la DB (usa tu servicio)
    await this.invitacionesService.crearInvitacion(dto.email, dto.nivel, token);

    // Retornar el token para que el frontend genere el link
    return { token };
  }
}



