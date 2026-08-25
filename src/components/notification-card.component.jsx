import Link from "next/link";
import Image from "next/image";
import { getDay } from "@/lib/date";
import { useContext, useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { UserContext } from "@/components/Providers";
import axios from "axios";
import { toast } from "react-hot-toast";

// Lazy load comment field (only when replying)
const DynamicNotificationCommentField = dynamic(
    () => import("./notification-comment-field.component"),
    { 
        loading: () => <div className="ml-14 pl-5 mt-8 animate-pulse bg-grey/30 h-20 rounded-md" />,
        ssr: false
    }
);

const NotificationCard = ({ data, index, notificationState }) => {

    const [isReplying, setReplying] = useState(false);

    const {
        seen,
        type,
        reply,
        createdAt,
        comment,
        replied_on_comment,
        user,
        // Backend populates "user" with personal_info.fullname/username/profile_img
        // plus the always-included _id. Fall back to {} so destructuring below
        // never throws even if user comes back null (e.g. deleted account).
        user: { personal_info: { fullname, username, profile_img } = {}, _id: user_id } = {},
        blog,
        _id: notification_id
    } = data || {};

    const { userAuth: { username: author_username, profile_img: author_profile_img, access_token } = {} } = useContext(UserContext);

    const { notifications, notifications: { results, totalDocs } = {}, setNotifications } = notificationState || {};

    const handleReplyClick = useCallback(() => {
        setReplying(preVal => !preVal);
    }, []);

    // blog is populated with "title blog_id" (+ default _id). Guard every
    // access since a deleted blog would leave this null.
    const blog_id = blog?._id;
    const blogId = blog?.blog_id;
    const title = blog?.title;

    // IMPORTANT: the backend's .populate("reply", "comment") only selects
    // the comment text on the reply sub-document — it does NOT populate
    // reply.user. So on initial page load we can never reliably know who
    // posted the reply from this field alone. We only trust reply.user
    // when it's present (e.g. after the optimistic client-side update in
    // NotificationCommentField, which does attach a user object). When
    // it's absent, we conservatively still show the Reply button rather
    // than hiding it based on data we don't actually have.
    const replyUsername = reply?.user?.personal_info?.username || reply?.user?.username;
    const hasUserReplied = Boolean(reply) && Boolean(replyUsername) && replyUsername === author_username;

    // The id of "the comment this action is about" differs by notification
    // type: for type 'reply' it's replied_on_comment, otherwise it's comment.
    const activeComment = type === 'reply' ? replied_on_comment : comment;
    const activeCommentId = activeComment?._id;

    const handleDelete = useCallback((comment_id, deleteType, target) => {
        if (!comment_id) {
            toast.error("This comment can no longer be found.");
            return;
        }

        if (!results) {
            toast.error("Unable to update the list right now.");
            return;
        }

        target.setAttribute("disabled", true);

        axios.post(
            process.env.NEXT_PUBLIC_SERVER_DOMAIN + "/delete-comment",
            { _id: comment_id },
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }
        )
        .then(() => {
            if (deleteType === 'comment') {
                const updatedResults = results.filter((_, i) => i !== index);
                setNotifications({ 
                    ...notifications, 
                    results: updatedResults, 
                    totalDocs: (totalDocs || updatedResults.length + 1) - 1, 
                    deleteDocCount: (notifications.deleteDocCount || 0) + 1
                });
            } else if (deleteType === 'reply') {
                const updatedResults = [...results];
                const { reply, ...notificationWithoutReply } = updatedResults[index] || {};
                updatedResults[index] = notificationWithoutReply;
                
                setNotifications({ 
                    ...notifications, 
                    results: updatedResults, 
                    totalDocs: (totalDocs || updatedResults.length + 1) - 1, 
                    deleteDocCount: (notifications.deleteDocCount || 0) + 1
                });
            }
            toast.success(`${deleteType === 'comment' ? 'Comment' : 'Reply'} deleted successfully`);
        })
        .catch((err) => {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.error || "Failed to delete");
        })
        .finally(() => {
            target.removeAttribute("disabled");
        });
    }, [notifications, results, index, access_token, totalDocs, setNotifications]);

    // Only bail out when there's truly no data to render at all. A missing
    // `user` (deleted account, populate failure, etc.) should still show a
    // graceful "Unknown user" card instead of silently vanishing — that
    // was the bug that made every notification disappear after the
    // backend's .select() previously excluded `user`.
    if (!data) return null;

    const displayName = fullname || "Unknown user";
    const displayUsername = username || null;
    const displayAvatar = profile_img || '/default-avatar.png';

    return (
        <article
            className={"p-6 border-b border-grey border-l-black " + (!seen ? "border-l-2" : "")}
            aria-label={`Notification from ${displayName}`}
        >
            <div className="flex gap-5 mb-3">
                <Image 
                    src={displayAvatar}
                    width={56}
                    height={56}
                    className="w-14 h-14 flex-none rounded-full object-cover"
                    alt={`${displayName}'s profile picture`}
                    loading={index < 3 ? "eager" : "lazy"}
                    quality={80}
                    unoptimized={displayAvatar?.startsWith('http') && !displayAvatar?.includes(process.env.NEXT_PUBLIC_DOMAIN || '')}
                />
                <div className="w-full">
                    <h1 className="font-medium text-xl text-dark-grey">
                        <span className="lg:inline-block hidden capitalize">{displayName}</span>
                        {displayUsername ? (
                            <Link 
                                href={`/user/${displayUsername}`} 
                                className="mx-1 text-black underline-offset-2 hover:underline"
                                prefetch={false}
                            >
                                @{displayUsername}
                            </Link>
                        ) : (
                            <span className="mx-1 text-dark-grey">@unknown</span>
                        )}
                        <span className="font-normal">
                            {
                                type === 'like' ? "liked your blog" :
                                type === 'comment' ? "commented on" : "replied on"
                            }
                        </span>
                    </h1>
                    {
                        type === "reply" ?
                            <div className="p-4 mt-4 rounded-md bg-grey">
                                <p className="text-dark-grey">
                                    {replied_on_comment?.comment || 'Original comment unavailable'}
                                </p>
                            </div>
                            :
                            blogId ? (
                                <Link 
                                    href={`/blog/${blogId}`} 
                                    className="font-medium text-dark-grey line-clamp-1 hover:text-black transition-colors"
                                    prefetch={index < 3}
                                >
                                    {`"${title || 'Untitled post'}"`}
                                </Link>
                            ) : (
                                <p className="font-medium text-dark-grey line-clamp-1">
                                    This post is no longer available
                                </p>
                            )
                    }
                </div>
            </div>
            {
                type !== 'like' && comment?.comment && (
                    <p className="ml-14 pl-5 font-gelasio text-xl my-5 text-dark-grey">
                        {comment.comment}
                    </p>
                )
            }

            <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8 flex-wrap">
                <time 
                    dateTime={createdAt}
                    className="text-sm"
                >
                    {getDay(createdAt)}
                </time>

                {
                    type !== 'like' && (
                        <>
                            {
                                !hasUserReplied && blog_id && activeCommentId && (
                                    <button
                                        onClick={handleReplyClick}
                                        className="hover:text-black underline-offset-2 hover:underline transition-colors text-sm"
                                        aria-label={`Reply to ${displayUsername || 'this user'}'s ${type}`}
                                        aria-pressed={isReplying}
                                    >
                                        Reply
                                    </button>
                                )
                            }
                            {
                                activeCommentId && (
                                    <button 
                                        className="hover:text-black underline-offset-2 hover:underline transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={(e) => handleDelete(activeCommentId, "comment", e.target)}
                                        aria-label={`Delete ${type} from ${displayUsername || 'this user'}`}
                                    >
                                        Delete
                                    </button>
                                )
                            }
                        </>
                    )
                }
            </div>

            {
                isReplying && blog_id && activeCommentId && (
                    <div className="mt-8">
                        {/* Use dynamic import for comment field */}
                        <DynamicNotificationCommentField
                            _id={blog_id}
                            blog_author={user}
                            index={index}
                            replyingTo={activeCommentId}
                            setReplying={setReplying}
                            notification_id={notification_id}
                            notificationData={notificationState}
                        />
                    </div>
                )
            }
            {
                reply && (
                    <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
                        <div className="flex gap-3 mb-3">
                            <Image 
                                src={author_profile_img || '/default-avatar.png'}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                                alt={`${author_username || 'User'}'s profile picture`}
                                loading="lazy"
                                quality={75}
                            />

                            <div>
                                <h2 className="font-medium text-xl text-dark-grey">
                                    <Link 
                                        href={`/user/${author_username}`} 
                                        className="mx-1 text-black underline-offset-2 hover:underline"
                                        prefetch={false}
                                    >
                                        @{author_username}
                                    </Link>

                                    <span className="font-normal">replied to </span>

                                    {displayUsername ? (
                                        <Link 
                                            href={`/user/${displayUsername}`} 
                                            className="mx-1 text-black underline-offset-2 hover:underline"
                                            prefetch={false}
                                        >
                                            @{displayUsername}
                                        </Link>
                                    ) : (
                                        <span className="mx-1 text-dark-grey">@unknown</span>
                                    )}
                                </h2>
                            </div>
                        </div>

                        <p className="ml-14 font-gelasio text-xl my-2 text-dark-grey">
                            {reply.comment}
                        </p>

                        <button 
                            className="hover:text-black ml-14 mt-2 underline underline-offset-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                                const replyId = reply._id || reply.id;
                                if (replyId) {
                                    handleDelete(replyId, "reply", e.target);
                                } else {
                                    toast.error("Unable to delete reply");
                                }
                            }}
                            aria-label={`Delete reply from ${author_username || 'user'}`}
                        >
                            Delete
                        </button>
                    </div>
                )
            }
        </article>
    )
}

export default memo(NotificationCard, (prevProps, nextProps) => {
    return (
        prevProps.data._id === nextProps.data._id &&
        prevProps.data.seen === nextProps.data.seen &&
        prevProps.data.reply === nextProps.data.reply
    );
});