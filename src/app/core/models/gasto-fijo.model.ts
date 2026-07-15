export interface GastoFijo {
  id?: number;
  concepto: string; // ej. "Hipoteca piso", "Alquiler oficina"
  importe: number;
  diaCobro: number; // 1-31
  categoria: 'vivienda' | 'oficina' | 'suministros' | 'seguros' | 'otros' | string;
  activo: boolean;
  fechaRegistro: Date;
  fechaDesactivacion?: Date;
}
