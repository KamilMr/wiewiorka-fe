export interface Environment {
  apiUrl: string;
  variant: 'development' | 'staging' | 'production';
}

const getEnvironment = (): Environment => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const variant =
    (process.env.EXPO_PUBLIC_APP_VARIANT as Environment['variant']) ||
    'development';

  return {
    apiUrl,
    variant,
  };
};

export const env = getEnvironment();

export const getSocketEndpoint = () => {
  const url = new URL(env.apiUrl);
  const basePath = url.pathname.replace(/\/$/, '');
  return {origin: url.origin, path: `${basePath}/socket.io/`};
};

export const isDevelopment = env.variant === 'development';
export const isStaging = env.variant === 'staging';
export const isProduction = env.variant === 'production';
