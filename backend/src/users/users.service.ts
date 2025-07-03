import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(userData: {
    email: string;
    nombre: string;
    password: string;
    nivel: string;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      email: userData.email,
      nombre: userData.nombre,
      password: hashedPassword,
      nivel: userData.nivel,
    });

    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user === null ? undefined : user;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  async update(id: number, updateData: Partial<CreateUserDto>): Promise<User> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return updatedUser;
  }


  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}