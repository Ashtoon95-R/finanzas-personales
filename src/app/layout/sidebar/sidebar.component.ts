import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LUCIDE_ICONS } from '@shared/icons';
import { StateService } from '@core/services/state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ...LUCIDE_ICONS],
  template: `
  <div class="h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col w-64 border-r border-gray-100 dark:border-gray-700">
      <!-- Logo area -->
      <div class="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
            $
          </div>
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
            Finanzas
          </span>
        </div>
        <button 
          class="ml-auto lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          (click)="onClose()">
          <svg lucideX class="w-5 h-5"></svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" 
             routerLinkActive="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
             [routerLinkActiveOptions]="{exact: false}"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 group"
             (click)="onClose()">
            <div class="flex items-center gap-3">
              @switch (item.icon) {
                @case ('layout-dashboard') {
                  <svg lucideLayoutDashboard class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
                @case ('circle-dollar-sign') {
                  <svg lucideCircleDollarSign class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
                @case ('shopping-cart') {
                  <svg lucideShoppingCart class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
                @case ('clock') {
                  <svg lucideClock class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
                @case ('landmark') {
                  <svg lucideLandmark class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
                @case ('settings') {
                  <svg lucideSettings class="w-[18px] h-[18px] opacity-75 group-hover:opacity-100 transition-opacity"></svg>
                }
              }
              {{ item.label }}
            </div>
            
            <div *ngIf="item.path === '/ajustes' && stateService.necesitaBackup()" class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" title="Backup necesario"></div>
          </a>
        }
      </nav>
      
      <!-- Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
            AD
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Autónomo</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SidebarComponent {
  stateService = inject(StateService);
  @Output() closeSidebar = new EventEmitter<void>();

  navItems = [
    { path: '/dashboard',         label: 'Dashboard',           icon: 'layout-dashboard' },
    { path: '/ingresos',          label: 'Ingresos',            icon: 'circle-dollar-sign' },
    { path: '/gastos',            label: 'Gastos Fijos',        icon: 'shopping-cart' },
    { path: '/variables',         label: 'Variables e Imprev.', icon: 'clock' },
    { path: '/ahorro-inversion',  label: 'Ahorros',             icon: 'landmark' },
    { path: '/ajustes',           label: 'Ajustes',             icon: 'settings' },
  ];

  onClose() {
    this.closeSidebar.emit();
  }
}


