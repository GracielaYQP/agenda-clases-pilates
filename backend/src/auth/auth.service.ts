import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  // Registro normal
  register(dto: CreateUserDto & { nivel: string }) {
    return this.usersService.create({
      email: dto.email,
      nombre: dto.nombre,
      apellido: dto.apellido,  
      dni: dto.dni,
      telefono: dto.telefono,
      password: dto.password,
      nivel: dto.nivel,
    }); 
  }

  // Login normal
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email , rol: user.rol };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      nombre: user.nombre,
      apellido: user.apellido, 
      dni: user.dni, 
      rol: user.rol,
      nivel: user.nivel,
    };
  }

  // Crear usuario desde invitación
  async createUser(data: {
    telefono: string; email: string; nombre: string; apellido: string; dni: string; password: string; nivel: string 
}) {
    // NO hacer hash aquí — lo hace UsersService.create
    return this.usersService.create({
      dni: data.dni,
      nombre: data.nombre,
      apellido: data.apellido,  
      telefono: data.telefono,
      email: data.email,// Asegúrate de que el DTO tenga este campo 
      password: data.password, 
      nivel: data.nivel,
    });
  }
}
