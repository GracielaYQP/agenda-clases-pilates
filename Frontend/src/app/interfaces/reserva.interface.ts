export interface Reserva {
  id: number;
  nombre: string;
  apellido: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

