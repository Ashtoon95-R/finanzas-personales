import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '@shared/icons';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { ConfiguracionUsuario } from '@core/models/configuracion.model';
import { CuentaAhorro } from '@core/models/cuenta-ahorro.model';
import { Deuda } from '@core/models/deuda.model';
import { CardComponent } from '@shared/components/card/card.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-ahorro-inversion',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, CardComponent, BadgeComponent, ModalComponent, FormsModule, ...LUCIDE_ICONS],
  templateUrl: './ahorro-inversion.component.html',
  styles: []
})
export class AhorroInversionComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);

  config = signal<ConfiguracionUsuario | null>(null);
  
  gastosFijosMesActual = signal<number>(0);
  mediaVariables6Meses = signal<number>(0);
  desviacionMesAnterior = signal<number>(0);

  cuentas = signal<CuentaAhorro[]>([]);
  deudas = signal<Deuda[]>([]);

  isCuentaModalOpen = false;
  isDeudaModalOpen = false;
  cuentaEditingId: number | null = null;
  deudaEditingId: number | null = null;
  mostrarPasos = false;

  toggleMostrarPasos() {
    this.mostrarPasos = !this.mostrarPasos;
  }

  cuentaForm: Partial<CuentaAhorro> = {
    nombre: '',
    entidad: 'Trade Republic',
    saldo: 0,
    interesAnual: 2
  };

  deudaForm: Partial<Deuda> = {
    concepto: '',
    importePendiente: 0,
    tipoInteres: 0
  };

  gastosBase = computed(() => this.gastosFijosMesActual() + this.mediaVariables6Meses() + this.desviacionMesAnterior());
  
  sueldoBrutoRecomendado = computed(() => {
    if (!this.config()) return 0;
    const c = this.config()!;
    const pAhorro = c.porcentajeAhorro / 100;
    const pImpuestos = c.reservaFiscalActiva ? (c.porcentajeImpuestos / 100) : 0;
    
    const factor = 1 - pAhorro - pImpuestos;
    if (factor <= 0) return 0;
    
    return this.gastosBase() / factor;
  });

  sueldoBrutoBase = computed(() => {
    if (!this.config()) return 0;
    const c = this.config()!;
    const pAhorro = c.porcentajeAhorro / 100;
    const pImpuestos = c.reservaFiscalActiva ? (c.porcentajeImpuestos / 100) : 0;
    
    const factor = 1 - pAhorro - pImpuestos;
    if (factor <= 0) return 0;
    
    const gastosSinDesviacion = this.gastosFijosMesActual() + this.mediaVariables6Meses();
    return gastosSinDesviacion / factor;
  });

  parteGastos = computed(() => this.gastosBase());
  
  parteAhorro = computed(() => {
    if (!this.config()) return 0;
    return this.sueldoBrutoRecomendado() * (this.config()!.porcentajeAhorro / 100);
  });
  
  parteImpuestos = computed(() => {
    if (!this.config() || !this.config()!.reservaFiscalActiva) return 0;
    return this.sueldoBrutoRecomendado() * (this.config()!.porcentajeImpuestos / 100);
  });

  colchonObjetivo = computed(() => {
    if (!this.config()) return 0;
    return this.gastosFijosMesActual() * this.config()!.colchonSeguridad;
  });
  colchonActual = computed(() => this.config()?.colchonActual || 0);
  deficitColchon = computed(() => Math.max(0, this.colchonObjetivo() - this.colchonActual()));

  totalDeudas = computed(() => this.deudas().reduce((sum, d) => sum + d.importePendiente, 0));
  totalDeudasCaras = computed(() => this.deudas().filter(d => d.tipoInteres > 5).reduce((sum, d) => sum + d.importePendiente, 0));

  totalCuentas = computed(() => this.cuentas().reduce((sum, c) => sum + c.saldo, 0));
  interesAnualEstimado = computed(() =>
    this.cuentas().reduce((sum, c) => sum + c.saldo * (c.interesAnual / 100), 0)
  );

  // Waterfall: colchón → deudas caras → cuentas remuneradas
  waterfall = computed(() => {
    const totalAhorro = this.parteAhorro();
    const deficit = this.deficitColchon();
    const deudasCaras = this.totalDeudasCaras();
    
    let colchon = 0;
    let deudas = 0;
    let cuentas = 0;
    let fase: 'colchon' | 'deudas' | 'cuentas' = 'colchon';
    
    if (deficit > 0) {
      colchon = Math.min(totalAhorro, deficit);
      const resto = totalAhorro - colchon;
      if (resto > 0) {
        deudas = Math.min(resto, deudasCaras);
        cuentas = resto - deudas;
      }
      fase = 'colchon';
    } else if (deudasCaras > 0) {
      deudas = Math.min(totalAhorro, deudasCaras);
      cuentas = totalAhorro - deudas;
      fase = 'deudas';
    } else {
      cuentas = totalAhorro;
      fase = 'cuentas';
    }
    
    return { colchon, deudas, cuentas, fase };
  });

  pctGastosFijos = computed(() => (this.gastosFijosMesActual() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctGastosVariables = computed(() => (this.mediaVariables6Meses() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctDesviacion = computed(() => (this.desviacionMesAnterior() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctAhorro = computed(() => (this.parteAhorro() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctImpuestos = computed(() => (this.parteImpuestos() / this.sueldoBrutoRecomendado()) * 100 || 0);

  // --- Plan de Acción Mensual ---
  saldoImagin = computed(() => this.config()?.saldoCuentaOperativa || 0);
  
  techoImagin = computed(() => {
    return (this.gastosFijosMesActual() * 2) + (this.parteImpuestos() * 3);
  });
  
  transferenciaOcio = computed(() => this.config()?.presupuestoVariableMensual || 0);
  transferenciaAhorroSueldo = computed(() => this.parteAhorro());

  excedenteImagin = computed(() => {
    return Math.max(0, this.saldoImagin() - this.techoImagin() - this.transferenciaOcio() - this.transferenciaAhorroSueldo() - this.gastosVariablesFuturos());
  });

  // Proyección de saldo (Conservadora: sin contar ingresos pendientes ni variables ya pagados)
  ingresosMesActual = signal<number>(0);
  gastosVariablesYaPagados = signal<number>(0); // Informativo
  gastosVariablesFuturos = signal<number>(0); // Gastos previstos que restarán saldo
  
  proyeccionFinDeMes = computed(() => {
    // Si ejecutan las transferencias y pagan los fijos/futuros, el saldo debería acercarse al Techo
    return this.saldoImagin() - this.gastosFijosMesActual() - this.transferenciaOcio() - this.gastosVariablesFuturos();
  });

  constructor() {
    effect(() => {
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      this.loadData(year, month);
    });
  }

  async loadData(year: number, month: number) {
    const [conf, fijos, cuentas, deudas] = await Promise.all([
      this.dataService.getConfiguracion(),
      this.dataService.getGastosFijosActivosEnMes(year, month),
      this.dataService.getCuentasAhorro(),
      this.dataService.getDeudas()
    ]);
    
    this.config.set(conf);
    this.cuentas.set(cuentas);
    this.deudas.set(deudas);
    
    this.gastosFijosMesActual.set(fijos.reduce((sum, g) => sum + g.importe, 0));

    const ingresos = await this.dataService.getIngresosByMonth(year, month);
    // Solo proyectamos los ingresos que aún NO hemos cobrado (pendiente o facturado)
    const ingresosPendientes = ingresos.filter(i => i.estado !== 'cobrado');
    this.ingresosMesActual.set(ingresosPendientes.reduce((sum, i) => sum + i.importe, 0));

    const variablesMesActual = await this.dataService.getGastosVariablesByMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pagados = variablesMesActual.filter(g => new Date(g.fecha) <= today);
    const futuros = variablesMesActual.filter(g => new Date(g.fecha) > today);
    
    this.gastosVariablesYaPagados.set(pagados.reduce((sum, g) => sum + g.importe, 0));
    this.gastosVariablesFuturos.set(futuros.reduce((sum, g) => sum + g.importe, 0));

    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;

    const prevVariables = await this.dataService.getGastosVariablesByMonth(prevYear, prevMonth);
    const prevVariablesNonTax = prevVariables.filter(g => g.categoria !== 'impuestos').reduce((sum, g) => sum + g.importe, 0);
    
    const prevImprevistos = await this.dataService.getImprevistosByDateRange(
      new Date(prevYear, prevMonth, 1),
      new Date(prevYear, prevMonth + 1, 0, 23, 59, 59)
    );
    const prevImprevistosTotal = prevImprevistos.reduce((sum, g) => sum + g.importe, 0);

    const presupuestoConfigurado = conf?.presupuestoVariableMensual || 0;
    
    const desviacion = (prevVariables.length === 0 && prevImprevistos.length === 0)
      ? 0
      : (presupuestoConfigurado > 0 ? (prevVariablesNonTax - presupuestoConfigurado) + prevImprevistosTotal : 0);
    this.desviacionMesAnterior.set(desviacion);

    const variables6m = await this.dataService.getGastosVariablesStats6Months(prevYear, prevMonth);
    
    const variablesSinImpuestos = variables6m.filter(g => g.categoria !== 'impuestos');
    const sumVariablesSinImpuestos = variablesSinImpuestos.reduce((sum, g) => sum + g.importe, 0);
    const historicoMediaSinImpuestos = sumVariablesSinImpuestos / 6;
    
    const impuestos6m = variables6m.filter(g => g.categoria === 'impuestos');
    const sumImpuestos = impuestos6m.reduce((sum, g) => sum + g.importe, 0);
    const historicoMediaImpuestos = sumImpuestos / 6;
    
    const baseVariables = Math.max(historicoMediaSinImpuestos, presupuestoConfigurado);
    
    this.mediaVariables6Meses.set(baseVariables + historicoMediaImpuestos);
  }

  openCuentaModal(cuenta?: CuentaAhorro) {
    if (cuenta) {
      this.cuentaEditingId = cuenta.id || null;
      this.cuentaForm = { ...cuenta };
    } else {
      this.cuentaEditingId = null;
      this.cuentaForm = {
        nombre: '',
        entidad: 'Trade Republic',
        saldo: 0,
        interesAnual: 2
      };
    }
    this.isCuentaModalOpen = true;
  }

  closeCuentaModal() {
    this.isCuentaModalOpen = false;
  }

  async saveCuenta(form: any) {
    if (form.invalid) return;
    if (this.cuentaEditingId) {
      await this.dataService.updateCuentaAhorro(this.cuentaEditingId, this.cuentaForm);
    } else {
      await this.dataService.addCuentaAhorro(this.cuentaForm as CuentaAhorro);
    }
    this.isCuentaModalOpen = false;
    this.reloadAllData();
  }

  async deleteCuenta(id: number) {
    if (confirm('¿Estás seguro de eliminar esta cuenta de ahorro?')) {
      await this.dataService.deleteCuentaAhorro(id);
      this.reloadAllData();
    }
  }

  openDeudaModal(deuda?: Deuda) {
    if (deuda) {
      this.deudaEditingId = deuda.id || null;
      this.deudaForm = { ...deuda };
    } else {
      this.deudaEditingId = null;
      this.deudaForm = {
        concepto: '',
        importePendiente: 0,
        tipoInteres: 0
      };
    }
    this.isDeudaModalOpen = true;
  }

  closeDeudaModal() {
    this.isDeudaModalOpen = false;
  }

  async saveDeuda(form: any) {
    if (form.invalid) return;
    if (this.deudaEditingId) {
      await this.dataService.updateDeuda(this.deudaEditingId, this.deudaForm);
    } else {
      await this.dataService.addDeuda(this.deudaForm as Deuda);
    }
    this.isDeudaModalOpen = false;
    this.reloadAllData();
  }

  async deleteDeuda(id: number) {
    if (confirm('¿Estás seguro de eliminar esta deuda?')) {
      await this.dataService.deleteDeuda(id);
      this.reloadAllData();
    }
  }

  async reloadAllData() {
    const year = this.stateService.currentYear();
    const month = this.stateService.currentMonth();
    await this.loadData(year, month);
  }
}
