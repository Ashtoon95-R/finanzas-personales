export interface Deuda {
  id?: number;
  concepto: string;
  importePendiente: number;
  tipoInteres: number; // porcentaje anual, ej: 4.5
  fechaRegistro?: Date | string;
}


