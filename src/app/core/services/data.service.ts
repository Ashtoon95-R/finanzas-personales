import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Ingreso } from '@core/models/ingreso.model';
import { GastoFijo } from '@core/models/gasto-fijo.model';
import { GastoVariable } from '@core/models/gasto-variable.model';
import { Imprevisto } from '@core/models/imprevisto.model';
import { ConfiguracionUsuario } from '@core/models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private db = inject(DatabaseService);

  // --- Ingresos ---
  async getIngresos(): Promise<Ingreso[]> {
    return this.db.ingresos.toArray();
  }

  async getIngresosByMonth(year: number, month: number): Promise<Ingreso[]> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    
    const currentMonth = await this.db.ingresos
      .where('fecha')
      .between(start, end, true, true)
      .toArray();

    const previousRecurrent = await this.db.ingresos
      .where('fecha')
      .below(start)
      .and(ing => ing.recurrente && ing.frecuencia === 'mensual')
      .toArray();

    const projected = previousRecurrent.map(ing => {
      const projectedDate = new Date(ing.fecha);
      projectedDate.setFullYear(year);
      projectedDate.setMonth(month);
      return { ...ing, fecha: projectedDate, _isProjected: true } as Ingreso & { _isProjected?: boolean };
    });

    return [...currentMonth, ...projected].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async addIngreso(ingreso: Ingreso): Promise<number> {
    return this.db.ingresos.add(ingreso);
  }

  async updateIngreso(id: number, changes: Partial<Ingreso>): Promise<number> {
    return this.db.ingresos.update(id, changes);
  }

  async deleteIngreso(id: number): Promise<void> {
    return this.db.ingresos.delete(id);
  }

  // --- Gastos Fijos ---
  async getGastosFijos(): Promise<GastoFijo[]> {
    return this.db.gastosFijos.toArray();
  }

  async getGastosFijosActivosEnMes(year: number, month: number): Promise<GastoFijo[]> {
    const todos = await this.getGastosFijos();
    // month is 0-indexed. end of month date:
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    
    return todos.filter(g => {
      // Must be registered before or during this month
      if (!g.fechaRegistro) g.fechaRegistro = new Date(0); // fallback for old data
      const registeredBeforeEnd = g.fechaRegistro <= endOfMonth;
      
      // Must not be deactivated before this month
      const notDeactivatedBeforeStart = !g.fechaDesactivacion || g.fechaDesactivacion >= startOfMonth;
      
      return registeredBeforeEnd && notDeactivatedBeforeStart;
    });
  }

  async addGastoFijo(gasto: GastoFijo): Promise<number> {
    return this.db.gastosFijos.add(gasto);
  }

  async updateGastoFijo(id: number, changes: Partial<GastoFijo>): Promise<number> {
    return this.db.gastosFijos.update(id, changes);
  }

  async deleteGastoFijo(id: number): Promise<void> {
    return this.db.gastosFijos.delete(id);
  }

  // ============================
  // GASTOS VARIABLES
  // ============================
  async getGastosVariables(): Promise<GastoVariable[]> {
    return this.db.gastosVariables.toArray();
  }

  async getGastosVariablesByMonth(year: number, month: number): Promise<GastoVariable[]> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    
    return this.db.gastosVariables
      .where('fecha')
      .between(start, end, true, true)
      .toArray();
  }

  async getGastosVariablesByDateRangeAndCategory(start: Date, end: Date, category?: string): Promise<GastoVariable[]> {
    let query = this.db.gastosVariables.where('fecha').between(start, end, true, true);
    if (category && category !== 'todas') {
       return query.filter(g => g.categoria === category).toArray();
    }
    return query.toArray();
  }

  async getGastosVariablesStats6Months(currentYear: number, currentMonth: number): Promise<GastoVariable[]> {
    // 6 months ending in currentMonth
    const start = new Date(currentYear, currentMonth - 5, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    return this.db.gastosVariables
      .where('fecha')
      .between(start, end, true, true)
      .toArray();
  }

  async addGastoVariable(gasto: GastoVariable): Promise<number> {
    return this.db.gastosVariables.add(gasto);
  }

  async updateGastoVariable(id: number, changes: Partial<GastoVariable>): Promise<number> {
    return this.db.gastosVariables.update(id, changes);
  }

  async deleteGastoVariable(id: number): Promise<void> {
    return this.db.gastosVariables.delete(id);
  }

  // ============================
  // IMPREVISTOS
  // ============================
  async getImprevistos(): Promise<Imprevisto[]> {
    return this.db.imprevistos.toArray();
  }

  async getImprevistosByDateRange(start: Date, end: Date): Promise<Imprevisto[]> {
    return this.db.imprevistos
      .where('fecha')
      .between(start, end, true, true)
      .toArray();
  }

  async getImprevistosLast12Months(currentYear: number, currentMonth: number): Promise<Imprevisto[]> {
    const start = new Date(currentYear, currentMonth - 11, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    return this.db.imprevistos
      .where('fecha')
      .between(start, end, true, true)
      .toArray();
  }

  async addImprevisto(imprevisto: Imprevisto): Promise<number> {
    return this.db.imprevistos.add(imprevisto);
  }

  async updateImprevisto(id: number, changes: Partial<Imprevisto>): Promise<number> {
    return this.db.imprevistos.update(id, changes);
  }

  async deleteImprevisto(id: number): Promise<void> {
    return this.db.imprevistos.delete(id);
  }

  // ============================
  // DASHBOARD & ANALYTICS
  // ============================
  async getEvolucionMensual12Meses(currentYear: number, currentMonth: number): Promise<{mes: string, ingresos: number, gastos: number}[]> {
    const result = [];
    // Go backwards 11 months + current month = 12 months
    for (let i = 11; i >= 0; i--) {
      // Calculate target month and year
      let d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();

      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);

      const [ing, gasFijo, gasVar, imp] = await Promise.all([
        this.db.ingresos.where('fecha').between(start, end, true, true).toArray(),
        this.getGastosFijosActivosEnMes(y, m),
        this.db.gastosVariables.where('fecha').between(start, end, true, true).toArray(),
        this.db.imprevistos.where('fecha').between(start, end, true, true).toArray()
      ]);

      // Calculate totals (including projected recurrent incomes)
      const recurrentIng = await this.db.ingresos.where('fecha').below(start).and(ing => ing.recurrente && ing.frecuencia === 'mensual').toArray();
      
      const totalIng = ing.reduce((a, b) => a + b.importe, 0) + recurrentIng.reduce((a, b) => a + b.importe, 0);
      const totalGas = gasFijo.reduce((a, b) => a + b.importe, 0) + gasVar.reduce((a, b) => a + b.importe, 0) + imp.reduce((a, b) => a + b.importe, 0);
      
      result.push({
        mes: d.toLocaleString('es-ES', { month: 'short' }) + ' ' + y.toString().substring(2),
        ingresos: totalIng,
        gastos: totalGas
      });
    }
    return result;
  }

  // --- Configuracion ---
  async getConfiguracion(): Promise<ConfiguracionUsuario> {
    let conf = await this.db.configuracion.get(1);
    if (!conf) {
      conf = {
        id: 1,
        colchonSeguridad: 3,
        porcentajeAhorro: 20,
        sueldoAsignado: 0,
        reservaFiscalActiva: false,
        porcentajeImpuestos: 20
      };
      await this.db.configuracion.add(conf);
    }
    return conf;
  }

  async updateConfiguracion(changes: Partial<ConfiguracionUsuario>): Promise<number> {
    return this.db.configuracion.update(1, changes);
  }
}
