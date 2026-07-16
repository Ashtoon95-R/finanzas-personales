const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

const ignoreKeywords = [
  'MERCADONA', 'CONSUM', 'LIDL', 'ALDI', 'CARREFOUR', 'MASYMAS',
  'PIZZERIA', 'GASTROBAR', 'STARBUCKS', 'BAR ', 'RESTAURANTE', 'CAFE', 'PUB', 'BURGER', 'MCDONALDS', 'KFC', 'GLOVO', 'JUST EAT', 'DELIVEROO', 'TEIKA', 'CHILL OUT', 'LIAOPASTEL', 'TAPAS', 'CERVECERIA', '100 MONTADITOS', 'SUSHI',
  'CINE', 'TEATRO', 'ZARA', 'PULL', 'BERSHKA', 'MANGO', 'DECATHLON', 'BAZAR', 'NORMAL', 'ARTICULOS DE REGA',
  'UBER', 'CABIFY', 'FREENOW', 'FGV', 'RENFE', 'ALSA', 'GASOLINERA', 'CEPSA', 'REPSOL', 'BP', 'GALP', 'BALLENOIL',
  'TRASP', 'TRANSF', 'BIZUM', 'CAJERO',
  'TALL S BARBER', 'LA TERRACITA', 'FOURVENUES', 'KLARNA', 'MES QUE DOLC', 'HORNO'
];

// Target dates: Jan 16 2026 to Jul 16 2026
const cutoffDate = new Date('2026-01-16');

const candidates = {};

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(';');
  if (parts.length < 3) continue;

  const concepto = parts[0].toUpperCase();
  const fechaStr = parts[1]; // DD/MM/YYYY
  const importeStr = parts[2]; 

  if (!importeStr.includes('-')) continue; 
  let importeNum = parseFloat(importeStr.replace('EUR', '').replace('.', '').replace(',', '.').trim());
  const absImporte = Math.abs(importeNum);

  // Check date
  const [d, m, y] = fechaStr.split('/');
  const date = new Date(`${y}-${m}-${d}`);
  if (date < cutoffDate) continue;

  if (ignoreKeywords.some(k => concepto.includes(k))) continue;

  // Clean concept slightly
  let cleanConcepto = concepto.substring(0, 18).trim();
  // Special grouping for cursor usage
  if (cleanConcepto.includes('CURSOR USAGE') || cleanConcepto.includes('CURSOR, AI')) {
      cleanConcepto = 'CURSOR AI';
  } else if (cleanConcepto.includes('GOOGLE ONE')) {
      cleanConcepto = 'GOOGLE ONE';
  } else if (cleanConcepto.includes('GOOGLE ADS')) {
      cleanConcepto = 'GOOGLE ADS';
  } else if (cleanConcepto.includes('PAYPAL *SPOTIFY')) {
      cleanConcepto = 'SPOTIFY';
  } else if (cleanConcepto.includes('BUSINESS PRIME')) {
      cleanConcepto = 'AMAZON BUSINESS PRIME';
  }

  if (!candidates[cleanConcepto]) {
      candidates[cleanConcepto] = { count: 0, amounts: [], lastDate: date };
  }
  
  candidates[cleanConcepto].count++;
  candidates[cleanConcepto].amounts.push(absImporte);
  if (date > candidates[cleanConcepto].lastDate) {
      candidates[cleanConcepto].lastDate = date;
  }
}

console.log("--- GASTOS FIJOS REALES DE LOS ÚLTIMOS 6 MESES (Ene-Jul 2026) ---");
console.log("Filtro: Gastos que se repiten recurrentemente en este periodo (4-6 veces) o que son claros recibos.");
console.log("-".repeat(80));

const sorted = Object.entries(candidates)
    .filter(([_, data]) => data.count >= 3 || ['OPENAI', 'GOOGLE', 'NETFLIX', 'PRIME', 'APPLE', 'SPOTIFY', 'CURSOR'].some(k => _ .includes(k)))
    .sort((a, b) => b[1].count - a[1].count);

for (const [concepto, data] of sorted) {
    const avg = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
    // Format amounts
    const lastAmt = data.amounts[0]; // Assuming array is chronological or we just take the first pushed which is usually latest if reading top down
    
    console.log(`${concepto.padEnd(25)} | Veces: ${String(data.count).padEnd(2)} | Importe medio: ~${avg.toFixed(2)}€/mes`);
}
