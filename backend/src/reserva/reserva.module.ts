import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './reserva.entity';
import { ReservaController } from './reserva.controller';
import { ReservaService } from './reserva.service';
import { Horario } from '../horarios/horarios.entity';
import { User } from '../users/user.entity';
import { FeriadosModule } from 'src/feriados/feriados.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Horario, User]),
            FeriadosModule],
  controllers: [ReservaController],
  providers: [ReservaService],
  exports: [TypeOrmModule, ReservaService]
})
export class ReservaModule {}

