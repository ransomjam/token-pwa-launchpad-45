export async function api<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, { 
    ...init, 
    headers: { 
      'Content-Type': 'application/json', 
      ...(init?.headers || {}) 
    } 
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}