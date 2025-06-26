import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  dni: string;

  @IsNotEmpty()
  nombre: string;

  @IsNotEmpty()
  apellido: string;

  @IsNotEmpty()
  telefono: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^(?=(?:.*\d))(?=.*[A-Z])(?=.*[a-z])(?=.*[.,*!?¿¡/#$%&])\S{8,20}$/, {
    message:
      'La contraseña debe tener entre 8 a 20 caracteres, al menos una letra mayúscula, un número y un símbolo.',
  })
  password: string;
}

