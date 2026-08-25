// components/blog-interaction.component.jsx

'use client'

import { useContext, useCallback, useState, useEffect, memo, useRef } from "react"
import { BlogContext } from "@/lib/blog-context"
import Link from "next/link"
import { UserContext } from "@/components/Providers"
import { toast } from "react-hot-toast"

const BlogInteraction = () => {
    const { 
        blog,
        setBlog, 
        islikedByUser,
        setlikedByUser,
        setCommentsWrapper
    } = useContext(BlogContext)

    // SAFE DESTRUCTURE: blog (or any nested key) may be undefined while
    // data is still loading, or if setBlog is ever called with a partial
    // object. Falling back to {} at each level prevents the whole
    // component from crashing on "Cannot read properties of undefined".
    const {
        _id,
        title,
        blog_id,
        activity = {},
        author
    } = blog || {}

    const { total_likes = 0, total_comments = 0 } = activity
    const author_username = author?.personal_info?.username

    const { userAuth } = useContext(UserContext)
    const { username, access_token, isAdmin } = userAuth || {}

    const [isLiking, setIsLiking] = useState(false)
    const [shareUrl, setShareUrl] = useState("")
    const likeAbortControllerRef = useRef(null)
    const checkLikeAbortControllerRef = useRef(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareUrl(window.location.href)
        }
    }, [])

    useEffect(() => {
        if (!access_token || !_id) return

        if (checkLikeAbortControllerRef.current) {
            checkLikeAbortControllerRef.current.abort()
        }

        const controller = new AbortController()
        checkLikeAbortControllerRef.current = controller

        const checkLikeStatus = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/isliked-by-user`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${access_token}`,
                        },
                        body: JSON.stringify({ _id }),
                        signal: controller.signal,
                    }
                )

                if (!response.ok) throw new Error('Failed to check like status')

                const { result } = await response.json()
                setlikedByUser(Boolean(result))

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to check like status:', err)
                }
            }
        }

        checkLikeStatus()

        return () => {
            controller.abort()
        }
    }, [_id, access_token, setlikedByUser])

    const handleLike = useCallback(async () => {
        // GUARD: don't allow a like action to fire before blog data
        // (and therefore _id) actually exists. This is what was letting
        // handleLike run against a stale/undefined blog object.
        if (!blog || !_id) {
            return
        }

        if (!access_token) {
            return toast.error("Please login to like this blog")
        }

        if (isLiking) return

        if (likeAbortControllerRef.current) {
            likeAbortControllerRef.current.abort()
        }

        const controller = new AbortController()
        likeAbortControllerRef.current = controller

        setIsLiking(true)

        const previousLikedState = islikedByUser
        const previousLikeCount = total_likes
        
        const newLikedState = !islikedByUser
        const newLikeCount = newLikedState ? total_likes + 1 : total_likes - 1
        
        setlikedByUser(newLikedState)
        setBlog(prev => {
            // GUARD: never spread/patch a prev that doesn't exist yet.
            if (!prev) return prev
            return {
                ...prev,
                activity: {
                    ...prev.activity,
                    total_likes: newLikeCount
                }
            }
        })

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/like-blog`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    },
                    body: JSON.stringify({ 
                        _id, 
                        islikedByUser: previousLikedState
                    }),
                    signal: controller.signal,
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to like blog')
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Like error:', err)
                
                setlikedByUser(previousLikedState)
                setBlog(prev => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        activity: {
                            ...prev.activity,
                            total_likes: previousLikeCount
                        }
                    }
                })
                
                toast.error(err.message || "Failed to like blog")
            }
        } finally {
            setIsLiking(false)
            likeAbortControllerRef.current = null
        }
    }, [blog, access_token, islikedByUser, total_likes, _id, setBlog, setlikedByUser, isLiking])

    const handleCommentClick = useCallback(() => {
        setCommentsWrapper(prev => !prev)
    }, [setCommentsWrapper])

    const handleCopyLink = useCallback(async () => {
        if (shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl)
                toast.success("Link copied to clipboard!")
            } catch (err) {
                console.error('Failed to copy:', err)
                toast.error("Failed to copy link")
            }
        }
    }, [shareUrl])

    // GUARD: don't build a share URL against an undefined title
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Read ${title || ''}`)}&url=${encodeURIComponent(shareUrl)}`

    // GUARD: if blog hasn't loaded yet at all, render nothing rather than
    // a broken interaction bar. Swap this for a skeleton/loader if you
    // have one.
    if (!blog) {
        return null
    }

    // FIX: this component was styled entirely with --lux-* and --gold-*
    // CSS variables (--lux-ink-2, --lux-ink-4, --lux-bg, --lux-rule-soft,
    // --gold, --gold-bright, --gold-dim, --gold-dim-2). None of those
    // tokens are defined anywhere in the project's CSS (globals.css,
    // HomeClientContent.module.css, or BlogContent's FontLoader) —
    // confirmed via project-wide search. An undefined custom property
    // used on an inherited property like `color` doesn't error, it just
    // falls back to whatever value the element inherits from its parent,
    // which is typically a low-contrast/default value. That's what made
    // the like/comment counts, icons, and borders in this component look
    // washed out on the white theme until something else (like toggling
    // the theme, which forces a full style recalculation) happened to
    // resolve it via a different code path.
    //
    // Swapped every --lux-*/--gold-* reference below for the equivalent
    // token already defined and working correctly across the rest of the
    // site in globals.css:
    //   --lux-ink-2     -> --color-text
    //   --lux-ink-4     -> --color-text-faint
    //   --lux-bg        -> --color-bg
    //   --lux-rule-soft -> --color-border-soft
    //   --gold          -> --color-accent
    //   --gold-bright   -> --color-accent-hover
    //   --gold-dim      -> --color-accent-dim
    //   --gold-dim-2    -> --color-accent-mid

    return (
        <>
            <hr className="border-[var(--color-border-soft)] my-2" />
            
            <div className="flex gap-6 justify-between items-center">
                <div className="flex gap-3 items-center">
                    <button 
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                            islikedByUser
                                ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-[var(--color-accent-hover)]"
                                : "bg-[var(--color-bg)] border-[var(--color-border-soft)] text-[var(--color-text-faint)] hover:bg-[var(--color-accent-mid)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                        }`}
                        aria-label={islikedByUser ? "Unlike blog" : "Like blog"}
                        aria-pressed={islikedByUser}
                        title={islikedByUser ? "Unlike" : "Like"}
                    >
                        <i className={`fi ${islikedByUser ? "fi-sr-heart" : "fi-rr-heart"} text-lg`}></i>
                    </button>
                    
                    <p 
                        className="text-xl text-[var(--color-text)] font-medium min-w-[2ch]" 
                        aria-label={`${total_likes} likes`}
                    >
                        {total_likes}
                    </p>

                    <button
                        onClick={handleCommentClick}
                        className="w-10 h-10 rounded-full border bg-[var(--color-bg)] border-[var(--color-border-soft)] text-[var(--color-text-faint)] transition-all duration-150 hover:bg-[var(--color-accent-mid)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:scale-110 active:scale-95 flex items-center justify-center"
                        aria-label="Toggle comments"
                        title="Comments"
                    >
                        <i className="fi fi-rr-comment-dots text-lg"></i>
                    </button>
                    
                    <p 
                        className="text-xl text-[var(--color-text)] font-medium min-w-[2ch]" 
                        aria-label={`${total_comments} comments`}
                    >
                        {total_comments}
                    </p>
                </div>

                <div className="flex gap-6 items-center">
                    {(username && author_username && username === author_username || isAdmin) && (
                        <Link 
                            href={`/editor/${blog_id}`}
                            className="underline text-[var(--color-text)] hover:text-[var(--color-accent-hover)] transition-colors duration-150 font-medium"
                            prefetch={true}
                        >
                            Edit
                        </Link>
                    )}
                    
                    <button
                        onClick={handleCopyLink}
                        className="text-[var(--color-text-faint)] transition-all duration-150 hover:scale-110 active:scale-95"
                        title="Copy link"
                        aria-label="Copy blog link"
                    >
                        <i className="fi fi-rr-link text-xl hover:text-[var(--color-accent-hover)] transition-colors duration-150"></i>
                    </button>
                    
                    <Link 
                        href={twitterShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Share on Twitter"
                        className="text-[var(--color-text-faint)] transition-all duration-150 hover:scale-110 active:scale-95"
                        aria-label="Share blog on Twitter"
                    >
                        <i className="fi fi-brands-twitter text-xl hover:text-twitter transition-colors duration-150"></i>
                    </Link>
                </div>
            </div>

            <hr className="border-[var(--color-border-soft)] my-2" />
        </>
    )
}

BlogInteraction.displayName = "BlogInteraction"

export default memo(BlogInteraction)