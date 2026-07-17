const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  return normalized.length >= 3 && normalized.length <= 30 && USERNAME_PATTERN.test(normalized);
}

export function accountEmailForUsername(value: string): string {
  return `${normalizeUsername(value)}@account.subscription-stats.invalid`;
}
