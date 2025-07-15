import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './reserva.entity';
import { Horario } from '../horarios/horarios.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
    @InjectRepository(Horario)
    private horarioRepo: Repository<Horario>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async reservar(horarioId: number, userId: number, nombre: string, apellido: string) {
    const horario = await this.horarioRepo.findOne({
      where: { id: horarioId },
      relations: ['reservas'],
    });

    if (!horario) throw new Error('Horario no encontrado');

    if (horario.reservas.length >= horario.totalCamas) {
      throw new Error('No hay camas disponibles');
    }

    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    const nuevaReserva = this.reservaRepo.create({
      horario,
      usuario,
      nombre,
      apellido,
    });

    horario.camasReservadas++;

    await this.horarioRepo.save(horario);
    return this.reservaRepo.save(nuevaReserva);
  }

  async obtenerReservasPorHorario(horarioId: number) {
    return this.reservaRepo.find({
      where: { horario: { id: horarioId } },
      relations: ['usuario'],
    });
  }

  // async obtenerReservasPorUsuario(userId: number) {
  //   try {
  //     const reservas = await this.reservaRepo.find({
  //       where: { usuario: { id: userId } },
  //       relations: ['horario'],
  //       order: { horario: { dia: 'ASC', hora: 'ASC' } },
  //     });

  //     console.log('🎯 Reservas encontradas:', reservas);
  //     return reservas;
  //   } catch (error) {
  //     console.error('❌ Error al obtener reservas por usuario:', error);
  //     throw new HttpException('No se pudieron obtener las reservas del usuario', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  async obtenerReservasPorUsuario(userId: number) {
  try {
    const reservas = await this.reservaRepo
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.horario', 'horario')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .where('reserva.usuarioId = :userId', { userId })
      .orderBy('horario.dia', 'ASC')
      .addOrderBy('horario.hora', 'ASC')
      .getMany();

    console.log('🎯 Reservas encontradas:', reservas);
    return reservas;
  } catch (error) {
    console.error('❌ Error al obtener reservas por usuario:', error);
    throw new HttpException(
      'No se pudieron obtener las reservas del usuario',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

}


