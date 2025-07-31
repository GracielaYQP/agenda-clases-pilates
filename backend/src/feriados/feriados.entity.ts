import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Feriado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  fecha: string;

  @Column()
  descripcion: string;
}
