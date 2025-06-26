import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  form: FormGroup;
  error: string = '';
  successMessage: string = '';  // <-- Mensaje de éxito

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      { dni:['',[Validators.required, Validators.pattern(/^[\d]{1,3}\.?[0-9]{3,3}\.?[\d]{3,3}$/)], []],
        nombre:['',[Validators.required, Validators.pattern(/^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ]{2,60}[\,\-\.]{0,1}[\s]{0,1}){1,3}$/)], []],
        apellido:['',[Validators.required, Validators.pattern(/^([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ]{2,60}[\,\-\.]{0,1}[\s]{0,1}){1,3}$/)], []],
        telefono:['',[Validators.required, Validators.pattern(/^[0-9]{10,13}$/)], []],
        email:['',[Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)], []],
        password:['',[Validators.required, Validators.pattern(/^(?=(?:.*\d))(?=.*[A-Z])(?=.*[a-z])(?=.*[.,*!?¿¡/#$%&])\S{8,20}$/)], []]
      }
  );
  }

  submit() {
    if (this.form.invalid) return;

    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.successMessage = '¡Registro exitoso! Serás redirigido al login...';
        this.error = '';

        // Esperar 3 segundos y redirigir
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: () => {
        this.error = 'El email ya está registrado';
        this.successMessage = '';
      },
    });
  }

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

  get Email() {
    return this.form.get('email');
  }

  get Password() {
    return this.form.get('password');
  }

}

