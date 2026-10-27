const test = require('node:test');
const assert = require('node:assert/strict');

const base = 'http://127.0.0.1:3000';

async function post(endpoint, body) {
  return fetch(base + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('API: testy integracyjne i odpornościowe', async t => {
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200, 'Agent musi działać na porcie 3000');

  await t.test('health zwraca status online', async () => {
    const r = await fetch(base + '/health');
    assert.equal((await r.json()).status, 'online');
  });

  await t.test('chat odrzuca puste dane', async () => {
    assert.equal((await post('/api/ai/chat', {})).status, 400);
  });

  await t.test('chat odrzuca błędny typ wiadomości', async () => {
    assert.equal((await post('/api/ai/chat', { message: 123 })).status, 400);
  });

  await t.test('chat odrzuca wiadomość ponad limit', async () => {
    assert.equal(
      (await post('/api/ai/chat', { message: 'x'.repeat(12001) })).status,
      400
    );
  });

  await t.test('chat odrzuca nadmiernie długą instrukcję systemową', async () => {
    assert.equal(
      (await post('/api/ai/chat', {
        message: 'test',
        system: 'x'.repeat(4001)
      })).status,
      400
    );
  });

  await t.test('generator odrzuca za krótki temat', async () => {
    assert.equal(
      (await post('/api/content/generate', { topic: 'x' })).status,
      400
    );
  });

  await t.test('generator odrzuca błędny typ i długość artykułu', async () => {
    assert.equal(
      (await post('/api/content/generate', {
        topic: 'Poprawny temat', words: '800'
      })).status,
      400
    );
    assert.equal(
      (await post('/api/content/generate', {
        topic: 'Poprawny temat', words: 99999
      })).status,
      400
    );
  });

  await t.test('research odrzuca niepoprawny język i krótki temat', async () => {
    assert.equal(
      (await post('/api/research', {
        query: 'AI', language: 'xx'
      })).status,
      400
    );
    assert.equal(
      (await post('/api/research', { query: 'x' })).status,
      400
    );
  });

  await t.test('redakcja odrzuca ścieżkę do pliku poza szkicami', async () => {
    assert.equal(
      (await post('/api/content/edit', {
        filename: '../.env', instructions: 'Popraw tekst'
      })).status,
      400
    );
  });

  await t.test('kolejka odrzuca próbę przejścia do innego katalogu', async () => {
    assert.equal(
      (await post('/api/publication/queue', {
        filename: '../.env', platform: 'manual'
      })).status,
      400
    );
  });

  await t.test('eksport odrzuca ścieżkę i niedozwolony format', async () => {
    assert.equal(
      (await post('/api/content/export', {
        filename: '../.env', format: 'html'
      })).status,
      400
    );
    assert.equal(
      (await post('/api/content/export', {
        filename: 'test.md', format: 'exe'
      })).status,
      400
    );
  });

  await t.test('serwer odrzuca żądanie JSON większe niż 5 MB', async () => {
    const response = await fetch(base + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(6 * 1024 * 1024) })
    });
    assert.equal(response.status, 413);
  });
});
