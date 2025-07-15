import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(userData: {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string; 
  password: string;
  nivel: string;
}): Promise<User> {
  // Validar email único
  const existingEmail = await this.userRepository.findOne({
    where: { email: userData.email },
  });
  if (existingEmail) {
    throw new BadRequestException('El email ya está registrado');
  }

  // Validar DNI único
  const existingDNI = await this.userRepository.findOne({
    where: { dni: userData.dni },
  });
  if (existingDNI) {
    throw new BadRequestException('El DNI ya está registrado');
  }

  // 🚨 Validar que la contraseña no esté repetida
  const existingUsers = await this.userRepository.find();
  for (const existing of existingUsers) {
    const isSame = await bcrypt.compare(userData.password, existing.password);
    if (isSame) {
      throw new BadRequestException('La contraseña ya está en uso. Elegí una diferente.');
    }
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = this.userRepository.create({
    email: userData.email,
    nombre: userData.nombre,
    apellido: userData.apellido,
    dni: userData.dni,
    telefono: userData.telefono,
    password: hashedPassword,
    nivel: userData.nivel,
  });

  return await this.userRepository.save(user);
}


  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user === null ? undefined : user;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    
    if (updateData.password && !updateData.password.startsWith('$2b$')) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return updatedUser;
  }

  async obtenerListadoUsuarios() {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.activo = :activo', { activo: true })
      .andWhere('LOWER(user.rol) != :rol', { rol: 'admin' })
      .orderBy('user.apellido', 'ASC')
      .addOrderBy('user.nombre', 'ASC')
      .getMany();
  }


  async inactivarUsuario(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    user.activo = false;
    await this.userRepository.save(user);
  }

  async findByEmailOrTelefono(usuario: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: [
        { email: usuario },
        { telefono: usuario },
      ],
    });
    return user ?? undefined;
  }

  async findByEmailOrTelefonoAndPassword(usuario: string, password: string): Promise<User | undefined> {
    const user = await this.findByEmailOrTelefono(usuario);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return undefined;
  }

  async setResetToken(id: number, token: string, expiry: Date) {
    await this.userRepository.update(id, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });
  }

  async findByResetToken(token: string) {
    return this.userRepository.findOne({ where: { resetToken: token } });
  }


  async findByTelefono(telefono: string) {
    return this.userRepository.findOne({ where: { telefono } });
  }

}