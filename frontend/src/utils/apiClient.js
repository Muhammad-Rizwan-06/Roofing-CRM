/**
 * Generalized API Client
 * Provides methods for common HTTP operations (GET, POST, PUT, DELETE)
 * Handles authentication headers and error handling
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to attach auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw {
            status: error.response.status,
            message: error.response.data?.message || `HTTP ${error.response.status}`,
            data: error.response.data,
          };
        }
        throw error;
      }
    );
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
   * GET request
   */
  async get(endpoint) {
    try {
      const response = await this.client.get(endpoint);
      return response.data;
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
      const response = await this.client.post(endpoint, data);
      return response.data;
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
      const response = await this.client.put(endpoint, data);
      return response.data;
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
      const response = await this.client.patch(endpoint, data);
      return response.data;
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
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
