const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

let totalOcio = 0;
let ocioTransactions = 0;

const ocioKeywords = [
  'PIZZERIA', 'GASTROBAR', 'STARBUCKS', 'MERCADONA', 'CONSUM', 'LIDL', 'BAR ', 'RESTAURANTE', 
  'CAFE', 'PUB', 'BURGER', 'MCDONALDS', 'KFC', 'UBER', 'CABIFY', 'FREENOW', 'CINE', 'TEATRO', 
  'GLOVO', 'JUST EAT', 'DELIVEROO', 'AMAZON', 'ZARA', 'PULL', 'BERSHKA', 'MANGO', 'DECATHLON',
  'BAZAR', 'NORMAL', 'TEIKA', 'CHILL OUT', 'LIAOPASTEL', 'TALLER', 'GASOLINERA', 'CEPSA', 'REPSOL'
];

const fixedOrBusinessKeywords = [
  'SEGURO', 'MYBOX', 'AYUNTAMIENTO', 'ASES', 'PRESTAMO', 'HIPOTECA', 'LUZ', 'AGUA', 'TELEFONICA', 
  'VODAFONE', 'ORANGE', 'DIGI', 'AUTONOMO', 'SEG.SOCIAL', 'HACIENDA', 'AEAT'
];

let firstDate = null;
let lastDate = null;
let allOcio = [];

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(';');
  if (parts.length < 3) continue;

  const concepto = parts[0].toUpperCase();
  const fechaStr = parts[1]; // DD/MM/YYYY
  const importeStr = parts[2]; // -9,00EUR

  if (!importeStr.includes('-')) continue; // Solo gastos

  let importeNum = parseFloat(importeStr.replace('EUR', '').replace('.', '').replace(',', '.').trim());
  
  // Track dates
  const [d, m, y] = fechaStr.split('/');
  const date = new Date(`${y}-${m}-${d}`);
  if (!firstDate || date < firstDate) firstDate = date;
  if (!lastDate || date > lastDate) lastDate = date;

  // Ignore transfers and bizum for now as they are ambiguous
  if (concepto.includes('TRASP') || concepto.includes('TRANSF') || concepto.includes('BIZUM') || concepto.includes('CAJERO')) continue;
  if (fixedOrBusinessKeywords.some(k => concepto.includes(k))) continue;

  // Is it likely ocio/variable?
  if (ocioKeywords.some(k => concepto.includes(k)) || Math.abs(importeNum) < 100) {
      totalOcio += Math.abs(importeNum);
      ocioTransactions++;
      allOcio.push({ concepto, importe: Math.abs(importeNum), fechaStr });
  }
}

const msDiff = lastDate - firstDate;
const daysDiff = msDiff / (1000 * 60 * 60 * 24) || 1;
const monthsDiff = Math.max(1, daysDiff / 30.44);

const monthlyAverage = totalOcio / monthsDiff;

console.log(`--- ANALISIS DE GASTOS VARIABLES/OCIO ---`);
console.log(`Periodo analizado: ${monthsDiff.toFixed(1)} meses`);
console.log(`Total de transacciones de Ocio/Variables detectadas: ${ocioTransactions}`);
console.log(`Total gastado en el periodo: ${totalOcio.toFixed(2)}€`);
console.log(`MEDIA MENSUAL ESTIMADA: ${monthlyAverage.toFixed(2)}€`);
