import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('invitaciones')
export class Invitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telefono: string;

  @Column({ unique: true })
  token: string;

  @Column()
  nivel_asignado: string;

  @Column({ default: 'pendiente' })
  estado: string;
}
