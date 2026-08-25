'use client'

import { UserContext, ThemeContext } from "@/components/Providers";
import { useContext, useCallback, useMemo } from "react";
import Link from "next/link";
import { removeFromSession } from "@/lib/session";
import { useRouter } from "next/navigation";

// FIX: accept an onClose callback from Navbar so this panel can close
// itself the moment any item is clicked, instead of relying solely on
// Navbar's pathname-change effect (which doesn't fire for same-route
// actions like Sign Out, and only fires *after* navigation completes
// for links, leaving the panel visibly open during that gap).
const UserNavigationPanel = ({ onClose }) => {

    const { userAuth = {}, setUserAuth } = useContext(UserContext);

    // FIX: the backend's /get-profile response (see app/user/[id]/page.jsx)
    // nests user fields under `personal_info` — personal_info.username,
    // personal_info.fullname, personal_info.profile_img, etc. The old
    // fallback chain only ever checked flat/top-level fields on userAuth,
    // so it never matched anything and silently fell through to the
    // literal string 'user' on every load. That sent every Profile /
    // Dashboard / Settings click to a route built from a username that
    // doesn't exist, which is why those pages rendered "user not found."
    // personal_info.username is now checked first; the flat fallbacks are
    // kept afterward only as a safety net in case this shape ever changes.
    const username =
        userAuth?.personal_info?.username ||
        userAuth?.username ||
        userAuth?.userName ||
        userAuth?.user_name ||
        userAuth?.personal_info?.fullname ||
        userAuth?.full_name ||
        userAuth?.fullName ||
        userAuth?.personal_info?.email?.split('@')[0] ||
        userAuth?.email?.split('@')[0] ||
        'user';

    const isAdmin = userAuth?.isAdmin ?? false;
    const { theme } = useContext(ThemeContext);
    const router = useRouter();
    const isDark = theme === "dark";

    const signOutUser = useCallback(() => {
        // Close the panel immediately and redirect without any artificial
        // delay so sign-out feels instant.
        onClose?.();

        removeFromSession("user");
        setUserAuth({ access_token: null, isAdmin: false });
        router.replace('/');
        router.refresh();
    }, [setUserAuth, router, onClose]);

    // FIX: links previously had no click handler at all, so the panel
    // only ever closed via Navbar's outside-click listener or its
    // pathname-change effect — both of which leave a visible gap where
    // the dropdown stays open after the user has already clicked an
    // option. Closing it on click gives immediate feedback.
    const handleItemClick = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const navigationItems = useMemo(() => [
        {
            href: "/editor",
            icon: "fi fi-rr-file-edit",
            label: "Write",
            show: isAdmin,
            mobileOnly: true
        },
        {
            href: `/user/${username}`,
            icon: "fi fi-rr-user",
            label: "Profile",
            show: true,
            mobileOnly: false
        },
        {
            href: "/dashboard/blogs",
            icon: "fi fi-rr-dashboard",
            label: "Dashboard",
            show: true,
            mobileOnly: false
        },
        {
            href: "/settings/edit-profile",
            icon: "fi fi-rr-settings",
            label: "Settings",
            show: true,
            mobileOnly: false
        }
    ], [isAdmin, username]);

    return (
        // This <nav> has no position of its own — Navbar.jsx's wrapper
        // (inline-styled: position: absolute; bottom: 100%) is the only
        // thing that positions this panel, opening it above the avatar.
        <nav
            className="w-60 border duration-200 shadow-lg rounded-lg overflow-hidden z-50"
            style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderColor: isDark ? "#2d2d2d" : "#E2E2E2",
                color: isDark ? "#e5e5e5" : "#242424",
            }}
            role="menu"
            aria-label="User navigation menu"
        >
            {navigationItems.map((item) =>
                item.show ? (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleItemClick}
                        className={`ts-usernav-item flex gap-3 items-center pl-8 py-4 transition-colors group ${item.mobileOnly ? 'md:hidden' : ''}`}
                        style={{ color: isDark ? "#e5e5e5" : "#242424" }}
                        role="menuitem"
                        prefetch={item.href.includes('/dashboard') || item.href.includes('/user')}
                    >
                        <i
                            className={`${item.icon} text-xl group-hover:scale-110 transition-transform`}
                            aria-hidden="true"
                        />
                        <p className="font-medium group-hover:translate-x-1 transition-transform">
                            {item.label}
                        </p>
                    </Link>
                ) : null
            )}

            <hr
                className="my-2"
                style={{ borderColor: isDark ? "#2d2d2d" : "#E2E2E2" }}
                aria-hidden="true"
            />

            <button
                className="ts-usernav-item ts-usernav-signout text-left p-4 w-full pl-8 py-4 transition-all duration-200 group"
                onClick={signOutUser}
                aria-label="Sign out"
                type="button"
                role="menuitem"
            >
                <div className="flex items-center gap-3">
                    <i
                        className="fi fi-rr-sign-out-alt text-xl group-hover:text-red group-hover:scale-110 transition-all"
                        style={{ color: isDark ? "#A8A8A8" : "#6B6B6B" }}
                        aria-hidden="true"
                    />
                    <div>
                        <h1
                            className="font-bold text-xl mb-1 group-hover:text-red transition-colors"
                            style={{ color: isDark ? "#e5e5e5" : "#242424" }}
                        >
                            Sign Out
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: isDark ? "#A8A8A8" : "#6B6B6B" }}
                        >
                            @{username}
                        </p>
                    </div>
                </div>
            </button>

            {/*
              FIX: highlight state used to be driven by JS
              onMouseEnter/onMouseLeave mutating inline style directly.
              On touch devices, mouseenter fires on tap but mouseleave
              never reliably fires when the finger moves to a different
              row (there's no real pointer to "leave" the element with),
              so the background color got stuck on whichever item was
              tapped first (the profile trigger that opened the panel).

              Fix: use real CSS :hover scoped to (hover: hover) and
              (pointer: fine) so it only applies on mice/trackpads, and
              :active for touch devices, which is re-evaluated correctly
              per-touch and never gets stuck. Per-row background colors
              are theme-aware via the isDark flag, matching the
              dark/light values that were previously set inline in JS.
            */}
            <style jsx>{`
                .ts-usernav-item {
                    background-color: transparent;
                }

                @media (hover: hover) and (pointer: fine) {
                    .ts-usernav-item:hover {
                        background-color: ${isDark ? "#2A2A2A" : "#F3F3F3"};
                    }
                    .ts-usernav-signout:hover {
                        background-color: ${isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.05)"};
                    }
                }

                .ts-usernav-item:active {
                    background-color: ${isDark ? "#2A2A2A" : "#F3F3F3"};
                }
                .ts-usernav-signout:active {
                    background-color: ${isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.05)"};
                }

                .ts-usernav-item:focus-visible {
                    background-color: ${isDark ? "#2A2A2A" : "#F3F3F3"};
                }
            `}</style>
        </nav>
    )
}

export default UserNavigationPanel;