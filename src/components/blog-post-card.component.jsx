'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getDay } from '@/lib/date';

const BlogPostCard = ({ content, author }) => {
  if (!content || !author) return null;

  const {
    publishedAt,
    tags = [],
    banner,
    title,
    des,
    blog_id: id,
  } = content;

  const { fullname, username } = author;
  const primaryTag = tags[0] || 'Market Report';
  const dateLabel  = publishedAt ? getDay(publishedAt) : '';

  return (
    <article className="ts_editorial_row_item" itemScope itemType="https://schema.org/NewsArticle">
      <Link href={`/blog/${id}`} className="ts_editorial_card_link">
        <div className="ts_editorial_card_text">

          <div className="ts_editorial_card_meta">
            <span className="ts_editorial_card_tag">{primaryTag}</span>
            {dateLabel && (
              <>
                <span className="ts_editorial_card_divider">·</span>
                <time dateTime={publishedAt} suppressHydrationWarning>
                  {dateLabel}
                </time>
              </>
            )}
          </div>

          <h3 className="ts_editorial_card_title" itemProp="headline">{title}</h3>
          <p  className="ts_editorial_card_des"   itemProp="description">{des}</p>

          <span className="ts_editorial_card_author">
            By {fullname || `@${username}`}
          </span>

        </div>

        {banner && (
          <div className="ts_editorial_card_thumb_wrap">
            <Image
              src={banner}
              alt={title}
              fill
              // FIX: was "140px" — matched the CSS box size exactly, so
              // Next.js only ever generated a 140px-wide source file.
              // That's correct for a 1x display but soft/blurry on any
              // retina (2x+) screen, which is why this thumbnail looked
              // noticeably lower-res than the lead article image next
              // to it. 280px gives Next a real 2x target; it rounds up
              // to the nearest configured imageSizes bucket (384 in
              // next.config.js), which is a safe, already-supported
              // value — no next.config.js changes required.
              sizes="(max-width: 640px) 50vw, 280px"
              // FIX: Next.js defaults to quality 75 when unset. Setting
              // this explicitly (and matching whatever the lead image
              // uses) removes a second, independent source of the
              // HD-vs-not-HD mismatch between card types.
              quality={90}
              className="ts_editorial_card_img"
              priority={false}
            />
          </div>
        )}
      </Link>
    </article>
  );
};

export default BlogPostCard;