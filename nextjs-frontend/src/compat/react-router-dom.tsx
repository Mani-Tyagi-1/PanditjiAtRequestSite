"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";

export interface ToObject {
  pathname?: string;
  search?: string;
  hash?: string;
}

export type To = string | ToObject;

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

export type NavigateFunction = {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
};

// ── Router state ────────────────────────────────────────────────────────────
// react-router carried `navigate(url, { state })` to `useLocation().state`; Next's router
// has no equivalent. Booking pages depend on it (chosen package, chadhava, selections), so
// state is held per target path in memory and mirrored to sessionStorage so a refresh
// keeps it, like history state does.
const STATE_PREFIX = "rr_state:";
const stateStore = new Map<string, unknown>();
const stateListeners = new Set<() => void>();

const stateKey = (url: string): string => {
  const path = url.split("#")[0].split("?")[0].replace(/\/+$/, "");
  return path || "/";
};

function setLocationState(url: string, state: unknown) {
  const key = stateKey(url);
  if (state == null) stateStore.delete(key);
  else stateStore.set(key, state);
  try {
    if (state == null) sessionStorage.removeItem(STATE_PREFIX + key);
    else sessionStorage.setItem(STATE_PREFIX + key, JSON.stringify(state));
  } catch {
    // private mode / non-serializable state — in-memory copy still works
  }
  stateListeners.forEach((l) => l());
}

function readLocationState(key: string): unknown {
  if (stateStore.has(key)) return stateStore.get(key) ?? null;
  let restored: unknown = null;
  try {
    const raw = sessionStorage.getItem(STATE_PREFIX + key);
    if (raw) restored = JSON.parse(raw);
  } catch {
    restored = null;
  }
  // Cached (even when null) so the snapshot stays referentially stable.
  if (restored != null) stateStore.set(key, restored);
  return restored;
}

const subscribeToState = (cb: () => void) => {
  stateListeners.add(cb);
  return () => {
    stateListeners.delete(cb);
  };
};

export function useNavigate(): NavigateFunction {
  const router = useRouter();

  return useCallback(
    ((to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (typeof window === "undefined") return;
        // A visitor who landed straight on this page (ad link, shared URL) has no
        // history to go back to — send them home instead of a dead button.
        if (to < 0 && window.history.length <= 1) {
          router.push("/");
          return;
        }
        window.history.go(to);
        return;
      }

      let url = "";
      if (typeof to === "string") {
        url = to;
      } else if (to && typeof to === "object") {
        url = `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
      }

      // Set before navigating so the destination's first render already sees it.
      if (options && "state" in options) setLocationState(url, options.state);

      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    }) as NavigateFunction,
    [router]
  );
}

const SearchParamsContext = React.createContext<string>("");
const SearchParamsSetContext = React.createContext<React.Dispatch<React.SetStateAction<string>>>(() => {});

function InnerSearchParamsSync() {
  const nextParams = useNextSearchParams();
  const searchString = nextParams?.toString() ?? "";
  const setSearch = React.useContext(SearchParamsSetContext);

  React.useEffect(() => {
    setSearch(searchString);
  }, [searchString, setSearch]);

  return null;
}

export function SearchParamsSync() {
  return (
    <React.Suspense fallback={null}>
      <InnerSearchParamsSync />
    </React.Suspense>
  );
}

export function SearchParamsProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const q = window.location.search;
      return q.startsWith("?") ? q.slice(1) : q;
    }
    return "";
  });

  return (
    <SearchParamsSetContext.Provider value={setSearch}>
      <SearchParamsContext.Provider value={search}>
        <SearchParamsSync />
        {children}
      </SearchParamsContext.Provider>
    </SearchParamsSetContext.Provider>
  );
}

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
}

export function useLocation(): Location {
  const pathname = usePathname() || "/";
  const contextSearch = React.useContext(SearchParamsContext);
  const [hash, setHash] = React.useState("");

  const search = contextSearch ? `?${contextSearch}` : "";

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHash(window.location.hash || "");
    }
  }, [pathname, contextSearch]);

  // Server snapshot is null so hydration matches; the client value arrives right after.
  const key = stateKey(pathname);
  const state = React.useSyncExternalStore(
    subscribeToState,
    () => readLocationState(key),
    () => null
  );

  return useMemo(() => {
    return {
      pathname,
      search,
      hash,
      state,
      key: "default",
    };
  }, [pathname, search, hash, state]);
}

export function useParams<T extends Record<string, any> = Record<string, string>>(): T {
  const params = useNextParams() || {};
  const pathname = usePathname() || "";

  return useMemo(() => {
    const result: Record<string, any> = { ...params };

    // If Next.js gave an array for slug, e.g. from [...slug]
    if (Array.isArray(result.slug)) {
      const segments = result.slug;
      if (segments[0] === "chadhava") {
        result.slug = segments[1];
      } else if (segments[0] === "live-mandir-puja") {
        result.slug = segments[1];
      } else if (segments[0] === "holy-pandit") {
        result.slug = segments[1];
      } else if (segments[0] === "shop-product") {
        result.slug = segments[1];
      } else if (segments[0] === "puja") {
        result.pujaId = segments[1];
      } else if (segments[0] === "category") {
        result.categoryId = segments[1];
      } else if (segments[0] === "pandit") {
        result.panditId = segments[1];
      } else if (segments[0] === "blog") {
        result.blogID = segments[1];
      } else if (segments[0] === "shop") {
        result.category = segments[1];
        if (segments[2]) result.handle = segments[2];
      } else if (segments[0] === "vedic-vivah" && segments[1] === "package") {
        result.packageId = segments[2];
      } else if (segments[0] === "vedic-vivah" && segments[1] === "guides") {
        result.slug = segments[2];
      } else if (segments[0] === "video-call" || segments[0] === "audio-call") {
        result.callId = segments[1];
        result.panditId = segments[2];
      } else if (segments[0] === "track-pandit") {
        result.panditId = segments[1];
        result.destLat = segments[2];
        result.destLng = segments[3];
      } else {
        result.slug = segments[segments.length - 1];
      }
    }

    // Direct pathname parsing guarantees parameters are always present
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "puja" && parts[1]) {
      result.pujaId = parts[1];
    }
    if (parts[0] === "category" && parts[1]) {
      result.categoryId = parts[1];
    }
    if (parts[0] === "pandit" && parts[1]) {
      result.panditId = parts[1];
    }
    if (parts[0] === "blog" && parts[1]) {
      result.blogID = parts[1];
    }
    if (parts[0] === "chadhava" && parts[1]) {
      result.slug = parts[1];
    }
    if (parts[0] === "live-mandir-puja" && parts[1]) {
      result.slug = parts[1];
    }
    if (parts[0] === "holy-pandit" && parts[1]) {
      result.slug = parts[1];
    }
    if (parts[0] === "shop-product" && parts[1]) {
      result.slug = parts[1];
    }
    if (parts[0] === "shop") {
      if (parts[1] && parts[1] !== "product") result.category = parts[1];
      if (parts[2]) result.handle = parts[2];
    }
    if (parts[0] === "vedic-vivah" && parts[1] === "package" && parts[2]) {
      result.packageId = parts[2];
    }
    if (parts[0] === "vedic-vivah" && parts[1] === "guides" && parts[2]) {
      result.slug = parts[2];
    }
    if ((parts[0] === "video-call" || parts[0] === "audio-call") && parts[1] && parts[2]) {
      result.callId = parts[1];
      result.panditId = parts[2];
    }
    if (parts[0] === "track-pandit" && parts[1]) {
      result.panditId = parts[1];
      result.destLat = parts[2];
      result.destLng = parts[3];
    }

    return result as T;
  }, [params, pathname]);
}

export function useSearchParams(): [
  URLSearchParams,
  (nextInit: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams), navigateOpts?: NavigateOptions) => void
] {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchString = React.useContext(SearchParamsContext);
  const current = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const setSearchParams = useCallback(
    (
      nextInit: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams),
      navigateOpts?: NavigateOptions
    ) => {
      let next: URLSearchParams;
      if (typeof nextInit === "function") {
        next = nextInit(new URLSearchParams(searchString));
      } else if (nextInit instanceof URLSearchParams) {
        next = nextInit;
      } else {
        next = new URLSearchParams(nextInit);
      }

      const nextStr = next.toString();
      const targetUrl = nextStr ? `${pathname}?${nextStr}` : pathname;
      if (navigateOpts?.replace) {
        router.replace(targetUrl);
      } else {
        router.push(targetUrl);
      }
    },
    [router, pathname, searchString]
  );

  return [current, setSearchParams];
}

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  state?: any;
  reloadDocument?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, children, className, ...rest },
  ref
) {
  let href = "/";
  if (typeof to === "string") {
    href = to;
  } else if (to && typeof to === "object") {
    href = `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
  }

  return (
    <NextLink
      ref={ref}
      href={href}
      replace={replace}
      className={className}
      {...rest}
    >
      {children}
    </NextLink>
  );
});

export interface NavLinkProps extends Omit<LinkProps, "className"> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  end?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, className, end, children, ...rest },
  ref
) {
  const pathname = usePathname() || "/";
  let href = "/";
  if (typeof to === "string") {
    href = to;
  } else if (to && typeof to === "object") {
    href = `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
  }

  const isActive = end ? pathname === href : pathname.startsWith(href);

  const computedClassName = typeof className === "function" ? className({ isActive, isPending: false }) : className;

  return (
    <Link ref={ref} to={to} className={computedClassName} {...rest}>
      {children}
    </Link>
  );
});

export function Navigate({ to, replace, state }: { to: To; replace?: boolean; state?: any }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, to, replace, state]);

  return null;
}

export function Outlet() {
  return null;
}

export function Routes({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function Route({ element }: { element?: React.ReactNode; path?: string }) {
  return <>{element}</>;
}

export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Routes,
  Route,
};
