const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

const cutoffDate = new Date('2026-01-16');
const targets = ['CURSOR', 'DONDOMINIO', 'GOOGLE ONE', 'OPENAI', 'APPLE.COM/BILL', 'PAYPAL *ITUNESAPP', 'AQUANET'];
const latestCharges = {};

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

  const [d, m, y] = fechaStr.split('/');
  const date = new Date(`${y}-${m}-${d}`);
  
  if (date < cutoffDate) continue;

  let targetMatch = targets.find(t => concepto.includes(t));
  if (targetMatch) {
      if (targetMatch === 'PAYPAL *ITUNESAPP') targetMatch = 'APPLE/ITUNES (Paypal)';
      if (targetMatch === 'APPLE.COM/BILL') targetMatch = 'APPLE.COM/BILL';

      if (!latestCharges[targetMatch] || date > latestCharges[targetMatch].date) {
          latestCharges[targetMatch] = { amount: absImporte, date: date, fullConcept: concepto };
      }
  }
}

console.log("--- ÚLTIMO IMPORTE EXACTO COBRADO ---");
for (const [key, data] of Object.entries(latestCharges)) {
    console.log(`${key.padEnd(25)} | Último cobro: ${data.amount.toFixed(2)}€  (Concepto real: ${data.fullConcept})`);
}
