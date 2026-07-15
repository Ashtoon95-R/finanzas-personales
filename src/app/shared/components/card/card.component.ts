import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full h-full'
  },
  template: `
    <div class="bg-white dark:bg-fintech-card rounded-2xl shadow-soft border border-slate-100 dark:border-fintech-border p-5 lg:p-6 transition-all duration-300 hover:shadow-md h-full">
      <div class="flex items-center justify-between mb-4" *ngIf="title">
        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ title }}</h3>
        <ng-content select="[header-actions]"></ng-content>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class CardComponent {
  @Input() title?: string;
}
