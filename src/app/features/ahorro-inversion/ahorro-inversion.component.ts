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

  gastosBase = computed(() => this.gastosFijosMesActual() + this.mediaVariables6Meses());
  
  sueldoBrutoRecomendado = computed(() => {
    if (!this.config()) return 0;
    const c = this.config()!;
    const pAhorro = c.porcentajeAhorro / 100;
    const pImpuestos = c.reservaFiscalActiva ? (c.porcentajeImpuestos / 100) : 0;
    
    const factor = 1 - pAhorro - pImpuestos;
    if (factor <= 0) return 0;
    
    return this.gastosBase() / factor;
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
  pctAhorro = computed(() => (this.parteAhorro() / this.sueldoBrutoRecomendado()) * 100 || 0);
  pctImpuestos = computed(() => (this.parteImpuestos() / this.sueldoBrutoRecomendado()) * 100 || 0);

  // --- Plan de Acción Mensual ---
  saldoImagin = computed(() => this.config()?.saldoCuentaOperativa || 0);
  saldoRevolut = computed(() => this.config()?.saldoRevolut || 0);

  techoImagin = computed(() => {
    return (this.gastosFijosMesActual() * 2) + (this.parteImpuestos() * 3);
  });

  presupuestoOcio = computed(() => this.config()?.presupuestoVariableMensual || 0);

  /** Lo que hay que pasar de Imagin a Revolut para llegar al presupuesto de variables. */
  transferenciaOcio = computed(() => {
    const presupuesto = this.presupuestoOcio();
    const revolut = this.saldoRevolut();
    return Math.max(0, Math.round((presupuesto - revolut) * 100) / 100);
  });
  transferenciaAhorroSueldo = computed(() => this.parteAhorro());

  // Checkboxes: al marcar, actualizan Imagin/colchón al momento (y se pueden deshacer)
  // El estado es por mes: al cambiar de mes se restaura el de ese mes, no se arrastra.
  private mesPlanKey = signal('');
  ocioEjecutado = signal(false);
  ahorroEjecutado = signal(false);
  excedenteEjecutado = signal(false);
  combinadoEjecutado = signal(false);

  /** Importes congelados al marcar, para mostrar/deshacer sin recalcular */
  importeOcioAplicado = signal(0);
  importeAhorroAplicado = signal(0);
  importeAhorroAColchon = signal(0);
  importeExcedenteAplicado = signal(0);
  importeCombinadoAplicado = signal(0);

  excedenteImagin = computed(() => {
    // No restar de nuevo lo que ya se transfirió al marcar checkboxes
    const ocioPendiente = this.ocioEjecutado() ? 0 : this.transferenciaOcio();
    const ahorroPendiente = (this.ahorroEjecutado() || this.combinadoEjecutado())
      ? 0
      : this.transferenciaAhorroSueldo();
    return Math.max(
      0,
      this.saldoImagin() - this.techoImagin() - ocioPendiente - ahorroPendiente - this.gastosImpuestosFuturos()
    );
  });

  mostrarOcio = computed(() => this.transferenciaOcio() > 0 || this.ocioEjecutado());
  mostrarAhorroSolo = computed(() =>
    this.ahorroEjecutado() ||
    (!this.combinadoEjecutado() &&
      (this.waterfall().fase !== 'colchon' || this.excedenteImagin() === 0))
  );
  mostrarExcedenteSolo = computed(() =>
    this.excedenteEjecutado() ||
    (!this.combinadoEjecutado() &&
      this.excedenteImagin() > 0 &&
      this.waterfall().fase !== 'colchon')
  );
  mostrarCombinado = computed(() =>
    this.combinadoEjecutado() ||
    (this.excedenteImagin() > 0 && this.waterfall().fase === 'colchon')
  );

  // Proyección de saldo (Conservadora: sin contar ingresos pendientes ni variables ya pagados)
  ingresosMesActual = signal<number>(0);
  gastosVariablesYaPagados = signal<number>(0); // Informativo
  gastosVariablesFuturos = signal<number>(0);
  gastosImpuestosFuturos = signal<number>(0);

  proyeccionFinDeMes = computed(() => {
    const ocioPendiente = this.ocioEjecutado() ? 0 : this.transferenciaOcio();
    return this.saldoImagin() - this.gastosFijosMesActual() - ocioPendiente - this.gastosImpuestosFuturos();
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
    this.restaurarCheckboxesDelMes(conf, year, month);
    
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
    const impuestosFuturos = futuros.filter(g => g.categoria === 'impuestos');

    this.gastosVariablesYaPagados.set(pagados.reduce((sum, g) => sum + g.importe, 0));
    this.gastosVariablesFuturos.set(futuros.reduce((sum, g) => sum + g.importe, 0));
    this.gastosImpuestosFuturos.set(impuestosFuturos.reduce((sum, g) => sum + g.importe, 0));

    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const presupuestoConfigurado = conf?.presupuestoVariableMensual || 0;

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

  private claveMes(year: number, month: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  private restaurarCheckboxesDelMes(conf: ConfiguracionUsuario | null, year: number, month: number): void {
    const key = this.claveMes(year, month);
    this.mesPlanKey.set(key);
    const plan = conf?.planDia1PorMes?.[key];

    this.ocioEjecutado.set(!!plan?.ocio?.hecho);
    this.importeOcioAplicado.set(plan?.ocio?.importe || 0);

    this.ahorroEjecutado.set(!!plan?.ahorro?.hecho);
    this.importeAhorroAplicado.set(plan?.ahorro?.importe || 0);
    this.importeAhorroAColchon.set(plan?.ahorro?.aColchon || 0);

    this.excedenteEjecutado.set(!!plan?.excedente?.hecho);
    this.importeExcedenteAplicado.set(plan?.excedente?.importe || 0);

    this.combinadoEjecutado.set(!!plan?.combinado?.hecho);
    this.importeCombinadoAplicado.set(plan?.combinado?.importe || 0);
  }

  private async guardarPlanDia1Mes(): Promise<void> {
    const conf = this.config();
    const key = this.mesPlanKey();
    if (!conf || !key) return;

    const planMes = {
      ocio: this.ocioEjecutado()
        ? { hecho: true, importe: this.importeOcioAplicado() }
        : undefined,
      ahorro: this.ahorroEjecutado()
        ? { hecho: true, importe: this.importeAhorroAplicado(), aColchon: this.importeAhorroAColchon() }
        : undefined,
      excedente: this.excedenteEjecutado()
        ? { hecho: true, importe: this.importeExcedenteAplicado() }
        : undefined,
      combinado: this.combinadoEjecutado()
        ? { hecho: true, importe: this.importeCombinadoAplicado() }
        : undefined,
    };

    const planDia1PorMes = { ...(conf.planDia1PorMes || {}) };
    const tieneAlgo = planMes.ocio || planMes.ahorro || planMes.excedente || planMes.combinado;
    if (tieneAlgo) {
      planDia1PorMes[key] = planMes;
    } else {
      delete planDia1PorMes[key];
    }

    await this.dataService.updateConfiguracion({ planDia1PorMes });
    this.config.set({ ...conf, planDia1PorMes });
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

  private async persistSaldos(deltaImagin: number, deltaColchon: number, deltaRevolut = 0): Promise<void> {
    const conf = this.config();
    if (!conf) return;

    const nuevoSaldo = Math.round(((conf.saldoCuentaOperativa || 0) + deltaImagin) * 100) / 100;
    const nuevoColchon = Math.round(((conf.colchonActual || 0) + deltaColchon) * 100) / 100;
    const nuevoRevolut = Math.round(((conf.saldoRevolut || 0) + deltaRevolut) * 100) / 100;

    await this.dataService.updateConfiguracion({
      saldoCuentaOperativa: nuevoSaldo,
      colchonActual: nuevoColchon,
      saldoRevolut: nuevoRevolut,
    });

    this.config.set({
      ...conf,
      saldoCuentaOperativa: nuevoSaldo,
      colchonActual: nuevoColchon,
      saldoRevolut: nuevoRevolut,
    });
    this.stateService.refreshSummary();
  }

  async onToggleOcio(checked: boolean): Promise<void> {
    if (checked) {
      const importe = this.transferenciaOcio();
      if (importe <= 0) return;
      this.importeOcioAplicado.set(importe);
      this.ocioEjecutado.set(true);
      await this.persistSaldos(-importe, 0, importe);
    } else {
      const importe = this.importeOcioAplicado();
      this.ocioEjecutado.set(false);
      this.importeOcioAplicado.set(0);
      if (importe > 0) await this.persistSaldos(importe, 0, -importe);
    }
    await this.guardarPlanDia1Mes();
  }

  async onToggleAhorro(checked: boolean): Promise<void> {
    if (checked) {
      const importe = this.transferenciaAhorroSueldo();
      if (importe <= 0) return;
      const aColchon = this.waterfall().fase === 'colchon' ? importe : 0;
      this.importeAhorroAplicado.set(importe);
      this.importeAhorroAColchon.set(aColchon);
      this.ahorroEjecutado.set(true);
      await this.persistSaldos(-importe, aColchon);
    } else {
      const importe = this.importeAhorroAplicado();
      const aColchon = this.importeAhorroAColchon();
      this.ahorroEjecutado.set(false);
      this.importeAhorroAplicado.set(0);
      this.importeAhorroAColchon.set(0);
      if (importe > 0) await this.persistSaldos(importe, -aColchon);
    }
    await this.guardarPlanDia1Mes();
  }

  async onToggleExcedente(checked: boolean): Promise<void> {
    if (checked) {
      const importe = this.excedenteImagin();
      if (importe <= 0) return;
      this.importeExcedenteAplicado.set(importe);
      this.excedenteEjecutado.set(true);
      await this.persistSaldos(-importe, importe);
    } else {
      const importe = this.importeExcedenteAplicado();
      this.excedenteEjecutado.set(false);
      this.importeExcedenteAplicado.set(0);
      if (importe > 0) await this.persistSaldos(importe, -importe);
    }
    await this.guardarPlanDia1Mes();
  }

  async onToggleCombinado(checked: boolean): Promise<void> {
    if (checked) {
      const importe = this.transferenciaAhorroSueldo() + this.excedenteImagin();
      if (importe <= 0) return;
      this.importeCombinadoAplicado.set(importe);
      this.combinadoEjecutado.set(true);
      await this.persistSaldos(-importe, importe);
    } else {
      const importe = this.importeCombinadoAplicado();
      this.combinadoEjecutado.set(false);
      this.importeCombinadoAplicado.set(0);
      if (importe > 0) await this.persistSaldos(importe, -importe);
    }
    await this.guardarPlanDia1Mes();
  }
}
