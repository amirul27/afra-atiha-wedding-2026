/**
 * Code.gs — Web app entry points for the Afra & Atiha Wedding 2026 app.
 * ---------------------------------------------------------------------------
 * Reads  : GET  ?action=list&collection=<name>&token=<token>
 * Writes : POST (Content-Type text/plain) with a JSON body:
 *            { action, collection, token, payload }            // create/update/remove
 *            { action:'upload', token, collection, filename,    // file upload
 *              mimeType, base64, meta:{...} }
 *
 * Every response is a JSON envelope: { ok: boolean, data?, error? }.
 * Requests are served as application/json via ContentService, which keeps them
 * on the CORS "simple request" path (no preflight that Apps Script can't answer).
 * ---------------------------------------------------------------------------
 */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    requireToken_(params.token);
    var action = params.action || 'list';

    if (action === 'list') {
      return ok_(listRows_(requireCollection_(params.collection)));
    }
    if (action === 'ping') {
      return ok_({ pong: true, time: new Date().toISOString() });
    }
    return fail_('Unknown action: ' + action);
  } catch (err) {
    return fail_(err && err.message ? err.message : String(err));
  }
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    requireToken_(body.token);
    var action = body.action;

    if (action === 'upload') return ok_(handleUpload_(body));

    var collection = requireCollection_(body.collection);
    if (action === 'create') return ok_(createRow_(collection, body.payload || {}));
    if (action === 'update') return ok_(updateRow_(collection, body.payload || {}));
    if (action === 'remove') return ok_(removeRow_(collection, (body.payload || {}).id));

    return fail_('Unknown action: ' + action);
  } catch (err) {
    return fail_(err && err.message ? err.message : String(err));
  }
}

/* ----------------------------------------------------------------- helpers */

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Invalid JSON body');
  }
}

function requireToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty(TOKEN_KEY);
  if (!expected) throw new Error('Server not initialised. Run setup() first.');
  if (!token || String(token) !== String(expected)) throw new Error('Unauthorised');
}

function requireCollection_(name) {
  if (!name || !SCHEMA[name]) throw new Error('Unknown collection: ' + name);
  return name;
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty(SPREADSHEET_KEY);
  if (!id) throw new Error('Spreadsheet not found. Run setup() first.');
  return SpreadsheetApp.openById(id);
}

function getSheet_(collection) {
  var sheet = getSpreadsheet_().getSheetByName(collection);
  if (!sheet) throw new Error('Sheet missing: ' + collection + '. Run setup() again.');
  return sheet;
}

function coerce_(field, value) {
  if (NUMBER_FIELDS.indexOf(field) !== -1) {
    var n = Number(value);
    return isNaN(n) ? 0 : n;
  }
  if (BOOLEAN_FIELDS.indexOf(field) !== -1) {
    return value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1';
  }
  return value === null || value === undefined ? '' : value;
}

function listRows_(collection) {
  var sheet = getSheet_(collection);
  var headers = SCHEMA[collection];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue; // skip rows without an id
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = coerce_(headers[c], row[c]);
    }
    out.push(obj);
  }
  return out;
}

function rowObjectToArray_(collection, obj) {
  return SCHEMA[collection].map(function (field) {
    var v = obj[field];
    if (BOOLEAN_FIELDS.indexOf(field) !== -1) return v === true || v === 'true' ? true : false;
    if (NUMBER_FIELDS.indexOf(field) !== -1) return v === undefined || v === null || v === '' ? 0 : Number(v);
    return v === undefined || v === null ? '' : v;
  });
}

function findRowIndexById_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // 1-based, +1 for header
  }
  return -1;
}

function newId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function createRow_(collection, payload) {
  var sheet = getSheet_(collection);
  if (!payload.id) payload.id = newId_(collection.slice(0, 3));
  sheet.appendRow(rowObjectToArray_(collection, payload));
  return payload;
}

function updateRow_(collection, payload) {
  if (!payload.id) throw new Error('Missing id for update');
  var sheet = getSheet_(collection);
  var rowIndex = findRowIndexById_(sheet, payload.id);
  if (rowIndex === -1) throw new Error('Record not found: ' + payload.id);
  var headers = SCHEMA[collection];
  var existing = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var merged = {};
  for (var c = 0; c < headers.length; c++) merged[headers[c]] = existing[c];
  // Apply only the provided fields (partial update).
  Object.keys(payload).forEach(function (k) {
    if (headers.indexOf(k) !== -1) merged[k] = payload[k];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowObjectToArray_(collection, merged)]);
  return merged;
}

function removeRow_(collection, id) {
  if (!id) throw new Error('Missing id for remove');
  var sheet = getSheet_(collection);
  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) throw new Error('Record not found: ' + id);
  sheet.deleteRow(rowIndex);
  return { id: id };
}

/* ------------------------------------------------------------------ upload */

function getFolder_() {
  var id = PropertiesService.getScriptProperties().getProperty(FOLDER_KEY);
  if (!id) throw new Error('Drive folder not found. Run setup() first.');
  return DriveApp.getFolderById(id);
}

function handleUpload_(body) {
  if (!body.base64) throw new Error('Missing file data');
  var folder = getFolder_();
  var mimeType = body.mimeType || 'application/octet-stream';
  var filename = body.filename || ('upload-' + Date.now());
  var bytes = Utilities.base64Decode(body.base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);

  var file = folder.createFile(blob);
  // Anyone with the link can view (so images/links open from the app).
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { /* domain policy may restrict sharing; link still works for owner */ }

  var meta = body.meta || {};
  var record = {
    id: newId_('doc'),
    name: meta.name || filename,
    category: meta.category || 'Other',
    event: meta.event || 'all',
    fileUrl: file.getUrl(),
    fileId: file.getId(),
    mimeType: mimeType,
    uploadedAt: new Date().toISOString(),
    notes: meta.notes || ''
  };
  getSheet_('documents').appendRow(rowObjectToArray_('documents', record));
  return record;
}

/* ---------------------------------------------------------------- envelope */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return json_({ ok: true, data: data });
}

function fail_(message) {
  return json_({ ok: false, error: message });
}
