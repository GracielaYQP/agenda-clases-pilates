import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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

  async reservar(
    horarioId: number, 
    userId: number, 
    nombre: string, 
    apellido: string, 
    fechaTurno: string, 
    automatica: boolean = true) {

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

  // Validación mensual
    if (automatica) {
      const { actuales: mensuales, maximas: maxMensuales } = await this.contarReservasAutomaticasDelMes(userId, fechaTurno);
      if (mensuales >= maxMensuales) {
        throw new BadRequestException(`Ya alcanzaste tu límite mensual de ${maxMensuales} clases.`);
      }

      // Validación semanal
      const { actuales: semanales, maximas: maxSemanales } = await this.contarReservasAutomaticasDeLaSemana(userId, fechaTurno);
      if (semanales >= maxSemanales) {
        throw new BadRequestException(`Ya alcanzaste tu límite semanal de ${maxSemanales} clases según tu plan.`);
      }
    }

    const fechaReserva = new Date().toISOString().split('T')[0]; // la fecha actual (YYYY-MM-DD)

    const nuevaReserva = this.reservaRepo.create({
      horario,
      usuario,
      nombre,
      apellido,
      fechaReserva,
      fechaTurno, 
      estado: 'reservado',
      automatica,
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

  async cancelarPorFecha(horarioId: number, userId: number, fechaTurno: string) {
    const horario = await this.horarioRepo.findOne({ where: { id: horarioId } });
    if (!horario) throw new Error('Horario no encontrado');

    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    // Verificar si ya existe una cancelación para ese día y usuario
    const yaExiste = await this.reservaRepo.findOne({
      where: {
        usuario: { id: userId },
        horario: { id: horarioId },
        fechaTurno,
        estado: 'cancelado',
      },
    });

    if (yaExiste) {
      throw new Error('Ya se canceló ese día');
    }

    const fechaReserva = new Date().toISOString().split('T')[0]; // día en que se realiza la cancelación

    const reservaCancelada = this.reservaRepo.create({
      usuario,
      horario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      fechaTurno,
      fechaReserva,
      estado: 'cancelado',
    });

    return this.reservaRepo.save(reservaCancelada);
  }

  async contarReservasAutomaticasDelMes(userId: number, fechaTurno: string): Promise<{ actuales: number, maximas: number }> {
    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    const clasesMaximas = parseInt(usuario.planMensual ?? '4', 10); // 👈 convierte el plan a número

    const fecha = new Date(fechaTurno);
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

    const actuales = await this.reservaRepo.count({
      where: {
        usuario: { id: userId },
        automatica: true,
        fechaTurno: Between(
          inicioMes.toISOString().split('T')[0],
          finMes.toISOString().split('T')[0]
        ),
      },
    });

    return {
      actuales,
      maximas: clasesMaximas,
    };
  }

  async contarReservasAutomaticasDeLaSemana(userId: number, fechaTurno: string): Promise<{ actuales: number, maximas: number }> {
    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    const planMensual = parseInt(usuario.planMensual ?? '4', 10);
    const clasesMaximasPorSemana = Math.floor(planMensual / 4); // Suponiendo 4 semanas por mes

    const fecha = new Date(fechaTurno);

    const primerDiaSemana = new Date(fecha);
    primerDiaSemana.setDate(fecha.getDate() - fecha.getDay() + 1); // Lunes
    const ultimoDiaSemana = new Date(primerDiaSemana);
    ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6); // Domingo

    const actuales = await this.reservaRepo.count({
      where: {
        usuario: { id: userId },
        automatica: true,
        fechaTurno: Between(
          primerDiaSemana.toISOString().split('T')[0],
          ultimoDiaSemana.toISOString().split('T')[0]
        ),
      },
    });

    return {
      actuales,
      maximas: clasesMaximasPorSemana,
    };
  }

  async getAsistenciaMensual(userId: number) {
    const reservas = await this.reservaRepo.find({ where: { usuario: { id: userId } } });

    const resumen: { [mes: string]: { asistencias: number; ausencias: number } } = {};

    reservas.forEach(reserva => {
      const fecha = new Date(reserva.fechaTurno);
      const mes = fecha.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!resumen[mes]) resumen[mes] = { asistencias: 0, ausencias: 0 };

      if (reserva.estado === 'reservado') resumen[mes].asistencias++;
      if (reserva.estado === 'cancelado') resumen[mes].ausencias++;
    });

    return resumen;
  }

  async cancelarReservaPorUsuario(id: number, tipo: 'momentanea' | 'permanente', user: any) {
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: ['usuario', 'horario']
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    // 🔐 Permitir solo al dueño de la reserva o al admin
    if (reserva.usuario.id !== user.sub && user.rol !== 'admin') {
      throw new ForbiddenException('No podés cancelar esta reserva');
    }

    // ✅ Cancelación momentánea
    if (tipo === 'momentanea') {
      reserva.estado = 'cancelado';
      reserva.cancelacionMomentanea = true;
      reserva.fechaCancelacion = new Date();
      await this.reservaRepo.save(reserva);
      return { mensaje: 'Turno cancelado por hoy. Se recuperará automáticamente en 24 hs.' };
    }

    // ✅ Cancelación permanente
    if (tipo === 'permanente') {
      reserva.estado = 'cancelado';
      reserva.cancelacionPermanente = true;
      reserva.fechaCancelacion = new Date();
      await this.reservaRepo.save(reserva);
      return { mensaje: 'Turno cancelado permanentemente.' };
    }

    throw new BadRequestException('Tipo de cancelación no válido');
  }


}


