import { Controller, Post, Param, Body, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ReservaService } from './reserva.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';



@Controller('reservas')
export class ReservaController {
  constructor(private reservaService: ReservaService) {}

     // 👉 Obtener reservas del usuario autenticado
  @Get('mis-reservas')
  @UseGuards(AuthGuard('jwt'))
  getMisReservas(@Req() req: Request) {
    const idRaw = (req.user as any)?.id ?? (req.user as any)?.sub;

    if (!idRaw) {
      throw new BadRequestException('Token inválido: no contiene ID');
    }

    const userId = Number(idRaw);

    if (isNaN(userId) || !Number.isInteger(userId)) {
      throw new BadRequestException('El ID del usuario no es válido');
    }

    return this.reservaService.obtenerReservasPorUsuario(userId);
  }

     // 👉 Reservar un horario (requiere token)
  @UseGuards(AuthGuard('jwt'))
  @Post(':horarioId')
  reservar(
    @Param('horarioId') horarioIdParam: string,
    @Req() req: Request,
    @Body() body: { nombre: string; apellido: string },
  ) {
    const horarioId = Number(horarioIdParam);
    if (isNaN(horarioId)) {
      throw new BadRequestException('ID de horario inválido');
    }

    const userId = (req.user as any)?.id;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('ID de usuario no válido');
    }

    return this.reservaService.reservar(horarioId, userId, body.nombre, body.apellido);
  }

  // 👉 Obtener reservas de un horario
  @Get(':horarioId')
  getReservas(@Param('horarioId') horarioIdParam: string) {
    const horarioId = Number(horarioIdParam);
    if (isNaN(horarioId)) {
      throw new BadRequestException('ID de horario inválido');
    }

    return this.reservaService.obtenerReservasPorHorario(horarioId);
  }
  


  

}





