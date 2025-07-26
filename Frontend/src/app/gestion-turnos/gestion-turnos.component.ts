import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosService } from '../services/horarios.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface Reserva {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Horario {
  id: number;
  dia: string;
  hora: string;
  nivel: string;
  totalCamas: number;
  camasReservadas: number;
  reservas: Reserva[];
}

@Component({
  selector: 'app-gestion-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-turnos.component.html',
  styleUrl: './gestion-turnos.component.css',
})
export class GestionTurnosComponent implements OnInit {
  usuarioNivel: string = '';
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  horarios: any[] = [];
  rolUsuario: string = '';
  modalAbierto: boolean = false;
  turnoSeleccionado: any = null;
  busquedaModo: string = 'nombre-apellido'; // valor por defecto
  nombreNuevo: string = '';
  apellidoNuevo: string = '';
  telefonoNuevo: string = '';
  reservaEditandoId: number | null = null;
  nombreEditado: string = '';
  apellidoEditado: string = '';
  nuevoUserId: number | null = null;
  mostrarFormAgregar: boolean = false;
  modalAlumnoAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  mostrarConfirmacion: boolean = false;
  mensajeReserva: string = '';
  esErrorReserva: boolean = false;
  mensajeAdminReserva: string = '';
  mostrarConfirmacionAdmin: boolean = false;
  esErrorAdmin: boolean = false;
  esRecuperacion: boolean = false;
  reservaAutomatica: boolean = true;


  constructor(
    private horariosService: HorariosService,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    const nivelGuardado = localStorage.getItem('nivelUsuario');
    const rolGuardado = localStorage.getItem('rol');

    if (!nivelGuardado || !rolGuardado) {
      console.error('❌ Nivel o rol de usuario no encontrado.');
      return;
    }

    this.usuarioNivel = nivelGuardado.trim();
    this.rolUsuario = rolGuardado.trim().toLowerCase();

    this.horariosService.getHorariosDeLaSemana().subscribe(data => {
      this.horarios = data;

      // 🧠 Días únicos con fecha formateada
      const diasUnicos = Array.from(
        new Set(data.map(h => `${h.dia} ${this.formatearFecha(h.fecha)}`))
      );

      // Ordenar según el orden de la semana
      const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      this.dias = ordenDias
        .map(d => diasUnicos.find(diaConFecha => diaConFecha.startsWith(d)))
        .filter((d): d is string => d !== undefined);

      // Horas únicas ordenadas
      this.horas = Array.from(new Set(data.map(h => h.hora))).sort((a, b) => {
        const ah = parseInt(a.split(':')[0], 10);
        const bh = parseInt(b.split(':')[0], 10);
        return ah - bh;
      });

      console.log('🗓️ Días con fecha:', this.dias);
      console.log('⏰ Horas:', this.horas);
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00-03:00`);
    return date.toLocaleDateString('es-AR'); 
  }

  getNivelParaHorario(hora: string): string {
    if (['08:00', '09:00'].includes(hora)) return 'Avanzado';
    if (['10:00', '11:00', '15:00', '16:00'].includes(hora)) return 'Intermedio';
    if (['17:00', '18:00'].includes(hora)) return 'Inicial';
    return '';
  }

  abrirTurno(turno: any) {
    if (!turno.id) {
      console.warn('🚨 Turno sin ID:', turno);
    }
    this.turnoSeleccionado = {
      ...turno,
      fecha: turno.fecha
    };

    if (this.rolUsuario === 'admin') {
      this.abrirEditorDeReservas(this.turnoSeleccionado);
    } else {
      this.nombreUsuario = localStorage.getItem('nombreUsuario') || 'Desconocido';
      this.apellidoUsuario = localStorage.getItem('apellidoUsuario') || 'Desconocido';
      this.modalAlumnoAbierto = true;
    }
    console.log('🧩 Turno recibido:', turno);
  }

  hasTurno(diaConFecha: string, hora: string): boolean {
    const [dia, fecha] = diaConFecha.split(' ');
    return this.horarios.some(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      (this.rolUsuario === 'admin' || h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase())
    );
  }

  getTurnos(diaConFecha: string, hora: string) {
    const [dia, fecha] = diaConFecha.split(' ');
    return this.horarios.filter(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      (this.rolUsuario === 'admin' || h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase())
    );
  }


  abrirEditorDeReservas(turno: any) {
    this.turnoSeleccionado = turno;
    this.modalAbierto = true;
    console.log('🧩 Turno recibido:', turno);
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.turnoSeleccionado = null;
  }

  anularReserva(reservaId: number) {
    if (confirm('¿Estás seguro de que querés anular esta reserva?')) {
      this.horariosService.anularReserva(reservaId, 'permanente').subscribe({
        next: () => {
          alert('✅ Reserva anulada');
          this.cerrarModal(); // Cierra y refresca automáticamente
        },
        error: (err) => {
          alert('❌ Error al anular la reserva: ' + err.error?.message || err.message);
        }
      });
    }
  }

  agregarReserva() {
    const turnoId = this.turnoSeleccionado?.idHorario;

    console.log('🎯 Turno seleccionado:', this.turnoSeleccionado);

    if (!turnoId) {
      this.mensajeAdminReserva = '❌ ID de turno inválido';
      this.esErrorAdmin = true;
      this.mostrarConfirmacionAdmin = true;
      return;
    }
    if (this.busquedaModo === 'nombre-apellido') {
      const nombre = this.nombreNuevo.trim();
      const apellido = this.apellidoNuevo.trim();

      if (!nombre || !apellido) {
        this.mensajeAdminReserva = '⚠️ Completá nombre y apellido';
        this.esErrorAdmin = true;
        this.mostrarConfirmacionAdmin = true;
        return;
      }

      this.horariosService.buscarPorNombreApellido(nombre, apellido).subscribe({
        next: (usuario) => {
          this.horariosService.reservarComoAdmin(
            turnoId, 
            nombre, 
            apellido, 
            usuario.id, 
            this.turnoSeleccionado.fecha,
            !this.esRecuperacion
        ).subscribe({
            next: () => {
              this.mensajeAdminReserva = '✅ Reserva creada correctamente';
              this.esErrorAdmin = false;
              this.mostrarConfirmacionAdmin = true;

              setTimeout(() => {
                this.mostrarConfirmacionAdmin = false;
                this.cerrarModal();
              }, 3000);
            },
            error: err => {
              this.mensajeAdminReserva = '❌ Error al reservar: ' + (err.error.message || err.message);
              this.esErrorAdmin = true;
              this.mostrarConfirmacionAdmin = true;
            }
          });
        },
        error: err => {
          this.mensajeAdminReserva = '❌ Usuario no encontrado: ' + (err.error.message || err.message);
          this.esErrorAdmin = true;
          this.mostrarConfirmacionAdmin = true;
        }
      });

    } else if (this.busquedaModo === 'telefono') {
      const telefono = this.telefonoNuevo.trim();

      if (!telefono) {
        this.mensajeAdminReserva = '⚠️ Ingresá un número de teléfono';
        this.esErrorAdmin = true;
        this.mostrarConfirmacionAdmin = true;
        return;
      }

      this.horariosService.buscarPorTelefono(telefono).subscribe({
        next: (usuario) => {
          this.horariosService.reservarComoAdmin(
            turnoId, 
            usuario.nombre, 
            usuario.apellido, 
            usuario.id, 
            this.turnoSeleccionado.fecha,
            !this.esRecuperacion
          ).subscribe({
            next: () => {
              this.mensajeAdminReserva = '✅ Reserva creada correctamente';
              this.esErrorAdmin = false;
              this.mostrarConfirmacionAdmin = true;

              setTimeout(() => {
                this.mostrarConfirmacionAdmin = false;
                this.cerrarModal();
              }, 3000);
            },
            error: err => {
              this.mensajeAdminReserva = '❌ Error al reservar: ' + (err.error.message || err.message);
              this.esErrorAdmin = true;
              this.mostrarConfirmacionAdmin = true;
            }
          });
        },
        error: err => {
          this.mensajeAdminReserva = '❌ Usuario no encontrado: ' + (err.error.message || err.message);
          this.esErrorAdmin = true;
          this.mostrarConfirmacionAdmin = true;
        }
      });
    }
  }


  iniciarEdicionReserva(reserva: any) {
    this.reservaEditandoId = reserva.id;
    this.nombreEditado = reserva.nombre;
    this.apellidoEditado = reserva.apellido;
    this.nuevoUserId = reserva.usuario?.id || null;
  }

  guardarEdicionReserva() {
    if (!this.reservaEditandoId) return;

    const body: any = {
      nombre: this.nombreEditado,
      apellido: this.apellidoEditado
    };

    if (this.nuevoUserId) body.nuevoUserId = this.nuevoUserId;

    this.horariosService.editarReserva(this.reservaEditandoId, body).subscribe({
      next: () => {
        alert('✅ Reserva actualizada');
        this.reservaEditandoId = null;
        this.horariosService.cargarHorarios();
      },
      error: err => alert('❌ Error al actualizar: ' + err.error.message)
    });
  }

  cerrarModalAlumno() {
    this.modalAlumnoAbierto = false;
    this.turnoSeleccionado = null;
  }

  confirmarReserva() {
    const idHorario = this.turnoSeleccionado.id ?? this.turnoSeleccionado.idHorario;

    if (!idHorario) {
      this.mensajeReserva = '❌ No se pudo obtener el ID del turno';
      this.esErrorReserva = true;
      this.mostrarConfirmacion = true;
      return;
    }

    this.horariosService.reservar(
      idHorario,
      this.nombreUsuario,
      this.apellidoUsuario,
      this.turnoSeleccionado.fecha,
      this.reservaAutomatica
    ).subscribe({
      next: () => {
        this.mensajeReserva = '✅ ¡Turno reservado exitosamente!';
        this.esErrorReserva = false;
        this.mostrarConfirmacion = true;

        setTimeout(() => {
          this.mostrarConfirmacion = false;
          this.cerrarModalAlumno();
        }, 2000);
      },
      error: err => {
        const mensajeBackend = err?.error?.message || err?.message || 'Error desconocido';

        if (mensajeBackend.includes('Ya alcanzaste tu límite mensual de')) {
          this.mensajeReserva = '⚠️ Ya alcanzaste el máximo de clases de tu plan mensual. Usá esta reserva como recuperación.';
        } else if (mensajeBackend.includes('Ya alcanzaste tu límite semanal de')) {
          this.mensajeReserva = '⚠️ Ya alcanzaste el límite semanal de clases de tu plan. Probá en otro día o como recuperación.';
        } else {
          this.mensajeReserva = '❌ No se pudo reservar: ' + mensajeBackend;
        }

        this.esErrorReserva = true;
        this.mostrarConfirmacion = true;

        setTimeout(() => {
          this.mostrarConfirmacion = false;
        }, 3000);
      }

    });
  }
}



