const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let server;
let base;

async function request(endpoint, body) {
return fetch(base + endpoint, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body)
});
}


test('API: testy integracyjne', async t => {
  base = 'http://127.0.0.1:3000';
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200);

  await t.test('GET /health zwraca status online', async () => {
    const response = await fetch(base + '/health');
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.status, 'online');
  });

  await t.test('chat odrzuca puste dane', async () => {
    const response = await request('/api/ai/chat', {});
    assert.equal(response.status, 400);
  });

  await t.test('generator odrzuca nieprawidłowy temat', async () => {
    const response = await request('/api/content/generate', { topic: 'x' });
    assert.equal(response.status, 400);
  });

  await t.test('kolejka odrzuca ścieżkę poza katalogiem szkiców', async () => {
    const response = await request('/api/publication/queue', {
      filename: '../.env',
      platform: 'manual'
    });
    assert.equal(response.status, 400);
  });

  await t.test('eksport odrzuca próbę odczytu pliku poza katalogiem', async () => {
    const response = await request('/api/content/export', {
      filename: '../.env',
      format: 'html'
    });
    assert.equal(response.status, 400);
  });
});
