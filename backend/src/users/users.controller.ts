import { Controller, Post, Body, Param, Patch, Get, NotFoundException, UseGuards, BadRequestException, Req, Query, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user.dto';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ILike, Repository } from 'typeorm';


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get("/obtenerListadoUsuarios")
    obtenerListadoUsuarios(){
        return this.usersService.obtenerListadoUsuarios();
  }

  @Patch("/modificarUsuario/:id")
    update(@Param('id') id, @Body() Body){
        return this.usersService.update( id, Body);
  }

  @Patch('/inactivar/:id')
    inactivarUsuario(@Param('id') id: number) {
      return this.usersService.inactivarUsuario(id);
  }

    @Get('buscar')
  async buscarPorNombreYApellido(
    @Query('nombre') nombre: string,
    @Query('apellido') apellido: string
  ) {
    console.log('🔍 Buscando usuario:', { nombre, apellido });

    if (!nombre || !apellido) {
      throw new BadRequestException('Faltan nombre o apellido');
    }

    try {
      const user = await this.userRepository.findOne({
        where: {
          nombre: ILike(nombre.trim()),
          apellido: ILike(apellido.trim()),
        },
      });

      if (!user) {
        throw new NotFoundException(`No se encontró un usuario con nombre ${nombre} y apellido ${apellido}`);
      }

      return user;
    } catch (error) {
      console.error('🔥 Error al buscar usuario:', error);
      throw new InternalServerErrorException('Error en la búsqueda de usuario');
    }
  }

  @Get('/:id')
    async findById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @Patch('/reactivar/:id')
  reactivarUsuario(@Param('id') id: number) {
    return this.usersService.reactivarUsuario(id);
  }

  @Get('telefono/:telefono')
  async buscarPorTelefono(@Param('telefono') telefono: string) {
    const user = await this.userRepository.findOneBy({ telefono });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

}
