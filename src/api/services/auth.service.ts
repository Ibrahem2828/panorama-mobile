import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  CurrentUser,
  EmptyResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RefreshTokenRequest,
  RegisterStudentRequest,
  SendOtpRequest,
  VerifyOtpRequest,
} from '../types';

export function login(request: LoginRequest) {
  return apiClient.post<LoginResponse, LoginRequest>(endpoints.auth.login, request);
}

export function registerStudent(request: RegisterStudentRequest) {
  return apiClient.post<CurrentUser, RegisterStudentRequest>(
    endpoints.auth.registerStudent,
    request,
  );
}

export function refreshToken(refresh: string) {
  return apiClient.post<RefreshTokenResponse, RefreshTokenRequest>(endpoints.auth.refresh, {
    refresh,
  });
}

export function logout(refresh: string, authToken?: string | null) {
  return apiClient.post<EmptyResponse, RefreshTokenRequest>(
    endpoints.auth.logout,
    { refresh },
    { authToken },
  );
}

export function getCurrentUser(authToken?: string | null) {
  return apiClient.get<CurrentUser>(endpoints.auth.me, { authToken });
}

export function sendOtp(request: SendOtpRequest) {
  return apiClient.post<EmptyResponse, SendOtpRequest>(endpoints.auth.sendOtp, request);
}

export function verifyOtp(request: VerifyOtpRequest) {
  return apiClient.post<EmptyResponse, VerifyOtpRequest>(endpoints.auth.verifyOtp, request);
}
