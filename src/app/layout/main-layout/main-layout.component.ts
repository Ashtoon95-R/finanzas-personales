import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { HeaderComponent } from '@layout/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <!-- Overlay for mobile sidebar -->
      <div 
        *ngIf="sidebarOpen()"
        class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        (click)="toggleSidebar()">
      </div>

      <!-- Sidebar -->
      <app-sidebar 
        class="fixed inset-y-0 left-0 z-30 w-64 transform transition duration-300 ease-in-out lg:relative lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
        (closeSidebar)="sidebarOpen.set(false)">
      </app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-header (toggleSidebar)="toggleSidebar()"></app-header>
        
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
          <div class="container mx-auto max-w-7xl">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update(val => !val);
  }
}


