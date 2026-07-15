import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { ConfiguracionUsuario } from '@core/models/configuracion.model';
import { CardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'app-ahorro-inversion',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, CardComponent],
  templateUrl: './ahorro-inversion.component.html',
  styles: []
})
export class AhorroInversionComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);

  config = signal<ConfiguracionUsuario | null>(null);
  
  // Base numbers
  gastosFijosMesActual = signal<number>(0);
  mediaVariables6Meses = signal<number>(0);

  // Derived calculations
  gastosBase = computed(() => this.gastosFijosMesActual() + this.mediaVariables6Meses());
  
  sueldoBrutoRecomendado = computed(() => {
    if (!this.config()) return 0;
    const c = this.config()!;
    const pAhorro = c.porcentajeAhorro / 100;
    const pImpuestos = c.reservaFiscalActiva ? (c.porcentajeImpuestos / 100) : 0;
    
    // Formula: SBR = Gastos / (1 - %Ahorro - %Impuestos)
    const factor = 1 - pAhorro - pImpuestos;
    if (factor <= 0) return 0; // Prevent div by zero or negative if percentages are too high
    
    return this.gastosBase() / factor;
  });

  // Breakdowns
  parteGastos = computed(() => this.gastosBase());
  
  parteAhorro = computed(() => {
    if (!this.config()) return 0;
    return this.sueldoBrutoRecomendado() * (this.config()!.porcentajeAhorro / 100);
  });
  
  parteImpuestos = computed(() => {
    if (!this.config() || !this.config()!.reservaFiscalActiva) return 0;
    return this.sueldoBrutoRecomendado() * (this.config()!.porcentajeImpuestos / 100);
  });

  // KPIs
  colchonObjetivo = computed(() => {
    if (!this.config()) return 0;
    return this.gastosFijosMesActual() * this.config()!.colchonSeguridad;
  });

  // Progress bar percentages for UI
  pctGastosFijos = computed(() => (this.gastosFijosMesActual() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctGastosVariables = computed(() => (this.mediaVariables6Meses() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctAhorro = computed(() => (this.parteAhorro() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctImpuestos = computed(() => (this.parteImpuestos() / this.sueldoBrutoRecomendado()) * 100 || 0);

  constructor() {
    effect(() => {
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      this.loadData(year, month);
    });
  }

  async loadData(year: number, month: number) {
    const [conf, fijos] = await Promise.all([
      this.dataService.getConfiguracion(),
      this.dataService.getGastosFijosActivosEnMes(year, month)
    ]);
    
    this.config.set(conf);
    
    // 1. Gastos Fijos (Solo personales/base)
    // Para simplificar, asumiremos que todos los fijos cuentan. Podríamos filtrar si tuvieran una marca "negocio"
    this.gastosFijosMesActual.set(fijos.reduce((sum, g) => sum + g.importe, 0));

    // 2. Media 6 meses variables o presupuesto manual (lo que sea mayor, o el presupuesto si no hay histórico)
    const variables6m = await this.dataService.getGastosVariablesStats6Months(year, month);
    const sumVariables = variables6m.reduce((sum, g) => sum + g.importe, 0);
    const historicoMedia = sumVariables / 6;
    
    // Tomamos el presupuesto configurado como base mínima (ocio, regalos, etc.), o si ya gasta más, cogemos el histórico
    const presupuestoConfigurado = conf?.presupuestoVariableMensual || 0;
    this.mediaVariables6Meses.set(Math.max(historicoMedia, presupuestoConfigurado));
  }
}
