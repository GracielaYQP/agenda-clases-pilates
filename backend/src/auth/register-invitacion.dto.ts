// src/auth/dto/register-invitacion.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterInvitacionDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
