/**
 * Arranque inmediato del worker: dispara el workflow de GitHub Actions.
 * Solo en el servidor (usa GITHUB_DISPATCH_TOKEN). Si no hay token o GitHub
 * falla, la búsqueda igual queda en cola y la toma el ciclo programado.
 */
export async function dispararWorker(): Promise<boolean> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return false;
  const repo = process.env.GITHUB_REPO || 'St4keholders/MIRENTAYA';
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/prospeccion.yml/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: process.env.GITHUB_DISPATCH_REF || 'main' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error('[prospeccion] GitHub respondió', r.status, await r.text().catch(() => ''));
    return r.ok;
  } catch (e) {
    console.error('[prospeccion] No se pudo disparar el workflow:', e);
    return false;
  }
}
