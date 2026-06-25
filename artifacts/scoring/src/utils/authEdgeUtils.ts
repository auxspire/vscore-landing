/** Pure helpers for edge-function detection (no Supabase import). */

export function phoneSyntheticEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@vscor.phone`;
}

export function isEdgeFunctionUnavailable(response: Response, body: unknown): boolean {
  if (!response.ok && (response.status === 502 || response.status === 503 || response.status === 404)) {
    return true;
  }
  const msg =
    typeof body === 'object' && body !== null
      ? String((body as { msg?: string; error?: string }).msg ?? (body as { error?: string }).error ?? '')
      : '';
  return (
    msg.includes('InvalidWorkerCreation') ||
    msg.includes('entrypoint') ||
    msg.includes('Function not found') ||
    msg.includes('failed to bootstrap')
  );
}
