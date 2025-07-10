import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvitacionService {
  private apiUrl = 'http://localhost:3000/invitaciones'; // Asegúrate que coincida con tu backend

  constructor(private http: HttpClient) {}


  getInvitacion(token: string): Observable<{ telefono: string; nivel: string }> {
    return this.http.get<{ valida: boolean; telefono: string; nivel: string }>(
      `${this.apiUrl}/verificar`,
      { params: { token } }
    );
  }


}
