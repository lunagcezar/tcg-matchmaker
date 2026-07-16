export function getApiBase(): string {
  return import.meta.env.QCLI_API_URL || 'http://localhost:8787';
}
