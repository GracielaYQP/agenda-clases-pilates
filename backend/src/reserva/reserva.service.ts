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

    const hoy = new Date(); // usar la fecha actual
    const fecha = hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD

    const nuevaReserva = this.reservaRepo.create({
      horario,
      usuario,
      nombre,
      apellido,
      fecha,
      estado: 'reservado',
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

  async anularReserva(reservaId: number) {
    const reserva = await this.reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['horario'],
    });

    if (!reserva) throw new Error('Reserva no encontrada');

    const horario = reserva.horario;
    horario.camasReservadas--;

    await this.horarioRepo.save(horario);
    await this.reservaRepo.remove(reserva);

    return { mensaje: 'Reserva anulada correctamente' };
  }

  async editarReserva(reservaId: number, datos: { nombre?: string; apellido?: string; nuevoUserId?: number }) {
    const reserva = await this.reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['usuario'],
    });

    if (!reserva) throw new Error('Reserva no encontrada');

    if (datos.nombre) reserva.nombre = datos.nombre;
    if (datos.apellido) reserva.apellido = datos.apellido;

    if (datos.nuevoUserId) {
      const nuevoUsuario = await this.userRepo.findOneBy({ id: datos.nuevoUserId });
      if (!nuevoUsuario) throw new Error('Nuevo usuario no encontrado');
      reserva.usuario = nuevoUsuario;
    }

    return this.reservaRepo.save(reserva);
  }

  async cancelarPorFecha(horarioId: number, userId: number, fecha: string) {
    const horario = await this.horarioRepo.findOne({ where: { id: horarioId } });
    if (!horario) throw new Error('Horario no encontrado');

    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    // Verificar si ya existe una cancelación para ese día
    const yaExiste = await this.reservaRepo.findOne({
      where: {
        usuario: { id: userId },
        horario: { id: horarioId },
        fecha,
        estado: 'cancelado',
      },
    });

    if (yaExiste) {
      throw new Error('Ya se canceló ese día');
    }

    const reservaCancelada = this.reservaRepo.create({
      usuario,
      horario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      fecha,
      estado: 'cancelado',
    });

    return this.reservaRepo.save(reservaCancelada);
  }


}


