import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldShowSessionServiceTypeBadge } from './court-tag-styles.ts';

describe('shouldShowSessionServiceTypeBadge', () => {
  it('hides Court Ordered service type when the session is already court-ordered', () => {
    assert.equal(shouldShowSessionServiceTypeBadge('Court Ordered', true), false);
    assert.equal(shouldShowSessionServiceTypeBadge('  court ordered  ', true), false);
  });

  it('keeps Court Ordered service type when the session is not court-ordered', () => {
    assert.equal(shouldShowSessionServiceTypeBadge('Court Ordered', false), true);
  });

  it('keeps non-court service types next to a court session badge', () => {
    assert.equal(shouldShowSessionServiceTypeBadge('School', true), true);
    assert.equal(shouldShowSessionServiceTypeBadge('Volunteering', true), true);
    assert.equal(shouldShowSessionServiceTypeBadge('Other', false), true);
  });

  it('hides empty service types', () => {
    assert.equal(shouldShowSessionServiceTypeBadge(null, true), false);
    assert.equal(shouldShowSessionServiceTypeBadge('', false), false);
    assert.equal(shouldShowSessionServiceTypeBadge('   ', true), false);
  });
});
