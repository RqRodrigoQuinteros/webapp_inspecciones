const MODELO_DOC_ID = 'TU_MODELO_DOC_ID_AQUI'; // Reemplaza con el ID del template Google Docs
const CARPETA_ACTAS = 'TU_CARPETA_ACTAS_ID_AQUI'; // Reemplaza con el ID de la carpeta Drive

function doGet(e) {
  // Manejar GET requests
  const action = e.parameter.action;
  switch (action) {
    case 'login':
      return login(e.parameter.dni);
    case 'getInspections':
      return getInspections(e.parameter.inspector);
    case 'getInspection':
      return getInspection(e.parameter.id);
    default:
      return ContentService.createTextOutput('Acción no válida').setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
  // Manejar POST requests
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  switch (action) {
    case 'saveInspection':
      return saveInspection(data);
    case 'generateActa':
      return generateActa(data);
    default:
      return ContentService.createTextOutput('Acción no válida').setMimeType(ContentService.MimeType.TEXT);
  }
}

function login(dni) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dni_ins');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == dni) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, name: data[i][0] })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
}

function getInspections(inspector) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('INSPECCIONES');
  const data = sheet.getDataRange().getValues();
  const inspections = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] == inspector) {
      inspections.push({
        id: data[i][0],
        created_at: data[i][1],
        updated_at: data[i][2],
        establecimiento: data[i][4],
        localidad: data[i][5],
        tipologia: data[i][6],
        nro_expediente: data[i][7],
        estado: data[i][8],
        doc_id: data[i][9],
        doc_url: data[i][10]
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(inspections)).setMimeType(ContentService.MimeType.JSON);
}

function getInspection(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('INSPECCIONES');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      return ContentService.createTextOutput(JSON.stringify({
        id: data[i][0],
        created_at: data[i][1],
        updated_at: data[i][2],
        inspector: data[i][3],
        establecimiento: data[i][4],
        localidad: data[i][5],
        tipologia: data[i][6],
        nro_expediente: data[i][7],
        estado: data[i][8],
        doc_id: data[i][9],
        doc_url: data[i][10]
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
}

function saveInspection(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('INSPECCIONES');
  const id = Utilities.getUuid();
  sheet.appendRow([id, new Date(), new Date(), data.inspector, data.establecimiento, data.localidad, data.tipologia, data.nro_expediente, 'pendiente', '', '']);
  
  // Guardar form data
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FORM_DATA');
  for (const [key, value] of Object.entries(data.formData)) {
    formSheet.appendRow([id, key, value]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, id })).setMimeType(ContentService.MimeType.JSON);
}

function generateActa(data) {
  const template = DriveApp.getFileById(MODELO_DOC_ID);
  const folder = DriveApp.getFolderById(CARPETA_ACTAS);
  const doc = template.makeCopy(`Acta_${data.id}`, folder);
  const body = DocumentApp.openById(doc.getId()).getBody();
  
  // Reemplazar placeholders
  for (const [key, value] of Object.entries(data.replacements)) {
    body.replaceText(`[${key}]`, value);
  }
  
  // Limpiar placeholders vacíos
  body.replaceText(/\[.*?\]/g, '');
  
  // Insertar anexos condicionales
  // Lógica para anexos aquí
  
  doc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = doc.getUrl();
  
  // Actualizar sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('INSPECCIONES');
  const range = sheet.getDataRange();
  const values = range.getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      sheet.getRange(i+1, 9).setValue('completada');
      sheet.getRange(i+1, 10).setValue(doc.getId());
      sheet.getRange(i+1, 11).setValue(url);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, url })).setMimeType(ContentService.MimeType.JSON);
}