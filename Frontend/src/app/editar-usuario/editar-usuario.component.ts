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
  };

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
      .subscribe(() => {
        alert('Usuario actualizado correctamente');
        this.router.navigate(['/listar-alumnos']);
      });
  }
}
