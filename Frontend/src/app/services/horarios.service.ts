import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Horario } from '../horarios-disponibles/horarios-disponibles.component';

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private apiUrl = 'http://localhost:3000/horarios';
  private horariosSubject = new BehaviorSubject<Horario[]>([]);
  horarios$ = this.horariosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getHorarios() {
    return this.http.get<Horario[]>(this.apiUrl);
  }

  cargarHorarios() {
    this.http.get<Horario[]>(this.apiUrl).subscribe(data => this.horariosSubject.next(data));
  }


  reservar(horarioId: number, nombre: string, apellido: string, userId: number): Observable<any> {
    return this.http.post(`http://localhost:3000/reservas/${horarioId}`, {
      userId,
      nombre,
      apellido
    }).pipe(
      tap(() => this.cargarHorarios())
    );
  }



}
