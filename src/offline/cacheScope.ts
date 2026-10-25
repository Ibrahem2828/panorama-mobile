/** Whose data the response cache reads and writes. Set from the signed-in user; null means "do not cache". */
let currentScope: string | null = null;

export function getCacheScope(): string | null {
  return currentScope;
}

export function setCacheScope(userId: string | number | null | undefined): void {
  currentScope = userId === null || userId === undefined ? null : String(userId);
}
