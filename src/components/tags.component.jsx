import { useContext, useCallback, memo } from "react";
import { EditorContext } from "@/lib/editor-context";

const Tag = ({ tag, tagIndex }) => {  // ✅ ADD: tagIndex prop for better key management
    const { blog, blog: { tags } = {}, setBlog } = useContext(EditorContext);
    
    // ✅ OPTIMIZED: useCallback to prevent recreation on every render
    const handleTagDelete = useCallback(() => {
        if (!tags) return;  // ✅ ADD: Safety check
        
        const updatedTags = tags.filter(t => t !== tag);
        setBlog(prev => ({ ...prev, tags: updatedTags }));  // ✅ FIX: Use functional update
    }, [tag, tags, setBlog]);

    // ✅ ADD: Handle keyboard interaction
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTagDelete();
        }
    }, [handleTagDelete]);

    // ✅ ADD: Safety check
    if (!tag) return null;

    return (
        <div 
            className="relative p-2 mt-2 mr-2 px-5 bg-white rounded-full inline-block hover:bg-opacity-50 pr-10 transition-all duration-200 hover:shadow-md group"  // ✅ ADD: Smooth transitions and hover effects
            role="listitem"  // ✅ ADD: Accessibility role
        >
            <p 
                className="outline-none text-sm text-dark-grey select-none"  // ✅ ADD: Better styling
                aria-label={`Tag: ${tag}`}  // ✅ ADD: Screen reader label
            >
                {tag}
            </p>
            <button 
                className="mt-[2px] rounded-full absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-red/10 transition-colors duration-200 group-hover:scale-110"  // ✅ IMPROVED: Better button styling
                onClick={handleTagDelete}
                onKeyDown={handleKeyDown}  // ✅ ADD: Keyboard support
                aria-label={`Remove tag: ${tag}`}  // ✅ ADD: Accessibility
                type="button"  // ✅ ADD: Explicit button type
                tabIndex={0}  // ✅ ADD: Keyboard focusable
            >
                <i 
                    className="fi fi-br-cross text-sm pointer-events-none text-dark-grey group-hover:text-red transition-colors duration-200"  // ✅ IMPROVED: Better icon styling with color change
                    aria-hidden="true"  // ✅ ADD: Hide from screen readers
                />
            </button>
        </div>
    );
};

// ✅ ADD: Memoization with custom comparison
export default memo(Tag, (prevProps, nextProps) => {
    return prevProps.tag === nextProps.tag && prevProps.tagIndex === nextProps.tagIndex;
});