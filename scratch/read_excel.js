const fs = require('fs');
const xlsx = require('xlsx');

function run() {
  const file = 'Registro_Autonomo_2026.xlsx';
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    return;
  }
  const workbook = xlsx.readFile(file);
  const data = {};
  for (const sheet of workbook.SheetNames) {
    data[sheet] = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
  }
  fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2));
  console.log('Successfully wrote to excel_data.json');
}

run();
