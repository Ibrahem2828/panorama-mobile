export { configureApiAuthBridge } from './apiAuthBridge';
export {
  bootstrapSession,
  endSessionReplacedByAnotherDevice,
  loginWithCredentials,
  logoutSession,
  refreshAccessToken,
  switchDeviceSession,
  toSafeAuthErrorMessage,
} from './authSessionService';
export {
  DeviceMismatchLoginError,
  DeviceSwitchError,
  classifyDeviceSwitchError,
  deviceLockReducer,
  initialDeviceLockState,
} from './deviceLock';
export type {
  DeviceLockError,
  DeviceLockEvent,
  DeviceLockPhase,
  DeviceLockState,
  DeviceSwitchFailure,
} from './deviceLock';
export type { BootstrapSessionResult } from './authSessionService';
export { clearAuthTokens, getStoredAuthTokens, saveAuthTokens } from './authTokenStorage';
export {
  registerNormalUser,
  registerStudentAccount,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  toSafeD1ErrorMessage,
  toSafeRegistrationErrorMessage,
} from './registrationService';
export {
  confirmPasswordReset,
  requestPasswordResetCode,
  toSafePasswordResetErrorMessage,
} from './passwordResetService';
