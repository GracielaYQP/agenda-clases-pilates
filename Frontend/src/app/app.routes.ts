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


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'acerca-de', component: AcercaDeComponent },
  { path: 'CvLucia', component: CvLuciaComponent  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistroComponent },
  { path: 'clases', component: ClasesComponent  },
  { path: 'horarios-disponibles', component: HorariosDisponiblesComponent  },
  { path: 'planes', component: PlanesComponent  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
