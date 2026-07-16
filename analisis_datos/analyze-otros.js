const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

const others = {};

const ocioAndFixedKeywords = [
  'MERCADONA', 'CONSUM', 'LIDL', 'ALDI', 'CARREFOUR', 'MASYMAS', 'CHARCUTERIA', 'FRUTERIA', 'PANADERIA',
  'PIZZERIA', 'GASTROBAR', 'STARBUCKS', 'BAR ', 'RESTAURANTE', 'CAFE', 'PUB', 'BURGER', 'MCDONALDS', 'KFC', 'GLOVO', 'JUST EAT', 'DELIVEROO', 'TEIKA', 'CHILL OUT', 'LIAOPASTEL', 'TAPAS', 'CERVECERIA', '100 MONTADITOS', 'SUSHI',
  'CINE', 'TEATRO', 'ZARA', 'PULL', 'BERSHKA', 'MANGO', 'DECATHLON', 'BAZAR', 'NORMAL', 'ARTICULOS DE REGA', 'AMAZON',
  'UBER', 'CABIFY', 'FREENOW', 'FGV', 'RENFE', 'ALSA', 'GASOLINERA', 'CEPSA', 'REPSOL', 'BP', 'GALP',
  'NETFLIX', 'SPOTIFY', 'GOOGLE', 'OPENAI', 'APPLE', 'AMZN',
  'SEGURO', 'MYBOX', 'AYUNTAMIENTO', 'ASES', 'PRESTAMO', 'HIPOTECA', 'LUZ', 'AGUA', 'TELEFONICA', 
  'VODAFONE', 'ORANGE', 'DIGI', 'AUTONOMO', 'SEG.SOCIAL', 'HACIENDA', 'AEAT',
  'TRASP', 'TRANSF', 'BIZUM', 'CAJERO'
];

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(';');
  if (parts.length < 3) continue;

  const concepto = parts[0].toUpperCase();
  const importeStr = parts[2]; 

  if (!importeStr.includes('-')) continue; 
  let importeNum = parseFloat(importeStr.replace('EUR', '').replace('.', '').replace(',', '.').trim());
  const absImporte = Math.abs(importeNum);

  if (ocioAndFixedKeywords.some(k => concepto.includes(k))) continue;

  if (absImporte < 100) {
      const cleanConcepto = concepto.substring(0, 15).trim(); // agrupar por los primeros 15 chars
      if (!others[cleanConcepto]) others[cleanConcepto] = { count: 0, total: 0 };
      others[cleanConcepto].count++;
      others[cleanConcepto].total += absImporte;
  }
}

const sorted = Object.entries(others).sort((a, b) => b[1].total - a[1].total).slice(0, 15);
console.log("TOP GASTOS 'PEQUEÑOS' NO CLASIFICADOS:");
for (const [concepto, data] of sorted) {
    console.log(`${concepto.padEnd(20)} | Veces: ${String(data.count).padEnd(3)} | Total: ${data.total.toFixed(2)}€`);
}
