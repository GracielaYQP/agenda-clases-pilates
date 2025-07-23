import { BadRequestException, Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';


@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  findAll() {
    return this.horariosService.findAll().then(horarios => {
      console.log('🧾 Horarios enviados al frontend:', horarios);
      return horarios;
    });
  }

  @Get('semana')
  async getSemana(@Req() req: ExpressRequest & { user?: any }) {
    const user = req.user;
    const userId = user?.id ?? null;

    return this.horariosService.getHorariosSemana(userId);
  }

  @Get(':id')
    findOne(@Param('id') id: string) {
      return this.horariosService.findOne(+id);
    }

}

