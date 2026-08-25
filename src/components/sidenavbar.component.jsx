'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserContext } from "@/components/Providers";
import { useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";

const SideNav = () => {
  const { userAuth: { isAdmin, access_token, new_notification_available } = {} } = useContext(UserContext);
  const pathname = usePathname();

  const page = useMemo(() => {
    return pathname?.split("/")[2] || "dashboard";
  }, [pathname]);

  const pageLabel = useMemo(() => page.replace(/-/g, " "), [page]);

  const [showSideNav, setShowSideNav] = useState(false);

  const sidebarRef = useRef(null);
  const toggleBarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  const [toggleBarHeight, setToggleBarHeight] = useState(56);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setShowSideNav(false);
  }, [pathname]);

  // Measure the mobile toggle bar height so overlay/sidebar offsets are
  // always correct instead of relying on a hardcoded magic number.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const measure = () => {
      if (toggleBarRef.current) {
        setToggleBarHeight(toggleBarRef.current.offsetHeight);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeof window !== "undefined" && showSideNav && window.innerWidth < 768) {
        const sidebar = sidebarRef.current;
        const toggleButton = toggleButtonRef.current;

        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          toggleButton &&
          !toggleButton.contains(event.target)
        ) {
          setShowSideNav(false);
        }
      }
    };

    if (showSideNav) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [showSideNav]);

  useEffect(() => {
    if (typeof window !== "undefined" && showSideNav && window.innerWidth < 768) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showSideNav]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showSideNav) {
        setShowSideNav(false);
      }
    };

    if (showSideNav) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showSideNav]);

  const toggleSideNav = useCallback(() => {
    setShowSideNav((prev) => !prev);
  }, []);

  const closeSideNav = useCallback(() => {
    setShowSideNav(false);
  }, []);

  const navigationLinks = useMemo(
    () => [
      {
        href: "/dashboard/blogs",
        icon: "fi fi-rr-document",
        label: "Blogs",
        show: true,
      },
      {
        href: "/dashboard/notifications",
        icon: "fi fi-rr-bell",
        label: "Notifications",
        show: true,
        badge: new_notification_available,
      },
      {
        href: "/editor",
        icon: "fi fi-rr-file-edit",
        label: "Write",
        show: isAdmin,
      },
    ],
    [isAdmin, new_notification_available]
  );

  const settingsLinks = useMemo(
    () => [
      {
        href: "/settings/edit-profile",
        icon: "fi fi-rr-user",
        label: "Edit Profile",
      },
      {
        href: "/settings/change-password",
        icon: "fi fi-rr-lock",
        label: "Change Password",
      },
    ],
    []
  );

  const isActive = useCallback(
    (href) => pathname === href || pathname?.startsWith(`${href}/`),
    [pathname]
  );

  if (access_token === null) {
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    return null;
  }

  const renderLink = (link) => {
    const active = isActive(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={closeSideNav}
        prefetch={link.href.includes("/dashboard")}
        aria-current={active ? "page" : undefined}
        className={
          "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium capitalize transition-all duration-200 " +
          (active
            ? "bg-purple/10 text-purple"
            : "text-dark-grey hover:bg-grey/40 hover:text-black")
        }
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-purple"
            aria-hidden="true"
          />
        )}
        <div className="relative flex w-5 flex-none items-center justify-center">
          <i
            className={`${link.icon} text-[18px] transition-transform duration-200 group-hover:scale-110 ${
              active ? "text-purple" : ""
            }`}
            aria-hidden="true"
          ></i>
          {link.badge && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-red ring-2 ring-white"
              aria-label="New notifications available"
            />
          )}
        </div>
        <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
          {link.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="w-full max-w-full md:sticky md:top-0 md:z-30 md:w-auto md:flex-none">
      {/* Mobile top bar — fixed (not sticky) so it's pinned flush to the
          very top of the viewport with zero gap, regardless of any
          margin/padding on parent containers. A spacer below pushes
          page content down by the bar's real height. */}
      <div
        ref={toggleBarRef}
        className="fixed inset-x-0 top-0 z-40 m-0 flex w-full items-center gap-1 border-b border-grey bg-white px-2 py-2 md:hidden"
      >
        <button
          ref={toggleButtonRef}
          className="flex flex-none items-center justify-center rounded-lg p-3 text-xl transition-colors hover:bg-grey/40 active:scale-95"
          onClick={toggleSideNav}
          aria-label="Toggle sidebar menu"
          aria-expanded={showSideNav}
          type="button"
        >
          <i className="fi fi-rr-bars-staggered pointer-events-none" aria-hidden="true"></i>
        </button>

        <span className="min-w-0 flex-1 truncate px-2 py-3 text-[15px] font-semibold capitalize">
          {pageLabel}
        </span>
      </div>

      {/* Spacer so fixed bar doesn't overlap page content underneath it */}
      <div className="md:hidden" style={{ height: toggleBarHeight }} aria-hidden="true" />

      {/* Overlay for mobile */}
      {showSideNav && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          style={{ top: toggleBarHeight }}
          onClick={closeSideNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed width on desktop so it reads as a real column
          rather than stretching to fill the parent.
          FIX: h-[...] -> max-h-[...] on both the desktop (md:) and mobile
          (max-md:) variants. A fixed `h-` forces this element to always be
          exactly `100vh - offset` tall and always reserves an overflow-y
          scroll container, even when the nav's actual content (a handful
          of links) is far shorter than the viewport. That created a second,
          independently-scrolling element sitting right next to the page's
          own <html> scrollbar. `max-h-` only caps the height as an upper
          bound — the nav sizes to its content, and only becomes its own
          scroll container on the rare screen where the links genuinely
          exceed the available height. */}
      <nav
        ref={sidebarRef}
        style={{ top: `${toggleBarHeight}px` }}
        className={
          "box-border bg-white p-5 transition-transform duration-300 ease-out " +
          "md:sticky md:top-20 md:max-h-[calc(100vh-80px)] md:w-[220px] md:flex-none md:overflow-y-auto md:border-r md:border-grey md:p-6 md:pr-4 " +
          "lg:w-[248px] " +
          "max-md:fixed max-md:left-0 max-md:z-50 max-md:max-h-[calc(100vh-56px)] max-md:w-[min(300px,85vw)] max-md:overflow-y-auto max-md:shadow-2xl " +
          (!showSideNav ? "max-md:-translate-x-full" : "max-md:translate-x-0")
        }
        aria-label="Dashboard navigation"
      >
        <div className="mb-7">
          <h1 className="mb-3 text-lg font-bold text-dark-grey md:text-xl">Dashboard</h1>
          <hr className="border-grey" />
        </div>

        <div className="space-y-1">
          {navigationLinks.map((link) => (link.show ? renderLink(link) : null))}
        </div>

        <div className="mb-3 mt-10 md:mt-14">
          <h1 className="mb-3 text-lg font-bold text-dark-grey md:text-xl">Settings</h1>
          <hr className="border-grey" />
        </div>

        <div className="space-y-1">{settingsLinks.map((link) => renderLink(link))}</div>

        {/* Close button for mobile */}
        <button
          className="mt-8 w-full rounded-lg bg-grey/60 px-4 py-3 text-center font-medium transition-colors hover:bg-grey active:scale-[0.98] md:hidden"
          onClick={closeSideNav}
          aria-label="Close sidebar"
          type="button"
        >
          Close Menu
        </button>
      </nav>
    </div>
  );
};

export default SideNav;