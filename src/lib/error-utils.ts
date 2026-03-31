/**
 * Extract a readable error message from any error type
 * Handles Error, Supabase errors, and plain objects
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;

    // Supabase error format
    if ('message' in obj && typeof obj.message === 'string') {
      return obj.message;
    }

    // PostgreSQL error hint
    if ('hint' in obj && typeof obj.hint === 'string') {
      return obj.hint;
    }

    // Generic fallback
    if ('error' in obj && typeof obj.error === 'string') {
      return obj.error;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Erro desconhecido';
}
