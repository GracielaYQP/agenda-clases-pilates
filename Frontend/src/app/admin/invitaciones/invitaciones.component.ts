import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
  
 async enviarInvitacion() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const res: any = await this.http.post(
        'http://localhost:3000/auth/invitar',
        this.form.value
      ).toPromise();

      if (res.reactivar && res.userId) {
        const resultado = await Swal.fire({
          title: 'Usuario inactivo encontrado',
          text: `El usuario ${res.nombre} ya existe pero está inactivo. ¿Deseas reactivarlo?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, reactivarlo',
          cancelButtonText: 'Cancelar'
        });

        if (resultado.isConfirmed) {
          await this.http.patch(`http://localhost:3000/users/reactivar/${res.userId}`, {}).toPromise();

          const respuesta: any = await this.http.post(
            'http://localhost:3000/auth/reset-link-whatsapp',
            { telefono: res.telefono }
          ).toPromise();

          this.success = `✅ Usuario reactivado. Se le envió un WhatsApp para restablecer la contraseña.`;
          this.linkWhatsapp = respuesta.whatsappUrl;

          await Swal.fire({
            title: 'Reactivado con éxito',
            text: 'Se envió un mensaje por WhatsApp al usuario.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });

          window.open(this.linkWhatsapp, '_blank');
          return;
        } else {
          this.success = '';
          this.error = 'Operación cancelada por el administrador.';
          return;
        }
      }

      if (res.token) {
        this.generatedLink = `http://localhost:4200/register?token=${res.token}`;
        this.success = 'Invitación generada correctamente.';
        this.error = '';

        const numeroSinEspacios = this.form.value.telefono.replace(/\s/g, '');
        const texto = encodeURIComponent(`Hola! Soy Lucía Carletta! Te envío el link para que completes tu registro: ${this.generatedLink}`);
        this.linkWhatsapp = `https://wa.me/54${numeroSinEspacios}?text=${texto}`;

        await Swal.fire({
          title: 'Invitación lista',
          text: 'El link fue generado correctamente. ¡Podés enviarlo por WhatsApp!',
          icon: 'success',
          confirmButtonText: 'Copiar y abrir WhatsApp'
        });

        // Abrir WhatsApp
        window.open(this.linkWhatsapp, '_blank');
      }
    } catch (err: any) {
      this.generatedLink = '';
      this.success = '';
      this.error = err?.error?.message || 'Error al generar la invitación.';

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.error,
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']); 
  }

  copiarAlPortapapeles() {
    navigator.clipboard.writeText(this.generatedLink || '');
  }

}