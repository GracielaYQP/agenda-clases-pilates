import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion-turnos.component.html',
  styleUrl: './gestion-turnos.component.css',
})
export class GestionTurnosComponent implements OnInit {
  usuarioNivel: string = '';

  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['8:00', '9:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];

  horarios: any[] = [];

  ngOnInit() {
    const nivelGuardado = localStorage.getItem('nivelUsuario') || 'Intermedio';
    this.usuarioNivel = nivelGuardado.trim();
    console.log('Nivel del usuario:', this.usuarioNivel);

    // Mock de horarios de ejemplo
    this.horarios = [
      { dia: 'Lunes', hora: '8:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 2 },
      { dia: 'Lunes', hora: '9:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 1 },
      { dia: 'Lunes', hora: '10:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 3 },
      { dia: 'Lunes', hora: '11:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 0 },
      { dia: 'Lunes', hora: '15:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 5 },
      { dia: 'Lunes', hora: '16:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 1 },
      { dia: 'Lunes', hora: '17:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 2 },
      { dia: 'Lunes', hora: '18:00', nivel: 'Inicial', totalCamas: 5, camasReservadas: 0 },
      // Repite para otros días según necesites...
      { dia: 'Viernes', hora: '9:00', nivel: 'Avanzado', totalCamas: 5, camasReservadas: 2 },
      { dia: 'Viernes', hora: '10:00', nivel: 'Intermedio', totalCamas: 5, camasReservadas: 2 },
    ];
  }

  reservar(turno: any) {
    if (turno.totalCamas - turno.camasReservadas <= 0) {
      alert('No hay camas disponibles para este horario');
      return;
    }

    console.log(`Reservando: ${turno.dia} ${turno.hora} (${turno.nivel})`);
    // Aquí luego harás POST al backend para registrar la reserva real.
  }

    hasTurno(dia: string, hora: string): boolean {
      return this.horarios.some(
        h =>
          h.dia === dia &&
          h.hora === hora &&
          h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
    }

    getTurnos(dia: string, hora: string) {
      return this.horarios.filter(
        h =>
          h.dia === dia &&
          h.hora === hora &&
          h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      );
    }


}
