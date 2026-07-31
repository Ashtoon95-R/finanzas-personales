export interface TransferenciaDia1Estado {
  hecho: boolean;
  importe: number;
  aColchon?: number;
}

export interface PlanDia1Mes {
  ocio?: TransferenciaDia1Estado;
  ahorro?: TransferenciaDia1Estado;
  excedente?: TransferenciaDia1Estado;
  combinado?: TransferenciaDia1Estado;
}

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
  saldoCuentaOperativa?: number; // saldo actual en la cuenta operativa (ej. Imagin)
  /** Estado de checkboxes del plan día 1, por mes (clave "YYYY-MM") */
  planDia1PorMes?: Record<string, PlanDia1Mes>;
}
