import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HorariosService } from '../services/horarios.service';

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  nivel: string;
}

@Component({
  standalone: true,
  selector: 'app-listar-alumnos',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-alumnos.component.html',
  styleUrl: './listar-alumnos.component.css',
})
export class ListarAlumnosComponent implements OnInit {
  
  alumnos: Alumno[] = [];
  filtroApellido: string = '';
  filtroDni: string = '';
  filtroTelefono: string = '';

  constructor(private http: HttpClient, private router: Router, private horariosService: HorariosService) {}

  ngOnInit(): void {
    this.obtenerAlumnos();
  }

  obtenerAlumnos() {
    this.http
      .get<Alumno[]>('http://localhost:3000/users/obtenerListadoUsuarios')
      .subscribe((data) => {
        this.alumnos = data
          // 1) Filtra los que NO son admin
          .filter(alumno => alumno.nivel?.toLowerCase() !== 'admin')
          // 2) Ordena por apellido y nombre
          .sort((a, b) => {
            const apellidoA = a.apellido?.toLowerCase() || '';
            const apellidoB = b.apellido?.toLowerCase() || '';
            if (apellidoA < apellidoB) return -1;
            if (apellidoA > apellidoB) return 1;
            const nombreA = a.nombre?.toLowerCase() || '';
            const nombreB = b.nombre?.toLowerCase() || '';
            return nombreA.localeCompare(nombreB);
          });
      });
  }

  get alumnosFiltrados() {
  return this.alumnos.filter(alumno =>
    alumno.apellido.toLowerCase().includes(this.filtroApellido.toLowerCase()) &&
    alumno.dni.toString().includes(this.filtroDni) &&
    alumno.telefono.toString().includes(this.filtroTelefono)
  );
}

  editarAlumno(id: number) {
    // Redirige a una ruta de edición, por ejemplo:
    this.router.navigate(['/editar-usuario', id]);
  }

  inactivarAlumno(id: number) {
    if (confirm('¿Está seguro de marcar este alumno como inactivo?')) {
      this.http.patch(`http://localhost:3000/users/inactivar/${id}`, {}).subscribe(() => {
        alert('Alumno marcado como inactivo.');
        this.obtenerAlumnos(); //refresca la lista de alumnos
        this.horariosService.refrescarHorarios(); //refresca los horarios
      });
    }
  }

  irAFormularioRegistro() {
    this.router.navigate(['/register'], { queryParams: { admin: true } });
  }
}
