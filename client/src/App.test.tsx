// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { App } from "./App";
import { useAuthStore } from "./features/auth/authStore";

vi.mock("./components/CityPreview", () => ({ CityPreview: () => <div>City preview</div> }));

test("renders the Phase 1 landing experience", () => {
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><MemoryRouter><App /></MemoryRouter></QueryClientProvider>);
  expect(screen.getByRole("heading", { name: /your social network is now a city/i })).toBeInTheDocument();
  expect(screen.getByText(/authentication \/ phase 2/i)).toBeInTheDocument();
});

test("renders a functional account registration form", () => {
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={["/register"]}><App /></MemoryRouter></QueryClientProvider>);
  expect(screen.getByRole("heading", { name: /build your identity/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/display name/i)).toBeRequired();
  expect(screen.getByLabelText(/^password/i)).toHaveAttribute("minlength", "10");
  expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled();
});
