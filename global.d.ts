declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_APP_ENV?: string;
    readonly EXPO_PUBLIC_API_BASE_URL?: string;
    readonly EXPO_PUBLIC_WS_BASE_URL?: string;
    readonly EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH?: string;
    readonly EXPO_PUBLIC_DASHBOARD_URL?: string;
    readonly NODE_ENV?: 'development' | 'production' | 'test';
  }
}

declare const process: {
  readonly env: NodeJS.ProcessEnv;
};
