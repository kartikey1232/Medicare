/**
 * MediDesk API Client
 * Central HTTP utility for all API calls — handles auth tokens,
 * error normalization, and request serialization.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `Request failed: ${res.status}`);
  }

  // Handle empty responses (204 No Content)
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: any) =>
    request<{ id: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  refresh: () =>
    request<{ token: string }>('/auth/refresh', { method: 'POST' }),

  me: () => request<any>('/auth/me'),
};

// ─── Tickets ───────────────────────────────────────────────
export const ticketApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/tickets${qs}`);
  },

  get: (id: string) => request<any>(`/tickets/${id}`),

  create: (payload: any) =>
    request<any>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),

  assign: (id: string, doctorId: string) =>
    request<any>(`/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ doctorId }),
    }),

  updateStatus: (id: string, status: string) =>
    request<any>(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateSeverity: (id: string, severity: string) =>
    request<any>(`/tickets/${id}/severity`, {
      method: 'PUT',
      body: JSON.stringify({ severity }),
    }),

  addNote: (id: string, note: string, isPrivate: boolean) =>
    request<any>(`/tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note, isPrivate }),
    }),

  addMessage: (id: string, message: string, voiceUrl?: string) =>
    request<any>(`/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, voiceUrl }),
    }),

  merge: (primaryTicketId: string, duplicateTicketId: string) =>
    request<any>('/tickets/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryTicketId, duplicateTicketId }),
    }),
};

// ─── Attachments ───────────────────────────────────────────
export const attachmentApi = {
  upload: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/attachments/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
  },
};

// ─── AI ────────────────────────────────────────────────────
export const aiApi = {
  analyze: (text: string) =>
    request<any>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  similar: (ticketId: string) => request<any[]>(`/ai/similar/${ticketId}`),
};

// ─── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => request<any>('/analytics'),
};

// ─── Admin ─────────────────────────────────────────────────
export const adminApi = {
  listUsers: () => request<any[]>('/admin/users'),
  listDoctors: () => request<any[]>('/admin/doctors'),
  suspendUser: (userId: string) =>
    request<any>(`/admin/users/${userId}/suspend`, { method: 'PUT' }),
  reactivateUser: (userId: string) =>
    request<any>(`/admin/users/${userId}/reactivate`, { method: 'PUT' }),
  updateRole: (userId: string, role: string) =>
    request<any>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// ─── Search ────────────────────────────────────────────────
export const searchApi = {
  global: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
};

// ─── Notifications ─────────────────────────────────────────
export const notificationApi = {
  list: () => request<any[]>('/notifications'),
  markRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),
};
