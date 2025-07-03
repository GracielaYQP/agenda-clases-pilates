import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { InvitacionService } from '../../services/invitacion.services';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent {
  form: FormGroup;
  error: string = '';
  successMessage: string = '';
  invitacionValida: boolean = false;

  // Datos de invitación
  email: string = '';
  nivel: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private invitacionService: InvitacionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Inicializa form vacío
    this.form = this.fb.group({
      dni: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[\d]{7,8}$/),
        ],
      ],
      nombre: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ]{2,60}[\,\-\.]{0,1}[\s]{0,1}){1,3}$/
          ),
        ],
      ],
      apellido: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ]{2,60}[\,\-\.]{0,1}[\s]{0,1}){1,3}$/
          ),
        ],
      ],
      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10,13}$/),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=(?:.*\d))(?=.*[A-Z])(?=.*[a-z])(?=.*[.,*!?¿¡/#$%&])\S{8,20}$/
          ),
        ],
      ],
    });

    // Procesa token de invitación de la URL
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.validarInvitacion(token);
    } else {
      this.invitacionValida = false;
    }
  }

  validarInvitacion(token: string) {
    this.invitacionService.getInvitacion(token).subscribe({
      next: (res: { email: string; nivel: string; }) => {
        this.invitacionValida = true;
        this.email = res.email;
        this.nivel = res.nivel;
      },
      error: () => {
        this.invitacionValida = false;
        this.error = 'Invitación inválida o expirada.';
      },
    });
  }

  submit() {
    if (this.form.invalid) return;

    const data = {
      ...this.form.value,
      email: this.email,
      nivel: this.nivel,
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.successMessage = '¡Registro exitoso! Serás redirigido al login...';
        this.error = '';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: () => {
        this.error = 'Error al registrar. Puede que ya esté registrado.';
        this.successMessage = '';
      },
    });
  }

  // Getters para validación reactiva
  get Dni() {
    return this.form.get('dni');
  }

  get Nombre() {
    return this.form.get('nombre');
  }

  get Apellido() {
    return this.form.get('apellido');
  }

  get Telefono() {
    return this.form.get('telefono');
  }

  get Password() {
    return this.form.get('password');
  }
}
