// Global state
let workbook = null;
let currentSheetIndex = null;
let history = JSON.parse(localStorage.getItem('excelSplitterHistory')) || [];

// DOM elements
const openFileBtn = document.getElementById('open-file-btn');
const fileInput = document.getElementById('file-input');
const sheetsGrid = document.getElementById('sheets-grid');
const tableView = document.getElementById('table-view');
const dataTable = document.getElementById('data-table');
const backToSheetsBtn = document.getElementById('back-to-sheets');
const saveBtn = document.getElementById('save-btn');
const exportFormat = document.getElementById('export-format');
const historyList = document.getElementById('history-list');
const resetHistoryBtn = document.getElementById('reset-history-btn');
const resetAllBtn = document.getElementById('reset-all-btn');


// Helper function to download file
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners

resetAllBtn.addEventListener('click', () => {
  // Clear workbook state
  workbook = null;
  currentSheetIndex = null;

  // Clear UI
  sheetsGrid.innerHTML = '';
  dataTable.innerHTML = '<thead></thead><tbody></tbody>';
  tableView.classList.add('hidden');

  // Clear file input
  fileInput.value = '';

  // Optional: show a placeholder message
  sheetsGrid.innerHTML = '<p> - </p>';
});

openFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
backToSheetsBtn.addEventListener('click', () => showSheets());
saveBtn.addEventListener('click', exportSheets);

resetHistoryBtn.addEventListener('click', () => {
  history = [];
  localStorage.removeItem('excelSplitterHistory');
  renderHistory();
});

// Load history
renderHistory();

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    workbook = XLSX.read(e.target.result, { type: 'array' });
    currentSheetIndex = null;
    showSheets();
    addToHistory(file.name);
  };
  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

// Show sheets as tiles
function showSheets() {
  tableView.classList.add('hidden');
  sheetsGrid.innerHTML = '';

  workbook.SheetNames.forEach((sheetName, index) => {
    const tile = document.createElement('div');
    tile.className = 'sheet-tile';
    tile.innerHTML = `
      <h3>${sheetName}</h3>
      <div class="preview">${getSheetPreview(sheetName)}</div>
    `;
    tile.addEventListener('click', () => showSheetData(index));
    sheetsGrid.appendChild(tile);
  });
}

// Get preview of sheet data
function getSheetPreview(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (json.length === 0) return 'No data';
  return json.slice(0, 3).map(row => row.slice(0, 3).join(', ')).join('<br>');
}

// Show sheet data in table view
function showSheetData(index) {
  currentSheetIndex = index;
  const sheetName = workbook.SheetNames[index];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Clear table
  dataTable.innerHTML = '<thead></thead><tbody></tbody>';

  // Add headers
  if (json.length > 0) {
    const headerRow = document.createElement('tr');
    json[0].forEach(cell => {
      const th = document.createElement('th');
      th.textContent = cell;
      headerRow.appendChild(th);
    });
    dataTable.querySelector('thead').appendChild(headerRow);
  }

  // Add data rows
  for (let i = 1; i < json.length; i++) {
    const row = document.createElement('tr');
    json[i].forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      row.appendChild(td);
    });
    dataTable.querySelector('tbody').appendChild(row);
  }

  // Show table view
  tableView.classList.remove('hidden');
}

// Export all sheets
function exportSheets() {
  if (!workbook) return;

  const format = exportFormat.value;
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (format === 'xlsx') {
      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.aoa_to_sheet(json);
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
      const excelBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
      downloadFile(excelBuffer, `${sheetName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
    else if (format === 'csv') {
      const newSheet = XLSX.utils.aoa_to_sheet(json);
      const csv = XLSX.utils.sheet_to_csv(newSheet);
      downloadFile(csv, `${sheetName}.csv`, 'text/csv');
    }
    else if (format === 'json') {
      const newSheet = XLSX.utils.aoa_to_sheet(json);
      const jsonData = XLSX.utils.sheet_to_json(newSheet);
      downloadFile(JSON.stringify(jsonData, null, 2), `${sheetName}.json`, 'application/json');
    }
  });
}

// Add file to history
function addToHistory(filename) {
  const timestamp = new Date().toISOString();
  history.unshift({ filename, timestamp });
  if (history.length > 10) history.pop();
  localStorage.setItem('excelSplitterHistory', JSON.stringify(history));
  renderHistory();
}

// Render history
function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.filename} (${new Date(item.timestamp).toLocaleString()})`;
    historyList.appendChild(li);
  });
}