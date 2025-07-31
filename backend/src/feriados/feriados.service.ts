import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Feriado } from './feriados.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FeriadosService implements OnModuleInit {
  constructor(
    @InjectRepository(Feriado)
    private readonly feriadoRepo: Repository<Feriado>
  ) {}

  async onModuleInit() {
    await this.cargarFeriadosIniciales(); // ⬅️ se ejecuta cuando arranca el módulo
  }

  async esFeriado(fecha: Date): Promise<boolean> {
    const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const feriado = await this.feriadoRepo.findOne({ where: { fecha: fechaStr } });
    return !!feriado;
  }

  async listarFeriados(): Promise<Feriado[]> {
    return this.feriadoRepo.find({ order: { fecha: 'ASC' } });
  }

  async cargarFeriadosIniciales(): Promise<void> {
    const feriados: Partial<Feriado>[] = [
      { fecha: '2025-01-01', descripcion: 'Año Nuevo' },
      { fecha: '2025-03-03', descripcion: 'Carnaval' },
      { fecha: '2025-03-04', descripcion: 'Carnaval' },
      { fecha: '2025-03-24', descripcion: 'Día de la Memoria' },
      { fecha: '2025-04-02', descripcion: 'Día de los Caídos en Malvinas' },
      { fecha: '2025-04-17', descripcion: 'Jueves Santo' },
      { fecha: '2025-04-18', descripcion: 'Viernes Santo' },
      { fecha: '2025-05-01', descripcion: 'Día del Trabajador' },
      { fecha: '2025-05-02', descripcion: 'Día no laborable con fines turísticos' },
      { fecha: '2025-05-25', descripcion: 'Revolución de Mayo' },
      { fecha: '2025-06-16', descripcion: 'Paso a la Inmortalidad de Güemes' },
      { fecha: '2025-06-20', descripcion: 'Día de la Bandera' },
      { fecha: '2025-07-09', descripcion: 'Día de la Independencia' },
      { fecha: '2025-08-15', descripcion: 'Día no laborable con fines turísticos' },
      { fecha: '2025-08-16', descripcion: 'Paso a la Inmortalidad de San Martín' },
      { fecha: '2025-10-12', descripcion: 'Día del Respeto a la Diversidad Cultural' },
      { fecha: '2025-11-21', descripcion: 'Día no laborable con fines turísticos' },
      { fecha: '2025-11-24', descripcion: 'Día de la Soberanía Nacional' },
      { fecha: '2025-12-08', descripcion: 'Inmaculada Concepción de María' },
      { fecha: '2025-12-25', descripcion: 'Navidad' },
    ];

    for (const feriado of feriados) {
      const existe = await this.feriadoRepo.findOne({ where: { fecha: feriado.fecha } });
      if (!existe) {
        await this.feriadoRepo.save(feriado);
      }
    }
  }
}

