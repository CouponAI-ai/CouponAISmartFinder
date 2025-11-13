// API client with date handling for CouponAI

export function convertDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if it's an ISO date string
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(obj)) {
      return new Date(obj) as any;
    }
    return obj as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertDates(item)) as any;
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertDates(value);
    }
    return converted;
  }
  
  return obj;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const data = await response.json();
  return convertDates(data);
}
