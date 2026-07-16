const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

const groups = {
  'Supermercados': { total: 0, keywords: ['MERCADONA', 'CONSUM', 'LIDL', 'ALDI', 'CARREFOUR', 'MASYMAS', 'CHARCUTERIA', 'FRUTERIA', 'PANADERIA'] },
  'Restaurantes y Bares': { total: 0, keywords: ['PIZZERIA', 'GASTROBAR', 'STARBUCKS', 'BAR ', 'RESTAURANTE', 'CAFE', 'PUB', 'BURGER', 'MCDONALDS', 'KFC', 'GLOVO', 'JUST EAT', 'DELIVEROO', 'TEIKA', 'CHILL OUT', 'LIAOPASTEL', 'TAPAS', 'CERVECERIA', '100 MONTADITOS', 'SUSHI'] },
  'Ocio y Compras': { total: 0, keywords: ['CINE', 'TEATRO', 'ZARA', 'PULL', 'BERSHKA', 'MANGO', 'DECATHLON', 'BAZAR', 'NORMAL', 'ARTICULOS DE REGA', 'AMAZON'] },
  'Transporte y Gasolina': { total: 0, keywords: ['UBER', 'CABIFY', 'FREENOW', 'FGV', 'RENFE', 'ALSA', 'GASOLINERA', 'CEPSA', 'REPSOL', 'BP', 'GALP'] },
  'Suscripciones Digitales': { total: 0, keywords: ['NETFLIX', 'SPOTIFY', 'GOOGLE', 'OPENAI', 'APPLE', 'AMZN'] },
  'Otros Gastos Pequeños (<100€ sin clasificar)': { total: 0, keywords: [] }
};

const fixedOrBusinessKeywords = [
  'SEGURO', 'MYBOX', 'AYUNTAMIENTO', 'ASES', 'PRESTAMO', 'HIPOTECA', 'LUZ', 'AGUA', 'TELEFONICA', 
  'VODAFONE', 'ORANGE', 'DIGI', 'AUTONOMO', 'SEG.SOCIAL', 'HACIENDA', 'AEAT'
];

let firstDate = null;
let lastDate = null;

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(';');
  if (parts.length < 3) continue;

  const concepto = parts[0].toUpperCase();
  const fechaStr = parts[1]; // DD/MM/YYYY
  const importeStr = parts[2]; // -9,00EUR

  if (!importeStr.includes('-')) continue; // Solo gastos

  let importeNum = parseFloat(importeStr.replace('EUR', '').replace('.', '').replace(',', '.').trim());
  const absImporte = Math.abs(importeNum);
  
  // Track dates
  const [d, m, y] = fechaStr.split('/');
  const date = new Date(`${y}-${m}-${d}`);
  if (!firstDate || date < firstDate) firstDate = date;
  if (!lastDate || date > lastDate) lastDate = date;

  // Ignorar transferencias y bizums
  if (concepto.includes('TRASP') || concepto.includes('TRANSF') || concepto.includes('BIZUM') || concepto.includes('CAJERO')) continue;
  if (fixedOrBusinessKeywords.some(k => concepto.includes(k))) continue;

  let classified = false;
  for (const [groupName, groupData] of Object.entries(groups)) {
    if (groupName !== 'Otros Gastos Pequeños (<100€ sin clasificar)' && groupData.keywords.some(k => concepto.includes(k))) {
      groupData.total += absImporte;
      classified = true;
      break;
    }
  }

  // Si no se ha clasificado, y es menor de 100 euros, va al cajón desastre
  if (!classified && absImporte < 100) {
    groups['Otros Gastos Pequeños (<100€ sin clasificar)'].total += absImporte;
  }
}

const msDiff = lastDate - firstDate;
const monthsDiff = Math.max(1, (msDiff / (1000 * 60 * 60 * 24)) / 30.44);

console.log(`--- DESGLOSE REAL DE GASTOS VARIABLES (ÚLTIMOS 12 MESES) ---`);
let total = 0;
for (const [groupName, groupData] of Object.entries(groups)) {
  const avgMonthly = groupData.total / monthsDiff;
  total += avgMonthly;
  console.log(`${groupName.padEnd(45)}: ${avgMonthly.toFixed(2)}€ / mes`);
}
console.log('-'.repeat(60));
console.log(`TOTAL MEDIA MENSUAL:                                 ${total.toFixed(2)}€ / mes`);
