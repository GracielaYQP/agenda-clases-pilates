// src/reserva/dto/create-reserva.dto.ts
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReservaDto {
  @IsDateString()
  @IsNotEmpty()
  fechaTurno: string;

  @IsOptional()
  @IsBoolean()
  automatica?: boolean;
}
