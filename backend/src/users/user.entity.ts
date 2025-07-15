import { Reserva } from 'src/reserva/reserva.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  dni: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ default: 'inicial' })
  nivel: string;

  @Column({ unique: true })
  telefono: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'alumno/a' })
  rol: string;
    
  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('varchar', { nullable: true })
  resetToken: string | null;

  @Column('timestamp', { nullable: true })
  resetTokenExpiry: Date | null;

  @OneToMany(() => Reserva, reserva => reserva.usuario)
  reservas: Reserva[]; 

}



