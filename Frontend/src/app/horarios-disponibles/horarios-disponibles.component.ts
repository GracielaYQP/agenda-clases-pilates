import { Component } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { HorariosService } from '../services/horarios.service';

export interface Horario {
  id: number;
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
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  usuarioNivel: string = '';

  horarios: Horario[] = [ ];
  
  
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
      this.horarios = (data && data.length > 0) ? data : this.generarHorariosBase();
      
      this.cargarHorarios();

      console.log('✅ Datos recibidos desde el observable o generados localmente');
      console.log('Usuario nivel:', this.usuarioNivel);
      console.log('Horarios:', this.horarios);
    });

    this.horariosService.cargarHorarios();
  }



  generarHorariosBase(): Horario[] {
  const horariosBase: Horario[] = [];
  let idCounter = 1; // ✅ Declarás idCounter antes de usarlo

  for (let dia of this.dias) {
    for (let hora of this.horas) {
      const nivel = this.getNivelParaHorario(dia, hora);

      horariosBase.push({
        id: idCounter++, // ✅ Asignás un id único
        dia,
        hora,
        nivel,
        totalCamas: 5,
        camasReservadas: 0
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

    this.dias = Array.from(new Set(this.horarios.map(h => h.dia)));
    this.horas = Array.from(new Set(this.horarios.map(h => h.hora))).sort((a, b) => {
      const ah = parseInt(a.split(':')[0], 10);
      const bh = parseInt(b.split(':')[0], 10);
      return ah - bh;
    });

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


  getDisponibles(dia: string, hora: string, nivel: string): string {
    if (nivel === 'No disponible') return '0';
    const turno = this.horarios.find(h =>
      h.dia === dia && h.hora === hora && h.nivel === nivel
    );
    return turno ? (turno.totalCamas - turno.camasReservadas).toString() : '5';
  }



  isDisponible(dia: string, hora: string, nivel: string): boolean {
    const turno = this.horarios.find(h =>
      h.dia === dia &&
      h.hora === hora &&
      h.nivel.toLowerCase() === nivel.toLowerCase()
    );
    return turno ? turno.totalCamas > turno.camasReservadas : false;
  }


  reservar(dia: string, hora: string, nivel: string) {
  if (!this.isClickable(dia, hora, nivel)) return;

  const id = this.getIdTurno(dia, hora, nivel);
  if (id === null) {
    alert('Turno no encontrado.');
    return;
  }

  this.horariosService.reservar(id).subscribe({
    next: (turnoActualizado) => {
      console.log('✅ Turno reservado:', turnoActualizado);
    },
    error: (err) => {
      alert('No se pudo reservar el turno: ' + err.error.message || err.message);
    }
  });
}


  getIdTurno(dia: string, hora: string, nivel: string): number | null {
    const turno = this.horarios.find(
      h => h.dia === dia && h.hora === hora && h.nivel === nivel
    );
    return turno ? turno['id'] : null;
  }



  isClickable(dia: string, hora: string, nivel: string): boolean {
  return (
    !!this.usuarioNivel &&
    this.usuarioNivel.toLowerCase() === nivel.toLowerCase() &&
    this.isDisponible(dia, hora, nivel)
  );
}


  getNivelParaHorario(dia: string, hora: string): string {
    if (dia === 'Viernes' && hora === '08:00') {
      return 'No disponible';
    }
    if (dia === 'Viernes' && hora === '18:00') {
      return 'No disponible';
    }
    if (['08:00', '09:00'].includes(hora)) {
      return 'Avanzado';
    } else if (['10:00', '11:00', '15:00', '16:00'].includes(hora)) {
      return 'Intermedio';
    } else if (['17:00', '18:00'].includes(hora)) {
      return 'Inicial';
    } else {
      return 'No definido';
    }
  }

}






