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

  dias: string[] = [];
  fechaInicioSemana: Date = new Date();
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  misReservas: any[] = [];
  modalAbierto = false;
  turnoAEliminar: any = null;

  constructor(private horariosService: HorariosService) {} 

  ngOnInit() {
    this.generarDiasConFechas();
    this.horariosService.getMisReservas().subscribe({
      next: (data: any[]) => {
        this.misReservas = data.filter(r => r.estado !== 'cancelado');
        console.log('🗓️ Mis reservas:', this.misReservas);
        this.cerrarModal();
      },
      error: (err: any) => {
        console.error('❌ Error al cargar mis reservas', err);
      }
    });
  }

  // Esta función genera días como "Lunes 29/07/2025"
  generarDiasConFechas() {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0 (domingo) a 6 (sábado)
    const diasDesdeLunes = (diaActual + 6) % 7; // cuántos días retroceder hasta llegar a lunes
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeLunes);

    this.dias = Array.from({ length: 5 }, (_, i) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const nombreDia = diasSemana[fecha.getDay()];
      const fechaStr = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1)
        .toString().padStart(2, '0')}/${fecha.getFullYear()}`;
      return `${nombreDia} ${fechaStr}`;
    });
  }

  // ✅ Devuelve true si el usuario tiene una reserva para esa fecha y hora
  hasReserva(diaCompleto: string, hora: string): boolean {
    const fechaFormateada = this.obtenerFechaFormateadaDesdeDia(diaCompleto);
    return this.misReservas.some(r =>
      r.fechaTurno === fechaFormateada &&
      r.horario.hora === hora
    );
  }

  // ✅ Devuelve el nivel del turno reservado en esa celda
  getNivel(diaCompleto: string, hora: string): string {
    const fechaFormateada = this.obtenerFechaFormateadaDesdeDia(diaCompleto);
    const reserva = this.misReservas.find(r =>
      r.fechaTurno === fechaFormateada &&
      r.horario.hora === hora
    );
    return reserva ? reserva.horario.nivel : '';
  }

  private obtenerFechaFormateadaDesdeDia(diaCompleto: string): string {
    const partes = diaCompleto.split(' '); // ["Martes", "30/07/2025"]
    const fechaTexto = partes[1];          // "30/07/2025"
    const fechaParts = fechaTexto.split('/'); // ["30", "07", "2025"]
    return `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`; // "2025-07-30"
  }


  getNombreCompleto(diaCompleto: string, hora: string): string {
    const fechaFormateada = this.obtenerFechaFormateadaDesdeDia(diaCompleto);
    const reserva = this.misReservas.find(r =>
      r.fechaTurno === fechaFormateada &&
      r.horario.hora === hora
    );
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

  confirmarCancelacion(tipo: 'momentanea' | 'permanente') {
    const reservaId = this.turnoAEliminar.id;

    this.horariosService.anularReserva(reservaId, tipo).subscribe({
      next: () => {
        this.misReservas = this.misReservas.filter(r => r.id !== reservaId);
        this.cerrarModal();
      },
      error: err => {
        console.error('❌ Error al cancelar la reserva', err);
      }
    });
  }

  abrirModalDesdeCelda(diaCompleto: string, hora: string) {
    const partes = diaCompleto.split(' '); // ["Martes", "30/07/2025"]
    const fechaTexto = partes[1]; // "30/07/2025"

    const fechaParts = fechaTexto.split('/'); // ["30", "07", "2025"]
    const fechaFormateada = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`; // "2025-07-30"

    const reserva = this.misReservas.find(r =>
      r.fechaTurno === fechaFormateada &&
      r.horario.hora === hora
    );

    if (reserva) {
      this.turnoAEliminar = reserva;
      this.modalAbierto = true;
    } else {
      console.warn('⚠️ No se encontró la reserva para mostrar en el modal');
    }
  }

}
