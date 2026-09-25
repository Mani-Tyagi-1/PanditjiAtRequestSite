import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

// Short-lived GET cache with in-flight de-duplication. Several components on the
// same page (and pages visited back-to-back) request the same catalogue endpoints;
// this collapses them into one network call. Callers must treat `data` as read-only.
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; promise: Promise<AxiosResponse> }>();

export function cachedGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const key = url + (config?.params ? JSON.stringify(config.params) : "");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise as Promise<AxiosResponse<T>>;

  const promise = axios.get<T>(url, config);
  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });
  return promise;
}
