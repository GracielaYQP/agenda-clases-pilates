import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { HorariosService } from './horarios.service';

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


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horariosService.findOne(+id);
  }

}

