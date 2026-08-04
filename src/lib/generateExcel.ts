import * as XLSX from 'xlsx';

export function generateClientExcel(data: any[], headers: string[], filename: string = 'shipments_export.xlsx') {
  if (!data || data.length === 0) return;

  // Format array arrays into an array of objects mapping header -> value
  // The backend currently returns data as an array of string arrays, and a headers array.
  const formattedData = data.map((rowArray) => {
    const rowObj: any = {};
    headers.forEach((header, index) => {
      rowObj[header] = rowArray[index] || 'N/A';
    });
    return rowObj;
  });

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments Data');

  // Trigger instant browser download
  XLSX.writeFile(workbook, filename);
}
