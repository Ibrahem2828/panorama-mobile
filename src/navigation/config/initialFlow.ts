import { RootRoutes } from '../routes';
import type { RootFlowMode, RootStackParamList } from '../types';

export const INITIAL_ROOT_FLOW: RootFlowMode = 'public';

export function getInitialRootRoute(flow: RootFlowMode): keyof RootStackParamList {
  switch (flow) {
    case 'studentSetup':
      return RootRoutes.StudentSetup;
    case 'app':
      return RootRoutes.App;
    case 'public':
      return RootRoutes.Public;
  }
}
