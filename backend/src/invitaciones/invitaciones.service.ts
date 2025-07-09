import { Injectable } from '@nestjs/common';
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
  async crearInvitacion(email: string, nivel: string, token: string): Promise<Invitacion> {
    const invitacion = this.invitacionRepo.create({
      email,
      nivel_asignado: nivel,
      token,
      estado: 'pendiente',
    });
    return this.invitacionRepo.save(invitacion);
  }

  
}

