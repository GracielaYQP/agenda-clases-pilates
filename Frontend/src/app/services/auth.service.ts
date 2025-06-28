import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('nombreUsuario', res.nombre);
      })
    );
  }

register(data: {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}): Observable<any> {
  return this.http.post('http://localhost:3000/users', data);
}

logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('nombreUsuario');
}

isLoggedIn(): boolean {
  return !!localStorage.getItem('token') && !!localStorage.getItem('nombreUsuario');
}

}

