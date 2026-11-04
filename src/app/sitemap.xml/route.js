
const SERVER_DOMAIN = (
  process.env.NEXT_PUBLIC_SERVER_DOMAIN || "https://api.tradingsyntax.com"
).replace(/\/+$/, "");

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://tradingsyntax.com"
).replace(/\/+$/, "");

const MAX_URLS = 50000;
const MAX_BYTES = 50 * 1024 * 1024;
const BLOG_PAGE_SIZE = 500;
const USER_PAGE_SIZE = 500;
const FETCH_TIMEOUT = 20000;

export const dynamic = "force-dynamic";
export const revalidate = 300;

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "X-Content-Type-Options": "nosniff",
};

const STATIC_PAGES = [
  {
    path: "/",
    priority: "1.0",
    changefreq: "daily",
  },
  {
    path: "/blog",
    priority: "0.9",
    changefreq: "daily",
  },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeUrl(value, allowedHosts = []) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    if (allowedHosts.length && !allowedHosts.includes(url.hostname)) {
      return null;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function absoluteSiteUrl(path) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function isValidSlug(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 250 &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

function isPublicBlog(blog) {
  if (!blog || typeof blog !== "object") return false;

  if (!isValidSlug(blog.blog_id)) return false;

  // Exclude drafts and unpublished content.
  if (blog.draft === true) return false;
  if (blog.isPublished === false) return false;
  if (blog.published === false) return false;

  // Exclude deleted, archived, or hidden content.
  if (blog.deleted === true) return false;
  if (blog.isDeleted === true) return false;
  if (blog.archived === true) return false;
  if (blog.isArchived === true) return false;
  if (blog.isHidden === true) return false;

  if (
    typeof blog.status === "string" &&
    !["published", "public", "active"].includes(
      blog.status.toLowerCase()
    )
  ) {
    return false;
  }

  // Require a publication date.
  if (!safeDate(blog.publishedAt)) return false;

  return true;
}

function isPublicUser(user) {
  if (!user || typeof user !== "object") return false;

  const username =
    user.personal_info?.username || user.username;

  if (!isValidSlug(username)) return false;

  if (user.deleted === true) return false;
  if (user.isDeleted === true) return false;
  if (user.suspended === true) return false;
  if (user.isSuspended === true) return false;
  if (user.isPrivate === true) return false;
  if (user.public === false) return false;

  return true;
}

function createUrlEntry({
  loc,
  lastmod,
  changefreq,
  priority,
  image,
}) {
  const safeLoc = normalizeUrl(loc);

  if (!safeLoc || !safeLoc.startsWith(`${SITE_URL}/`) &&
      safeLoc !== SITE_URL) {
    return null;
  }

  let xml = `<url><loc>${escapeXml(safeLoc)}</loc>`;

  const validLastmod = safeDate(lastmod);

  if (validLastmod) {
    xml += `<lastmod>${validLastmod}</lastmod>`;
  }

  if (changefreq) {
    xml += `<changefreq>${changefreq}</changefreq>`;
  }

  if (priority) {
    xml += `<priority>${priority}</priority>`;
  }

  if (image) {
    const safeImage = normalizeUrl(image, [
      "images.unsplash.com",
      "plus.unsplash.com",
      "res.cloudinary.com",
      "tradingsyntax.com",
      "api.tradingsyntax.com",
      "supabase.co",
    ]);

    if (safeImage) {
      xml += `<image:image><image:loc>${escapeXml(
        safeImage
      )}</image:loc></image:image>`;
    }
  }

  xml += "</url>";

  return xml;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${url}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBlogs() {
  const allBlogs = [];
  const seenIds = new Set();

  let page = 1;

  while (allBlogs.length < MAX_URLS) {
    const data = await fetchJson(
      `${SERVER_DOMAIN}/search-blogs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          limit: BLOG_PAGE_SIZE,
        }),
      }
    );

    if (!Array.isArray(data?.blogs)) {
      throw new Error(
        "Invalid /search-blogs response: expected blogs array"
      );
    }

    const blogs = data.blogs;

    for (const blog of blogs) {
      if (!isPublicBlog(blog)) continue;

      if (seenIds.has(blog.blog_id)) continue;

      seenIds.add(blog.blog_id);
      allBlogs.push(blog);
    }

    if (blogs.length < BLOG_PAGE_SIZE) break;

    page++;
  }

  return allBlogs;
}

async function fetchUsers() {
  const allUsers = [];
  const seenUsernames = new Set();

  let page = 1;

  while (allUsers.length < MAX_URLS) {
    const url = new URL(`${SERVER_DOMAIN}/all-users`);

    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(USER_PAGE_SIZE));

    const data = await fetchJson(url.toString());

    if (!Array.isArray(data?.users)) {
      throw new Error(
        "Invalid /all-users response: expected users array"
      );
    }

    const users = data.users;

    for (const user of users) {
      if (!isPublicUser(user)) continue;

      const username =
        user.personal_info?.username || user.username;

      if (seenUsernames.has(username)) continue;

      seenUsernames.add(username);
      allUsers.push({
        ...user,
        _sitemapUsername: username,
      });
    }

    if (users.length < USER_PAGE_SIZE) break;

    page++;
  }

  return allUsers;
}

function generateSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>`;
}

export async function GET() {
  try {
    // Fetch both data sources. If either fails, do not publish
    // an incomplete sitemap as a successful response.
    const [blogs, users] = await Promise.all([
      fetchBlogs(),
      fetchUsers(),
    ]);

    const entries = [];
    const seenUrls = new Set();

    function addEntry(entry) {
      if (!entry) return;

      const match = entry.match(/<loc>(.*?)<\/loc>/);

      if (!match) return;

      const url = match[1];

      if (seenUrls.has(url)) return;

      seenUrls.add(url);
      entries.push(entry);
    }

    // Static indexable pages.
    for (const page of STATIC_PAGES) {
      addEntry(
        createUrlEntry({
          loc: absoluteSiteUrl(page.path),
          lastmod: null,
          changefreq: page.changefreq,
          priority: page.priority,
        })
      );
    }

    // Published blog articles.
    for (const blog of blogs) {
      const lastmod =
        safeDate(blog.updatedAt) ||
        safeDate(blog.publishedAt);

      addEntry(
        createUrlEntry({
          loc: absoluteSiteUrl(
            `/blog/${encodeURIComponent(blog.blog_id)}`
          ),
          lastmod,
          changefreq: "weekly",
          priority: "0.8",
          image: blog.banner,
        })
      );
    }

    // Public user profiles.
    for (const user of users) {
      const username = user._sitemapUsername;

      addEntry(
        createUrlEntry({
          loc: absoluteSiteUrl(
            `/user/${encodeURIComponent(username)}`
          ),
          lastmod: safeDate(user.updatedAt),
          changefreq: "monthly",
          priority: "0.6",
        })
      );
    }

    // Sitemap protocol limit: maximum 50,000 URLs.
    if (entries.length > MAX_URLS) {
      throw new Error(
        `Sitemap contains ${entries.length} URLs. A sitemap index is required.`
      );
    }

    const xml = generateSitemapXml(entries);

    // Sitemap protocol limit: 50 MB uncompressed.
    if (Buffer.byteLength(xml, "utf8") > MAX_BYTES) {
      throw new Error(
        "Sitemap exceeds the 50 MB uncompressed limit."
      );
    }

    return new Response(xml, {
      status: 200,
      headers: XML_HEADERS,
    });
  } catch (error) {
    console.error("[SITEMAP ERROR]", error);

    // Do not return a misleading incomplete sitemap with HTTP 200.
    return new Response(
      "Sitemap temporarily unavailable",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "Retry-After": "300",
        },
      }
    );
  }
}
