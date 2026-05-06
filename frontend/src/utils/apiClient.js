/**
 * Generalized API Client
 * Provides methods for common HTTP operations (GET, POST, PUT, DELETE)
 * Handles authentication headers and error handling
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://wi3bmu631i.execute-api.ap-south-1.amazonaws.com/production";

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get the authorization token from localStorage
   */
  getAuthToken() {
    try {
      const auth = localStorage.getItem("auth");
      if (!auth) return null;
      const { token } = JSON.parse(auth);
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Build headers with authorization
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle response errors
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: error.message || `HTTP ${response.status}`,
        data: error,
      };
    }
    return response.json();
  }

  /**
   * GET request
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`PATCH ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
