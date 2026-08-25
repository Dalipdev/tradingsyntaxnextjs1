"use client";

import {
  useContext,
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { UserContext, ThemeContext } from "@/components/Providers";
import dynamic from "next/dynamic";
import axios from "axios";
import { storeInSession } from "../lib/session";

const logo = "/imgs/logo.png";

const UserNavigationPanel = dynamic(
  () => import("./user-navigation.component"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-48 h-32 bg-white rounded-lg shadow-lg animate-pulse"
        style={{
          position: "absolute",
          right: 0,
          bottom: "100%",
          marginBottom: "8px",
          zIndex: 50,
        }}
      />
    ),
  },
);

const NavbarResponsiveStyles = () => (
  <style suppressHydrationWarning>{`
.ts-navbar-logo-wrap {
  position: relative;
  height: clamp(28px, 5vw, 56px);
  width: clamp(110px, 18vw, 140px);
}

    .ts-navbar-brand-search {
      display: flex;
      align-items: center;
      gap: clamp(6px, 1.4vw, 14px);
      flex: 1 1 auto;
      min-width: 0;
    }

    .ts-navbar-iconbtn {
      width: clamp(36px, 10vw, 48px);
      height: clamp(36px, 10vw, 48px);
    }

    .ts-navbar-actions {
      gap: clamp(4px, 1.6vw, 12px);
    }
    @media (min-width: 768px) {
      .ts-navbar-actions {
        gap: 24px;
      }
    }

    @media (min-width: 768px) and (max-width: 900px) {
      .ts-navbar-search {
        width: 12rem !important;
      }
    }
  `}</style>
);

const Navbar = () => {
  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [domTheme, setDomTheme] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const searchInputRef = useRef(null);
  const userNavRef = useRef(null);

  const { theme, setTheme } = useContext(ThemeContext);
  const { userAuth, setUserAuth } = useContext(UserContext);

  const router = useRouter();
  const pathname = usePathname();

  const access_token = userAuth?.access_token;
  // FIX: backend returns user fields nested under `personal_info`
  // (confirmed by /get-profile using personal_info.username /
  // personal_info.fullname) — not flat on userAuth. Falling back to
  // the flat field keeps this safe if the shape ever changes.
  const profile_img = userAuth?.personal_info?.profile_img || userAuth?.profile_img;
  const new_notification_available = userAuth?.new_notification_available;
  const isAdmin = userAuth?.isAdmin;

  useEffect(() => {
    setMounted(true);
    const initialDomTheme = document.body.getAttribute("data-theme");
    const normalized =
      initialDomTheme === "dark" || initialDomTheme === "light"
        ? initialDomTheme
        : "light";
    setDomTheme(normalized);
    if (normalized !== theme) {
      setTheme(normalized);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "data-theme") {
          const next = document.body.getAttribute("data-theme");
          if (next === "dark" || next === "light") {
            setDomTheme(next);
          }
        }
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!access_token) return;

    const controller = new AbortController();
    const runNotificationFetch = () => {
      axios
        .get(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/new-notification`, {
          headers: { Authorization: `Bearer ${access_token}` },
          signal: controller.signal,
          timeout: 5000,
        })
        .then(({ data }) => {
          setUserAuth((prev) => ({ ...prev, ...data }));
        })
        .catch((err) => {
          if (err.name !== "CanceledError") {
            console.error("Failed to fetch notifications:", err);
          }
        });
    };

    let idleTimer = null;
    const schedule = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? () => {
          idleTimer = window.requestIdleCallback(runNotificationFetch);
        }
      : () => {
          idleTimer = setTimeout(runNotificationFetch, 200);
        };

    schedule();

    return () => {
      controller.abort();
      if (idleTimer !== null) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleTimer === 'number') {
          window.cancelIdleCallback(idleTimer);
        } else {
          clearTimeout(idleTimer);
        }
      }
    };
  }, [access_token, setUserAuth]);

  useEffect(() => {
    setSearchBoxVisibility(false);
    setSearchQuery("");
    setUserNavPanel(false);
  }, [pathname]);

  useEffect(() => {
    if (!userNavPanel) return;

    const handlePointerDown = (e) => {
      if (userNavRef.current && !userNavRef.current.contains(e.target)) {
        setUserNavPanel(false);
      }
    };

    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [userNavPanel]);

  const handleUserNavPanel = useCallback(() => {
    setUserNavPanel((prev) => !prev);
  }, []);

  const closeUserNavPanel = useCallback(() => {
    setUserNavPanel(false);
  }, []);

  const handleLogoClick = useCallback(
    (e) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [pathname],
  );

  const handleSearch = useCallback(
    (e) => {
      if (e.key === "Enter" && searchQuery.trim().length) {
        router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
        setSearchBoxVisibility(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router],
  );

  const toggleSearchBox = useCallback(() => {
    setSearchBoxVisibility((prev) => {
      const newState = !prev;
      if (newState) setTimeout(() => searchInputRef.current?.focus(), 100);
      return newState;
    });
  }, []);

  const changeTheme = useCallback(() => {
    const currentDomTheme = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const newTheme = currentDomTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
    setDomTheme(newTheme);
    storeInSession("theme", newTheme);
  }, [setTheme]);

  const effectiveTheme = domTheme ?? theme;

  const handleLogoError = useCallback(() => {
    console.warn(
      `[Navbar] Logo failed to load: "${logo}". ` +
      `Check that this file exists at public${logo} and is a valid, non-empty image.`
    );
    setLogoFailed(true);
  }, []);

  const themeIcon = !mounted ? "fi-rr-moon-stars" : effectiveTheme === "light" ? "fi-rr-moon-stars" : "fi-rr-sun";
  const themeLabel = !mounted ? "Switch to dark mode" : `Switch to ${effectiveTheme === "light" ? "dark" : "light"} mode`;
  const isEditorPage = pathname?.startsWith("/editor");

  const iconBtnClass =
    "ts-navbar-iconbtn rounded-full relative active:scale-95 transition-all duration-200 hover:opacity-80";
  const iconBtnStyle = {
    backgroundColor: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
  };

  if (isEditorPage) return null;

  return (
    <>
      <NavbarResponsiveStyles />
      <nav className="navbar">
        <div className="ts-navbar-brand-search">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex-none flex items-center"
            aria-label="TradingSyntax home"
          >
            <div className="ts-navbar-logo-wrap">
              {!logoFailed && (
                <Image
                  src={logo}
                  alt="TradingSyntax"
                  fill
                  priority
                  sizes="(max-width: 480px) 90px, 140px"
                  style={{ objectFit: "contain", objectPosition: "left center" }}
                  onError={handleLogoError}
                />
              )}
            </div>
          </Link>

          <div className="hidden md:block md:w-64 lg:w-80 flex-none ts-navbar-search">
            <div className="relative">
              <input
                suppressHydrationWarning
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full p-4 pl-12 pr-6 rounded-full input-box focus:outline-none focus-visible:outline-none"
                aria-label="Search blogs"
                maxLength={100}
              />
              <i className="fi fi-rr-search input-icon absolute left-5 top-1/2 -translate-y-1/2 text-xl pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="flex items-center ts-navbar-actions ml-auto">
          <button
            suppressHydrationWarning
            className={`md:hidden ${iconBtnClass} flex items-center justify-center`}
            style={iconBtnStyle}
            onClick={toggleSearchBox}
            aria-label={searchBoxVisibility ? "Close search" : "Open search"}
          >
            <i
              className={`fi ${searchBoxVisibility ? "fi-rr-cross" : "fi-rr-search"} text-xl`}
              aria-hidden="true"
              style={{ color: "var(--color-text)" }}
            />
          </button>

          {isAdmin && (
            <Link
              href="/editor"
              className="hidden md:flex gap-2 items-center px-4 py-3 opacity-75 hover:opacity-100 hover:text-purple transition-colors duration-200"
              style={{ color: "var(--color-text)" }}
              prefetch={true}
            >
              <i className="fi fi-rr-file-edit" aria-hidden="true" />
              <p>Write</p>
            </Link>
          )}

          <button
            suppressHydrationWarning
            className={iconBtnClass}
            style={iconBtnStyle}
            onClick={changeTheme}
            aria-label={themeLabel}
          >
            <i className={`fi ${themeIcon} text-2xl block mt-1`} aria-hidden="true" suppressHydrationWarning style={{ color: "var(--color-text)" }} />
          </button>

          {access_token ? (
            <>
              <Link href="/dashboard/notifications" aria-label={new_notification_available ? "New notifications available" : "Notifications"}>
                <button suppressHydrationWarning className={iconBtnClass} style={iconBtnStyle}>
                  <i className="fi fi-rr-bell text-2xl block mt-1" aria-hidden="true" style={{ color: "var(--color-text)" }} />
                  {new_notification_available && (
                    <span className="w-3 h-3 rounded-full absolute z-10 top-2 right-2 animate-pulse" style={{ background: "var(--color-accent)" }} aria-label="New notification indicator" />
                  )}
                </button>
              </Link>

              <div ref={userNavRef} className="relative z-50">
                <button
                  suppressHydrationWarning
                  className="ts-navbar-iconbtn mt-1 transition-all duration-200 rounded-full active:scale-95 hover:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-border-strong)' }}
                  onClick={handleUserNavPanel}
                  aria-label="User menu"
                  aria-expanded={userNavPanel}
                >
                  <div
                    className="ts-navbar-iconbtn relative rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      border: "1px solid var(--color-border-strong)",
                    }}
                  >
                    {profile_img ? (
                      <Image
                        src={profile_img}
                        alt="Profile"
                        fill
                        sizes="48px"
                        quality={90}
                        className="object-cover"
                        priority
                        unoptimized={true}
                      />
                    ) : (
                      <i
                        className="fi fi-rr-user text-lg"
                        aria-hidden="true"
                        style={{ color: "var(--color-text)" }}
                      />
                    )}
                  </div>
                </button>

                {/*
                  FIX: switched from Tailwind's `absolute right-0
                  bottom-full mb-2 z-50` classes to equivalent INLINE
                  styles. The Tailwind classes were logically correct
                  (bottom-full anchors the panel's bottom edge to the
                  top of this relatively-positioned wrapper — i.e. it
                  should already render above), but it kept rendering
                  below anyway, which means something with higher CSS
                  specificity was overriding the computed `position`
                  or `bottom` value (most likely candidates: a global
                  `nav { ... }` selector in globals.css catching the
                  child panel's own <nav> root element, or a Tailwind
                  class getting dropped/overridden in the build).

                  Inline styles beat any stylesheet rule that isn't
                  using `!important`, so this guarantees the panel
                  opens above the avatar regardless of what else is
                  happening in global CSS. This wrapper remains the
                  ONLY thing that positions the panel —
                  UserNavigationPanel's own <nav> still has no
                  position of its own.
                */}
                {userNavPanel && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: "100%",
                      marginBottom: "8px",
                      zIndex: 50,
                    }}
                  >
                    <UserNavigationPanel onClose={closeUserNavPanel} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link className="btn-dark py-2 transition-all duration-200 hover:shadow-lg active:scale-95" href="/signin">
                Sign In
              </Link>
              <Link className="btn-light py-2 hidden md:block transition-all duration-200 hover:shadow-lg active:scale-95" href="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {searchBoxVisibility && (
        <div
          className="md:hidden w-full px-4 py-3 border-t z-40"
          style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
        >
          <div className="relative">
            <input
              suppressHydrationWarning
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full p-4 pl-12 pr-6 rounded-full input-box focus:outline-none focus-visible:outline-none"
              aria-label="Search blogs"
              maxLength={100}
            />
            <i className="fi fi-rr-search input-icon absolute left-5 top-1/2 -translate-y-1/2 text-xl pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  );
};

Navbar.displayName = "Navbar";
export default memo(Navbar); 