import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { ReservaService } from './reserva.service';

@Controller('reservas')
export class ReservaController {
  constructor(private reservaService: ReservaService) {}

  @Post(':horarioId')
  reservar(
    @Param('horarioId') horarioId: string,
    @Body() body: { userId: number; nombre: string; apellido: string },
  ) {
    return this.reservaService.reservar(+horarioId, body.userId, body.nombre, body.apellido);
  }

  @Get(':horarioId')
  getReservas(@Param('horarioId') horarioId: string) {
    return this.reservaService.obtenerReservasPorHorario(+horarioId);
  }
  
}

