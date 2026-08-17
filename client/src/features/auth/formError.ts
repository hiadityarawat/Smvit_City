import axios from "axios";
import type { ApiErrorBody } from "@socialverse/shared";

export function formError(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) return error.response?.data.error.message ?? "The server could not be reached.";
  return "Something unexpected happened. Please try again.";
}
