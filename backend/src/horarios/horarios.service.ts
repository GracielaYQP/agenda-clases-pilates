import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horarios.entity';
import { Reserva } from 'src/reserva/reserva.entity';
import { User } from 'src/users/user.entity';
import { addDays, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';



@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private horariosRepository: Repository<Horario>,
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(User) 
    private userRepository: Repository<User>,
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
    const turno = await this.horariosRepository.findOne({
      where: { id },
      relations: ['reservas'],
    });

    if (!turno) throw new Error('Turno no encontrado');
    if (turno.camasReservadas >= turno.totalCamas) {
      throw new Error('No hay turnos disponibles');
    }

  // Buscar el usuario
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('Usuario no encontrado');


    const nuevaReserva = new Reserva();
    nuevaReserva.nombre = nombre;
    nuevaReserva.apellido = apellido;
    nuevaReserva.horario = turno;   // ✅ Asignar objeto completo
    nuevaReserva.usuario = user;

    await this.reservasRepository.save(nuevaReserva);

    turno.camasReservadas += 1;
    await this.horariosRepository.save(turno);

    const turnoActualizado = await this.horariosRepository.findOne({
      where: { id: turno.id },
      relations: ['reservas'],
    });

    if (!turnoActualizado) throw new Error('No se pudo obtener el turno actualizado');

    return turnoActualizado;
  }

  async getHorariosSemana(userId?: number) {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const hoy = new Date();
    const hoyBuenosAires = toZonedTime(hoy, timeZone);
    const lunes = startOfWeek(hoyBuenosAires, { weekStartsOn: 1 });

    const semana: Date[] = [];
    for (let i = 0; i < 5; i++) {
      semana.push(addDays(lunes, i));
    }

    const todosHorarios = await this.horariosRepository.find({
      relations: ['reservas', 'reservas.usuario'],
    });

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
      reservas: { nombre: string; apellido: string }[];
    }[] = [];

    for (const fecha of semana) {
      const diaNombre = format(fecha, 'EEEE', { locale: es });
      const diaCapitalizado = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);
      const fechaISO = format(fecha, 'yyyy-MM-dd');

      const horariosDelDia = todosHorarios.filter(h => h.dia === diaCapitalizado);

      for (const horario of horariosDelDia) {
        const reservasDeEseDia = horario.reservas.filter(r => r.fechaTurno === fechaISO);

        const cantidadReservadas = reservasDeEseDia.filter(r => r.estado === 'reservado').length;

        const estaReservadoPorUsuario = userId
          ? reservasDeEseDia.some(r => r.usuario.id === userId && r.estado === 'reservado')
          : false;

        const estaCanceladoPorUsuario = userId
          ? reservasDeEseDia.some(r => r.usuario.id === userId && r.estado === 'cancelado')
          : false;

        const reservasSimples = reservasDeEseDia
          .filter(r => r.estado === 'reservado')
          .map(r => ({
            nombre: r.nombre,
            apellido: r.apellido
          }));

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
          reservas: reservasSimples
        });
      }
    }

    return resultado;
  }


}
