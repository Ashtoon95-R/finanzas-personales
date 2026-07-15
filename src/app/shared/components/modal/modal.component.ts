import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS } from '@shared/icons';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ...LUCIDE_ICONS],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-0">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
        (click)="close()"></div>
      
      <!-- Modal Panel -->
      <div class="relative bg-white dark:bg-fintech-card rounded-2xl shadow-xl border border-slate-100 dark:border-fintech-border w-full max-w-md transform transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-fintech-border">
          <h3 id="modal-title" class="text-lg font-semibold text-slate-800 dark:text-white">{{ title }}</h3>
          <button 
            type="button"
            class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
            aria-label="Cerrar modal"
            (click)="close()">
            <svg lucideX class="w-5 h-5" aria-hidden="true"></svg>
          </button>
        </div>
        
        <!-- Body -->
        <div class="px-6 py-5">
          <ng-content></ng-content>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-fintech-border flex justify-end gap-3 rounded-b-2xl bg-slate-50 dark:bg-fintech-dark/50" *ngIf="showFooter">
          <ng-content select="[footer-actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Modal';
  @Input() showFooter = true;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
}


