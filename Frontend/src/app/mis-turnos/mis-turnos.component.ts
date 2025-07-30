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
  mostrarModalConfirmarAccion = false;  // segundo modal de confirmación final
  tipoCancelacionSeleccionado: 'momentanea' | 'permanente' = 'momentanea';
  textoConfirmacion = '';
  mensajeUsuarioCancel = '';
  mostrarConfirmacionUsuario = false;
  esErrorUsuarioCancel = false;
  uiBloqueadoAlumnoCancel = false;      // bloquea todo salvo “Cerrar” luego del éxito


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

  confirmarCancelacion(tipo: 'momentanea' | 'permanente') {
    if (!this.turnoAEliminar || !this.turnoAEliminar.id) {
      console.error('❌ Reserva inválida:', this.turnoAEliminar);
      this.mensajeUsuarioCancel = '❌ No se pudo cancelar: reserva inválida.';
      this.esErrorUsuarioCancel = true;
      this.mostrarConfirmacionUsuario = true;
      return;
    }

    this.tipoCancelacionSeleccionado = tipo;

    const fechaArg = this.formatearFechaArg(this.turnoAEliminar.fechaTurno);
    const dia = this.turnoAEliminar?.horario?.dia ?? '';
    const hora = this.turnoAEliminar?.horario?.hora ?? '';

    if (tipo === 'momentanea') {
      this.textoConfirmacion = `¿Querés cancelar la reserva del día ${dia} ${fechaArg} a las ${hora}?`;
    } else {
      this.textoConfirmacion = `¿Querés cancelar permanentemente tu reserva de ${dia} ${hora} (${fechaArg})?`;
    }

    // Cerramos el primer modal y abrimos el de confirmación final
    this.modalAbierto = false;
    this.mostrarModalConfirmarAccion = true;
  }

  aceptarCancelacion() {
    const reservaId = this.turnoAEliminar?.id;
    if (!reservaId) {
      this.mensajeUsuarioCancel = '❌ No se pudo cancelar: ID de reserva inválido.';
      this.esErrorUsuarioCancel = true;
      this.mostrarConfirmacionUsuario = true;
      this.mostrarModalConfirmarAccion = false;
      return;
    }

    // ⚡ Si la reserva es temporal, el tipo no aplica (borrado físico en backend)
    const tipo = this.turnoAEliminar.automatica
      ? this.tipoCancelacionSeleccionado
      : 'momentanea'; // se trata como "momentánea" para el backend (borrar)

    this.horariosService.anularReserva(reservaId, tipo).subscribe({
      next: () => {
        // Sacar de la lista
        this.misReservas = this.misReservas.filter(r => r.id !== reservaId);

        // Mensaje
        if (this.turnoAEliminar.automatica) {
          // Permanente
          this.mensajeUsuarioCancel =
            tipo === 'momentanea'
              ? '✅ La reserva fue cancelada por esta vez.'
              : '✅ La reserva fue cancelada permanentemente.';
        } else {
          // Temporal
          this.mensajeUsuarioCancel = '✅ La reserva de recuperación fue cancelada.';
        }

        this.esErrorUsuarioCancel = false;
        this.mostrarConfirmacionUsuario = true;

        // Bloquea UI
        this.uiBloqueadoAlumnoCancel = true;

        // Cierra el modal de confirmación
        this.mostrarModalConfirmarAccion = false;
        this.modalAbierto = false;
      },
      error: (err) => {
        console.error('❌ Error al cancelar la reserva', err);
        this.mensajeUsuarioCancel =
          '❌ Error al cancelar: ' +
          (err?.error?.message || err?.message || 'desconocido');
        this.esErrorUsuarioCancel = true;
        this.mostrarConfirmacionUsuario = true;
        this.uiBloqueadoAlumnoCancel = false;
        this.mostrarModalConfirmarAccion = false;
      },
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

      // 👇 Lógica nueva: diferenciar por tipo de reserva
      if (reserva.automatica) {
        // 🔹 Reserva permanente: mostrar modal con opciones
        this.modalAbierto = true;
      } else {
        // 🔹 Reserva temporal: solo una confirmación
        this.textoConfirmacion = `¿Querés cancelar esta reserva de recuperación (${diaCompleto} ${hora})?`;
        this.mostrarModalConfirmarAccion = true;
      }

    } else {
      console.warn('⚠️ No se encontró la reserva para mostrar en el modal');
    }
  }

  cerrarModal() {
    this.turnoAEliminar = null;
    this.modalAbierto = false;
    this.mostrarModalConfirmarAccion = false;
    this.uiBloqueadoAlumnoCancel = false;
    this.mostrarConfirmacionUsuario = false;
    this.mensajeUsuarioCancel = '';
    this.esErrorUsuarioCancel = false;
  }

  cerrarConfirmacionFinal() {
    // Si la reserva era permanente, vuelve a abrir el modal original
    if (this.turnoAEliminar?.automatica) {
      this.mostrarModalConfirmarAccion = false;
      this.modalAbierto = true;
    } else {
      // Si era temporal, cerramos todo
      this.mostrarModalConfirmarAccion = false;
      this.turnoAEliminar = null;
    }
  }

  formatearFechaArg(yyyyMmDd: string): string {
    // "2025-07-30" -> "30/07/2025"
    if (!yyyyMmDd) return '';
    const [y, m, d] = yyyyMmDd.split('-');
    return `${d}/${m}/${y}`;
  }

}
