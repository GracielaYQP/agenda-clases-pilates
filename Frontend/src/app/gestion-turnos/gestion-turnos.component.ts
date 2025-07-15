import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosService } from '../services/horarios.service';
import { ActivatedRoute } from '@angular/router';

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
  imports: [CommonModule],
  templateUrl: './gestion-turnos.component.html',
  styleUrl: './gestion-turnos.component.css',
})
export class GestionTurnosComponent implements OnInit {
  usuarioNivel: string = '';
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];
  horarios: any[] = [];
  rolUsuario: string = '';

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

  reservar(turno: any) {
    const nombre = localStorage.getItem('nombreUsuario') || 'Desconocido';
    const apellido = localStorage.getItem('apellidoUsuario') || 'Desconocido';
    const userId = Number(localStorage.getItem('userId'));

    const mensaje = `¿Deseás reservar este turno?\n\nNombre: ${nombre}\nApellido: ${apellido}\nNivel: ${turno.nivel}\nDía: ${turno.dia}\nHora: ${turno.hora}`;

    if (confirm(mensaje)) {
      this.horariosService.reservar(turno.id, nombre, apellido).subscribe({
        next: () => {
          alert('✅ ¡Turno reservado exitosamente!');
        },
        error: (err) => {
          alert('❌ No se pudo reservar: ' + err.error.message);
        }
      });
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


    
}
