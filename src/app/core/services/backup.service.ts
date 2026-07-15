import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';


@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private db = inject(DatabaseService);

  async exportToJSON(): Promise<string> {
    const data = {
      ingresos: await this.db.ingresos.toArray(),
      gastosFijos: await this.db.gastosFijos.toArray(),
      gastosVariables: await this.db.gastosVariables.toArray(),
      imprevistos: await this.db.imprevistos.toArray(),
      configuracion: await this.db.configuracion.toArray(),
      cuentasAhorro: await this.db.cuentasAhorro.toArray(),
      deudas: await this.db.deudas.toArray()
    };
    return JSON.stringify(data, null, 2);
  }

  async importFromJSON(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      
      await this.db.transaction(
        'rw',
        [
          this.db.ingresos,
          this.db.gastosFijos,
          this.db.gastosVariables,
          this.db.imprevistos,
          this.db.configuracion,
          this.db.cuentasAhorro,
          this.db.deudas,
        ],
        async () => {
          if (data.ingresos) {
            await this.db.ingresos.clear();
            await this.db.ingresos.bulkAdd(data.ingresos);
          }
          if (data.gastosFijos) {
            await this.db.gastosFijos.clear();
            await this.db.gastosFijos.bulkAdd(data.gastosFijos);
          }
          if (data.gastosVariables) {
            await this.db.gastosVariables.clear();
            await this.db.gastosVariables.bulkAdd(data.gastosVariables);
          }
          if (data.imprevistos) {
            await this.db.imprevistos.clear();
            await this.db.imprevistos.bulkAdd(data.imprevistos);
          }
          if (data.configuracion) {
            await this.db.configuracion.clear();
            await this.db.configuracion.bulkAdd(data.configuracion);
          }
          if (data.cuentasAhorro) {
            await this.db.cuentasAhorro.clear();
            await this.db.cuentasAhorro.bulkAdd(data.cuentasAhorro);
          }
          if (data.deudas) {
            await this.db.deudas.clear();
            await this.db.deudas.bulkAdd(data.deudas);
          }
      });
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Formato de archivo inválido o corrupto.');
    }
  }
}
