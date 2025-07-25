import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { InvitacionesModule } from './invitaciones/invitaciones.module';
import { HorariosModule } from './horarios/horarios.module';
import { MailerService } from './auth/mailer/mailer.service';
import { ReservaModule } from './reserva/reserva.module';
import { ConfigModule } from '@nestjs/config';



@Module({
   imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
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
    ReservaModule,
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
     }),
    
  ],
  controllers: [AppController],
  providers: [AppService, MailerService,],
})
export class AppModule {}






