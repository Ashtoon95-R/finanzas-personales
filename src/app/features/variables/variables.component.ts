import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { GastoVariable } from '@core/models/gasto-variable.model';
import { Imprevisto } from '@core/models/imprevisto.model';
import { CardComponent } from '@shared/components/card/card.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, BaseChartDirective, CardComponent, BadgeComponent, ModalComponent],
  templateUrl: './variables.component.html',
  styles: []
})
export class VariablesComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);

  gastos = signal<GastoVariable[]>([]);
  imprevistos = signal<Imprevisto[]>([]);
  imprevistos12Meses = signal<number>(0);
  activeTab = signal<'stats' | 'list'>('stats');
  
  totalGastos = computed(() => this.gastos().reduce((acc, curr) => acc + curr.importe, 0));
  totalImprevistos = computed(() => this.imprevistos().reduce((acc, curr) => acc + curr.importe, 0));

  // Filters
  filterCategory = 'todas';
  filterStartDate = '';
  filterEndDate = '';

  // Modals
  isGastoModalOpen = false;
  isImprevistoModalOpen = false;
  editingId: number | null = null;

  gastoForm: Partial<GastoVariable> = { concepto: '', importe: 0, categoria: 'dietas', fecha: new Date(), recurrente: false };
  imprevistoForm: Partial<Imprevisto> = { concepto: '', importe: 0, categoria: 'reparacion', fecha: new Date(), notas: '' };

  categoriasGasto = [
    { value: 'impuestos', label: 'Impuestos y Trimestres (IVA/IRPF)' },
    { value: 'supermercado', label: 'Supermercado y Alimentación' },
    { value: 'restaurantes', label: 'Restaurantes y Dietas' },
    { value: 'ocio', label: 'Ocio y Entretenimiento' },
    { value: 'consumo', label: 'Consumo y Compras Personales' },
    { value: 'transporte', label: 'Transporte y Viajes' },
    { value: 'material', label: 'Material y Equipamiento' },
    { value: 'marketing', label: 'Marketing y Publicidad' },
    { value: 'otros', label: 'Otros' }
  ];

  categoriasImprevisto = [
    { value: 'reparacion', label: 'Reparaciones' },
    { value: 'salud', label: 'Urgencias Médicas' },
    { value: 'multas', label: 'Multas y Sanciones' },
    { value: 'otros', label: 'Otros imprevistos' }
  ];

  // Chart
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: {
      y: { beginAtZero: true }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartReady = signal(false);

  constructor() {
    effect(() => {
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      
      // Init dates for the month
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      
      // Update filter UI dates without triggering an infinite loop
      this.filterStartDate = start.toISOString().split('T')[0];
      this.filterEndDate = end.toISOString().split('T')[0];
      
      this.loadData();
    });
  }

  async loadData() {
    if (!this.filterStartDate || !this.filterEndDate) return;
    
    const start = new Date(this.filterStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.filterEndDate);
    end.setHours(23, 59, 59, 999);

    const gastos = await this.dataService.getGastosVariablesByDateRangeAndCategory(start, end, this.filterCategory);
    this.gastos.set(gastos.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));

    let imprevistos = await this.dataService.getImprevistosByDateRange(start, end);
    if (this.filterCategory !== 'todas') {
      imprevistos = imprevistos.filter(i => i.categoria === this.filterCategory);
    }
    this.imprevistos.set(imprevistos.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));

    // 12 Months Imprevistos KPI
    const imp12 = await this.dataService.getImprevistosLast12Months(this.stateService.currentYear(), this.stateService.currentMonth());
    this.imprevistos12Meses.set(imp12.reduce((acc, curr) => acc + curr.importe, 0));

    await this.updateChartData();
  }

  async updateChartData() {
    const year = this.stateService.currentYear();
    const month = this.stateService.currentMonth();
    
    // Get historical 6 months data
    const histGastos = await this.dataService.getGastosVariablesStats6Months(year, month);
    const currGastos = await this.dataService.getGastosVariablesByMonth(year, month);

    const categories = this.categoriasGasto.map(c => c.value);
    const labels = this.categoriasGasto.map(c => c.label);
    
    const currentMonthData = categories.map(cat => 
       currGastos.filter(g => g.categoria === cat).reduce((sum, g) => sum + g.importe, 0)
    );

    // Calculate 6 months avg (excluding current month if we want strict average of past, or include it)
    // We include it here (6 months total / 6)
    const avg6MonthsData = categories.map(cat => {
       const total = histGastos.filter(g => g.categoria === cat).reduce((sum, g) => sum + g.importe, 0);
       return total / 6;
    });

    this.barChartData = {
      labels: labels,
      datasets: [
        { data: avg6MonthsData, label: 'Media últimos 6 meses', backgroundColor: '#94a3b8', hoverBackgroundColor: '#64748b' },
        { data: currentMonthData, label: 'Mes Actual', backgroundColor: '#6366f1', hoverBackgroundColor: '#4f46e5' }
      ]
    };
    this.chartReady.set(true);
  }

  onFilterChange() {
    this.loadData();
  }

  // GASTOS MODAL
  openGastoModal(gasto?: GastoVariable) {
    if (gasto) {
      this.editingId = gasto.id || null;
      this.gastoForm = { ...gasto, fecha: new Date(gasto.fecha) };
    } else {
      this.editingId = null;
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      const now = new Date();
      const day = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : 1;
      this.gastoForm = { concepto: '', importe: 0, categoria: 'dietas', fecha: new Date(year, month, day), recurrente: false };
    }
    this.isGastoModalOpen = true;
  }

  async saveGasto(form: NgForm) {
    if (form.invalid) return;
    const values = { ...this.gastoForm, fecha: new Date(this.gastoForm.fecha as any) } as GastoVariable;
    if (this.editingId) await this.dataService.updateGastoVariable(this.editingId, values);
    else await this.dataService.addGastoVariable(values);
    this.isGastoModalOpen = false;
    this.refreshAll();
  }

  async deleteGasto(id?: number) {
    if (id && confirm('¿Eliminar gasto variable?')) {
      await this.dataService.deleteGastoVariable(id);
      this.refreshAll();
    }
  }

  // IMPREVISTOS MODAL
  openImprevistoModal(imp?: Imprevisto) {
    if (imp) {
      this.editingId = imp.id || null;
      this.imprevistoForm = { ...imp, fecha: new Date(imp.fecha) };
    } else {
      this.editingId = null;
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      const now = new Date();
      const day = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : 1;
      this.imprevistoForm = { concepto: '', importe: 0, categoria: 'reparacion', fecha: new Date(year, month, day), notas: '' };
    }
    this.isImprevistoModalOpen = true;
  }

  async saveImprevisto(form: NgForm) {
    if (form.invalid) return;
    const values = { ...this.imprevistoForm, fecha: new Date(this.imprevistoForm.fecha as any) } as Imprevisto;
    if (this.editingId) await this.dataService.updateImprevisto(this.editingId, values);
    else await this.dataService.addImprevisto(values);
    this.isImprevistoModalOpen = false;
    this.refreshAll();
  }

  async deleteImprevisto(id?: number) {
    if (id && confirm('¿Eliminar imprevisto?')) {
      await this.dataService.deleteImprevisto(id);
      this.refreshAll();
    }
  }

  private refreshAll() {
    this.stateService.refreshSummary();
    this.loadData();
  }
}
