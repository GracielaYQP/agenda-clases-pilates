import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit{
  form: FormGroup;
  error: string = '';
  showPassword: boolean = false;
  isAdmin: boolean = false;
  email: string = '';
  password: string = '';
; 

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
 
  ngOnInit(): void {

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
         console.log('✅ Respuesta del login:', res);
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

  solicitarResetPorWhatsapp() {
    const telefono = this.form.value.usuario;

    if (!telefono || telefono.length < 8) {
      this.error = 'Ingresá un número de teléfono válido para recuperar tu contraseña';
      return;
    }

    this.auth.solicitarResetWhatsapp({ telefono }).subscribe({
      next: (res) => {
        const link = `https://wa.me/${res.telefono}?text=Hola!%20Aquí%20tenés%20el%20link%20para%20restablecer%20tu%20contraseña:%20${encodeURIComponent(res.resetLink)}`;
        window.open(link, '_blank');
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo enviar el link por WhatsApp.';
      }
    });
  }
}


