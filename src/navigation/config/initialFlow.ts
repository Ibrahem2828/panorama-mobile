import { RootRoutes } from '../routes';
import type { AuthStatus } from '../../features/auth/types';
import type { RootFlowMode, RootStackParamList } from '../types';

export const INITIAL_ROOT_FLOW: RootFlowMode = 'public';

export function getRootFlowForAuthStatus(status: AuthStatus): RootFlowMode {
  if (status === 'authenticated') {
    return 'app';
  }

  return 'public';
}

export function getInitialRootRoute(flow: RootFlowMode): keyof RootStackParamList {
  switch (flow) {
    case 'studentSetup':
      return RootRoutes.StudentSetup;
    case 'app':
      return RootRoutes.App;
    case 'accessDenied':
      return RootRoutes.Public;
    case 'public':
      return RootRoutes.Public;
  }
}
