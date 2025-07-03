import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';

@Controller('invitaciones')
export class InvitacionesController {
  constructor(private readonly invitacionesService: InvitacionesService) {}

  // Verificar invitación (GET /invitaciones/verificar?token=abc123)
  @Get('verificar')
  async verificar(@Query('token') token: string) {
    const invitacion = await this.invitacionesService.findByToken(token);
    if (!invitacion || invitacion.estado !== 'pendiente') {
      throw new NotFoundException('Invitación inválida o expirada');
    }

    return {
      valida: true,
      email: invitacion.email,
      nivel: invitacion.nivel_asignado,
    };
  }
}

