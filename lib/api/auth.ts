import { apiRequest } from "./client"
import type { AuthResponse, SendOtpData } from "./types"

export async function sendOtp(email: string): Promise<SendOtpData> {
  return apiRequest<SendOtpData>("/api/v1/auth/send-otp", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email }),
  })
}

export async function login(email: string, code: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, code }),
  })
}

export async function register(payload: {
  email: string
  code: string
  name: string
  character_name: string
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(payload),
  })
}

export async function getMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/me", {
    method: "GET",
  })
}
