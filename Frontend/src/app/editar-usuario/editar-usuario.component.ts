import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  nivel: string;
  planMensual: string;  // 🔹 NUEVO
}

@Component({
  standalone: true,
  selector: 'app-editar-usuario',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-usuario.component.html',
  styleUrl: './editar-usuario.component.css',
})
export class EditarUsuarioComponent implements OnInit {
  usuario: Usuario = {
    id: 0,
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    nivel: '',
    planMensual: ''   // 🔹 NUEVO
  };

  // ✅ variables para modal de confirmación
  modalVisible: boolean = false;
  mensajeModal: string = '';
  esError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.obtenerUsuario(Number(id));
    }
  }

  obtenerUsuario(id: number) {
    this.http
      .get<Usuario>(`http://localhost:3000/users/${id}`)
      .subscribe((data) => {
        this.usuario = data;
      });
  }

  guardarCambios() {
    this.http
      .patch(
        `http://localhost:3000/users/modificarUsuario/${this.usuario.id}`,
        this.usuario
      )
      .subscribe({
        next: () => {
          // ✅ Mostrar modal de éxito
          this.mensajeModal = '✅ Usuario actualizado correctamente';
          this.esError = false;
          this.modalVisible = true;

          setTimeout(() => {
            this.modalVisible = false;
            this.router.navigate(['/listar-alumnos']);
          }, 2500);
        },
        error: (err) => {
          this.mensajeModal = '❌ Error al actualizar: ' + (err.error?.message || err.message);
          this.esError = true;
          this.modalVisible = true;

          setTimeout(() => {
            this.modalVisible = false;
          }, 3000);
        }
      });
  }

  cerrarFormulario() {
    this.router.navigate(['/listar-alumnos']);
  }
}
