import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { DatabaseService } from './database.service';

describe('DataService', () => {
  let service: DataService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [DataService, DatabaseService]
    });
    service = TestBed.inject(DataService);
    dbService = TestBed.inject(DatabaseService);
    
    // Clear all tables before each test
    await dbService.ingresos.clear();
    await dbService.gastosFijos.clear();
    await dbService.gastosVariables.clear();
    await dbService.imprevistos.clear();
    await dbService.configuracion.clear();
  });

  afterAll(async () => {
    if (dbService) {
      await dbService.delete();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add and retrieve un ingreso', async () => {
    const newIngreso = {
      concepto: 'Nómina',
      tipo: 'fijo' as const,
      importe: 2000,
      fecha: new Date(),
      recurrente: true,
      frecuencia: 'mensual' as const
    };

    const id = await service.addIngreso(newIngreso);
    expect(id).toBeDefined();

    const ingresos = await service.getIngresos();
    expect(ingresos.length).toBe(1);
    expect(ingresos[0].concepto).toBe('Nómina');
  });

  it('should retrieve ingresos by month', async () => {
    const febDate = new Date(2026, 1, 15); // February 15, 2026
    const marchDate = new Date(2026, 2, 10); // March 10, 2026

    await service.addIngreso({
      concepto: 'Ingreso Feb',
      tipo: 'variable',
      importe: 500,
      fecha: febDate,
      recurrente: false,
      frecuencia: 'unico'
    });

    await service.addIngreso({
      concepto: 'Ingreso Mar',
      tipo: 'variable',
      importe: 300,
      fecha: marchDate,
      recurrente: false,
      frecuencia: 'unico'
    });

    const febIngresos = await service.getIngresosByMonth(2026, 1);
    expect(febIngresos.length).toBe(1);
    expect(febIngresos[0].concepto).toBe('Ingreso Feb');
  });
});
