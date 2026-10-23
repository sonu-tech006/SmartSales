import {
  User,
  Dataset,
  Forecast,
  AnalyticsSummary,
  ProductItem,
  Report,
  NotificationItem,
  ETLLog,
} from '../types';

const TOKEN_KEY = 'smartsales_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // Use fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; mockResetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Datasets
  getDatasets: () => request<{ datasets: Dataset[] }>('/api/datasets'),

  getDatasetDetails: (id: string) => request<{ dataset: Dataset; etlLog?: ETLLog }>(`/api/datasets/${id}`),

  getDatasetPreview: (id: string, page = 1, limit = 20) =>
    request<{ page: number; limit: number; total: number; totalPages: number; rows: any[] }>(
      `/api/datasets/${id}/preview?page=${page}&limit=${limit}`
    ),

  deleteDataset: (id: string) =>
    request<{ message: string }>(`/api/datasets/${id}`, {
      method: 'DELETE',
    }),

  profileCSV: (csvContent: string) =>
    request<any>('/api/datasets/upload/profile', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),

  importDataset: (data: {
    name: string;
    description?: string;
    filename: string;
    csvContent: string;
    columnMappings: Record<string, string>;
  }) =>
    request<{ dataset: Dataset; etlLog: ETLLog; validationSummary: any }>('/api/datasets/upload/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Analytics
  getAnalytics: (datasetId: string) =>
    request<AnalyticsSummary>(`/api/datasets/${datasetId}/analytics`),

  getProductPerformance: (datasetId: string, search = '') =>
    request<{ products: ProductItem[] }>(
      `/api/datasets/${datasetId}/products${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),

  // Forecasting
  generateForecast: (
    datasetId: string,
    options: { modelType: string; horizonDays: number; forecastName?: string }
  ) =>
    request<{ forecast: Forecast }>(`/api/datasets/${datasetId}/forecast`, {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  getForecasts: () => request<{ forecasts: Forecast[] }>('/api/forecasts'),

  getForecastDetails: (id: string) => request<{ forecast: Forecast }>(`/api/forecasts/${id}`),

  deleteForecast: (id: string) =>
    request<{ message: string }>(`/api/forecasts/${id}`, {
      method: 'DELETE',
    }),

  // Reports
  createReport: (data: { datasetId: string; title?: string; dateRange?: { start: string; end: string } }) =>
    request<{ report: Report }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReports: () => request<{ reports: Report[] }>('/api/reports'),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),

  // Samples
  downloadSampleUrl: '/api/samples/download',
};
