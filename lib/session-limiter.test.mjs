// Proof for the admin session-mint throttle. Run: node --test lib/session-limiter.test.mjs
// (imports the TS helper via Node 24 type stripping; no test runner dep added
// to the admin app for one 40-line guard).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkSessionMintLimit,
  clientIpFromHeaders,
  resetSessionMintLimits,
  SESSION_MINT_LIMIT,
} from './session-limiter.ts';

test('allows 20 attempts then 429s the 21st per IP', () => {
  resetSessionMintLimits();
  for (let i = 0; i < 20; i++) assert.equal(checkSessionMintLimit('1.2.3.4'), true);
  assert.equal(checkSessionMintLimit('1.2.3.4'), false);
});

test('budgets are per IP', () => {
  resetSessionMintLimits();
  for (let i = 0; i < 20; i++) checkSessionMintLimit('1.2.3.4');
  assert.equal(checkSessionMintLimit('5.6.7.8'), true);
});

test('window is 15 minutes', () => {
  assert.equal(SESSION_MINT_LIMIT.WINDOW_MS, 15 * 60 * 1000);
  assert.equal(SESSION_MINT_LIMIT.MAX_ATTEMPTS, 20);
});

test('client IP prefers first forwarded entry', () => {
  const h = new Headers({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' });
  assert.equal(clientIpFromHeaders(h), '9.9.9.9');
});
