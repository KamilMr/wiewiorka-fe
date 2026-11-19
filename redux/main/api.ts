import {getURL} from '@/common';

export const authenticatedFetch = (
  endpoint: string,
  token: string,
  options: RequestInit = {},
) =>
  fetch(getURL(endpoint), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
