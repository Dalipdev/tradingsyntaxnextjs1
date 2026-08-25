import { useState, useContext, useCallback, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { UserContext } from "@/components/Providers";

const NotificationCommentField = ({ 
    _id, 
    blog_author, 
    index = undefined, 
    replyingTo = undefined, 
    setReplying, 
    notification_id, 
    notificationData 
}) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);  // ✅ ADD: Ref for auto-focus
    
    const { _id: user_id } = blog_author || {};  // ✅ FIX: Safe destructuring
    const { userAuth: { access_token } = {} } = useContext(UserContext);
    const { notifications, notifications: { results } = {}, setNotifications } = notificationData || {};

    // ✅ ADD: Auto-focus textarea when component mounts
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // ✅ OPTIMIZED: useCallback to prevent recreation on every render
    const handleComment = useCallback(async () => {
        // Trim whitespace and validate
        const trimmedComment = comment.trim();
        
        if (!trimmedComment.length) {
            return toast.error("Write something to leave a comment.");
        }

        // ✅ ADD: Character limit validation
        if (trimmedComment.length > 1000) {
            return toast.error("Comment is too long (max 1000 characters).");
        }

        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        // ✅ ADD: Check for required fields
        if (!access_token) {
            return toast.error("You must be logged in to reply.");
        }

        if (!_id || !user_id) {
            return toast.error("Missing required information.");
        }

        setIsSubmitting(true);

        try {
            const { data } = await axios.post(
                process.env.NEXT_PUBLIC_SERVER_DOMAIN + "/add-comment",
                {
                    _id,
                    blog_author: user_id,
                    comment: trimmedComment,
                    replying_to: replyingTo,
                    notification_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                    timeout: 10000  // ✅ ADD: 10 second timeout
                }
            );

            // Close reply field if setReplying exists
            if (setReplying) {
                setReplying(false);
            }

            // Update notifications state immutably
            if (index !== undefined && results && results[index]) {
                const updatedResults = [...results];
                updatedResults[index] = {
                    ...updatedResults[index],
                    reply: { 
                        comment: trimmedComment, 
                        _id: data._id,
                        // Include user info to track who replied
                        user: data.user || { 
                            username: data.commented_by?.personal_info?.username,
                            personal_info: data.commented_by?.personal_info  // ✅ ADD: Full user data
                        }
                    }
                };
                
                setNotifications({ 
                    ...notifications, 
                    results: updatedResults 
                });
            }

            // Clear comment field
            setComment('');
            toast.success("Reply posted successfully!");

        } catch (err) {
            console.error('Comment submission error:', err);
            
            // ✅ IMPROVED: Better error handling
            if (err.code === 'ECONNABORTED') {
                toast.error("Request timed out. Please try again.");
            } else if (err.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
            } else if (err.response?.status === 429) {
                toast.error("Too many requests. Please wait a moment.");
            } else {
                toast.error(err.response?.data?.error || "Failed to add comment. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [comment, isSubmitting, access_token, _id, user_id, replyingTo, notification_id, setReplying, index, results, notifications, setNotifications]);

    // ✅ OPTIMIZED: useCallback to prevent recreation
    const handleKeyDown = useCallback((e) => {
        // Allow Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();  // ✅ ADD: Prevent default behavior
            handleComment();
        }
        
        // ✅ ADD: Escape key to cancel
        if (e.key === 'Escape' && setReplying) {
            setReplying(false);
        }
    }, [handleComment, setReplying]);

    // ✅ ADD: Character counter
    const characterCount = comment.length;
    const maxCharacters = 1000;
    const isNearLimit = characterCount > maxCharacters * 0.9;

    return (
        <div className="w-full">  {/* ✅ ADD: Wrapper for better layout */}
            <textarea
                ref={textareaRef}  // ✅ ADD: Ref for auto-focus
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Leave a reply... (Ctrl+Enter to submit, Esc to cancel)"  // ✅ IMPROVED: Better placeholder
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto w-full disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-black/10"  // ✅ ADD: Better disabled & focus states
                aria-label="Reply to comment"
                aria-describedby="char-count"  // ✅ ADD: Link to character counter
                disabled={isSubmitting}
                maxLength={maxCharacters}  // ✅ ADD: Hard limit
            />
            
            {/* ✅ ADD: Character counter */}
            <div 
                id="char-count" 
                className={`text-sm mt-1 text-right transition-colors ${
                    isNearLimit ? 'text-red' : 'text-dark-grey'
                }`}
                aria-live="polite"  // ✅ ADD: Announce to screen readers
            >
                {characterCount}/{maxCharacters}
            </div>

            {/* ✅ ADD: Action buttons container */}
            <div className="flex gap-3 mt-5 items-center">
                <button 
                    className="btn-dark px-10 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"  // ✅ IMPROVED: Better disabled state
                    onClick={handleComment}
                    disabled={isSubmitting || !comment.trim().length}  // ✅ ADD: Disable if empty
                    aria-label="Submit reply"
                    type="button"  // ✅ ADD: Explicit button type
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <svg 
                                className="animate-spin h-4 w-4" 
                                viewBox="0 0 24 24"
                                aria-hidden="true"  // ✅ ADD: Hide from screen readers
                            >
                                <circle 
                                    className="opacity-25" 
                                    cx="12" 
                                    cy="12" 
                                    r="10" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path 
                                    className="opacity-75" 
                                    fill="currentColor" 
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Posting...
                        </span>
                    ) : "Reply"}
                </button>
                
                {/* ✅ ADD: Cancel button */}
                {setReplying && (
                    <button
                        className="text-dark-grey hover:text-black transition-colors underline-offset-2 hover:underline"
                        onClick={() => setReplying(false)}
                        disabled={isSubmitting}
                        aria-label="Cancel reply"
                        type="button"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* ✅ ADD: Keyboard shortcuts hint */}
            <p className="text-xs text-dark-grey mt-2 opacity-60">
                <kbd className="px-1.5 py-0.5 bg-grey rounded text-xs">Ctrl+Enter</kbd> to submit, 
                <kbd className="px-1.5 py-0.5 bg-grey rounded text-xs ml-1">Esc</kbd> to cancel
            </p>
        </div>
    );
};

export default NotificationCommentField;