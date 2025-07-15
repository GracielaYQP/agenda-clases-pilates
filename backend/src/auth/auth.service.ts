import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/user.dto';
import { MailerService } from './mailer/mailer.service';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
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
  async loginFlexible(usuario: string, password: string) {
    const user = await this.usersService.findByEmailOrTelefono(usuario);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

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
    telefono: string; 
    email: string; 
    nombre: string; 
    apellido: string; 
    dni: string; 
    password: string; 
    nivel: string 
}) {
    // NO hacer hash aquí — lo hace UsersService.create
    return this.usersService.create({
      dni: data.dni,
      nombre: data.nombre,
      apellido: data.apellido,  
      telefono: data.telefono,
      email: data.email,
      password: data.password, 
      nivel: data.nivel,
    });
  }

  // async sendResetPasswordEmail(email: string) {
  //   const user = await this.usersService.findByEmail(email);
  //   if (!user) throw new NotFoundException('Usuario no encontrado');

  //   const token = uuidv4();
  //   const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  //   await this.usersService.setResetToken(user.id, token, expiry);

  //   const resetUrl = `http://localhost:4200/reset-password/${token}`;
  //   await this.mailerService.sendMail({
  //     to: email,
  //     subject: 'Restablecer contraseña',
  //     html: `
  //       <p>Hola ${user.nombre},</p>
  //       <p>Recibimos tu solicitud para cambiar la contraseña.</p>
  //       <p><a href="${resetUrl}">Hacé clic aquí para restablecerla</a></p>
  //       <p>Este enlace es válido por 1 hora.</p>
  //     `,
  //   });

  //   return { message: 'Te enviamos un enlace a tu correo para restablecer tu contraseña' };
  // }

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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'Contraseña restablecida exitosamente' };
    console.log('🔐 Nueva contraseña encriptada:', hashedPassword);
   

  }
  
}
