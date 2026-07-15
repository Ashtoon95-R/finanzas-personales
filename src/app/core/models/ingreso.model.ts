export interface Ingreso {
  id?: number;
  concepto: string;
  tipo: 'fijo' | 'variable';
  importe: number;
  fecha: Date;
  recurrente: boolean;
  frecuencia: 'mensual' | 'unico';
  notas?: string;
  estado?: 'pendiente' | 'facturado' | 'cobrado';
  fechaCobro?: Date;
  _isProjected?: boolean;
}
