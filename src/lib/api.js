async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || `Erreur ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  stats: () => request('/stats'),
  clients: {
    list: () => request('/clients'),
    create: (data) => request('/clients', { method: 'POST', body: data }),
    update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request('/products'),
    create: (data) => request('/products', { method: 'POST', body: data }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  invoices: {
    list: () => request('/invoices'),
    get: (id) => request(`/invoices/${id}`),
    create: (data) => request('/invoices', { method: 'POST', body: data }),
    update: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: data }),
    setStatus: (id, status) => request(`/invoices/${id}/status`, { method: 'PATCH', body: { status } }),
    remove: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
  },
}
