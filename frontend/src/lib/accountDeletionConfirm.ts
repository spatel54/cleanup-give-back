export const ACCOUNT_DELETE_CONFIRM_WORD = 'DELETE';

export function isAccountDeleteConfirmed(value: string): boolean {
  return value.trim() === ACCOUNT_DELETE_CONFIRM_WORD;
}
