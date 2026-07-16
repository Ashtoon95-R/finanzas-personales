const fs = require('fs');

const csv = fs.readFileSync('c:/Users/adria/.gemini/antigravity-ide/scratch/finanzas-personales/extractDocument_20260716.csv', 'utf8');
const lines = csv.split('\n').slice(1);

let bizumEnviado = 0;
let bizumVeces = 0;

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(';');
  if (parts.length < 3) continue;

  const concepto = parts[0].toUpperCase();
  const importeStr = parts[2]; 

  if (!importeStr.includes('-')) continue; 
  let importeNum = parseFloat(importeStr.replace('EUR', '').replace('.', '').replace(',', '.').trim());
  const absImporte = Math.abs(importeNum);

  if (concepto.includes('BIZUM ENVIADO') || concepto.includes('BIZUM A')) {
      bizumEnviado += absImporte;
      bizumVeces++;
  }
}

console.log(`TOTAL BIZUM ENVIADO (Últimos 12 meses): ${bizumEnviado.toFixed(2)}€ en ${bizumVeces} envíos.`);
console.log(`MEDIA MENSUAL EN BIZUM: ${(bizumEnviado / 12).toFixed(2)}€`);
