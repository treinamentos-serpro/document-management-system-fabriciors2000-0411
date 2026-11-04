// Testes de integração: sobem o app em porta efêmera e usam fetch nativo.
// STORAGE_DIR e a cota são definidos antes do require (config é imutável).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, before, after } = require('node:test');
const assert = require('node:assert');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_DOCUMENTS_PER_OWNER = '5';

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

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health responde ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { status: 'ok' });
});

test('GET /documents sem X-User-Id retorna 400', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 400);
  const { error } = await response.json();
  assert.strictEqual(error.code, 'VALIDATION_ERROR');
});

test('X-User-Id com caracteres inválidos é rejeitado', async () => {
  const response = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': '../etc/passwd' },
  });
  assert.strictEqual(response.status, 400);
});

test('upload sem arquivo retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: new FormData(),
  });
  assert.strictEqual(response.status, 400);
});

test('upload, listagem isolada por dono e download', async () => {
  const uploadResponse = await uploadFile('alice', 'relatorio.txt', 'olá');
  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.ok(!('storageName' in document), 'storageName não deve ser exposto');

  const aliceList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  }).then((r) => r.json());
  assert.ok(aliceList.documents.some((d) => d.id === document.id));

  const bobList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  }).then((r) => r.json());
  assert.ok(!bobList.documents.some((d) => d.id === document.id));

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.strictEqual(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /relatorio\.txt/);
  assert.strictEqual(await download.text(), 'olá');

  // Outro dono não pode baixar o documento.
  const forbidden = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.strictEqual(forbidden.status, 404);
});

test('download de id inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.strictEqual(response.status, 404);
  const { error } = await response.json();
  assert.strictEqual(error.code, 'DOCUMENT_NOT_FOUND');
});

test('nome original com separadores de caminho é normalizado', async () => {
  const response = await uploadFile('carol', '../../evil.txt');
  assert.strictEqual(response.status, 201);
  const { document } = await response.json();
  assert.strictEqual(document.originalName, 'evil.txt');
});

test('cota por dono é aplicada', async () => {
  for (let i = 0; i < 5; i += 1) {
    const ok = await uploadFile('dave', `doc-${i}.txt`);
    assert.strictEqual(ok.status, 201);
  }
  const blocked = await uploadFile('dave', 'doc-extra.txt');
  assert.strictEqual(blocked.status, 429);
  const { error } = await blocked.json();
  assert.strictEqual(error.code, 'QUOTA_EXCEEDED');
});
