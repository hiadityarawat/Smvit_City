import type { ApiEnvelope, AuthSession, LoginInput, RegisterInput } from "@socialverse/shared";
import { apiClient } from "../../api/client";

let refreshInFlight: Promise<AuthSession> | null = null;

export const authApi = {
  async register(input: RegisterInput) {
    const response = await apiClient.post<ApiEnvelope<AuthSession>>("/auth/register", input);
    return response.data.data;
  },
  async login(input: LoginInput) {
    const response = await apiClient.post<ApiEnvelope<AuthSession>>("/auth/login", input);
    return response.data.data;
  },
  refresh() {
    if (!refreshInFlight) {
      refreshInFlight = apiClient.post<ApiEnvelope<AuthSession>>("/auth/refresh")
        .then((response) => response.data.data)
        .finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
  },
  async logout() {
    await apiClient.post("/auth/logout");
  },
  async forgotPassword(email: string) {
    const response = await apiClient.post<ApiEnvelope<{ message: string }>>("/auth/forgot-password", { email });
    return response.data.data;
  },
  async resetPassword(token: string, password: string) {
    const response = await apiClient.post<ApiEnvelope<{ message: string }>>("/auth/reset-password", { token, password });
    return response.data.data;
  },
};
