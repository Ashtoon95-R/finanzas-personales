const fs = require('fs');

function monthToDate(mesStr) {
  const map = {
    'Enero': '01',
    'Febrero': '02',
    'Marzo': '03',
    'Abril': '04',
    'Mayo': '05',
    'Junio': '06',
    'Julio': '07',
    'Agosto': '08',
    'Septiembre': '09',
    'Octubre': '10',
    'Noviembre': '11',
    'Diciembre': '12'
  };
  const monthStr = map[mesStr] || '01';
  return `2026-${monthStr}-20T10:00:00.000Z`;
}

function run() {
  const backupStr = fs.readFileSync('finanzas-backup-2026-07-16.json', 'utf8');
  const backup = JSON.parse(backupStr);

  const excelStr = fs.readFileSync('excel_data.json', 'utf8');
  const excelData = JSON.parse(excelStr);

  const registros = excelData.Registro_Horas || [];
  
  let currentId = 1;
  if (backup.ingresos && backup.ingresos.length > 0) {
    currentId = Math.max(...backup.ingresos.map(i => i.id || 0)) + 1;
  }

  const nuevosIngresos = registros.map(row => {
    return {
      id: currentId++,
      concepto: row.Cliente,
      tipo: 'variable',
      importe: row.Total,
      fecha: monthToDate(row.Mes),
      recurrente: false,
      frecuencia: 'unico',
      notas: row.Comentarios || '',
      estado: row.Pagado ? 'cobrado' : 'facturado'
    };
  });

  backup.ingresos = [...(backup.ingresos || []), ...nuevosIngresos];

  fs.writeFileSync('finanzas-backup-combinado.json', JSON.stringify(backup, null, 2));
  console.log(`Añadidos ${nuevosIngresos.length} ingresos. Archivo 'finanzas-backup-combinado.json' generado.`);
}

run();
