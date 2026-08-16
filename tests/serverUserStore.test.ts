import assert from 'node:assert/strict';
import test from 'node:test';
import { ServerUserStore } from '../src/services/serverUserStore';

test('server user records never contain local password credentials', () => {
  const account = ServerUserStore.getOrCreateUser({ uid: 'firebase-user', email: 'user@example.com' });
  assert.equal('passwordHash' in account, false);
  assert.equal('password' in account, false);
  assert.equal('verifyPassword' in ServerUserStore, false);
});
