/**
 * API Configuration and HTTP Client
 * 
 * This module provides the base configuration for all API calls.
 * Replace the BASE_URL with your actual backend URL when deploying.
 */

// API Base URL - Change this when connecting to a real backend
// export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const API_BASE_URL = import.meta.env.VITE_API_URL;
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * HTTP request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Get the auth token from sessionStorage
 */
function getAuthToken(): string | null {
  try {
    const session = sessionStorage.getItem('session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Base API client with authentication and error handling
 * 
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param options - Request options
 * @returns Promise with the API response
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  const token = getAuthToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data as T,
      message: data.message,
    };
  } catch (error) {
    // Network error or server unreachable
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Please try again.',
    };
  }
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: 'DELETE', headers }),
};
