export function getUUID() {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
