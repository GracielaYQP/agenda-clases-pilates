import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horarios.entity';
import { Reserva } from 'src/reserva/reserva.entity';
import { User } from 'src/users/user.entity';

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
      throw new Error('No hay camas disponibles');
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

}
