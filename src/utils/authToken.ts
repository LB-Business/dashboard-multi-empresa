export function isJwtExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) return true;

    const payload = JSON.parse(atob(payloadBase64));

    if (!payload.exp) return false;

    const nowInSeconds = Math.floor(Date.now() / 1000);

    return payload.exp <= nowInSeconds;
  } catch {
    return true;
  }
}