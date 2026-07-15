import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editable-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-fintech-border shadow-sm">
      <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
        <thead class="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-fintech-card/80 dark:text-slate-400 border-b border-slate-200 dark:border-fintech-border">
          <tr>
            <th *ngFor="let col of columns" class="px-6 py-4 font-semibold tracking-wider">
              {{ col.label }}
            </th>
            <th *ngIf="actions" class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data" class="bg-white dark:bg-fintech-card border-b dark:border-fintech-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <td *ngFor="let col of columns" class="px-6 py-4 whitespace-nowrap">
              <ng-container *ngIf="!col.template">
                {{ row[col.key] }}
              </ng-container>
              <!-- We can use content projection or just handle it outside for now -->
              <ng-container *ngIf="col.template">
                <!-- Fallback to plain text if no template mechanism implemented in simple version -->
                {{ row[col.key] }}
              </ng-container>
            </td>
            <td *ngIf="actions" class="px-6 py-4 text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              <button (click)="onEdit(row)" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3 font-medium">
                Editar
              </button>
              <button (click)="onDelete(row)" class="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 font-medium">
                Eliminar
              </button>
            </td>
          </tr>
          <tr *ngIf="data.length === 0">
            <td [attr.colspan]="columns.length + (actions ? 1 : 0)" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No hay datos disponibles para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: []
})
export class EditableTableComponent {
  @Input() data: any[] = [];
  @Input() columns: { key: string, label: string, template?: boolean }[] = [];
  @Input() actions = true;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }
}


