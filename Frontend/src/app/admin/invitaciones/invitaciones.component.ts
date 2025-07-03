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


  constructor( private router: Router, private fb: FormBuilder, private http: HttpClient, public auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nivel: ['', Validators.required],
    });
  }

  
  get esAdmin(): boolean {
    return localStorage.getItem('rol') === 'admin' && this.auth.isLoggedIn();
  }
  
  enviarInvitacion() {
    if (this.form.invalid) return;

    this.http.post<{ token: string }>('http://localhost:3000/auth/invitar', this.form.value)
      .subscribe({
        next: (res) => {
          this.generatedLink = `http://localhost:4200/register?token=${res.token}`;
          this.success = 'Invitación generada correctamente.';
          this.error = '';
        },
        error: () => {
          this.error = 'Hubo un error al generar la invitación.';
          this.success = '';
        }
      });
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']); 
  }
}