import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(c => c.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent) 
      },
      { 
        path: 'ingresos', 
        loadComponent: () => import('./features/ingresos/ingresos.component').then(c => c.IngresosComponent) 
      },
      { 
        path: 'gastos', 
        loadComponent: () => import('./features/gastos/gastos.component').then(c => c.GastosComponent) 
      },
      { 
        path: 'ahorro-inversion', 
        loadComponent: () => import('./features/ahorro-inversion/ahorro-inversion.component').then(c => c.AhorroInversionComponent) 
      },
      { 
        path: 'ajustes', 
        loadComponent: () => import('./features/ajustes/ajustes.component').then(c => c.AjustesComponent) 
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
