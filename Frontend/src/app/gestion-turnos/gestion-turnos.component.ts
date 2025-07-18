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
    console.log('Nivel del usuario:', this.usuarioNivel);
    console.log('Rol del usuario:', this.rolUsuario);  

    this.route.queryParams.subscribe(() => {
      this.horariosService.cargarHorarios();
    });

    this.horariosService.horarios$.subscribe(data => {
      this.horarios = data;
      console.log('Horarios cargados desde backend:', this.horarios);

      const turnosConReservas = this.horarios.filter(t => t.reservas && t.reservas.length > 0);
      console.log('Turnos con reservas:', turnosConReservas);
    });
  }

  getNivelParaHorario(hora: string): string {
    if (['08:00', '09:00'].includes(hora)) return 'Avanzado';
    if (['10:00', '11:00', '15:00', '16:00'].includes(hora)) return 'Intermedio';
    if (['17:00', '18:00'].includes(hora)) return 'Inicial';
    return '';
  }

  // reservar(turno: any) {
  //   const nombre = localStorage.getItem('nombreUsuario') || 'Desconocido';
  //   const apellido = localStorage.getItem('apellidoUsuario') || 'Desconocido';
  //   const userId = Number(localStorage.getItem('userId'));

  //   const mensaje = `¿Deseás reservar este turno?\n\nNombre: ${nombre}\nApellido: ${apellido}\nNivel: ${turno.nivel}\nDía: ${turno.dia}\nHora: ${turno.hora}`;

  //   if (confirm(mensaje)) {
  //     this.horariosService.reservar(turno.id, nombre, apellido).subscribe({
  //       next: () => {
  //         alert('✅ ¡Turno reservado exitosamente!');
  //       },
  //       error: (err) => {
  //         alert('❌ No se pudo reservar: ' + err.error.message);
  //       }
  //     });
  //   }
  // }

  abrirTurno(turno: any) {
    if (this.rolUsuario === 'admin') {
      // 👉 Mostrar modal con las reservas actuales y permitir editar
      this.abrirEditorDeReservas(turno);
    } else {
      // 👉 Alumno: reservar normalmente
      const nombre = localStorage.getItem('nombreUsuario') || 'Desconocido';
      const apellido = localStorage.getItem('apellidoUsuario') || 'Desconocido';

      const mensaje = `¿Deseás reservar este turno?\n\nNombre: ${nombre}\nApellido: ${apellido}\nNivel: ${turno.nivel}\nDía: ${turno.dia}\nHora: ${turno.hora}`;

      if (confirm(mensaje)) {
        this.horariosService.reservar(turno.id, nombre, apellido).subscribe({
          next: () => alert('✅ ¡Turno reservado exitosamente!'),
          error: (err) => alert('❌ No se pudo reservar: ' + err.error.message)
        });
      }
    }
  }

  hasTurno(dia: string, hora: string): boolean {
    return this.horarios.some(h =>
      h.dia === dia &&
      h.hora === hora &&
      (this.rolUsuario === 'admin' || h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase())
    );
  }

  getTurnos(dia: string, hora: string) {
    return this.horarios.filter(h =>
      h.dia === dia &&
      h.hora === hora &&
      (this.rolUsuario === 'admin' || h.nivel.toLowerCase() === this.usuarioNivel.toLowerCase())
    );
  }

  abrirEditorDeReservas(turno: any) {
    this.turnoSeleccionado = turno;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.turnoSeleccionado = null;
  }

  anularReserva(reservaId: number) {
    if (confirm('¿Estás seguro de que querés anular esta reserva?')) {
      this.horariosService.anularReserva(reservaId).subscribe({
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

  agregarReserva(turnoId: number) {
    if (this.busquedaModo === 'nombre-apellido') {
      const nombre = this.nombreNuevo.trim();
      const apellido = this.apellidoNuevo.trim();

      if (!nombre || !apellido) {
        alert('⚠️ Completá nombre y apellido');
        return;
      }

      this.horariosService.buscarPorNombreApellido(nombre, apellido).subscribe({
        next: (usuario) => {
          this.horariosService.reservarComoAdmin(turnoId, nombre, apellido, usuario.id).subscribe({
            next: () => {
              alert('✅ Reserva creada');
              this.cerrarModal();
            },
            error: err => alert('❌ Error al reservar: ' + err.error.message)
          });
        },
        error: err => alert('❌ Usuario no encontrado: ' + err.error.message)
      });

    } else if (this.busquedaModo === 'telefono') {
      const telefono = this.telefonoNuevo.trim();

      if (!telefono) {
        alert('⚠️ Ingresá un número de teléfono');
        return;
      }

      this.horariosService.buscarPorTelefono(telefono).subscribe({
        next: (usuario) => {
          this.horariosService.reservarComoAdmin(turnoId, usuario.nombre, usuario.apellido, usuario.id).subscribe({
            next: () => {
              alert('✅ Reserva creada');
              this.cerrarModal();
            },
            error: err => alert('❌ Error al reservar: ' + err.error.message)
          });
        },
        error: err => alert('❌ Usuario no encontrado: ' + err.error.message)
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



}
