import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/user.dto';
import { MailerService } from './mailer/mailer.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/user.entity';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  // Registro normal
  async register(dto: CreateUserDto) {
    return this.usersService.create(dto); 
  }

  // Login normal
  async loginFlexible(usuario: string, password: string) {
    console.log('🟡 Intentando login con:', usuario);

    const user = await this.usersService.findByEmailOrTelefono(usuario);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    console.log('👤 Usuario encontrado:', user.telefono);
    if (!user.activo) {
    throw new UnauthorizedException('Tu cuenta está inactiva. Por favor, comunicate con el estudio para reactivarla.');
  }

    const cleanPassword = password.trim(); // elimina espacios accidentales
    console.log('🔎 Contraseña limpia recibida desde el frontend:', cleanPassword);

    const passwordValid = await bcrypt.compare(cleanPassword, user.password);
    console.log('🔐 Contraseña válida?', passwordValid);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: user.id, email: user.email, rol: user.rol };
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
 async createUser(data: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersService.create({
      ...data,
      password: hashedPassword
    });
  }

  async sendResetPasswordWhatsappLink(telefono: string) {
      const user = await this.usersService.findByTelefono(telefono);
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const token = uuidv4();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await this.usersService.setResetToken(user.id, token, expiry);

      const resetUrl = `http://localhost:4200/reset-password/${token}`;

      const mensaje = `
          Hola ${user.nombre} 👋,

          Recibimos tu solicitud para cambiar la contraseña de tu cuenta en el sistema de Pilates. 

          📎 Link para restablecer tu contraseña: ${resetUrl}

          Este enlace es válido por 1 hora ⏳.

          Gracias 💪
      `;

      return {
        resetLink: resetUrl,
        telefono: user.telefono,
        mensaje,
        whatsappUrl: `https://wa.me/${user.telefono}?text=${encodeURIComponent(mensaje)}`
      };
  }

    async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const cleanPassword = newPassword.trim();

    console.log('🛠 Contraseña original recibida:', newPassword);
    console.log('🧼 Contraseña limpia (trim):', cleanPassword);

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[.,*!?¿¡/#$%&])[A-Za-z\d.,*!?¿¡/#$%&]{8,20}$/.test(cleanPassword)) {
      throw new BadRequestException('La contraseña no cumple los requisitos mínimos');
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    console.log('🔐 Hash generado:', hashedPassword);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    console.log(`🔐 Contraseña actualizada correctamente para ${user.telefono}`);
    return { message: 'Contraseña restablecida exitosamente' };
  }  
}
