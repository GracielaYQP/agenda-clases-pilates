import { Component } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { HorariosService } from '../services/horarios.service';
import { Horario } from '../gestion-turnos/gestion-turnos.component';

export interface Reserva {
  id: number;
  nombre: string;
  apellido: string;
}


export interface HorarioSemana {
  idHorario: number;
  dia: string;
  fecha: string;
  hora: string;
  nivel: string;
  totalCamas: number;
  camasReservadas: number;
  camasDisponibles: number;
  reservadoPorUsuario: boolean;
  canceladoPorUsuario: boolean;
}

@Component({
  selector: 'app-horarios-disponibles',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './horarios-disponibles.component.html',
  styleUrl: './horarios-disponibles.component.css'
})

export class HorariosDisponiblesComponent {

  horarios: HorarioSemana[] = [];
  nivelHorarios: HorarioSemana[] = [];
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  usuarioNivel: string = '';
  mostrarMensajeActualizacion: boolean = false;
 
  
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

    // console.log('Usuario nivel:', this.usuarioNivel);
    // console.log('Horarios mostrados:', this.nivelHorarios);
    // console.log('Días:', this.dias);
    // console.log('Horas:', this.horas);
  }


  ngOnInit() {
    this.horariosService.getHorariosDeLaSemana().subscribe(data => {
      this.horarios = data;
      const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

      const diasUnicos = Array.from(
        new Set(data.map(h => `${h.dia} ${this.formatearFecha(h.fecha)}`))
      );

      // Ordenar según el orden de los días de la semana
      this.dias = ordenDias
      .map(dia =>
        diasUnicos.find(d => d.startsWith(dia))
      )
      .filter((d): d is string => d !== undefined);

      this.horas = Array.from(new Set(data.map(h => h.hora))).sort((a, b) => {
        const ah = parseInt(a.split(':')[0], 10);
        const bh = parseInt(b.split(':')[0], 10);
        return ah - bh;
      });
      this.mostrarMensajeTemporal();
    });
  }

  generarHorariosBase(): HorarioSemana[] {
    const horariosBase: HorarioSemana[] = [];
    let idCounter = 1; 

    for (let dia of this.dias) {
      for (let hora of this.horas) {
        const nivel = this.getNivelParaHorario(dia, hora);

        horariosBase.push({
          idHorario: idCounter++,
          fecha:'',
          dia,
          hora,
          nivel,
          totalCamas: 5,
          camasReservadas: 0,
          camasDisponibles: 5,
          reservadoPorUsuario: false,
          canceladoPorUsuario: false,
          });
      }
    }

    return horariosBase;
  }

  cargarHorarios() {
    this.usuarioNivel = localStorage.getItem('nivelUsuario') || '';

    if (this.usuarioNivel) {
      this.nivelHorarios = this.horarios.filter(
        h => h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
    } else {
      this.nivelHorarios = this.horarios; // <=== MOSTRAR TODOS
    }

    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    this.dias = ordenDias.filter(dia => this.horarios.some(h => h.dia === dia));

    this.horas = Array.from(new Set(this.horarios.map(h => h.hora))).sort((a, b) => {
      const ah = parseInt(a.split(':')[0], 10);
      const bh = parseInt(b.split(':')[0], 10);
      return ah - bh;
    });

    // console.log('Usuario nivel:', this.usuarioNivel);
    // console.log('Horarios mostrados:', this.nivelHorarios);
    // console.log('Días:', this.dias);
    // console.log('Horas:', this.horas);
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

  getDisponibles(diaConFecha: string, hora: string, nivel: string): string {
    if (nivel === 'No disponible') return '0';

    const [dia, fecha] = diaConFecha.split(' ');

    const turno = this.horarios.find(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      h.nivel === nivel
    );

    return turno ? turno.camasDisponibles.toString() : '0';
  }

  isDisponible(dia: string, hora: string, nivel: string): boolean {
    const turno = this.horarios.find(h =>
      h.dia === dia &&
      h.hora === hora &&
      h.nivel.toLowerCase() === nivel.toLowerCase()
    );
    return turno ? turno.totalCamas > turno.camasReservadas : false;
  }

  reservar(diaConFecha: string, hora: string, nivel: string) {
    if (!this.isClickable(diaConFecha, hora, nivel)) return;

    const [dia, fecha] = diaConFecha.split(' ');

    this.router.navigate(['/gestion-turnos'], {
      queryParams: { dia, hora, nivel, fecha }
    });
  }


  getIdTurno(dia: string, hora: string, nivel: string): number | null {
    const turno = this.horarios.find(
      h => h.dia === dia && h.hora === hora && h.nivel === nivel
    );
    return turno ? turno.idHorario : null;
  }


  isClickable(diaConFecha: string, hora: string, nivel: string): boolean {
    const [dia, fecha] = diaConFecha.split(' ');

    const turno = this.horarios.find(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      h.nivel === nivel
    );

    return (
      !!this.usuarioNivel &&
      this.usuarioNivel.toLowerCase() === nivel.toLowerCase() &&
      !!turno &&
      turno.camasDisponibles > 0
    );
  }


  getNivelParaHorario(diaConFecha: string, hora: string): string {
    const [dia, fecha] = diaConFecha.split(' ');

    const turno = this.horarios.find(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora
    );

    return turno ? turno.nivel : 'No disponible';
  }


  mostrarMensajeTemporal() {
    this.mostrarMensajeActualizacion = true;
    setTimeout(() => {
      this.mostrarMensajeActualizacion = false;
    }, 4000); // se oculta después de 4 segundos
  }

  formatearFecha(fecha: string): string {
    // Fuerza la hora 12:00 del mediodía para evitar desfases de zona horaria
    const date = new Date(`${fecha}T12:00:00-03:00`);
    return date.toLocaleDateString('es-AR');
  }


}






