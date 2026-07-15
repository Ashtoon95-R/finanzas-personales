import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { LUCIDE_ICONS } from '@shared/icons';
import { DataService } from '@core/services/data.service';
import { StateService } from '@core/services/state.service';
import { GastoFijo } from '@core/models/gasto-fijo.model';
import { CardComponent } from '@shared/components/card/card.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, CardComponent, BadgeComponent, ModalComponent, ...LUCIDE_ICONS],
  templateUrl: './gastos.component.html',
  styles: []
})
export class GastosComponent {
  dataService = inject(DataService);
  stateService = inject(StateService);

  gastosFijos = signal<GastoFijo[]>([]);
  
  totalFijos = computed(() => 
    this.gastosFijos().reduce((acc, curr) => acc + curr.importe, 0)
  );

  activeSubscriptionsCount = computed(() => 
    this.gastosFijos().filter(g => g.activo).length
  );

  isModalOpen = false;
  editingId: number | null = null;
  
  formData: Partial<GastoFijo> = {
    concepto: '',
    importe: 0,
    diaCobro: 1,
    categoria: 'vivienda',
    activo: true
  };

  categorias = [
    { value: 'vivienda', label: 'Vivienda (Alquiler/Hipoteca)' },
    { value: 'oficina', label: 'Oficina / Coworking' },
    { value: 'suministros', label: 'Suministros (Luz, Internet)' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'cuota_autonomo', label: 'Cuota Autónomo / Impuestos' },
    { value: 'software', label: 'Software / Herramientas' },
    { value: 'ocio_suscripciones', label: 'Ocio (Suscripciones, Gym)' },
    { value: 'educacion', label: 'Educación / Cursos' },
    { value: 'otros', label: 'Otros' }
  ];

  constructor() {
    effect(() => {
      const year = this.stateService.currentYear();
      const month = this.stateService.currentMonth();
      this.loadGastos(year, month);
    });
  }

  async loadGastos(year: number, month: number) {
    // Only load the fixed expenses that are active for the currently viewed month
    let data = await this.dataService.getGastosFijosActivosEnMes(year, month);
    // Sort by diaCobro
    data = data.sort((a, b) => a.diaCobro - b.diaCobro);
    this.gastosFijos.set(data);
  }

  openModal(gasto?: GastoFijo) {
    if (gasto) {
      this.editingId = gasto.id || null;
      this.formData = { ...gasto };
    } else {
      this.editingId = null;
      this.formData = {
        concepto: '',
        importe: 0,
        diaCobro: 1,
        categoria: 'vivienda',
        activo: true
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveGasto(form: NgForm) {
    if (form.invalid) return;

    if (this.editingId) {
      // Si estamos editando, respetamos las fechas originales si no han cambiado,
      // pero si se desactiva, marcamos la fecha de desactivacion
      const existing = this.gastosFijos().find(g => g.id === this.editingId);
      let changes = { ...this.formData };
      
      if (existing?.activo && !this.formData.activo) {
        changes.fechaDesactivacion = new Date();
      } else if (!existing?.activo && this.formData.activo) {
        changes.fechaDesactivacion = undefined; // Se reactiva
      }
      
      await this.dataService.updateGastoFijo(this.editingId, changes as Partial<GastoFijo>);
    } else {
      // Nuevo gasto
      const newGasto: GastoFijo = {
        ...(this.formData as any),
        fechaRegistro: new Date()
      };
      await this.dataService.addGastoFijo(newGasto);
    }

    this.closeModal();
    this.refreshData();
  }

  async deactivateGasto(gasto: GastoFijo) {
    if (!gasto.id) return;
    if (confirm('¿Estás seguro de que quieres cancelar este gasto recurrente? Dejará de cobrarse en los meses futuros, pero se conservará en el histórico.')) {
      await this.dataService.updateGastoFijo(gasto.id, {
        activo: false,
        fechaDesactivacion: new Date()
      });
      this.refreshData();
    }
  }

  private refreshData() {
    this.stateService.refreshSummary();
    this.loadGastos(this.stateService.currentYear(), this.stateService.currentMonth());
  }
}


