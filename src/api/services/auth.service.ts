import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ChangePasswordRequest,
  ConfirmPasswordResetRequest,
  CurrentUser,
  EmptyResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterStudentRequest,
  RequestPasswordResetRequest,
  SendOtpRequest,
  UpdateCurrentUserRequest,
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

export function updateCurrentUser(input: UpdateCurrentUserRequest, authToken: string) {
  const allowedInput: UpdateCurrentUserRequest = {};

  if (typeof input.full_name === 'string') {
    allowedInput.full_name = input.full_name;
  }

  if (typeof input.username === 'string') {
    allowedInput.username = input.username;
  }

  return apiClient.patch<CurrentUser, UpdateCurrentUserRequest>(endpoints.auth.me, allowedInput, {
    authToken,
  });
}

export function changePassword(input: ChangePasswordRequest, authToken: string) {
  return apiClient.post<unknown, ChangePasswordRequest>(endpoints.auth.changePassword, input, {
    authToken,
  });
}

export function sendOtp(request: SendOtpRequest) {
  return apiClient.post<EmptyResponse, SendOtpRequest>(endpoints.auth.sendOtp, request);
}

export function verifyOtp(request: VerifyOtpRequest) {
  return apiClient.post<EmptyResponse, VerifyOtpRequest>(endpoints.auth.verifyOtp, request);
}

export function requestPasswordReset(request: RequestPasswordResetRequest) {
  return apiClient.post<EmptyResponse, RequestPasswordResetRequest>(
    endpoints.auth.requestPasswordReset,
    request,
  );
}

export function confirmPasswordReset(request: ConfirmPasswordResetRequest) {
  return apiClient.post<EmptyResponse, ConfirmPasswordResetRequest>(
    endpoints.auth.confirmPasswordReset,
    request,
  );
}
