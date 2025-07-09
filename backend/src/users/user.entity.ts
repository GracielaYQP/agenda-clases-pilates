import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column()
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




}



