import {
  ACCOUNT_DELETE_CONFIRM_WORD,
  isAccountDeleteConfirmed,
} from './accountDeletionConfirm';

describe('isAccountDeleteConfirmed', () => {
  it('requires the exact DELETE word', () => {
    expect(isAccountDeleteConfirmed('')).toBe(false);
    expect(isAccountDeleteConfirmed('delete')).toBe(false);
    expect(isAccountDeleteConfirmed(' DELETE ')).toBe(true);
    expect(ACCOUNT_DELETE_CONFIRM_WORD).toBe('DELETE');
  });
});
