import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Ingreso } from '@core/models/ingreso.model';
import { GastoFijo } from '@core/models/gasto-fijo.model';
import { GastoVariable } from '@core/models/gasto-variable.model';
import { Imprevisto } from '@core/models/imprevisto.model';
import { ConfiguracionUsuario } from '@core/models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  ingresos!: Table<Ingreso, number>;
  gastosFijos!: Table<GastoFijo, number>;
  gastosVariables!: Table<GastoVariable, number>;
  imprevistos!: Table<Imprevisto, number>;
  configuracion!: Table<ConfiguracionUsuario, number>;

  constructor() {
    super('FinanzasPersonalesDB');

    this.version(1).stores({
      ingresos: '++id, fecha, tipo, recurrente',
      gastosFijos: '++id, categoria, activo',
      gastosVariables: '++id, fecha, categoria',
      imprevistos: '++id, fecha, categoria',
      configuracion: '++id' // Usually just id=1
    });

    this.on('populate', () => this.populateInitialData());
  }

  private async populateInitialData() {
    await this.configuracion.add({
      id: 1,
      colchonSeguridad: 3, // 3 meses por defecto
      porcentajeAhorro: 20, // 20% por defecto
      sueldoAsignado: 0,
      reservaFiscalActiva: false,
      porcentajeImpuestos: 20,
      presupuestoVariableMensual: 300 // 300 euros por defecto para gastos variables/ocio/regalos
    });
  }
}
