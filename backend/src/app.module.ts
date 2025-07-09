import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { InvitacionesModule } from './invitaciones/invitaciones.module';
import { HorariosModule } from './horarios/horarios.module';



@Module({
   imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'carola20958',
      database: 'pilates_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Solo para desarrollo
    }),
    AuthModule,
    UsersModule,
    InvitacionesModule,
    HorariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}






