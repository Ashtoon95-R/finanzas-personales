import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Ingreso } from '@core/models/ingreso.model';
import { GastoFijo } from '@core/models/gasto-fijo.model';
import { GastoVariable } from '@core/models/gasto-variable.model';
import { Imprevisto } from '@core/models/imprevisto.model';
import { ConfiguracionUsuario } from '@core/models/configuracion.model';
import { CuentaAhorro } from '@core/models/cuenta-ahorro.model';
import { Deuda } from '@core/models/deuda.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  ingresos!: Table<Ingreso, number>;
  gastosFijos!: Table<GastoFijo, number>;
  gastosVariables!: Table<GastoVariable, number>;
  imprevistos!: Table<Imprevisto, number>;
  configuracion!: Table<ConfiguracionUsuario, number>;
  cuentasAhorro!: Table<CuentaAhorro, number>;
  deudas!: Table<Deuda, number>;

  constructor() {
    super('FinanzasPersonalesDB');

    this.version(1).stores({
      ingresos: '++id, fecha, tipo, recurrente',
      gastosFijos: '++id, categoria, activo',
      gastosVariables: '++id, fecha, categoria',
      imprevistos: '++id, fecha, categoria',
      configuracion: '++id' // Usually just id=1
    });

    this.version(2).stores({
      posicionesInversion: '++id, concepto, tipoVehiculo',
      deudas: '++id, concepto'
    }).upgrade(async tx => {
      const configTable = tx.table('configuracion');
      const configs = await configTable.toArray();
      for (const conf of configs) {
        let changed = false;
        if (conf.colchonActual === undefined) { conf.colchonActual = 0; changed = true; }
        if (changed) {
          await configTable.put(conf);
        }
      }
    });

    // v3: sustituye cartera de inversión por cuentas de ahorro remuneradas
    this.version(3).stores({
      posicionesInversion: null,
      cuentasAhorro: '++id, nombre, entidad'
    });

    // v4: Fix date strings that might have been imported incorrectly
    this.version(4).stores({}).upgrade(async tx => {
      const tablesWithDates = ['ingresos', 'gastosVariables', 'imprevistos'];
      for (const tableName of tablesWithDates) {
        const table = tx.table(tableName);
        await table.toCollection().modify((item) => {
          if (typeof item.fecha === 'string') {
            item.fecha = new Date(item.fecha);
          }
          if (item.fechaCobro && typeof item.fechaCobro === 'string') {
            item.fechaCobro = new Date(item.fechaCobro);
          }
          if (item.fechaRegistro && typeof item.fechaRegistro === 'string') {
            item.fechaRegistro = new Date(item.fechaRegistro);
          }
        });
      }
      
      const configTable = tx.table('configuracion');
      await configTable.toCollection().modify((item) => {
        if (typeof item.ultimoBackup === 'string') {
          item.ultimoBackup = new Date(item.ultimoBackup);
        }
      });
      
      const gastosFijosTable = tx.table('gastosFijos');
      await gastosFijosTable.toCollection().modify((item) => {
        if (typeof item.fechaRegistro === 'string') {
          item.fechaRegistro = new Date(item.fechaRegistro);
        }
      });
    });

    this.on('populate', () => this.populateInitialData());
  }

  private async populateInitialData() {
    await this.configuracion.add({
      id: 1,
      colchonSeguridad: 3,
      porcentajeAhorro: 20,
      sueldoAsignado: 0,
      reservaFiscalActiva: false,
      porcentajeImpuestos: 20,
      presupuestoVariableMensual: 300,
      colchonActual: 0
    });
  }
}
