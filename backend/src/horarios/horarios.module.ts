import { Module } from '@nestjs/common';
import { HorariosController } from './horarios.controller';
import { HorariosService } from './horarios.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './horarios.entity';

@Module({
  controllers: [HorariosController],
  providers: [HorariosService],
  imports: [TypeOrmModule.forFeature([Horario])],
  exports: [HorariosService],
})
export class HorariosModule {}
