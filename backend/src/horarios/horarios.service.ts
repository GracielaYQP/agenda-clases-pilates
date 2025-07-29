import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horarios.entity';
import { Reserva } from 'src/reserva/reserva.entity';
import { User } from 'src/users/user.entity';
import { addDays, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ReservaService } from 'src/reserva/reserva.service';



@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private horariosRepository: Repository<Horario>,
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(User) 
    private userRepository: Repository<User>,
    private readonly reservaService: ReservaService,
  ) {}

  // Obtener todos los horarios con reservas
  findAll(): Promise<Horario[]> {
    return this.horariosRepository.find({ relations: ['reservas', 'reservas.usuario'] });
  }

  // Obtener uno por ID
  findOne(id: number): Promise<Horario | null> {
    return this.horariosRepository.findOne({
      where: { id },
      relations: ['reservas', 'reservas.usuario'],
    });
  }

  // Reservar una cama
async reservar(id: number, nombre: string, apellido: string, userId?: number): Promise<Horario> {
    if (!userId) throw new Error('ID de usuario no proporcionado');

    const horario = await this.horariosRepository.findOne({ where: { id } });
    if (!horario) throw new Error('Horario no encontrado');

    const timeZone = 'America/Argentina/Buenos_Aires';
    const hoy = toZonedTime(new Date(), timeZone);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const diaIndex = diasSemana.indexOf(horario.dia);
    if (diaIndex === -1) throw new Error(`Día inválido: ${horario.dia}`);

    const lunes = startOfWeek(hoy, { weekStartsOn: 1 });
    const fechaTurno = addDays(lunes, diaIndex);
    const fechaTurnoStr = format(fechaTurno, 'yyyy-MM-dd');

    // Valida según plan y guarda la reserva
    await this.reservaService.reservar(id, userId, nombre, apellido, fechaTurnoStr, true);

    // Recuperar turno actualizado
    const turnoActualizado = await this.horariosRepository.findOne({
      where: { id },
      relations: ['reservas', 'reservas.usuario'],
    });

    if (!turnoActualizado) {
      throw new Error('No se pudo obtener el turno actualizado');
    }

    return turnoActualizado;
  }

  async getHorariosSemana(userId?: number) {
    // Genera reservas recurrentes al iniciar la semana
    await this.reservaService.generarReservasRecurrentesSemanaActual();

    const timeZone = 'America/Argentina/Buenos_Aires';
    const hoy = new Date();
    const hoyBuenosAires = toZonedTime(hoy, timeZone);
    const lunes = startOfWeek(hoyBuenosAires, { weekStartsOn: 1 }); // lunes de esta semana

    // Genera los 5 días de la semana (lunes a viernes)
    const semana: Date[] = [];
    for (let i = 0; i < 5; i++) {
      semana.push(addDays(lunes, i));
    }

    // Busca todos los horarios con sus reservas y usuarios
    const todosHorarios = await this.horariosRepository.find({
      relations: ['reservas', 'reservas.usuario'],
    });

    // Resultado final que vamos a devolver al frontend
    const resultado: {
      idHorario: number;
      dia: string;
      fecha: string;
      hora: string;
      nivel: string;
      totalCamas: number;
      camasReservadas: number;
      camasDisponibles: number;
      reservadoPorUsuario: boolean;
      canceladoPorUsuario: boolean;
      reservas: any[];
    }[] = [];

    // Procesamos día por día
    for (const fecha of semana) {
      const diaNombre = format(fecha, 'EEEE', { locale: es }); // ejemplo: "lunes"
      const diaCapitalizado = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1); // "Lunes"
      const fechaISO = format(fecha, 'yyyy-MM-dd'); // ejemplo: "2025-07-29"

      const horariosDelDia = todosHorarios.filter(h => h.dia === diaCapitalizado);

      for (const horario of horariosDelDia) {
        const reservasDeEseDia = horario.reservas.filter(r => {
          if (!r.fechaTurno) return false;

          const turnoISO = new Date(r.fechaTurno).toISOString().split('T')[0];
          return turnoISO === fechaISO;

        });

        const cantidadReservadas = reservasDeEseDia.filter(r => r.estado === 'reservado').length;

        const estaReservadoPorUsuario = userId
          ? reservasDeEseDia.some(r => r.usuario?.id === userId && r.estado === 'reservado')
          : false;

        const estaCanceladoPorUsuario = userId
          ? reservasDeEseDia.some(r => r.usuario?.id === userId && r.estado === 'cancelado')
          : false;

        const reservasFiltradas = reservasDeEseDia.filter(r => r.estado === 'reservado');

        resultado.push({
          idHorario: horario.id,
          dia: diaCapitalizado,
          fecha: fechaISO,
          hora: horario.hora,
          nivel: horario.nivel,
          totalCamas: horario.totalCamas,
          camasReservadas: cantidadReservadas,
          camasDisponibles: horario.totalCamas - cantidadReservadas,
          reservadoPorUsuario: estaReservadoPorUsuario,
          canceladoPorUsuario: estaCanceladoPorUsuario,
          reservas: reservasFiltradas
        });
      }
    }

    // Siempre retornamos un array limpio
    return resultado.map(h => ({
      ...h,
      reservas: h.reservas ?? []
    }));
  }
}