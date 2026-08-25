'use client'

import { useContext, useState, memo, useCallback, useMemo } from "react";
import Image from "next/image";
import axios from "axios";
import { getDay } from "@/lib/date";
import { UserContext } from "@/components/Providers";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BlogContext } from "@/lib/blog-context";

// Lazy load CommentField for better performance
const CommentField = dynamic(() => import("./comment-field.component"), {
  loading: () => <div className="h-20 animate-pulse bg-gray-50 rounded-md mt-8" />,
});

const CommentCard = ({ index, leftVal = 0, commentData = {} }) => {
  const {
    commented_by: {
      personal_info: { profile_img, fullname, username: commented_by_username } = {},
    } = {},
    commentedAt,
    createdAt,
    comment,
    _id,
    children = [],
    childrenLevel = 0,
    isReplyLoaded = false,
  } = commentData;

  // Contexts
  const { blog = {}, setBlog = () => {}, setTotalParentCommentLoaded } = useContext(BlogContext);
  const { userAuth: { access_token, username, isAdmin } = {} } = useContext(UserContext);

  const commentsArr = blog?.comments?.results || [];

  const totalReplies = children.length;

  const [isReplying, setReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized values
  const commentText = useMemo(() => 
    typeof comment === 'string' ? comment : comment?.comment || '', 
    [comment]
  );
  
  const commentDate = useMemo(() => 
    commentedAt || createdAt || new Date(), 
    [commentedAt, createdAt]
  );

  const isCommentAuthor = username === commented_by_username;
  const canDelete = isCommentAuthor || isAdmin;

  // TEMP DEBUG — remove once the delete button issue is confirmed fixed.
  // This will print once per rendered comment, every time this
  // component renders.
  console.log('[CommentCard debug]', {
    commentId: _id,
    username,
    commented_by_username,
    isCommentAuthor,
    isAdmin,
    canDelete,
  });

  // Calculate loaded replies count
  const repliesLoadedCount = useMemo(() => {
    let count = 0;
    let i = index + 1;
    while (commentsArr[i] && commentsArr[i].childrenLevel > childrenLevel) {
      count++;
      i++;
    }
    return count;
  }, [commentsArr, index, childrenLevel]);

  const canLoadMore = totalReplies > repliesLoadedCount;

  // Toggle reply field
  const handleReplyClick = useCallback(() => {
    if (!access_token) {
      return toast.error("Login first to leave a reply");
    }
    setReplying((prev) => !prev);
  }, [access_token]);

  // Hide replies
  const hideReplies = useCallback(() => {
    const updated = commentsArr.filter(
      (c, idx) => idx <= index || c.childrenLevel <= childrenLevel
    );
    setBlog({ ...blog, comments: { ...blog.comments, results: updated } });
  }, [commentsArr, index, childrenLevel, blog, setBlog]);

  // Load replies
  const loadReplies = useCallback(async ({ skip = 0 } = {}) => {
    if (!totalReplies || isLoading) return;

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-replies`,
        { _id, skip },
        { timeout: 10000 }
      );

      const replies = data.replies.map((reply) => ({
        ...reply,
        childrenLevel: childrenLevel + 1,
        parentIndex: index,
      }));

      // Insert after already loaded replies
      let insertIndex = index + 1;
      while (commentsArr[insertIndex] && commentsArr[insertIndex].childrenLevel > childrenLevel) {
        insertIndex++;
      }

      const updated = [
        ...commentsArr.slice(0, insertIndex),
        ...replies,
        ...commentsArr.slice(insertIndex),
      ];

      updated[index] = { ...updated[index], isReplyLoaded: true };

      setBlog({ ...blog, comments: { ...blog.comments, results: updated } });
    } catch (err) {
      console.error("Failed to load replies:", err);
      toast.error(err.response?.data?.error || "Unable to load replies");
    } finally {
      setIsLoading(false);
    }
  }, [totalReplies, isLoading, _id, childrenLevel, index, commentsArr, blog, setBlog]);

  // Delete comment handler
  const handleDelete = useCallback(async () => {
    if (!access_token) {
      return toast.error("Login required");
    }

    if (isDeleting) return;

    const confirmDelete = window.confirm(
      children.length > 0
        ? "This will also delete all replies. Are you sure?"
        : "Are you sure you want to delete this comment?"
    );
    
    if (!confirmDelete) return;

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting comment...");

    try {
      const isParentComment = childrenLevel === 0;

      // Count total comments being deleted
      let totalCommentsToDelete = 1;
      let replyIndicesToDelete = [];

      if (children.length > 0) {
        let currentIndex = index + 1;
        while (
          currentIndex < commentsArr.length &&
          commentsArr[currentIndex].childrenLevel > childrenLevel
        ) {
          replyIndicesToDelete.push(currentIndex);
          totalCommentsToDelete++;
          currentIndex++;
        }
      }

      // Delete on backend
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/delete-comment`,
        { _id },
        { 
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // Optimistic update
      let newCommentArr = [...commentsArr];

      // Update parent's children array if this is a reply
      if (!isParentComment && commentData.parentIndex !== undefined) {
        const parentComment = newCommentArr[commentData.parentIndex];
        if (parentComment?.children) {
          parentComment.children = parentComment.children.filter(
            (childId) => childId !== _id
          );
        }
      }

      // Remove comments in reverse order
      const indicesToRemove = [index, ...replyIndicesToDelete].sort((a, b) => b - a);
      indicesToRemove.forEach((idx) => {
        newCommentArr.splice(idx, 1);
      });

      const parentCommentDecrement = isParentComment ? 1 : 0;

      // Update blog state
      const updatedActivity = {
        ...blog.activity,
        total_comments: Math.max(0, (blog.activity?.total_comments || 0) - totalCommentsToDelete),
        total_parent_comments: Math.max(
          0,
          (blog.activity?.total_parent_comments || 0) - parentCommentDecrement
        ),
      };

      setBlog({
        ...blog,
        comments: { ...blog.comments, results: newCommentArr },
        activity: updatedActivity,
      });

      if (isParentComment && setTotalParentCommentLoaded) {
        setTotalParentCommentLoaded((prev) => Math.max(0, prev - 1));
      }

      toast.dismiss(loadingToast);
      toast.success(
        children.length > 0
          ? "Comment and replies deleted"
          : "Comment deleted"
      );
    } catch (err) {
      console.error("Failed to delete comment:", err);
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || "Unable to delete comment");
    } finally {
      setIsDeleting(false);
    }
  }, [
    access_token, 
    isDeleting, 
    children.length, 
    childrenLevel, 
    index, 
    commentsArr, 
    _id, 
    commentData.parentIndex, 
    blog, 
    setBlog, 
    setTotalParentCommentLoaded
  ]);

  // Early return if no comment
  if (!commentText) {
    return null;
  }

  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey hover:border-grey/70 transition-colors duration-200">
        {/* Header */}
        <div className="flex gap-3 items-center mb-3">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={profile_img}
              alt={`${fullname}'s profile`}
              width={96}
              height={96}
              quality={90}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="line-clamp-1 text-sm">
            <span className="font-medium text-black">{fullname}</span>
            {' '}
            <span className="text-dark-grey">@{commented_by_username}</span>
          </p>
          <time 
            dateTime={commentDate} 
            className="min-w-fit text-sm text-dark-grey ml-auto"
          >
            {getDay(commentDate)}
          </time>
        </div>

        {/* Comment Text */}
        <p className="font-gelasio text-lg ml-3 leading-relaxed text-dark-grey">
          {commentText}
        </p>

        {/* Actions */}
        <div className="flex gap-5 items-center mt-5">
          {/* Reply Toggle Button */}
          {totalReplies > 0 &&
            (isReplyLoaded ? (
              <button
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2 transition-all duration-200"
                onClick={hideReplies}
                aria-label="Hide replies"
              >
                <i className="fi fi-rs-comment-dots" aria-hidden="true"></i>
                Hide Replies
              </button>
            ) : (
              <button
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => loadReplies({ skip: 0 })}
                disabled={isLoading}
                aria-label={`Load ${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
              >
                <i className="fi fi-rs-comment-dots" aria-hidden="true"></i>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-dark-grey border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  `${totalReplies} ${totalReplies === 1 ? "Reply" : "Replies"}`
                )}
              </button>
            ))}

          {/* Reply Button */}
          <button 
            className="underline text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
            onClick={handleReplyClick}
            aria-label="Reply to comment"
          >
            Reply
          </button>

          {/* Delete Button */}
          {canDelete && (
            <button
              className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red hover:border-red transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete comment"
              aria-label="Delete comment"
            >
              {isDeleting ? (
                <span className="inline-block w-4 h-4 border-2 border-red border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <i className="fi fi-rr-trash pointer-events-none" aria-hidden="true"></i>
              )}
            </button>
          )}
        </div>

        {/* Load More Replies */}
        {isReplyLoaded && canLoadMore && (
          <button
            onClick={() => loadReplies({ skip: repliesLoadedCount })}
            className="text-dark-grey mt-3 ml-8 p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="Load more replies"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-dark-grey border-t-transparent rounded-full animate-spin"></span>
                Loading...
              </>
            ) : (
              "Load More Replies"
            )}
          </button>
        )}

        {/* Reply Field */}
        {isReplying && (
          <div className="mt-8">
            <CommentField 
              action="reply" 
              index={index} 
              replyingTo={_id} 
              setReplying={setReplying} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

CommentCard.displayName = "CommentCard";

export default memo(CommentCard);