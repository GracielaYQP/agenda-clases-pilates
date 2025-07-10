import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dia: string;

  @Column()
  hora: string;

  @Column()
  nivel: string;

  @Column({ default: 5 })
  totalCamas: number;

  @Column({ default: 0 })
  camasReservadas: number;
}
