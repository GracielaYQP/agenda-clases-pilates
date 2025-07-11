import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
})
export class LoginComponent {
  form: FormGroup;
  error: string = '';
  showPassword: boolean = false; 

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get Usuario() {
    return this.form.get('usuario');
  }

  get Password() {
    return this.form.get('password');
  }

  togglePasswordVisibility() {  
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.form.invalid) return;
    console.log('🔐 Enviando datos de login:', this.form.value);

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        // Guardar el token y el nombre
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('nombreUsuario', res.nombre);
        localStorage.setItem('nivelUsuario', res.nivel);
        localStorage.setItem('rol', res.rol); 

        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log('❌ Error al iniciar sesión:', err);
        this.error = err.error?.message || 'Error desconocido al iniciar sesión';
      }
    });
  }

}


