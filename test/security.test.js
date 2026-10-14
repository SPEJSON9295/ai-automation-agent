const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("plik .env jest wykluczony z Git", () => {
  const ignore = fs.readFileSync(".gitignore", "utf8");
  assert.match(ignore, /^\.env$/m);
  assert.match(ignore, /^\.env\.\*$/m);
  assert.match(ignore, /^node_modules\/$/m);
});

test("package.json zawiera skrypt testowy", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.test, "node --test");
});

test("serwer waliduje wejście przez Zod", () => {
  const source = fs.readFileSync("server.js", "utf8");
  assert.match(source, /safeParse/);
  assert.match(source, /AI_API_KEY/);
});

test("nie zapisujemy kluczy API w kodzie testów", () => {
  const source = fs.readFileSync("test/security.test.js", "utf8");
  assert.doesNotMatch(source, /sk-[A-Za-z0-9]{20,}/);
});
