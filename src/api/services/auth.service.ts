import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AuthTokens,
  CurrentUser,
  EmptyResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterStudentRequest,
  SendOtpRequest,
  VerifyOtpRequest,
} from '../types';

export function login(request: LoginRequest) {
  return apiClient.post<AuthTokens, LoginRequest>(endpoints.auth.login, request);
}

export function registerStudent(request: RegisterStudentRequest) {
  return apiClient.post<CurrentUser, RegisterStudentRequest>(
    endpoints.auth.registerStudent,
    request,
  );
}

export function refreshToken(request: RefreshTokenRequest) {
  return apiClient.post<AuthTokens, RefreshTokenRequest>(endpoints.auth.refresh, request);
}

export function logout(authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(endpoints.auth.logout, {}, { authToken });
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
