export function generateDeviceId(): string {
  let id = localStorage.getItem('app_device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 11).toUpperCase();
    localStorage.setItem('app_device_id', id);
  }
  return id;
}

export function generateActivationCode(deviceId: string): string {
  const salt = "REPORTER_APP_SECRET_2024";
  let hash = 0;
  const str = deviceId + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

export function isValidActivationCode(deviceId: string, code: string): boolean {
  if (!code) return false;
  return generateActivationCode(deviceId) === code.trim().toUpperCase();
}
