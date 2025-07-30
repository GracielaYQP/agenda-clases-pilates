import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { Reserva } from './reserva.entity';
import { Horario } from '../horarios/horarios.entity';
import { User } from '../users/user.entity';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cron } from '@nestjs/schedule'; 

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
    console.log('📦 Reservar: automatica =', automatica, 'fechaTurno =', fechaTurno);

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
      const fecha = new Date(reserva.fechaTurno);
      const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
        // 🚫 Ignorar reservas en sábado o domingo
        if (diaSemana === 0 || diaSemana === 6) {
          return;
        }
      const mes = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' }); // Ej: "julio 2025"
      const fechaFormateada = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }); // Ej: "lun. 29/07"

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
    // Traemos SIEMPRE las relaciones que necesitamos
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: ['usuario', 'horario'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    // ⚠️ ¡No loguees antes de verificar null!
    const userId = user?.id ?? user?.sub;
    const rol = user?.rol;

    // 🔐 Permitir solo al dueño o al admin
    if (!reserva.usuario || (reserva.usuario.id !== Number(userId) && user.rol !== 'admin')) {
      throw new ForbiddenException('No podés cancelar esta reserva');
    }

    // ✅ Si es una reserva de recuperación (automatica = false) → la borramos físicamente
    if (!reserva.automatica) {
      // liberamos cama
      if (reserva.horario) {
        reserva.horario.camasReservadas = Math.max(0, reserva.horario.camasReservadas - 1);
        await this.horarioRepo.save(reserva.horario);
      }
      await this.reservaRepo.remove(reserva);   // 👈 BORRADO FÍSICO
      return { mensaje: '✅ Reserva de recuperación eliminada.' };
    }

    // ✅ Si es recurrente (automatica = true) → cancelar momentánea/permanente
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

}