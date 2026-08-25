'use client'

import { useState, useContext, useCallback, memo } from "react";
import { UserContext } from "@/components/Providers";
import { Toaster, toast } from "react-hot-toast";
import { BlogContext } from "@/lib/blog-context";
import axios from "axios";

const CommentField = ({ action, index = undefined, replyingTo = undefined, setReplying }) => {
  const {
    blog,
    blog: {
      _id,
      author: { _id: blog_author } = {},
      comments = { results: [] },
      activity = { total_comments: 0, total_parent_comments: 0 },
    } = {},
    setBlog,
    setTotalParentCommentLoaded,
  } = useContext(BlogContext);
  
  const {
    userAuth: { access_token, username, fullname, profile_img } = {},
  } = useContext(UserContext);
  
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComment = useCallback(async () => {
    if (!access_token) {
      return toast.error("Login first to leave a comment");
    }
    
    const trimmedComment = comment.trim();
    if (!trimmedComment.length) {
      return toast.error("Write something to leave a comment.");
    }

    if (trimmedComment.length > 1000) {
      return toast.error("Comment is too long (max 1000 characters)");
    }

    if (isSubmitting) return; // Prevent double submissions

    setIsSubmitting(true);
    const loadingToast = toast.loading(replyingTo ? "Adding reply..." : "Adding comment...");

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/add-comment`,
        {
          _id,
          blog_author,
          comment: trimmedComment,
          replying_to: replyingTo,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      // Clear input immediately (optimistic update)
      setComment("");
      
      // Attach commenter info
      data.commented_by = {
        personal_info: { username, profile_img, fullname },
      };

      let newCommentArr = [...(comments.results || [])];
      
      const isParentComment = !replyingTo;

      if (replyingTo) {
        // ---------- REPLY ----------
        if (!newCommentArr[index]) {
          toast.dismiss(loadingToast);
          return toast.error("Parent comment not found");
        }

        // Add reply ID to parent's children array
        newCommentArr[index] = {
          ...newCommentArr[index],
          children: [
            ...(newCommentArr[index].children || []),
            data._id,
          ],
          isReplyLoaded: true,
        };

        // Configure reply metadata
        data.childrenLevel = newCommentArr[index].childrenLevel + 1;
        data.parentIndex = index;
        data.children = [];

        // Insert reply right after parent (or after loaded replies)
        let insertPosition = index + 1;
        while (
          insertPosition < newCommentArr.length &&
          newCommentArr[insertPosition] &&
          newCommentArr[insertPosition].childrenLevel > newCommentArr[index].childrenLevel
        ) {
          insertPosition++;
        }
        
        newCommentArr.splice(insertPosition, 0, data);
        
        if (setReplying) setReplying(false);
      } else {
        // ---------- PARENT COMMENT ----------
        data.childrenLevel = 0;
        data.children = [];
        newCommentArr = [data, ...newCommentArr];
      }

      // Calculate increments
      const totalCommentsIncrement = 1;
      const parentCommentsIncrement = isParentComment ? 1 : 0;

      // Update blog state with new counts
      const newActivity = {
        ...activity,
        total_comments: (activity.total_comments || 0) + totalCommentsIncrement,
        total_parent_comments: (activity.total_parent_comments || 0) + parentCommentsIncrement,
      };

      setBlog({
        ...blog,
        comments: {
          ...comments,
          results: newCommentArr,
        },
        activity: newActivity,
      });

      // Update parent comment loaded counter ONLY for parent comments
      if (isParentComment && setTotalParentCommentLoaded) {
        setTotalParentCommentLoaded((prev) => prev + 1);
      }

      toast.dismiss(loadingToast);
      toast.success(
        replyingTo ? "Reply added!" : "Comment added!"
      );
    } catch (err) {
      console.error("Comment error:", err);
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    access_token, 
    comment, 
    _id, 
    blog_author, 
    replyingTo, 
    comments, 
    index, 
    activity, 
    blog, 
    username, 
    profile_img, 
    fullname, 
    setBlog, 
    setTotalParentCommentLoaded, 
    setReplying,
    isSubmitting
  ]);

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  }, [handleComment]);

  const characterCount = comment.length;
  const isOverLimit = characterCount > 1000;

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="w-full">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? "Write a reply..." : "Leave a comment..."}
          className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto w-full transition-all duration-200 focus:border-dark-grey/50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          maxLength={1200}
          aria-label={replyingTo ? "Reply text" : "Comment text"}
        />
        
        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm ${isOverLimit ? 'text-red' : 'text-dark-grey'}`}>
            {characterCount} / 1000 characters
          </span>
          <span className="text-xs text-dark-grey">
            Press Enter to submit, Shift+Enter for new line
          </span>
        </div>

        <button 
          className="btn-dark mt-5 px-10 capitalize transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
          onClick={handleComment}
          disabled={isSubmitting || !comment.trim().length || isOverLimit}
          aria-label={`${action} comment`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {replyingTo ? "Replying..." : "Posting..."}
            </span>
          ) : (
            action
          )}
        </button>
      </div>
    </>
  );
};

CommentField.displayName = "CommentField";

export default memo(CommentField);