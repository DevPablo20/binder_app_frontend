import { ApiError } from '@/api/client';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export { truncate };
