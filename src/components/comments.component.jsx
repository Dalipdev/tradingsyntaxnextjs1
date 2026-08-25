// components/comments.component.jsx

'use client'

import { useContext, useState, useEffect, useCallback, memo, useRef } from "react"
import { BlogContext } from "@/lib/blog-context"
import { UserContext } from "@/components/Providers"
import { toast } from "react-hot-toast"
import AnimationWrapper from "@/lib/page-animation"

const CommentContainer = () => {
    const {
        blog,
        setBlog,
        commentsWrapper,
        setCommentsWrapper,
        totalParentCommentLoaded,
        setTotalParentCommentLoaded,
    } = useContext(BlogContext)

    // SAFE DESTRUCTURE: same pattern as blog-interaction.component.jsx —
    // blog (or any nested key) may briefly be undefined/incomplete
    // while loading, so fall back to {} at each level instead of
    // crashing the whole panel.
    const {
        _id,
        title,
        comments = {},
        activity = {},
        author
    } = blog || {}

    const { results: commentsArr = [] } = comments
    const { total_parent_comments = 0 } = activity

    const { userAuth } = useContext(UserContext)
    const { access_token, username, fullname, profile_img } = userAuth || {}

    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const textareaRef = useRef(null)
    const abortControllerRef = useRef(null)

    useEffect(() => {
        if (commentsWrapper && commentsArr.length === 0) {
            loadComments()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commentsWrapper])

    const loadComments = useCallback(async ({ skip = 0 } = {}) => {
        if (isLoading || !_id) return

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoading(true)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-blog-comments`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blog_id: _id, skip }),
                    signal: controller.signal,
                }
            )

            if (!response.ok) throw new Error('Failed to load comments')

            const data = await response.json()

            setBlog(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    comments: {
                        ...prev.comments,
                        results: skip > 0
                            ? [...(prev.comments?.results || []), ...data]
                            : data
                    }
                }
            })

            setTotalParentCommentLoaded(skip + data.length)

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error loading comments:', err)
                toast.error('Failed to load comments')
            }
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }, [_id, setBlog, setTotalParentCommentLoaded, isLoading])

    const handleComment = useCallback(async () => {
        // GUARD: don't let this run before blog/author data is ready.
        if (!blog || !_id || !author?._id) {
            return toast.error("Blog is still loading, try again in a moment")
        }

        if (!access_token) {
            return toast.error("Please login to comment")
        }

        if (!comment.trim()) {
            return toast.error("Write something to comment")
        }

        if (isSubmitting) return

        setIsSubmitting(true)
        const submittingToast = toast.loading("Adding comment...")

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/add-comment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    },
                    body: JSON.stringify({
                        _id,
                        // FIX: backend expects blog_author to be an
                        // ObjectId reference (schema: Cast to ObjectId).
                        // Previously this sent the username STRING
                        // (blog.author.personal_info.username), which
                        // fails Mongoose's cast and throws a 500.
                        // Send the actual author document _id instead.
                        blog_author: author._id,
                        comment: comment.trim(),
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to add comment')
            }

            const newComment = await response.json()

            toast.dismiss(submittingToast)
            toast.success("Comment added successfully!")

            setBlog(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    comments: {
                        ...prev.comments,
                        results: [newComment, ...(prev.comments?.results || [])]
                    },
                    activity: {
                        ...prev.activity,
                        total_comments: (prev.activity?.total_comments || 0) + 1,
                        total_parent_comments: (prev.activity?.total_parent_comments || 0) + 1
                    }
                }
            })

            setComment("")
            setTotalParentCommentLoaded(prev => prev + 1)

            textareaRef.current?.focus()

        } catch (err) {
            console.error('Comment error:', err)
            toast.dismiss(submittingToast)
            toast.error(err.message || "Failed to add comment")
        } finally {
            setIsSubmitting(false)
        }
    }, [blog, access_token, comment, _id, author, setBlog, setTotalParentCommentLoaded, isSubmitting])

    const handleKeyDown = useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleComment()
        }
    }, [handleComment])

    if (!commentsWrapper) return null

    return (
        <div className="max-w-[900px] center">
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setCommentsWrapper(false)} />

            <div
                className="fixed top-0 right-0 w-full md:w-[30%] h-screen bg-[var(--color-surface)] border-l border-[var(--color-border)] z-50 overflow-y-auto"
                style={{ boxShadow: "var(--shadow-popover)" }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-medium text-[var(--color-text)]" style={{ fontFamily: "var(--font-display)" }}>
                            Comments
                        </h2>
                        <button
                            onClick={() => setCommentsWrapper(false)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
                            aria-label="Close comments"
                        >
                            <i className="fi fi-rr-cross text-2xl"></i>
                        </button>
                    </div>

                    {access_token ? (
                        <div className="mb-6">
                            <textarea
                                ref={textareaRef}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Leave a comment..."
                                className="w-full input-box pl-5 resize-none h-[100px] overflow-auto"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[var(--color-text-faint)] mt-1">
                                Press Ctrl+Enter to submit
                            </p>
                            <button
                                onClick={handleComment}
                                disabled={isSubmitting || !comment.trim()}
                                className="btn-dark mt-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Posting...
                                    </span>
                                ) : (
                                    "Add Comment"
                                )}
                            </button>
                        </div>
                    ) : (
                        <p className="text-center text-[var(--color-text-faint)] mb-6">
                            <a href="/signin" className="underline text-[var(--color-accent)]">Login</a> to leave a comment
                        </p>
                    )}

                    <div>
                        {commentsArr && commentsArr.length > 0 ? (
                            <>
                                {commentsArr.map((c, i) => (
                                    <AnimationWrapper key={c._id || i}>
                                        <CommentCard commentData={c} />
                                    </AnimationWrapper>
                                ))}

                                {total_parent_comments > totalParentCommentLoaded && (
                                    <button
                                        onClick={() => loadComments({ skip: totalParentCommentLoaded })}
                                        disabled={isLoading}
                                        className="text-[var(--color-text-faint)] p-2 px-3 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] rounded-md flex items-center gap-2 mx-auto disabled:opacity-50"
                                    >
                                        {isLoading ? "Loading..." : "Load More"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-[var(--color-text-faint)]">No comments yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const CommentCard = memo(({ commentData }) => {
    const {
        comment,
        commented_by,
        commentedAt
    } = commentData || {}

    const { personal_info } = commented_by || {}
    const { fullname, username, profile_img } = personal_info || {}

    return (
        <div className="w-full mb-4 pb-4 border-b border-[var(--color-border)]">
            <div className="flex gap-3 items-start">
                <img 
                    src={profile_img} 
                    className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                    alt={fullname}
                />
                <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--color-text)]">{fullname}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">@{username}</p>
                    <p className="mt-2 text-[var(--color-text-muted)]">{comment}</p>
                </div>
            </div>
        </div>
    )
})

CommentCard.displayName = "CommentCard"

export default memo(CommentContainer)