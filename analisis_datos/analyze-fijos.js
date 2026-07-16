const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

const candidates = {};

// Skip obvious leisure/supermarket/travel that we already know
const ignoreKeywords = [
  'MERCADONA', 'CONSUM', 'LIDL', 'ALDI', 'CARREFOUR', 'MASYMAS',
  'PIZZERIA', 'GASTROBAR', 'STARBUCKS', 'BAR ', 'RESTAURANTE', 'CAFE', 'PUB', 'BURGER', 'MCDONALDS', 'KFC', 'GLOVO', 'JUST EAT', 'DELIVEROO', 'TEIKA', 'CHILL OUT', 'LIAOPASTEL', 'TAPAS', 'CERVECERIA', '100 MONTADITOS', 'SUSHI',
  'CINE', 'TEATRO', 'ZARA', 'PULL', 'BERSHKA', 'MANGO', 'DECATHLON', 'BAZAR', 'NORMAL', 'ARTICULOS DE REGA',
  'UBER', 'CABIFY', 'FREENOW', 'FGV', 'RENFE', 'ALSA', 'GASOLINERA', 'CEPSA', 'REPSOL', 'BP', 'GALP', 'BALLENOIL',
  'TRASP', 'TRANSF', 'BIZUM', 'CAJERO',
  'TALL S BARBER', 'LA TERRACITA', 'FOURVENUES', 'KLARNA' // Specific ones we know are ocio/personal
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

  if (ignoreKeywords.some(k => concepto.includes(k))) continue;

  // Group by exact concept to find recurring ones
  const cleanConcepto = concepto.substring(0, 20).trim();
  if (!candidates[cleanConcepto]) candidates[cleanConcepto] = { count: 0, total: 0, sampleAmt: 0 };
  
  candidates[cleanConcepto].count++;
  candidates[cleanConcepto].total += absImporte;
  candidates[cleanConcepto].sampleAmt = absImporte; // Take the last seen amount
}

console.log("--- POSIBLES GASTOS FIJOS / SUSCRIPCIONES PARA AÑADIR A LA APP ---");
console.log("Concepto                 | Veces/Año | Estimado Mensual");
console.log("-".repeat(60));

const sorted = Object.entries(candidates)
    .filter(([_, data]) => data.count >= 2 || ['OPENAI', 'GOOGLE', 'NETFLIX', 'PRIME', 'APPLE', 'SPOTIFY'].some(k => _ .includes(k)))
    .sort((a, b) => b[1].count - a[1].count);

for (const [concepto, data] of sorted) {
    let monthlyCost = 0;
    let freq = "";
    if (data.count >= 10) {
        monthlyCost = data.total / 12; // Monthly subscription
        freq = "Mensual";
    } else if (data.count > 1 && data.count < 10) {
        monthlyCost = data.total / 12; // Irregular or quarterly, average to monthly
        freq = "Irregular/Trimestral";
    } else {
        monthlyCost = data.sampleAmt / 12; // Yearly sub seen once
        freq = "Anual";
    }
    
    // Only show if it's less than 300 to filter out big random taxes/purchases, unless it's explicitly a sub
    if (monthlyCost < 100 || ['OPENAI', 'GOOGLE'].some(k => concepto.includes(k))) {
        console.log(`${concepto.padEnd(24)} | ${String(data.count).padEnd(9)} | ~${monthlyCost.toFixed(2)}€/mes (${freq})`);
    }
}
