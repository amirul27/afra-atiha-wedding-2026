/**
 * Setup.gs — run ONCE to provision the backend.
 * ---------------------------------------------------------------------------
 * 1. In the Apps Script editor choose `setup` from the function dropdown and
 *    click Run. Authorise the requested Sheets + Drive scopes.
 * 2. Copy the API token printed in the execution log into your front-end .env
 *    file as VITE_API_TOKEN.
 * 3. Deploy:  Deploy ▸ New deployment ▸ Web app
 *      - Execute as:  Me
 *      - Who has access:  Anyone
 *    Copy the Web app URL into .env as VITE_API_URL.
 *
 * Re-running `setup` is safe: it reuses the existing spreadsheet/folder and
 * only adds missing sheets or header rows.
 * ---------------------------------------------------------------------------
 */

// Column order MUST match the field names in src/types/index.ts exactly.
var SCHEMA = {
  tasks: ['id', 'title', 'notes', 'event', 'status', 'priority', 'assignee', 'dueDate', 'createdAt'],
  guests: ['id', 'name', 'phone', 'email', 'side', 'event', 'rsvp', 'partySize', 'tableNo', 'notes', 'invitationSent'],
  budget: ['id', 'category', 'item', 'event', 'estimated', 'actual', 'paid', 'vendor', 'notes'],
  vendors: ['id', 'name', 'category', 'event', 'contactName', 'phone', 'email', 'status', 'cost', 'deposit', 'notes'],
  shopping: ['id', 'item', 'category', 'event', 'forWhom', 'status', 'price', 'store', 'link', 'notes'],
  documents: ['id', 'name', 'category', 'event', 'fileUrl', 'fileId', 'mimeType', 'uploadedAt', 'notes']
};

// Numeric and boolean fields are coerced on read so the API returns real types.
var NUMBER_FIELDS = ['partySize', 'estimated', 'actual', 'paid', 'cost', 'deposit', 'price'];
var BOOLEAN_FIELDS = ['invitationSent'];

var PROP = PropertiesService.getScriptProperties();
var SPREADSHEET_KEY = 'SPREADSHEET_ID';
var FOLDER_KEY = 'DRIVE_FOLDER_ID';
var TOKEN_KEY = 'API_TOKEN';
var SPREADSHEET_NAME = 'Afra & Atiha Wedding 2026 — Data';
var FOLDER_NAME = 'Afra & Atiha Wedding 2026 — Files';

function setup() {
  var ss = getOrCreateSpreadsheet_();
  ensureSheets_(ss);
  var folder = getOrCreateFolder_();
  var token = getOrCreateToken_();

  Logger.log('============================================================');
  Logger.log('Setup complete.');
  Logger.log('Spreadsheet : %s', ss.getUrl());
  Logger.log('Drive folder: %s', 'https://drive.google.com/drive/folders/' + folder.getId());
  Logger.log('API token   : %s', token);
  Logger.log('------------------------------------------------------------');
  Logger.log('Add to your .env:');
  Logger.log('  VITE_API_TOKEN=%s', token);
  Logger.log('  VITE_API_URL=<paste the Web app URL after you deploy>');
  Logger.log('============================================================');
}

function getOrCreateSpreadsheet_() {
  var id = PROP.getProperty(SPREADSHEET_KEY);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* recreate below */ }
  }
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  PROP.setProperty(SPREADSHEET_KEY, ss.getId());
  return ss;
}

function ensureSheets_(ss) {
  Object.keys(SCHEMA).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var headers = SCHEMA[name];
    var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var hasHeaders = firstRow.join('') !== '';
    if (!hasHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });
  // Remove the default empty "Sheet1" if it is still present and unused.
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
}

function getOrCreateFolder_() {
  var id = PROP.getProperty(FOLDER_KEY);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ }
  }
  var folder = DriveApp.createFolder(FOLDER_NAME);
  PROP.setProperty(FOLDER_KEY, folder.getId());
  return folder;
}

function getOrCreateToken_() {
  var token = PROP.getProperty(TOKEN_KEY);
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    PROP.setProperty(TOKEN_KEY, token);
  }
  return token;
}
