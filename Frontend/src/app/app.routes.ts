import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegistroComponent } from './auth/registro/registro.component';
import { AcercaDeComponent } from './acerca-de/acerca-de.component';
import { CvLuciaComponent } from './cv-lucia/cv-lucia.component';
import { ClasesComponent } from './clases/clases.component';
import { HorariosDisponiblesComponent } from './horarios-disponibles/horarios-disponibles.component';
import { PlanesComponent } from './planes/planes.component';
import { GestionTurnosComponent } from './gestion-turnos/gestion-turnos.component';
import { AuthGuard } from './services/auth.guard';
import { InvitacionesComponent } from './admin/invitaciones/invitaciones.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'acerca-de', component: AcercaDeComponent },
  { path: 'CvLucia', component: CvLuciaComponent  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistroComponent },
  { path: 'clases', component: ClasesComponent  },
  { path: 'horarios-disponibles', component: HorariosDisponiblesComponent  },
  { path: 'planes', component: PlanesComponent  },
  { path: 'gestion-turnos', component: GestionTurnosComponent, canActivate: [AuthGuard]  },
  {
    path: 'admin/invitaciones',
    component: InvitacionesComponent,
    canActivate: [AuthGuard], // protege primero si está logueado
    data: { roles: ['admin'] } // 👈 pasas los roles permitidos
  },

];

