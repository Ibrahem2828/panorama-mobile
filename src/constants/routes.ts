export const routeNames = {
  bootstrap: 'Bootstrap',
} as const;

export type RouteName = (typeof routeNames)[keyof typeof routeNames];
