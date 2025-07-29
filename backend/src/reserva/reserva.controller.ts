import { Controller, Post, Param, Body, Get, UseGuards, Req, BadRequestException, Patch } from '@nestjs/common';
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

  @UseGuards(AuthGuard('jwt'))
  @Post(':horarioId')
  reservar(
    @Param('horarioId') horarioIdParam: string,
    @Req() req: Request,
    @Body() body: { nombre: string; apellido: string; userId?: number; fechaTurno: string }
  ) {
    const horarioId = Number(horarioIdParam);
    if (isNaN(horarioId)) {
      throw new BadRequestException('ID de horario inválido');
    }

    const user = req.user as any;
    const rol = user?.rol;
    const idFromToken = user?.id;
    const userId = body.userId ?? idFromToken;

    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('ID de usuario no válido');
    }

    if (rol === 'admin' && !body.userId) {
      throw new BadRequestException('Un administrador debe indicar el usuario para reservar');
    }

    if (!body.fechaTurno) {
      throw new BadRequestException('Debe indicarse la fecha del turno');
    }

    return this.reservaService.reservar(horarioId, userId, body.nombre, body.apellido, body.fechaTurno);
  }

  // Obtener reservas de un horario
  @Get(':horarioId')
  getReservas(@Param('horarioId') horarioIdParam: string) {
    const horarioId = Number(horarioIdParam);
    if (isNaN(horarioId)) {
      throw new BadRequestException('ID de horario inválido');
    }

    return this.reservaService.obtenerReservasPorHorario(horarioId);
  }
  
  // Anular una reserva
  @UseGuards(AuthGuard('jwt'))
  @Post('anular/:reservaId')
  anularReserva(@Param('reservaId') reservaId: string) {
    return this.reservaService.anularReserva(Number(reservaId));
  }

  //  Modificar reserva existente (cambiar usuario o nombre/apellido)
  @UseGuards(AuthGuard('jwt'))
  @Patch(':reservaId')
  editarReserva(
    @Param('reservaId') reservaId: string,
    @Body() body: { nombre?: string; apellido?: string; nuevoUserId?: number }
  ) {
    return this.reservaService.editarReserva(Number(reservaId), body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cancelar')
  cancelarPorFecha(
    @Req() req: Request,
    @Body() body: { horarioId: number; fechaTurno: string }
  ) {
    const user = req.user as any;
    const userId = user?.id;

    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('ID de usuario no válido');
    }

    if (!body.horarioId || !body.fechaTurno) {
      throw new BadRequestException('Faltan datos: horarioId o fecha');
    }

    return this.reservaService.cancelarPorFecha(body.horarioId, userId, body.fechaTurno);
  }

  @Get('recurrentes/:userId/:fecha')
  contarRecurrentes(@Param('userId') userId: number, @Param('fecha') fecha: string) {
    return this.reservaService.contarReservasAutomaticasDelMes(userId, fecha);
  }

  @Get('asistencia-mensual/:userId')
  getAsistenciaMensual(@Param('userId') userId: number) {
    return this.reservaService.getAsistenciaMensual(userId);
  }

  @Patch('cancelar/:id')
  @UseGuards(AuthGuard('jwt'))
  async cancelarReserva(
    @Param('id') id: number,
    @Body('tipo') tipo: 'momentanea' | 'permanente',
    @Req() req: Request
  ) {
    const user = req.user;
    return this.reservaService.cancelarReservaPorUsuario(id, tipo, user);
  }

  @Post('marcar-recuperadas')
    async marcarRecuperadas() {
      return this.reservaService.marcarReservasMomentaneasComoRecuperadas();
    }
}




