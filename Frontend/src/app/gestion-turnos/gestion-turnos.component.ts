import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosService } from '../services/horarios.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  reservaSeleccionada: any = null;
  mostrarModalTipoCancelacion: boolean = false;
  mostrarModalConfirmarAccion: boolean = false;
  tipoCancelacionSeleccionado: 'momentanea' | 'permanente' = 'momentanea';
  textoConfirmacion: string = '';
  uiBloqueadoAlumno = false;
  uiBloqueadoAdmin = false;
  mensajeBloqueoRecuperacion: string = '';
  modalConfirmacionFinalAbierta = false;

  

  constructor(
    private horariosService: HorariosService,
    private route: ActivatedRoute,
    private http: HttpClient
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
      console.log('📋 Turnos con reservas:', data.filter(d => d.reservas?.length > 0));

      // 🔧 Asegurarnos que cada reserva tenga bien definido su ID
      data.forEach(horario => {
        if (!horario.idHorario) {
          console.warn('⛔ Horario sin ID detectado:', horario);
          return;
        }

        if (horario.reservas && Array.isArray(horario.reservas)) {
          horario.reservas.forEach((reserva: any, index: number) => {
            if (!reserva.id && reserva.id !== 0) {
              const nombre = reserva.nombre || 'NN';
              const apellido = reserva.apellido || 'SN';
              reserva.id = `${horario.idHorario}_${nombre}_${apellido}`.replace(/\s/g, '');
              console.log('🆔 ID generado para reserva:', reserva.id);
            }
          });
        }
      });

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
      console.log('🎯 Horarios recibidos:', this.horarios);

    });
  }

  getNivelParaHorario(hora: string): string {
    if (['08:00', '09:00'].includes(hora)) return 'Avanzado';
    if (['10:00', '11:00', '15:00', '16:00'].includes(hora)) return 'Intermedio';
    if (['17:00', '18:00'].includes(hora)) return 'Inicial';
    return '';
  }

  async abrirTurno(turno: any) {
    const turnoId = turno.id || turno.idHorario;
    console.log('🧪 DEBUG abrirTurno()');
    console.log('Rol:', this.rolUsuario);
    console.log('Turno:', turno);

    if (!turnoId) {
      console.warn('🚨 Turno sin ID:', turno);
      return;
    }

    this.turnoSeleccionado = {
      ...turno,
      idHorario: turnoId,
      fecha: turno.fecha
    };

    console.log('🧪 Rol:', this.rolUsuario, 'Turno:', turno);

    if (this.rolUsuario === 'admin') {
      this.uiBloqueadoAlumno = false;
      this.abrirEditorDeReservas(this.turnoSeleccionado);
    } else {
      // 🛑 Validar si es feriado
      const esFeriado = await this.esFeriado(turno.fecha);
      if (esFeriado) {
        this.uiBloqueadoAlumno = true;
        this.mensajeBloqueoRecuperacion = '📅 No podés reservar clases de recuperación en días feriados.';
        return; // No abre el modal
      }

      // ⏱️ Validar si falta menos de 1 hora
      const ahora = new Date();
      const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora}:00-03:00`);
      const diferenciaMs = fechaHoraTurno.getTime() - ahora.getTime();
      const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

      if (diferenciaHoras < 1) {
        this.uiBloqueadoAlumno = true;
        this.mensajeBloqueoRecuperacion = '⚠️ No podés hacer una reserva de recuperación con menos de 1 hora de anticipación.';
      } else {
        this.uiBloqueadoAlumno = false;
        this.mensajeBloqueoRecuperacion = '';
      }

      this.nombreUsuario = localStorage.getItem('nombreUsuario') || 'Desconocido';
      this.apellidoUsuario = localStorage.getItem('apellidoUsuario') || 'Desconocido';
      this.modalAlumnoAbierto = true;
    }

    console.log('🧩 Turno recibido:', this.turnoSeleccionado);
  }

  hasTurno(diaConFecha: string, hora: string): boolean {
    const [dia, fecha] = diaConFecha.split(' ');

    return this.horarios.some(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      (
        this.rolUsuario === 'admin' ||
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      )
    );
  }

  getTurnos(diaConFecha: string, hora: string) {
    const [dia, fecha] = diaConFecha.split(' ');
    // console.log('🔎 getTurnos:', dia, fecha, this.horarios);
    return this.horarios.filter(h =>
      h.dia === dia &&
      this.formatearFecha(h.fecha) === fecha &&
      h.hora === hora &&
      (
        this.rolUsuario === 'admin' ||
        h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase()
      )
    );
  }

  formatearFecha(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00-03:00`);
    return date.toLocaleDateString('es-AR'); // da formato DD/MM/YYYY
  }

  abrirEditorDeReservas(turno: any) {
    this.turnoSeleccionado = turno;
    this.modalAbierto = true;
    console.log('🧩 Turno recibido:', turno);
    console.log('✅ modalAbierto:', this.modalAbierto);
    console.log('❓ mostrarFormAgregar:', this.mostrarFormAgregar);
    console.log('❓ modalConfirmacionFinalAbierta:', this.modalConfirmacionFinalAbierta);
    console.log('❓ mostrarModalTipoCancelacion:', this.mostrarModalTipoCancelacion);
  }

  anularReserva(reservaId: number) {
    if (confirm('¿Estás seguro de que querés anular esta reserva?')) {
      this.horariosService.anularReserva(reservaId, 'permanente').subscribe({
      next: () => {
        this.mensajeAdminReserva = '✅ Reserva cancelada correctamente.';
        this.esErrorAdmin = false;
        this.mostrarConfirmacionAdmin = true;

        // 🔁 REFRESCAR horarios actualizados
        this.horariosService.getHorariosDeLaSemana().subscribe(horarios => {
          this.horarios = horarios;
          console.log('♻️ Horarios actualizados tras cancelar:', this.horarios);
        });

        setTimeout(() => {
          this.mostrarConfirmacionAdmin = false;
        }, 3000);
      }
      });
    }
  }

  agregarReserva() {
    const turnoId = this.turnoSeleccionado?.idHorario;
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
            this.reservaAutomatica
        ).subscribe({
            next: () => {
              this.mensajeAdminReserva = '✅ Reserva creada correctamente';
              this.esErrorAdmin = false;
              this.mostrarConfirmacionAdmin = true;
              this.uiBloqueadoAdmin = true;

              this.refrescarHorarios();

              setTimeout(() => {
                this.mostrarConfirmacionAdmin = false;
                this.cerrarModal();
              }, 3000);
            },
            error: err => {
              this.mensajeAdminReserva = '❌ Error al reservar: ' + (err.error.message || err.message);
              this.esErrorAdmin = true;
              this.mostrarConfirmacionAdmin = true;
              this.uiBloqueadoAdmin = false;
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
            this.reservaAutomatica
          ).subscribe({
            next: () => {
              this.mensajeAdminReserva = '✅ Reserva creada correctamente';
              this.esErrorAdmin = false;
              this.mostrarConfirmacionAdmin = true;
              this.uiBloqueadoAdmin = true;

              setTimeout(() => {
                this.mostrarConfirmacionAdmin = false;
                this.cerrarModal();
              }, 3000);
            },
            error: err => {
              this.mensajeAdminReserva = '❌ Error al reservar: ' + (err.error.message || err.message);
              this.esErrorAdmin = true;
              this.mostrarConfirmacionAdmin = true;
              this.uiBloqueadoAdmin = false;
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

  cerrarModal() {
    this.modalAbierto = false;
    this.turnoSeleccionado = null;
    this.uiBloqueadoAdmin = false;
    this.refrescarHorarios();
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
        this.refrescarHorarios();
      },
      error: err => alert('❌ Error al actualizar: ' + err.error.message)
    });
  }

  confirmarReserva() {
    const idHorario = this.turnoSeleccionado.id ?? this.turnoSeleccionado.idHorario;

    if (!idHorario) {
      this.mensajeReserva = '❌ No se pudo obtener el ID del turno';
      this.esErrorReserva = true;
      this.mostrarConfirmacion = true;
      return;
    }

    // ⛔ Validación: no permitir recuperación con menos de 1 hora de anticipación
    if (this.reservaAutomatica=== false) {
      try {
        const ahora = new Date();
        const fechaStr = this.turnoSeleccionado.fecha; // yyyy-mm-dd
        const horaStr = this.turnoSeleccionado.hora;   // HH:mm
        const fechaHoraTurno = new Date(`${fechaStr}T${horaStr}:00-03:00`);
        const diferenciaMinutos = (fechaHoraTurno.getTime() - ahora.getTime()) / (1000 * 60);

        if (diferenciaMinutos < 60) {
          this.mensajeReserva = '⚠️ Las clases de recuperación deben reservarse con al menos una hora de anticipación.';
          this.esErrorReserva = true;
          this.mostrarConfirmacion = true;

          setTimeout(() => {
            this.mostrarConfirmacion = false;
          }, 3000);

          return;
        }
      } catch (error) {
        console.error('Error al calcular diferencia horaria:', error);
      }
    }

    // 👉 Llamado al backend
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
        this.uiBloqueadoAlumno = true;

        setTimeout(() => {
          this.mostrarConfirmacion = false;
          this.cerrarModalAlumno();
        }, 3000);
      },
      error: err => {
        const mensajeBackend = err?.error?.message || err?.message || 'Error desconocido';

        if (mensajeBackend.includes('Ya alcanzaste tu límite mensual de')) {
          this.mensajeReserva = '⚠️ Ya alcanzaste el máximo de clases de tu plan mensual. Solo podés reservar como recuperación.';
        } else if (mensajeBackend.includes('Ya alcanzaste tu límite semanal de')) {
          this.mensajeReserva = '⚠️ Ya alcanzaste el límite semanal de clases de tu plan. Solo podés reservar como recuperación.';
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

  cerrarModalAlumno() {
    this.modalAlumnoAbierto = false;
    this.turnoSeleccionado = null;
    this.uiBloqueadoAlumno = false;
    this.refrescarHorarios();
  }

  abrirModalConfirmacionFinal() {
    this.modalConfirmacionFinalAbierta = true;
    this.mostrarFormAgregar = false;
  }

  cerrarModalConfirmacionFinal() {
    this.modalConfirmacionFinalAbierta = false;
    this.mostrarFormAgregar = true;
  }

  confirmarReservaFinal() {
    this.agregarReserva();
    this.modalConfirmacionFinalAbierta = false;
    this.resetearCamposReserva();
  }

  abrirFormAgregar() {
  this.mostrarFormAgregar = true;
  this.modalAbierto = false; // cierra el modal principal
}

  cerrarFormAgregar() {
    this.mostrarFormAgregar = false;
    this.resetearCamposReserva();
    this.modalAbierto = true; // vuelve al modal principal
  }

  resetearCamposReserva() {
    this.nombreNuevo = '';
    this.apellidoNuevo = '';
    this.telefonoNuevo = '';
    this.busquedaModo = 'nombre-apellido';
  }
  
  confirmarCancelacion(tipo: 'momentanea' | 'permanente') {
    const id = this.reservaSeleccionada?.id;

    if (!id || isNaN(+id)) {
      console.error('❌ ID de reserva inválido:', id);
      this.mensajeAdminReserva = '❌ No se pudo cancelar: ID de reserva inválido.';
      this.esErrorAdmin = true;
      this.mostrarConfirmacionAdmin = true;
      setTimeout(() => this.mostrarConfirmacionAdmin = false, 3000);
      return;
    }

    this.tipoCancelacionSeleccionado = tipo;

    if (tipo === 'momentanea') {
      const fecha = this.turnoSeleccionado?.fecha || 'la fecha indicada';
      this.textoConfirmacion = `¿Querés cancelar la reserva del día ${fecha}?`;
    } else {
      const alumno = `${this.reservaSeleccionada?.nombre ?? ''} ${this.reservaSeleccionada?.apellido ?? ''}`.trim();
      this.textoConfirmacion = `¿Querés cancelar permanentemente la reserva de ${alumno || 'este alumno'}?`;
    }

    this.mostrarModalTipoCancelacion = false;
    this.mostrarModalConfirmarAccion = true;
  }

  cerrarModalTipoCancelacion() {
    this.mostrarModalTipoCancelacion = false;
    this.modalAbierto = true; // vuelve al modal principal
  }

  cerrarModalConfirmarAccion() {
    this.mostrarModalConfirmarAccion = false;
    this.modalAbierto = true;
  }

  ejecutarCancelacion() {
    this.aceptarCancelacion(); // ✅ Usa tu método centralizado
  }
 
  aceptarCancelacion() {
      const id = this.reservaSeleccionada?.id;

      if (!id || isNaN(+id)) {
        this.mensajeAdminReserva = '❌ No se pudo cancelar: ID de reserva inválido.';
        this.esErrorAdmin = true;
        this.mostrarConfirmacionAdmin = true;
        this.mostrarModalConfirmarAccion = false;
        return;
      }

    this.horariosService.anularReserva(+id, this.tipoCancelacionSeleccionado).subscribe({
      next: () => {
    // Mensaje de éxito específico
        this.mensajeAdminReserva = this.tipoCancelacionSeleccionado === 'momentanea'
          ? '✅ La reserva fue cancelada por este día.'
          : '✅ La reserva fue cancelada permanentemente.';

        this.esErrorAdmin = false;
        this.mostrarConfirmacionAdmin = true;

        // Cerrar modal de confirmación y limpiar selección
        this.mostrarModalConfirmarAccion = false;
        this.reservaSeleccionada = null;

        this.refrescarHorarios();

        // Ocultar mensaje tras 3s
        setTimeout(() => {
          this.mostrarConfirmacionAdmin = false;
        }, 3000);
      },
      error: err => {
        console.error('❌ Error al cancelar', err);
        this.mensajeAdminReserva = '❌ Error al cancelar: ' + (err.error?.message || err.message);
        this.esErrorAdmin = true;
        this.mostrarConfirmacionAdmin = true;
        this.mostrarModalConfirmarAccion = false;

        setTimeout(() => {
          this.mostrarConfirmacionAdmin = false;
        }, 3000);
      }
    });
  }

  cerrarConfirmacion() {
    this.mostrarModalConfirmarAccion = false;
    this.refrescarHorarios();
  }

  preguntarTipoCancelacion(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.mostrarModalTipoCancelacion = true;
  }

  abrirModalTipoCancelacion(reserva: any) {
    this.reservaSeleccionada = { ...reserva, id: +reserva.id };
    this.mostrarModalTipoCancelacion = true;
    this.modalAbierto = false;
      //El admin NO tiene restricciones
      this.uiBloqueadoAdmin = false; // ponerlo en el html!!!!!!!
    }

  private refrescarHorarios() {
    this.horariosService.getHorariosDeLaSemana().subscribe({
      next: (data) => {
        this.horarios = data;
        console.log('♻️ Horarios actualizados:', this.horarios);
      },
      error: (err) => console.error('❌ Error al refrescar horarios', err)
    });
  }

  esFeriado(fecha: string): Promise<boolean> {
    return this.http.get<{ esFeriado: boolean }>(`http://localhost:3000/feriados/${fecha}`)
      .toPromise()
      .then(response => response?.esFeriado ?? false) // 👈 si no hay respuesta, devolvemos false
      .catch(() => false); // 👈 si falla la petición, devolvemos false
  }

  onCambioTipoReserva() {
    this.mensajeBloqueoRecuperacion = '';
    this.uiBloqueadoAlumno = false;
  }
}