import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feriado } from './feriados.entity';
import { FeriadosService } from './feriados.service';
import { FeriadosController } from './feriados.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Feriado])],
  providers: [FeriadosService],
  exports: [FeriadosService],
  controllers: [FeriadosController], // exportamos para usar en otros módulos
})
export class FeriadosModule {}

