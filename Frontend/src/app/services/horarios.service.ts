import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HorarioSemana } from '../horarios-disponibles/horarios-disponibles.component';

@Injectable({ providedIn: 'root' })

export class HorariosService {

  private apiUrl = 'http://localhost:3000/horarios';
  private horariosSubject = new BehaviorSubject<HorarioSemana[]>([]);
  horarios$ = this.horariosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getHorarios() {
    return this.http.get<HorarioSemana[]>(this.apiUrl);
  }

  cargarHorarios() {
    this.http.get<HorarioSemana[]>(this.apiUrl).subscribe(data => this.horariosSubject.next(data));
  }

  refrescarHorarios() {
    this.cargarHorarios(); // 🔄 reutiliza el mismo método
  }

  reservar(
    horarioId: number, 
    nombre: string, 
    apellido: string, 
    fechaTurno: string,
    automatica: boolean
  ): Observable<any> {
    return this.http.post(`http://localhost:3000/reservas/${horarioId}`, {
      nombre,
      apellido,
      fechaTurno,
      automatica
    }).pipe(
      tap(() => this.cargarHorarios())
    );
  }

  getMisReservas(): Observable<any[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No se encontró el token en localStorage');
      return new BehaviorSubject<any[]>([]).asObservable(); // o lanzar un error
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>('http://localhost:3000/reservas/mis-reservas', { headers });
  }

  anularReserva(reservaId: number, tipo: 'momentanea' | 'permanente') {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.patch(`http://localhost:3000/reservas/cancelar/${reservaId}`, { tipo }, { headers });
  }

  buscarPorNombreApellido(nombre: string, apellido: string): Observable<any> {
    return this.http.get(`http://localhost:3000/users/buscar?nombre=${nombre}&apellido=${apellido}`);
  }

  buscarPorTelefono(telefono: string): Observable<any> {
    return this.http.get(`http://localhost:3000/users/telefono/${telefono}`);
  }

  reservarComoAdmin(
    horarioId: number, 
    nombre: string, 
    apellido: string, 
    userId: number, 
    fechaTurno: string,
    automatica: boolean
  ): Observable<any> {
    return this.http.post(`http://localhost:3000/reservas/${horarioId}`, {
      nombre,
      apellido,
      userId,
      fechaTurno,
      automatica
    }).pipe(
      tap(() => this.cargarHorarios())
    );
  }

  editarReserva(reservaId: number, data: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/reservas/${reservaId}`, data).pipe(
      tap(() => this.cargarHorarios())
    );
  }

  getHorariosDeLaSemana(): Observable<any[]> {
    const token = localStorage.getItem('token');

    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.get<any[]>('http://localhost:3000/horarios/semana', { headers });
    } else {
      // 🔓 llamada pública sin autenticación
      return this.http.get<any[]>('http://localhost:3000/horarios/semana');
    }
  }

  marcarRecuperadas() {
    return this.http.post(`http://localhost:3000/reservas/marcar-recuperadas`, {});

  }




}
