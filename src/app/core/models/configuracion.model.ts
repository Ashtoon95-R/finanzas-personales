export interface ConfiguracionUsuario {
  id?: number; // Usually just 1 record, so id = 1
  colchonSeguridad: number; // meses de gastos fijos
  porcentajeAhorro: number; // % de ahorro objetivo mensual
  sueldoAsignado: number; // sueldo actual asignado
  reservaFiscalActiva: boolean; // si calcula impuestos
  porcentajeImpuestos: number; // % para IVA/IRPF
  presupuestoVariableMensual?: number; // presupuesto estimado para ocio, regalos y variables
  ultimoBackup?: string; // ISO date string
  colchonActual?: number; // saldo líquido acumulado actual en el colchón de seguridad
}
