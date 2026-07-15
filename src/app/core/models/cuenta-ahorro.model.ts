export interface CuentaAhorro {
  id?: number;
  nombre: string;
  entidad: string;
  saldo: number;
  interesAnual: number; // % TAE, p.ej. 2 para Trade Republic
  fechaRegistro?: Date | string;
}
