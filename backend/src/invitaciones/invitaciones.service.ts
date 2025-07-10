import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitacion } from './invitaciones.entity';


@Injectable()
export class InvitacionesService {
  constructor(
    @InjectRepository(Invitacion)
    private readonly invitacionRepo: Repository<Invitacion>,
  ) {}

  // Buscar invitación por token
  async findByToken(token: string): Promise<Invitacion | null> {
    return this.invitacionRepo.findOne({
      where: { token }
    });
  }

  // Marcar invitación como usada
  async marcarComoUsada(id: number): Promise<void> {
    await this.invitacionRepo.update(id, { estado: 'usado' });
  }

  // (Opcional) Crear una nueva invitación
  async crearInvitacion(telefono: string, nivel: string, token: string): Promise<Invitacion> {
    const invitacionExistente = await this.invitacionRepo.findOne({ where: { telefono } });

    if (invitacionExistente) {
      throw new BadRequestException('Este usuario ya tiene una invitación pendiente o fue registrado.');
    }

    const invitacion = this.invitacionRepo.create({
      telefono,
      nivel_asignado: nivel,
      token,
      estado: 'pendiente',
    });

    return this.invitacionRepo.save(invitacion);
  }


  
}

