import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { Ingreso } from '@core/models/ingreso.model';
import { CardComponent } from '@shared/components/card/card.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { EditableTableComponent } from '@shared/components/editable-table/editable-table.component';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, CardComponent, BadgeComponent, ModalComponent, EditableTableComponent],
  templateUrl: './ingresos.component.html',
  styles: []
})
export class IngresosComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);

  ingresos = signal<Ingreso[]>([]);
  
  // Computed values for the top cards
  totalFijos = computed(() => 
    this.ingresos().filter(i => i.tipo === 'fijo').reduce((acc, curr) => acc + curr.importe, 0)
  );
  totalVariables = computed(() => 
    this.ingresos().filter(i => i.tipo === 'variable').reduce((acc, curr) => acc + curr.importe, 0)
  );
  total = computed(() => this.totalFijos() + this.totalVariables());

  isModalOpen = false;
  editingId: number | null = null;
  
  // Form model
  formData: Partial<Ingreso> = {
    concepto: '',
    importe: 0,
    tipo: 'variable',
    recurrente: false,
    frecuencia: 'unico',
    estado: 'pendiente',
    fecha: new Date()
  };

  tableColumns = [
    { key: 'fecha', label: 'Fecha', template: true },
    { key: 'concepto', label: 'Concepto' },
    { key: 'tipo', label: 'Tipo', template: true },
    { key: 'importe', label: 'Importe', template: true },
    { key: 'estado', label: 'Estado', template: true }
  ];

  constructor() {
    effect(() => {
      // Re-fetch data when month/year changes
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      this.loadIngresos(year, month);
    });
  }

  async loadIngresos(year: number, month: number) {
    const data = await this.dataService.getIngresosByMonth(year, month);
    this.ingresos.set(data);
  }

  openModal(ingreso?: Ingreso) {
    if (ingreso) {
      this.editingId = ingreso.id || null;
      this.formData = { ...ingreso };
      // Keep dates in standard input format (YYYY-MM-DD)
      if (this.formData.fecha) {
         this.formData.fecha = new Date(this.formData.fecha);
      }
    } else {
      this.editingId = null;
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      const now = new Date();
      const day = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : 1;
      this.formData = {
        concepto: '',
        importe: 0,
        tipo: 'variable',
        recurrente: false,
        frecuencia: 'unico',
        estado: 'pendiente',
        fecha: new Date(year, month, day)
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveIngreso(form: NgForm) {
    if (form.invalid) return;

    // Convert fecha back to Date object if it's a string from the date input
    const formValues = { ...this.formData };
    if (typeof formValues.fecha === 'string') {
      formValues.fecha = new Date(formValues.fecha);
    }
    
    // Auto set frequency if recurrent is true and it wasn't selected
    if (formValues.recurrente && !formValues.frecuencia) {
        formValues.frecuencia = 'mensual';
    } else if (!formValues.recurrente) {
        formValues.frecuencia = 'unico';
    }

    if (this.editingId) {
      await this.dataService.updateIngreso(this.editingId, formValues as Ingreso);
    } else {
      await this.dataService.addIngreso(formValues as Ingreso);
    }

    this.closeModal();
    this.stateService.refreshSummary();
    const year = this.stateService.currentYear();
    const month = this.stateService.currentMonth();
    this.loadIngresos(year, month);
  }

  async deleteIngreso(ingreso: Ingreso) {
    if (!ingreso.id) return;
    if (confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      await this.dataService.deleteIngreso(ingreso.id);
      this.stateService.refreshSummary();
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      this.loadIngresos(year, month);
    }
  }

  async changeState(ingreso: Ingreso, newState: 'pendiente' | 'facturado' | 'cobrado') {
    if (!ingreso.id || (ingreso as any)._isProjected) {
        alert("No se puede editar el estado de un ingreso proyectado directamente. Edita el ingreso original.");
        return;
    }
    await this.dataService.updateIngreso(ingreso.id, { estado: newState });
    this.stateService.refreshSummary();
    this.loadIngresos(this.stateService.currentYear(), this.stateService.currentMonth());
  }
}
