import { Reserva } from "./reserva.interface";

export interface HorarioSemana {
  idHorario: number;
  fecha: string;
  dia: string;
  hora: string;
  nivel: string;
  totalCamas: number;
  camasReservadas: number;
  camasDisponibles: number;
  reservadoPorUsuario: boolean;
  canceladoPorUsuario: boolean;
  reservas?: Reserva[];
}
