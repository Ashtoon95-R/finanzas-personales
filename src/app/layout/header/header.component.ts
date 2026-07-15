import { Component, EventEmitter, Output, inject, computed } from '@angular/core';
import { StateService } from '@core/services/state.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { LUCIDE_ICONS } from '@shared/icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ...LUCIDE_ICONS],
  template: `
    <header class="bg-white dark:bg-fintech-card shadow-sm border-b border-slate-100 dark:border-fintech-border h-20 flex items-center justify-between px-4 lg:px-8">
      <div class="flex items-center">
        <button 
          class="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2 mr-3"
          (click)="onToggleSidebar()">
          <svg lucideMenu class="w-6 h-6"></svg>
        </button>
        
        <!-- Month/Year Selector -->
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-fintech-dark rounded-lg p-1 border border-slate-100 dark:border-fintech-border">
          <button (click)="prevMonth()" class="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-slate-700 transition-colors">
            <svg lucideChevronLeft class="w-5 h-5"></svg>
          </button>
          <span class="font-medium text-slate-800 dark:text-slate-100 min-w-[100px] text-center capitalize">
            {{ displayMonth() }} {{ state.currentYear() }}
          </span>
          <button (click)="nextMonth()" class="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-slate-700 transition-colors">
            <svg lucideChevronRight class="w-5 h-5"></svg>
          </button>
        </div>
      </div>
      
      <!-- Quick Summary -->
      <div class="hidden md:flex items-center gap-6">
        <div class="text-right">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Ingresos</p>
          <p class="text-emerald-600 dark:text-emerald-400 font-bold">{{ state.totalIngresos() | currency:'EUR' }}</p>
        </div>
        <div class="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div class="text-right">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Gastos</p>
          <p class="text-rose-600 dark:text-rose-400 font-bold">{{ state.totalGastos() | currency:'EUR' }}</p>
        </div>
        <div class="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div class="text-right">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Disponible</p>
          <p class="font-bold text-slate-800 dark:text-white" 
             [class.text-rose-600]="state.disponible() < 0" 
             [class.dark:text-rose-400]="state.disponible() < 0">
             {{ state.disponible() | currency:'EUR' }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center md:hidden">
         <p class="font-bold text-slate-800 dark:text-white text-lg">
             {{ state.disponible() | currency:'EUR' }}
         </p>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  state = inject(StateService);
  @Output() toggleSidebar = new EventEmitter<void>();

  displayMonth = computed(() => {
    const d = new Date();
    d.setMonth(this.state.currentMonth());
    return d.toLocaleString('es-ES', { month: 'long' });
  });

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  prevMonth() {
    let m = this.state.currentMonth() - 1;
    if (m < 0) {
      this.state.setYear(this.state.currentYear() - 1);
      this.state.setMonth(11);
    } else {
      this.state.setMonth(m);
    }
  }

  nextMonth() {
    let m = this.state.currentMonth() + 1;
    if (m > 11) {
      this.state.setYear(this.state.currentYear() + 1);
      this.state.setMonth(0);
    } else {
      this.state.setMonth(m);
    }
  }
}


