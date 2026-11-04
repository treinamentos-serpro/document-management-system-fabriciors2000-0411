// Testes dos endpoints de documentos: upload, listagem e download.
// Cada arquivo de teste roda em processo próprio (node --test), então o
// repositório em memória começa vazio aqui.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, before, after } = require('node:test');
const assert = require('node:assert');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-docs-test-'));
process.env.STORAGE_DIR = storageDir;

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(storageDir, { recursive: true, force: true });
});

function uploadFile(owner, fileName, content = 'conteúdo de teste') {
  const form = new FormData();
  form.append('file', new Blob([content]), fileName);
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
}

// --- POST /upload ---

test('POST /upload retorna 201 com os metadados públicos do documento', async () => {
  const content = 'conteúdo do contrato';
  const response = await uploadFile('alice', 'contrato.pdf', content);
  assert.strictEqual(response.status, 201);

  const { document } = await response.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(document.originalName, 'contrato.pdf');
  assert.strictEqual(document.size, Buffer.byteLength(content));
  assert.strictEqual(document.owner, 'alice');
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));

  // Campos internos nunca são expostos na API.
  assert.ok(!('storageName' in document));
  assert.ok(!('mimeType' in document));
});

test('POST /upload grava o arquivo no diretório de armazenamento local', async () => {
  const filesBefore = fs.readdirSync(storageDir).length;
  const response = await uploadFile('alice', 'nota.txt');
  assert.strictEqual(response.status, 201);
  assert.strictEqual(fs.readdirSync(storageDir).length, filesBefore + 1);
});

test('POST /upload sem X-User-Id retorna 400', async () => {
  const form = new FormData();
  form.append('file', new Blob(['x']), 'arquivo.txt');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.strictEqual(response.status, 400);
  const { error } = await response.json();
  assert.strictEqual(error.code, 'VALIDATION_ERROR');
});

// --- GET /documents ---

test('GET /documents retorna lista vazia para dono sem documentos', async () => {
  const response = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-sem-docs' },
  });
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { documents: [] });
});

test('GET /documents lista todos os documentos do dono', async () => {
  const names = ['a.txt', 'b.txt', 'c.txt'];
  const ids = [];
  for (const name of names) {
    const { document } = await uploadFile('bob', name).then((r) => r.json());
    ids.push(document.id);
  }

  const { documents } = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  }).then((r) => r.json());

  assert.strictEqual(documents.length, names.length);
  for (const id of ids) {
    assert.ok(documents.some((d) => d.id === id));
  }
  for (const doc of documents) {
    assert.strictEqual(doc.owner, 'bob');
    assert.ok(!('storageName' in doc));
  }
});

// --- GET /documents/:id/download ---

test('GET /documents/:id/download devolve o conteúdo original', async () => {
  const content = 'linha 1\nlinha 2';
  const { document } = await uploadFile('carol', 'ata.txt', content).then((r) =>
    r.json()
  );

  const response = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'carol' } }
  );
  assert.strictEqual(response.status, 200);
  assert.match(
    response.headers.get('content-disposition'),
    /attachment.*ata\.txt/
  );
  assert.strictEqual(await response.text(), content);
});

test('GET /documents/:id/download sem X-User-Id retorna 400', async () => {
  const { document } = await uploadFile('carol', 'outro.txt').then((r) =>
    r.json()
  );
  const response = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(response.status, 400);
});

test('GET /documents/:id/download de documento de outro dono retorna 404', async () => {
  const { document } = await uploadFile('dave', 'privado.txt').then((r) =>
    r.json()
  );
  const response = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'intruso' } }
  );
  assert.strictEqual(response.status, 404);
  const { error } = await response.json();
  assert.strictEqual(error.code, 'DOCUMENT_NOT_FOUND');
});
