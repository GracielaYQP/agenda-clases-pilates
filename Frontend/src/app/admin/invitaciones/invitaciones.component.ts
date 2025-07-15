import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invitaciones',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './invitaciones.component.html',
  styleUrls: ['./invitaciones.component.css']
})
export class InvitacionesComponent {
  form: FormGroup;
  generatedLink: string = '';
  success: string = '';
  error: string = '';
  linkWhatsapp: string = '';


  constructor( private router: Router, private fb: FormBuilder, private http: HttpClient, public auth: AuthService) {
    this.form = this.fb.group({
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10,13}$/)]],
      nivel: ['', Validators.required],
    });
  }

  
  get esAdmin(): boolean {
    return localStorage.getItem('rol') === 'admin' && this.auth.isLoggedIn();
  }
  
  enviarInvitacion() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // 👈 Activa todos los mensajes de error
      return;
    }

    this.http.post<{ token: string }>('http://localhost:3000/auth/invitar', this.form.value)
      .subscribe({
        next: (res) => {
          this.generatedLink = `http://localhost:4200/register?token=${res.token}`;
          this.success = 'Invitación generada correctamente.';
          this.error = '';
          // Generar link de WhatsApp
        const numeroSinEspacios = this.form.value.telefono.replace(/\s/g, '');
        const texto = encodeURIComponent(
          `Hola! Soy Lucía Carletta! Te envío el link para que completes tu registro: ${this.generatedLink}`
        );
        this.linkWhatsapp = `https://wa.me/54${numeroSinEspacios}?text=${texto}`;
      },
        error: (err) => {
          this.generatedLink = '';
          if (err.error && err.error.message) {
            this.error = err.error.message;   // Usa mensaje del backend (ej: "Correo ya registrado")
          } else {
            this.error = 'Hubo un error al generar la invitación. Usuario ya registrado o error del servidor.';
          }
          this.success = '';
        }
      });
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']); 
  }

  copiarAlPortapapeles() {
    navigator.clipboard.writeText(this.generatedLink || '');
  }

}