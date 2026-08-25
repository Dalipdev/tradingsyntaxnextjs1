'use client'

import { useState, useEffect, useContext } from "react"
import Link from "next/link"
import Image from "next/image"
import axios from "axios"
import { UserContext } from "@/components/Providers"
import AboutUser from "@/components/about.component"
import BlogPostCard from "@/components/blog-post-card.component"
import InPageNavigation from "@/components/inpage-navigation.component"
import NoDataMessage from "@/components/nodata.component"
import LoadMoreDataBtn from "@/components/load-more.component"
import AnimationWrapper from "@/lib/page-animation"
import Loader from "@/components/loader.component"

export default function ProfileClient({ profile, profileId }) {
  const [blogs, setBlogs] = useState(null);
  const { userAuth: { username } = {} } = useContext(UserContext) || {};

  const {
    personal_info: { fullname, username: profile_username, profile_img, bio },
    account_info: { total_posts, total_reads },
    social_links,
    joinedAt,
    _id: user_id
  } = profile;

  useEffect(() => {
    fetchBlogs({ page: 1 });
  }, [user_id]);

  const fetchBlogs = ({ page = 1 }) => {
    axios.post(process.env.NEXT_PUBLIC_SERVER_DOMAIN + "/search-blogs", {
      author: user_id,
      page,
    })
      .then(({ data }) => {
        setBlogs(data.blogs);
      })
      .catch(err => console.error(err));
  };

  const isOwnProfile = profileId === username;

  return (
    <AnimationWrapper>
      <section className="ts-profile-section">
        <div className="ts-profile-grid">

          {/* ============================================================
              SIDEBAR — identity card
              Mobile: centered stack, full width, no border.
              Tablet (768px+): left column, modest width, top-aligned.
              Desktop (1100px+): wider column, sticky, full bordered card.
             ============================================================ */}
          <aside className="ts-profile-sidebar">
            <div className="ts-profile-card">

              <div className="ts-profile-avatar-wrap">
                <Image
                  src={profile_img}
                  alt={fullname}
                  fill
                  sizes="(max-width: 767px) 156px, (max-width: 1099px) 112px, 144px"
                  className="ts-profile-avatar"
                  priority
                />
              </div>

              <div className="ts-profile-identity">
                <h1 className="ts-profile-name">{fullname}</h1>
                <p className="ts-profile-handle">@{profile_username}</p>
              </div>

              {/* ── Signature element: data-strip stats, ticker-style ── */}
              <div className="ts-profile-stats" role="group" aria-label="Author statistics">
                <div className="ts-profile-stat">
                  <span className="ts-profile-stat-value">{total_posts.toLocaleString()}</span>
                  <span className="ts-profile-stat-label">Blogs</span>
                </div>
                <div className="ts-profile-stat-divider" aria-hidden="true" />
                <div className="ts-profile-stat">
                  <span className="ts-profile-stat-value">{total_reads.toLocaleString()}</span>
                  <span className="ts-profile-stat-label">Reads</span>
                </div>
              </div>

              {isOwnProfile && (
                <Link href="/settings/edit-profile" className="btn-light ts-profile-edit-btn">
                  Edit Profile
                </Link>
              )}

              <div className="ts-profile-about-desktop">
                <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />
              </div>

            </div>
          </aside>

          {/* ============================================================
              MAIN — feed
             ============================================================ */}
          <div className="ts-profile-main">
            <InPageNavigation routes={["Blogs Published", "About"]} defaultHidden={["About"]}>
              <>
                {!blogs ? <Loader /> : (
                  blogs.length ? (
                    <div className="ts-profile-feed">
                      {blogs.map((blog, i) => (
                        <AnimationWrapper key={blog._id || i} transition={{ duration: 1, delay: i * 0.1 }}>
                          <BlogPostCard content={blog} author={profile.personal_info} />
                        </AnimationWrapper>
                      ))}
                    </div>
                  ) : <NoDataMessage message="No blogs published" />
                )}
                {blogs && <LoadMoreDataBtn state={blogs} fetchDataFun={fetchBlogs} />}
              </>
              <div className="ts-profile-about-mobile">
                <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />
              </div>
            </InPageNavigation>
          </div>

        </div>
      </section>
    </AnimationWrapper>
  );
}