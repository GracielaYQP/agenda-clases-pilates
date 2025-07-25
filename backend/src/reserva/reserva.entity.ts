// reserva.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Horario } from '../horarios/horarios.entity';
import { User } from '../users/user.entity'; // si ya tenés un modelo de usuario

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ type: 'date' }) 
  fechaTurno: string;

  @Column({ type: 'date' }) 
  fechaReserva: string;

  @Column({ default: 'reservado' })
  estado: 'reservado' | 'cancelado';

  @ManyToOne(() => Horario, horario => horario.reservas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'horarioId' }) // 👈 asegurate de tener esto
  horario: Horario;

  @ManyToOne(() => User, user => user.reservas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' }) // 👈 esto también
  usuario: User;

}
