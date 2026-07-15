import { Injectable, signal, computed, inject } from '@angular/core';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private dataService = inject(DataService);

  // Global Date State
  currentDate = signal(new Date());

  // Derived state
  currentMonth = computed(() => this.currentDate().getMonth());
  currentYear = computed(() => this.currentDate().getFullYear());
  
  // Financial Summary State
  totalIngresos = signal(0);
  totalGastos = signal(0);
  disponible = computed(() => this.totalIngresos() - this.totalGastos());
  necesitaBackup = signal(false);

  constructor() {
    this.refreshSummary();
  }

  setMonth(month: number) {
    const date = new Date(this.currentDate());
    date.setMonth(month);
    this.currentDate.set(date);
    this.refreshSummary();
  }

  setYear(year: number) {
    const date = new Date(this.currentDate());
    date.setFullYear(year);
    this.currentDate.set(date);
    this.refreshSummary();
  }

  async refreshSummary() {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    const ingresos = await this.dataService.getIngresosByMonth(year, month);
    const gastosVar = await this.dataService.getGastosVariablesByMonth(year, month);
    const gastosFijos = await this.dataService.getGastosFijosActivosEnMes(year, month);
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    const imprevistos = await this.dataService.getImprevistosByDateRange(start, end);

    const totalIng = ingresos.reduce((acc, curr) => acc + curr.importe, 0);
    const totalGas = gastosVar.reduce((acc, curr) => acc + curr.importe, 0) + 
                     gastosFijos.reduce((acc, curr) => acc + curr.importe, 0) +
                     imprevistos.reduce((acc, curr) => acc + curr.importe, 0);

    this.totalIngresos.set(totalIng);
    this.totalGastos.set(totalGas);

    // Comprobar backup
    const config = await this.dataService.getConfiguracion();
    if (config && config.ultimoBackup) {
      const diff = new Date().getTime() - new Date(config.ultimoBackup).getTime();
      const dias = Math.floor(diff / (1000 * 3600 * 24));
      this.necesitaBackup.set(dias > 30);
    } else {
      this.necesitaBackup.set(true); // Si no hay backup nunca, lo necesita
    }
  }
}


