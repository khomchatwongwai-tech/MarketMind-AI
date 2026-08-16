import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, ServerUserStore } from '../src/services/serverUserStore';

test('passwords use salted scrypt hashes and verify safely', () => {
  const first = hashPassword('correct horse battery staple');
  const second = hashPassword('correct horse battery staple');

  assert.match(first, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.notEqual(first, second);

  const account = {
    passwordHash: first,
  } as Parameters<typeof ServerUserStore.verifyPassword>[0];

  assert.equal(ServerUserStore.verifyPassword(account, 'correct horse battery staple'), true);
  assert.equal(ServerUserStore.verifyPassword(account, 'wrong password'), false);
});

test('legacy or malformed password hashes fail closed', () => {
  const account = { passwordHash: 'sha256_sim_123_456' } as Parameters<
    typeof ServerUserStore.verifyPassword
  >[0];
  assert.equal(ServerUserStore.verifyPassword(account, 'anything'), false);
});
