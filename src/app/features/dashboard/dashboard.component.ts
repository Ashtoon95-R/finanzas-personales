import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { CardComponent } from '@shared/components/card/card.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, BaseChartDirective, CardComponent, BadgeComponent],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);
  router = inject(Router);

  viewMode = signal<'month' | 'year'>('year');

  // Totals for view
  totalIngresos = signal(0);
  totalGastosFijos = signal(0);
  totalGastosVariables = signal(0);
  totalImprevistos = signal(0);
  
  disponibleNeto = computed(() => 
    this.totalIngresos() - (this.totalGastosFijos() + this.totalGastosVariables() + this.totalImprevistos())
  );

  // Financial Health Indicator
  objetivoAhorro = signal(0); 
  saludPorcentaje = computed(() => {
    const disp = this.disponibleNeto();
    const obj = this.objetivoAhorro();
    if (obj === 0) return disp > 0 ? 100 : 0;
    const perc = (disp / obj) * 100;
    return perc > 100 ? 100 : (perc < 0 ? 0 : perc);
  });
  
  saludColor = computed(() => {
    const p = this.saludPorcentaje();
    if (p >= 100) return 'bg-emerald-500';
    if (p >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  });

  // Evolution Chart (Area/Line)
  public evoChartReady = signal(false);
  public evoChartType: ChartType = 'line';
  public evoChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public evoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 }, // Smooth curves
    },
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Distribution Chart (Donut)
  public donutChartReady = signal(false);
  public donutChartType: ChartType = 'doughnut';
  public donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public donutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'right' } }
  };

  constructor() {
    effect(() => {
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      const mode = this.viewMode();
      this.loadDashboardData(year, month, mode);
    });
  }

  toggleViewMode(mode: 'month' | 'year') {
    this.viewMode.set(mode);
  }

  async loadDashboardData(year: number, month: number, mode: 'month' | 'year') {
    // 1. Load 12 Months Evolution Chart
    const evoData = await this.dataService.getEvolucionAnual(year);
    this.evoChartData = {
      labels: evoData.map(d => d.mes),
      datasets: [
        { 
          data: evoData.map(d => d.ingresos), 
          label: 'Ingresos', 
          borderColor: '#10b981', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          fill: true 
        },
        { 
          data: evoData.map(d => d.gastos), 
          label: 'Gastos Totales', 
          borderColor: '#f43f5e', 
          backgroundColor: 'rgba(244, 63, 94, 0.1)', 
          fill: true 
        }
      ]
    };
    this.evoChartReady.set(true);

    // 2. Set Totals based on viewMode
    if (mode === 'year') {
      const sumIng = evoData.reduce((acc, d) => acc + d.ingresos, 0);
      const sumFijo = evoData.reduce((acc, d) => acc + d.fijos, 0);
      const sumVar = evoData.reduce((acc, d) => acc + d.variables, 0);
      const sumImp = evoData.reduce((acc, d) => acc + d.imprevistos, 0);
      this.totalIngresos.set(sumIng);
      this.totalGastosFijos.set(sumFijo);
      this.totalGastosVariables.set(sumVar);
      this.totalImprevistos.set(sumImp);
    } else {
      const mData = evoData[month];
      this.totalIngresos.set(mData?.ingresos || 0);
      this.totalGastosFijos.set(mData?.fijos || 0);
      this.totalGastosVariables.set(mData?.variables || 0);
      this.totalImprevistos.set(mData?.imprevistos || 0);
    }

    const ingresosNetos = this.totalIngresos() - this.totalGastosFijos();
    this.objetivoAhorro.set(ingresosNetos > 0 ? ingresosNetos * 0.2 : 0);

    // 3. Load Donut Chart (Distribution by Category)
    let fijos, variables, imprevistos;
    
    if (mode === 'year') {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      variables = await this.dataService['db'].gastosVariables.where('fecha').between(start, end, true, true).toArray();
      imprevistos = await this.dataService['db'].imprevistos.where('fecha').between(start, end, true, true).toArray();
      fijos = await this.dataService['db'].gastosFijos.where('activo').equals(1).toArray(); 
    } else {
      [fijos, variables, imprevistos] = await Promise.all([
        this.dataService.getGastosFijosActivosEnMes(year, month),
        this.dataService.getGastosVariablesByMonth(year, month),
        this.dataService.getImprevistosByDateRange(new Date(year, month, 1), new Date(year, month + 1, 0, 23, 59, 59))
      ]);
    }

    const categoryMap = new Map<string, number>();
    
    // Agrupar fijos
    fijos.forEach((g: any) => {
      const cat = g.categoria || 'Fijo Otros';
      // If annual view, multiply fixed cost by 12 (approximate)
      const multiplier = mode === 'year' ? 12 : 1;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (g.importe * multiplier));
    });
    // Agrupar variables
    variables.forEach((g: any) => {
      const cat = g.categoria || 'Variable Otros';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + g.importe);
    });
    // Imprevistos
    imprevistos.forEach((g: any) => {
      categoryMap.set('imprevistos', (categoryMap.get('imprevistos') || 0) + g.importe);
    });

    const labels = Array.from(categoryMap.keys());
    const data = Array.from(categoryMap.values());
    
    // Generar colores (simples para este demo)
    const bgColors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'
    ];

    this.donutChartData = {
      labels: labels,
      datasets: [
        { 
          data: data, 
          backgroundColor: bgColors.slice(0, labels.length) 
        }
      ]
    };
    this.donutChartReady.set(true);
  }

  navigateToAdd(type: 'ingreso' | 'gasto' | 'imprevisto') {
    if (type === 'ingreso') this.router.navigate(['/ingresos']);
    if (type === 'gasto') this.router.navigate(['/variables']);
    if (type === 'imprevisto') this.router.navigate(['/variables']);
  }
}


