const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the billing server. Check that Spring Boot is running.');
  }

  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = body;
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null
      ? data.message || data.error || data.detail
      : data;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return data;
}

export const api = {
  menu: () => request('/menu-items'),
  addMenuItem: (item) => request('/menu-items', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id, item) => request(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteMenuItem: (id) => request(`/menu-items/${id}`, { method: 'DELETE' }),
  bills: () => request('/bills'),
  createBill: (bill) => request('/bills', { method: 'POST', body: JSON.stringify(bill) }),
  payBill: (id, paymentMethod) => request(`/bills/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }),
};
