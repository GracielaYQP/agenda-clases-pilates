import { Module } from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';
import { InvitacionesController } from './invitaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitacion } from './invitaciones.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Invitacion])],
  controllers: [InvitacionesController],
  providers: [InvitacionesService],
  exports: [InvitacionesService] // 👈 Si lo usas en AuthModule
})
export class InvitacionesModule {}

