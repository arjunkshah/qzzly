const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// A helper function to handle API requests
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown> | unknown[]
): Promise<T> => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'An API error occurred');
    }

    if (response.status === 204) { // No Content
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error: ${method} ${endpoint}`, error);
    throw error;
  }
}; 