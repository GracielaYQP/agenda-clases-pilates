import { Component } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { HorariosService } from '../services/horarios.service';

export interface Horario {
  
  dia: string;
  hora: string;
  nivel: string;
  totalCamas: number;
  camasReservadas: number;
}

@Component({
  selector: 'app-horarios-disponibles',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './horarios-disponibles.component.html',
  styleUrl: './horarios-disponibles.component.css'
})
export class HorariosDisponiblesComponent {

  nivelHorarios: Horario[] = [];
  dias: string[] = [];
  horas: string[] = [];
  usuarioNivel: string = '';

  horarios: Horario[] = [
    
  { "dia": "Lunes", "hora": "08:00", "nivel": "Avanzado", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "09:00", "nivel": "Avanzado", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "10:00", "nivel": "Intermedio", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "11:00", "nivel": "Intermedio", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "15:00", "nivel": "Intermedio", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "16:00", "nivel": "Intermedio", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "17:00", "nivel": "Inicial", "totalCamas": 5, "camasReservadas": 0 },
  { "dia": "Lunes", "hora": "18:00", "nivel": "Inicial", "totalCamas": 5, "camasReservadas": 0 }
  // Repetí esto mismo para Martes a Viernes
]
  
    
  constructor(private router: Router, private horariosService: HorariosService) {
 
    this.usuarioNivel = localStorage.getItem('nivelUsuario') || '';

    if (this.usuarioNivel) {
      // Si está logueado, mostrar solo su nivel
      this.nivelHorarios = this.horarios.filter(
        h => h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
    } else {
      // Si no está logueado, mostrar todos
      this.nivelHorarios = this.horarios;
    }

    this.dias = Array.from(new Set(this.horarios.map(h => h.dia)));

    this.horas = Array.from(new Set(this.horarios.map(h => h.hora))).sort(
      (a, b) => {
        const ah = parseInt(a.split(':')[0], 10);
        const bh = parseInt(b.split(':')[0], 10);
        return ah - bh;
      }
    );

    console.log('Usuario nivel:', this.usuarioNivel);
    console.log('Horarios mostrados:', this.nivelHorarios);
    console.log('Días:', this.dias);
    console.log('Horas:', this.horas);
  }


  ngOnInit() {
    this.horariosService.horarios$.subscribe(data => {
      this.horarios = data;
      this.cargarHorarios(); // recalcula nivelHorarios, dias y horas con los datos ya cargados
      console.log('Horarios actualizados:', this.horarios);
    });
    this.horariosService.cargarHorarios();
    console.log(this.horarios);
  }

  cargarHorarios() {
    this.usuarioNivel = localStorage.getItem('nivelUsuario') || '';

    if (this.usuarioNivel) {
      this.nivelHorarios = this.horarios.filter(
        h => h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
    } else {
      this.nivelHorarios = this.horarios;
    }

    this.dias = Array.from(new Set(this.horarios.map(h => h.dia)));
    this.horas = Array.from(new Set(this.horarios.map(h => h.hora))).sort(
      (a, b) => {
        const ah = parseInt(a.split(':')[0], 10);
        const bh = parseInt(b.split(':')[0], 10);
        return ah - bh;
      }
    );

    console.log('Usuario nivel:', this.usuarioNivel);
    console.log('Horarios mostrados:', this.nivelHorarios);
    console.log('Días:', this.dias);
    console.log('Horas:', this.horas);
  }
 

  getNivelTurno(dia: string, hora: string): string {
    // Si hay usuario logueado, filtra por su nivel
    if (this.usuarioNivel) {
      const turno = this.horarios.find(h =>
        h.dia === dia &&
        h.hora === hora &&
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
      return turno ? turno.nivel : '';
    } else {
      // Si no hay usuario, muestra el primer turno disponible (puedes mostrar todos si quieres)
      const turnos = this.horarios.filter(h => h.dia === dia && h.hora === hora);
      return turnos.map(t => t.nivel).join(', ');
    }
  }

  getDisponibles(dia: string, hora: string): string {
    if (this.usuarioNivel) {
      const turno = this.horarios.find(h =>
        h.dia === dia &&
        h.hora === hora &&
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
      return turno ? (turno.totalCamas - turno.camasReservadas).toString() : '0';
    } else {
      // Suma los disponibles de todos los niveles
      const turnos = this.horarios.filter(h => h.dia === dia && h.hora === hora);
      return turnos
        .map(t => `${t.nivel}: ${t.totalCamas - t.camasReservadas}`)
        .join(' | ');
    }
  }

  isDisponible(dia: string, hora: string): boolean {
    if (this.usuarioNivel) {
      const turno = this.horarios.find(h =>
        h.dia === dia &&
        h.hora === hora &&
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
      return turno ? turno.totalCamas > turno.camasReservadas : false;
    } else {
      // Si no hay usuario, es disponible si hay algún turno con camas libres
      return this.horarios.some(h =>
        h.dia === dia &&
        h.hora === hora &&
        h.totalCamas > h.camasReservadas
      );
    }
  }

  reservar(dia: string, hora: string) {
    if (!this.usuarioNivel) {
      // No logueado: no hacer nada
      return;
    }
    const nivelTurno = this.getNivelTurno(dia, hora);
    this.router.navigate(['/gestion-turnos'], {
      queryParams: {
        dia,
        hora,
        nivel: nivelTurno || this.usuarioNivel
      }
    });
  }

  isClickable(dia: string, hora: string): boolean {
    // Permite click solo si hay usuario logueado y hay turno disponible para su nivel
    if (!this.usuarioNivel) return false;
    const turno = this.horarios.find(
      h => h.dia === dia && h.hora === hora && h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
    );
    return turno ? this.isDisponible(dia, hora) : false;
  }


}
