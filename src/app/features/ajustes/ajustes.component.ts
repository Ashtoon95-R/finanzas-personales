import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { BackupService } from '../../core/services/backup.service';
import { StateService } from '../../core/services/state.service';
import { ConfiguracionUsuario } from '../../core/models/configuracion.model';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './ajustes.component.html',
  styles: []
})
export class AjustesComponent {
  dataService = inject(DataService);
  backupService = inject(BackupService);
  stateService = inject(StateService);

  config = signal<ConfiguracionUsuario>({
    id: 1,
    colchonSeguridad: 3,
    porcentajeAhorro: 20,
    sueldoAsignado: 0,
    reservaFiscalActiva: false,
    porcentajeImpuestos: 20,
    presupuestoVariableMensual: 300
  });

  saved = signal(false);

  // Backup state
  diasDesdeBackup = computed(() => {
    const ultimo = this.config().ultimoBackup;
    if (!ultimo) return -1;
    const diff = new Date().getTime() - new Date(ultimo).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  });

  alertaBackup = computed(() => {
    const dias = this.diasDesdeBackup();
    return dias === -1 || dias > 30;
  });

  constructor() {
    this.loadConfig();
  }

  async loadConfig() {
    const c = await this.dataService.getConfiguracion();
    if (c) this.config.set(c);
  }

  async saveConfig() {
    await this.dataService.updateConfiguracion(this.config());
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }

  // Backup functions
  async exportarDatos() {
    try {
      const jsonStr = await this.backupService.exportToJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `finanzas-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Actualizar ultimoBackup
      const newConfig = { ...this.config(), ultimoBackup: new Date().toISOString() };
      await this.dataService.updateConfiguracion(newConfig);
      this.config.set(newConfig);
      
      // Notify state service to update global badge if implemented
      this.stateService.refreshSummary();

    } catch (err) {
      console.error('Error al exportar', err);
      alert('Hubo un error al generar la copia de seguridad.');
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (confirm('ATENCIÓN: Importar una copia de seguridad sobrescribirá TODOS los datos actuales. Esta acción no se puede deshacer. ¿Estás seguro de continuar?')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          await this.backupService.importFromJSON(json);
          alert('Datos restaurados correctamente.');
          window.location.reload(); // Recargar para limpiar estados cacheados
        } catch (err: any) {
          alert('Error al importar: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset input
  }
}
