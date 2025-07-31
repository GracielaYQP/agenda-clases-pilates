import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { InvitacionService } from '../../services/invitacion.services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent {
  form!: FormGroup;
  error: string = '';
  successMessage: string = '';
  invitacionValida: boolean = false;
  showPassword: boolean = false;
  esAdmin: boolean = false;
  telefono: string = '';
  nivel: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private invitacionService: InvitacionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const adminParam = this.route.snapshot.queryParamMap.get('admin');
    this.esAdmin = adminParam === 'true';
    
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.validarInvitacion(token);
    } else {
      this.invitacionValida = false;
      this.crearFormulario(); // crear formulario sin invitación
    }
  }

  private crearFormulario() {
    this.form = this.fb.group(
      {
        dni: [
          '',
          [Validators.required, Validators.pattern(/^[\d]{7,8}$/)],
        ],
        nombre: [
          '',
          [Validators.required, Validators.pattern(/^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]{3,})$/)],
        ],
        apellido: [
          '',
          [Validators.required, Validators.pattern(/^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]{3,})$/)],
        ],
        planMensual: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(?=(?:.*\d))(?=.*[A-Z])(?=.*[a-z])(?=.*[.,*!?¿¡/#$%&])\S{8,20}$/),
          ],
        ],
        repeat_password: ['', Validators.required],
        ...(this.invitacionValida ? {} : {
          telefono: ['', Validators.required],
          nivel: ['', Validators.required]
        })
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const repeatPassword = form.get('repeat_password')?.value;
    return password === repeatPassword ? null : { passwordMismatch: true };
  }

  validarInvitacion(token: string) {
    this.invitacionService.getInvitacion(token).subscribe({
      next: (res: { telefono: string; nivel: string }) => {
        this.invitacionValida = true;
        this.telefono = res.telefono;
        this.nivel = res.nivel;
        this.crearFormulario(); // Crear formulario después de validar
      },
      error: () => {
        this.invitacionValida = false;
        this.error = 'Invitación inválida o expirada.';
        this.crearFormulario(); // Igual se crea el formulario
      },
    });
  }

  submit() {
    if (this.form.invalid) return;

    const data = {
      ...this.form.value,
      telefono: this.invitacionValida ? this.telefono : this.form.value.telefono,
      nivel: this.invitacionValida ? this.nivel : this.form.value.nivel,
      planMensual: this.form.value.planMensual
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.successMessage = '¡Registro exitoso!';
        this.error = '';

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: () => {
        this.error = 'Error al registrar. Puede que este usuario ya esté registrado.';
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  cerrarFormulario() {
  this.invitacionValida = false;
  this.esAdmin = false;
  this.router.navigate(['/listar-alumnos']);
}

}
