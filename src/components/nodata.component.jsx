import { memo } from 'react';  // ✅ ADD: Prevent unnecessary re-renders

const NoDataMessage = ({ message }) => {

    return (
        <div 
            className="text-center w-full p-4 rounded-full bg-grey/50 mt-4"
            role="status"  // ✅ ADD: Accessibility - announces to screen readers
            aria-live="polite"  // ✅ ADD: Announces changes politely
        >
            <p className="text-gray-600 dark:text-gray-400">  {/* ✅ ADD: Better contrast & dark mode */}
                {message || 'No data available'}  {/* ✅ ADD: Fallback text */}
            </p>
        </div>
    )
}

// ✅ ADD: Memoization - prevents re-render if message hasn't changed
export default memo(NoDataMessage);