import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = T>(url: string, config?: any): Promise<R>;
  post<T = any, R = T>(url: string, data?: any, config?: any): Promise<R>;
  put<T = any, R = T>(url: string, data?: any, config?: any): Promise<R>;
  delete<T = any, R = T>(url: string, config?: any): Promise<R>;
}

export const api: CustomAxiosInstance = axios.create({
  baseURL: 'https://luxowash-api.vercel.app/api',
});

// Add a response interceptor to handle the "response_data" wrapper
api.interceptors.response.use((response: AxiosResponse) => {
  if (response.data && response.data.response_data) {
    return response.data.response_data;
  }
  return response.data;
});
