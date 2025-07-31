import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { Reserva } from './reserva.entity';
import { Horario } from '../horarios/horarios.entity';
import { User } from '../users/user.entity';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cron } from '@nestjs/schedule'; 
import { FeriadosService } from 'src/feriados/feriados.service';

@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
    @InjectRepository(Horario)
    private horarioRepo: Repository<Horario>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly feriadosService: FeriadosService,
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

    // ✅ Validación para reservas automáticas
    if (automatica) {
      // 1. Validación mensual
      const { actuales: mensuales, maximas: maxMensuales } = await this.contarReservasAutomaticasDelMes(userId, fechaTurno);
      if (mensuales >= maxMensuales) {
        throw new BadRequestException(`Ya alcanzaste tu límite mensual de ${maxMensuales} clases.`);
      }

      // 2.Validación semanal
      const { actuales: semanales, maximas: maxSemanales } = await this.contarReservasAutomaticasDeLaSemana(userId, fechaTurno);
      if (semanales >= maxSemanales) {
        throw new BadRequestException(`Ya alcanzaste tu límite semanal de ${maxSemanales} clases según tu plan.`);
      }
    }
    const fechaReserva = new Date().toISOString().split('T')[0];
    // ✅ Validación para reservas de recuperación    
    if (!automatica) {  
      const fecha = new Date(`${fechaTurno}T00:00:00-03:00`);
      // 1. No permitir recuperar en feriados
      const esFeriado = await this.feriadosService.esFeriado(fecha);
      if (esFeriado) {
        throw new BadRequestException('No podés reservar una clase de recuperación en un día feriado.');
      }

      // 2. No permitir si falta menos de 1 hora    
      const ahora = new Date();
      const fechaHoraTurno = new Date(`${fechaTurno}T${horario.hora}:00-03:00`); // suponiendo que horario.hora = '08:00'
      const diferenciaMinutos = (fechaHoraTurno.getTime() - ahora.getTime()) / (1000 * 60);
      if (diferenciaMinutos < 60) {
        throw new BadRequestException('⏰ Las reservas de recuperación deben hacerse al menos una hora antes del inicio de la clase.');
      }
      
      // 3. Validar si tiene recuperaciones disponibles
      const recuperacionesDisponibles = await this.contarCancelacionesMomentaneasDelMes(userId, fechaTurno);
      if (recuperacionesDisponibles <= 0) {
        throw new BadRequestException('No tenés recuperaciones disponibles este mes.');
      }
    }

    // ✅ Crear la reserva
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
    const ahora = new Date();

    const reservas = await this.reservaRepo.find({
      where: { usuario: { id: userId } },
      relations: ['horario'],
      order: { fechaTurno: 'ASC' }
    });

    const resultado: Record<string, {
      asistencias: number,
      ausencias: number,
      fechasAsistencias: string[],
      fechasAusencias: string[]
    }> = {};

    reservas.forEach(reserva => {
      const fechaReserva = new Date(reserva.fechaTurno);

      // 🚫 Ignorar reservas que aún no ocurrieron
      if (fechaReserva > ahora) return;

      // 🚫 Ignorar fines de semana
      const diaSemana = fechaReserva.getDay();
      if (diaSemana === 0 || diaSemana === 6) return;

      const mes = fechaReserva.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      const fechaFormateada = fechaReserva.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });

      if (!resultado[mes]) {
        resultado[mes] = {
          asistencias: 0,
          ausencias: 0,
          fechasAsistencias: [],
          fechasAusencias: []
        };
      }

      if (reserva.estado === 'reservado') {
        resultado[mes].asistencias++;
        resultado[mes].fechasAsistencias.push(fechaFormateada);
      } else if (reserva.estado === 'cancelado') {
        resultado[mes].ausencias++;
        resultado[mes].fechasAusencias.push(fechaFormateada);
      }
    });

    return resultado;
  }

  async cancelarReservaPorUsuario(id: number, tipo: 'momentanea' | 'permanente', user: any) {
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: ['usuario', 'horario'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const userId = user?.id ?? user?.sub;
    const rol = user?.rol;

    // 🔐 Permitir solo al dueño o al admin
    if (!reserva.usuario || (reserva.usuario.id !== Number(userId) && rol !== 'admin')) {
      throw new ForbiddenException('No podés cancelar esta reserva');
    }

    const ahora = new Date();
    const fechaHoraTurno = new Date(`${reserva.fechaTurno}T${reserva.horario.hora}:00-03:00`);
    const diferenciaMs = fechaHoraTurno.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    // ⛔️ Bloquear cancelación si el turno cae en feriado
    const fechaTurno = new Date(`${reserva.fechaTurno}T00:00:00-03:00`);
    const esFeriado = await this.feriadosService.esFeriado(fechaTurno);
    if (esFeriado) {
      throw new BadRequestException('No se puede cancelar una clase que cae en feriado.');
    }

    // ⏱️ Bloqueo solo para alumno (no admin)
    if (rol !== 'admin' && diferenciaHoras < 2) {
      throw new BadRequestException('Solo se puede cancelar hasta 2 horas antes del turno.');
    }

    // ✅ Recuperación → borrado físico
    if (!reserva.automatica) {
      if (reserva.horario) {
        reserva.horario.camasReservadas = Math.max(0, reserva.horario.camasReservadas - 1);
        await this.horarioRepo.save(reserva.horario);
      }
      await this.reservaRepo.remove(reserva);
      return { mensaje: '✅ Reserva de recuperación eliminada.' };
    }

    // ✅ Recurrente → cancelación momentánea o permanente
    if (tipo === 'momentanea') {
      reserva.estado = 'cancelado';
      reserva.cancelacionMomentanea = true;
      reserva.cancelacionPermanente = false;
    } else {
      reserva.estado = 'cancelado';
      reserva.cancelacionPermanente = true;
      reserva.cancelacionMomentanea = false;
    }

    reserva.automatica = false;
    reserva.fechaCancelacion = new Date();

    if (reserva.horario) {
      reserva.horario.camasReservadas = Math.max(0, reserva.horario.camasReservadas - 1);
      await this.horarioRepo.save(reserva.horario);
    }

    await this.reservaRepo.save(reserva);
    return { mensaje: '✅ Reserva cancelada.' };
  }

  async generarReservasRecurrentesSemanaActual() {
    const hoy = new Date();
    const lunes = startOfWeek(hoy, { weekStartsOn: 1 });

    for (let i = 0; i < 5; i++) {
      const fecha = addDays(lunes, i);
      const fechaTurno = format(fecha, 'yyyy-MM-dd');

      const diaNombre = format(fecha, 'EEEE', { locale: es });
      const diaCapitalizado = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);

      const horariosDelDia = await this.horarioRepo.find({
        where: { dia: diaCapitalizado },
        relations: ['reservas', 'reservas.usuario']
      });

      for (const horario of horariosDelDia) {
        const reservasPrevias = await this.reservaRepo.find({
          where: {
            horario: { id: horario.id },
            estado: 'reservado',
            automatica: true
          },
          relations: ['usuario']
        });

        for (const reserva of reservasPrevias) {
          // ✅ Verificar si ya existe la misma reserva para ese día
          const yaExiste = await this.reservaRepo.findOne({
            where: {
              usuario: { id: reserva.usuario.id },
              horario: { id: horario.id },
              fechaTurno,
              estado: 'reservado'
            }
          });

          if (yaExiste) {
            console.log(`⚠️ Ya existe reserva para ${reserva.nombre} ${reserva.apellido} - ${diaCapitalizado} ${horario.hora} (${fechaTurno})`);
            continue;
          }

          // ✅ Verificar si hay camas disponibles
          const reservasDelTurno = await this.reservaRepo.find({
            where: {
              horario: { id: horario.id },
              fechaTurno,
              estado: 'reservado'
            }
          });

          if (reservasDelTurno.length >= horario.totalCamas) {
            console.log('🚫 Cupo completo:', reserva.nombre, reserva.apellido, horario.dia, horario.hora);
            continue;
          }

          // ✅ Crear nueva reserva automática
          const nuevaReserva = this.reservaRepo.create({
            horario,
            usuario: reserva.usuario,
            nombre: reserva.nombre,
            apellido: reserva.apellido,
            fechaTurno,
            fechaReserva: format(new Date(), 'yyyy-MM-dd'),
            estado: 'reservado',
            automatica: true
          });

          await this.reservaRepo.save(nuevaReserva);
          console.log('✅ Reserva recurrente creada:', nuevaReserva);
        }
      }
    }
  }

  async marcarReservasMomentaneasComoRecuperadas() {
    const hoy = new Date().toISOString().split('T')[0];

    const reservasRecuperadas = await this.reservaRepo.find({
      where: {
        automatica: false,
        estado: 'reservado',
        fechaTurno: LessThan(hoy),
      },
      relations: ['horario'],
    });

    for (const reserva of reservasRecuperadas) {
      // Liberar la cama
      if (reserva.horario) {
        reserva.horario.camasReservadas = Math.max(0, reserva.horario.camasReservadas - 1);
        await this.horarioRepo.save(reserva.horario);
      }

      // Marcar como "recuperada"
      reserva.estado = 'recuperada';
      reserva.fechaCancelacion = new Date(); // opcional, puede llamarse fechaRegistroFinal si querés

      await this.reservaRepo.save(reserva);
      console.log(`✅ Reserva marcada como recuperada: ${reserva.nombre} ${reserva.apellido} (${reserva.fechaTurno})`);
    }
  }

  @Cron('0 4 * * 0') // domingo a las 04:00
  async marcarRecuperadasCron() {
    console.log('📆 Ejecutando CRON: domingo 04:00 → marcando reservas recuperadas...');
    await this.marcarReservasMomentaneasComoRecuperadas();
  }

  async contarCancelacionesMomentaneasDelMes(userId: number, fechaTurno: string): Promise<number> {
    const fecha = new Date(fechaTurno);
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

    // Clases canceladas momentáneamente
    const canceladas = await this.reservaRepo.count({
      where: {
        usuario: { id: userId },
        automatica: false,
        cancelacionMomentanea: true,
        estado: 'cancelado',
        fechaTurno: Between(
          inicioMes.toISOString().split('T')[0],
          finMes.toISOString().split('T')[0]
        ),
      },
    });

    // Clases ya recuperadas (reservas no automáticas ya realizadas)
    const recuperadas = await this.reservaRepo.count({
      where: {
        usuario: { id: userId },
        automatica: false,
        estado: 'reservado',
        fechaTurno: Between(
          inicioMes.toISOString().split('T')[0],
          finMes.toISOString().split('T')[0]
        ),
      },
    });

    return canceladas - recuperadas;
  }

}