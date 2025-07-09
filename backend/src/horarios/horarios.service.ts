// src/horarios/horarios.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horarios.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private horariosRepository: Repository<Horario>,
  ) {}

  // Obtener todos
  findAll(): Promise<Horario[]> {
    return this.horariosRepository.find();
  }

  // Obtener uno por ID
  findOne(id: number): Promise<Horario | null> {
    return this.horariosRepository.findOneBy({ id });
  }

  // Reservar una cama
  async reservar(id: number): Promise<Horario> {
    const turno = await this.findOne(id);

    if (!turno) throw new Error('Turno no encontrado');

    if (turno.camasReservadas >= turno.totalCamas) {
      throw new Error('No hay camas disponibles');
    }

    turno.camasReservadas += 1;
    return this.horariosRepository.save(turno);
  }
}

