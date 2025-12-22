import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // For web, check if we're in a browser and use window.location
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port, origin } = window.location;
    
    // Vercel domains - use same origin (API functions at same domain)
    if (hostname.includes('vercel.app')) {
      return origin;
    }
    
    // If we're on port 8081 (Expo web dev) or empty port (Replit proxy), API is on port 5000
    if (port === '8081' || port === '') {
      return `${protocol}//${hostname}:5000`;
    }
    
    // For development with port 5000
    if (port === '5000') {
      return origin;
    }
    
    // Otherwise use same origin
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  // For native apps, use EXPO_PUBLIC_DOMAIN
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    // Fallback for development
    host = "localhost:5000";
  }

  // Clean up the host string
  host = host.trim();

  // Handle Replit domains - use https and remove explicit port
  if (host.includes("replit.dev") || host.includes("repl.co")) {
    host = host.replace(/:5000$/, "").replace(/:443$/, "");
    return `https://${host}`;
  }

  // For localhost, use http
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    if (!host.includes(":")) {
      host = `${host}:5000`;
    }
    return `http://${host}`;
  }

  // Default to https for other domains
  return `https://${host}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const text = await res.text();
      errorMessage = text || res.statusText;
    } catch {
      errorMessage = res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const route = queryKey.join("/");
    const url = new URL(route, baseUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const res = await fetch(url.toString(), {
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out. Please check your connection.");
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});
