import { Component } from '@angular/core';
import { HorariosService } from '../services/horarios.service';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent {

  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  misReservas: any[] = [];
  modalAbierto = false;
  turnoAEliminar: any = null;

  constructor(private horariosService: HorariosService) {} 

  ngOnInit() {
    this.horariosService.getMisReservas().subscribe({
      next: (data: any[]) => {
        this.misReservas = data;
        console.log('🗓️ Mis reservas:', data);
      },
      error: (err: any) => {
        console.error('❌ Error al cargar mis reservas', err);
      }
    });
  }

  // Devuelve true si el usuario tiene una reserva para ese día y hora
  hasReserva(dia: string, hora: string): boolean {
    return this.misReservas.some(r => r.horario.dia === dia && r.horario.hora === hora);
  }

  getNivel(dia: string, hora: string): string {
    const reserva = this.misReservas.find(r => r.horario.dia === dia && r.horario.hora === hora);
    return reserva ? reserva.horario.nivel: '';
  }

  getNivelClase(dia: string, hora: string): string {
    return this.getNivel(dia, hora).toLowerCase();
  }

  getNombreCompleto(dia: string, hora: string): string {
    const reserva = this.misReservas.find(r => r.horario.dia === dia && r.horario.hora === hora);
    return reserva ? `${reserva.nombre} ${reserva.apellido}` : '';
  }

  abrirModalCancelacion(reserva: any) {
    this.turnoAEliminar = reserva;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.turnoAEliminar = null;
    this.modalAbierto = false;
  }

  confirmarCancelacion() {
    const reservaId = this.turnoAEliminar.id;

    this.horariosService.anularReserva(reservaId).subscribe({
      next: () => {
        this.misReservas = this.misReservas.filter(r => r.id !== reservaId);
        this.cerrarModal();
      },
      error: err => {
        console.error('❌ Error al cancelar la reserva', err);
      }
    });
  }

  abrirModalDesdeCelda(dia: string, hora: string) {
    const reserva = this.misReservas.find(r => r.horario.dia === dia && r.horario.hora === hora);
    if (reserva) {
      this.abrirModalCancelacion(reserva);
    }
  }
}
