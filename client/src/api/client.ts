import axios from "axios";
import type { ApiEnvelope, AuthSession } from "@socialverse/shared";
import { useAuthStore } from "../features/auth/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  timeout: 10_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface RetryConfig { _retry?: boolean; url?: string }
apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const config = error.config as (typeof error.config & RetryConfig);
  if (!config || config._retry || config.url?.includes("/auth/refresh") || config.url?.includes("/auth/login")) throw error;
  config._retry = true;
  try {
    const response = await axios.post<ApiEnvelope<AuthSession>>(`${apiClient.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
    useAuthStore.getState().setSession(response.data.data);
    config.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
    return apiClient.request(config);
  } catch (refreshError) {
    useAuthStore.getState().setAnonymous();
    throw refreshError;
  }
});
