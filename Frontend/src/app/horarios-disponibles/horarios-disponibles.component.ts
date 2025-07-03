import { Component } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';

interface Horario {
  dia: string;
  hora: string;
  nivel: 'Inicial' | 'Intermedio' | 'Avanzado';
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
  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['8:00', '9:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];


  horarios: Horario[] = [
    { dia: 'Lunes', hora: '8:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 5 },
    { dia: 'Lunes', hora: '9:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 5 },
    { dia: 'Lunes', hora: '10:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 5 },
    { dia: 'Lunes', hora: '11:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 0 },
    { dia: 'Lunes', hora: '15:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 0 },
    { dia: 'Lunes', hora: '16:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 1 },
    { dia: 'Lunes', hora: '17:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 2 },
    { dia: 'Lunes', hora: '18:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 0 },

    { dia: 'Martes', hora: '8:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 3 },
    { dia: 'Martes', hora: '9:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 2 },
    { dia: 'Martes', hora: '10:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 1 },
    { dia: 'Martes', hora: '11:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 0 },
    
  ];

  usuarioNivel: string = '';

  constructor(private router: Router) {
    this.usuarioNivel = localStorage.getItem('nivelUsuario') || '';
    console.log('Nivel usuario:', this.usuarioNivel);
  }

  get horariosFiltrados(): Horario[] {
    return this.horarios.filter(h => h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase());
  }

  isDisponible(dia: string, hora: string): boolean {
    if (dia === 'Viernes' && hora === '8:00') return false;

    const turno = this.horarios.find(
      h =>
        h.dia === dia &&
        h.hora === hora &&
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
    );

    if (!turno) return false;

    return turno.totalCamas > turno.camasReservadas;
  }


  reservar(dia: string, hora: string) {
  this.router.navigate(['/gestion-turno'], {
    queryParams: {
      dia,
      hora,
      nivel: this.usuarioNivel
    }
  });
  }

  getDisponibles(dia: string, hora: string): number {
  const turno = this.horarios.find(
    h =>
      h.dia === dia &&
      h.hora === hora &&
      h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
  );

  if (!turno) return 0;

  return turno.totalCamas - turno.camasReservadas;
}


}
