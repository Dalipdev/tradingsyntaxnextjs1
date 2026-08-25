import HomeClientContent from './HomeClientContent';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com';
const SERVER   = process.env.NEXT_PUBLIC_SERVER_DOMAIN;

// FIXED: Ensures data still fetches during local dev when using a production/remote API server
const ENABLE_SSR_API = Boolean(SERVER);

export const metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: { type: 'website', url: SITE_URL },
};

async function getInitialData() {
  if (!ENABLE_SSR_API) return { blogs: null, trending: [] };

  try {
    // 🔧 FIX: fetchWithTimeout's global defaults were bumped (retries 1→2,
    // retryDelay 500ms→1500ms) to help client-side calls tolerate Render
    // cold starts. But that makes SSR calls here take up to ~39s worst case
    // before falling back — too long for a real visitor's first page load.
    // These two calls now explicitly override retries/retryDelay to fail
    // fast (~1 retry, short delay) so the homepage renders its graceful
    // fallback (empty state) quickly on a cold backend, rather than making
    // the visitor wait tens of seconds for SSR to resolve.
    const [blogsRes, trendingRes] = await Promise.allSettled([
      fetchWithTimeout(
        `${SERVER}/latest-blogs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: 1 }),
          next: { revalidate: 300 },
        },
        { timeout: 8000, fallback: null, retries: 1, retryDelay: 800 }
      ),
      fetchWithTimeout(
        `${SERVER}/trending-blogs`,
        {
          next: { revalidate: 600 },
        },
        { timeout: 8000, fallback: null, retries: 1, retryDelay: 800 }
      ),
    ]);

    const rawBlogs =
      blogsRes.status === 'fulfilled' && blogsRes.value.ok
        ? await blogsRes.value.json()
        : null;

    const blogs = rawBlogs
      ? rawBlogs.results && Array.isArray(rawBlogs.results)
        ? rawBlogs
        : rawBlogs.blogs && Array.isArray(rawBlogs.blogs)
        ? {
            results:   rawBlogs.blogs,
            page:      rawBlogs.page || 1,
            totalDocs: rawBlogs.totalDocs ?? rawBlogs.blogs.length,
          }
        : null
      : null;

    const trendingData =
      trendingRes.status === 'fulfilled' && trendingRes.value.ok
        ? await trendingRes.value.json()
        : null;

    const trending = trendingData
      ? Array.isArray(trendingData)           ? trendingData
      : Array.isArray(trendingData.blogs)     ? trendingData.blogs
      : Array.isArray(trendingData.results)   ? trendingData.results
      : Array.isArray(trendingData.data)      ? trendingData.data
      : []
      : [];

    return { blogs: blogs || null, trending };
  } catch {
    return { blogs: null, trending: [] };
  }
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are Smart Money Concepts (SMC) in trading?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Smart Money Concepts (SMC) is a trading methodology focusing on institutional order flow.',
      },
    },
  ],
};

function buildArticleListSchema(blogs) {
  if (!blogs?.results?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Latest Trading Articles — TradingSyntax',
    url: SITE_URL,
    numberOfItems: blogs.results.length,
    itemListElement: blogs.results.slice(0, 10).map((blog, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'BlogPosting',
        headline:     blog.title,
        description: blog.des || blog.description || '',
        url:         `${SITE_URL}/blog/${blog.blog_id || blog._id}`,
      },
    })),
  };
}

function buildWebPageSchema(blogsCount) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/#webpage`,
    url:  SITE_URL,
    name: 'TradingSyntax — Smart Money Concepts',
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

function SSRBlogList({ blogs }) {
  if (!blogs?.results?.length) return null;
  return (
    <section aria-label="Latest trading articles" style={{ display: 'none' }} aria-hidden="true">
      <h2>Latest Trading Articles</h2>
      <ul>
        {blogs.results.map((blog) => (
          <li key={blog._id || blog.blog_id}>
            <article itemScope itemType="https://schema.org/BlogPosting">
              <h3 itemProp="headline">
                <a href={`/blog/${blog.blog_id || blog._id}`} itemProp="url">
                  {blog.title}
                </a>
              </h3>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const { blogs, trending } = await getInitialData();

  const articleListSchema = buildArticleListSchema(blogs);
  const webPageSchema     = buildWebPageSchema(blogs?.totalDocs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {articleListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleListSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <SSRBlogList blogs={blogs} />

      <HomeClientContent
        initialBlogs={blogs || { results: [], totalDocs: 0 }}
        initialTrending={trending}
        serverReady={Boolean(blogs?.results?.length)}
      />
    </>
  );
}