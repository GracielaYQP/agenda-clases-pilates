import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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


  @Get('/:id')
    async findById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

}
