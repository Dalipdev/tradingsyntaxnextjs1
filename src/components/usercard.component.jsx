import Link from "next/link";
import Image from "next/image";  // ✅ ADD: Next.js optimized images
import { memo } from "react";  // ✅ ADD: Memoization

const UserCard = ({ user, index = 0 }) => {  // ✅ ADD: index prop for optimization
    
    // ✅ ADD: Early return if no user data
    if (!user || !user.personal_info) return null;

    const { personal_info: { fullname, username, profile_img } } = user;

    // ✅ ADD: Fallback values
    const displayName = fullname || 'Unknown User';
    const displayUsername = username || 'unknown';
    const displayImage = profile_img || '/default-avatar.png';

    return (
        <Link 
            href={`/user/${displayUsername}`} 
            className="flex gap-5 items-center mb-5 p-3 rounded-lg hover:bg-grey/20 transition-colors duration-200 group"  // ✅ IMPROVED: Better hover with padding
            prefetch={index < 5}  // ✅ ADD: Only prefetch first 5 users
            aria-label={`View ${displayName}'s profile`}  // ✅ ADD: Accessibility
        >
            <div className="relative flex-shrink-0">  {/* ✅ ADD: Wrapper for image */}
                <Image 
                    src={displayImage}
                    alt={`${displayName}'s profile picture`}  // ✅ IMPROVED: Better alt text
                    width={56}  // ✅ ADD: Explicit dimensions (w-14 = 56px)
                    height={56}  // ✅ ADD: Explicit dimensions (h-14 = 56px)
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-transparent group-hover:ring-black/10 transition-all duration-200"  // ✅ IMPROVED: Better styling with ring effect
                    loading={index < 5 ? "eager" : "lazy"}  // ✅ ADD: Prioritize first 5
                    quality={80}  // ✅ ADD: Optimized quality
                    unoptimized={displayImage.startsWith('http') && !displayImage.includes(process.env.NEXT_PUBLIC_DOMAIN || '')}  // ✅ ADD: Handle external images
                />
                {/* ✅ ADD: Online status indicator (optional - remove if not needed) */}
                {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span> */}
            </div>

            <div className="flex-1 min-w-0">  {/* ✅ ADD: min-w-0 for text truncation */}
                <h1 className="font-medium text-xl line-clamp-2 text-dark-grey group-hover:text-black transition-colors duration-200">  {/* ✅ IMPROVED: Color transition */}
                    {displayName}
                </h1>
                <p className="text-dark-grey text-sm group-hover:translate-x-1 transition-transform duration-200 inline-block">  {/* ✅ IMPROVED: Animation on hover */}
                    @{displayUsername}
                </p>
            </div>

            {/* ✅ ADD: Arrow indicator on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <i className="fi fi-rr-arrow-right text-dark-grey" aria-hidden="true"></i>
            </div>
        </Link>
    );
};

// ✅ ADD: Memoization to prevent unnecessary re-renders
export default memo(UserCard, (prevProps, nextProps) => {
    return (
        prevProps.user?.personal_info?.username === nextProps.user?.personal_info?.username &&
        prevProps.index === nextProps.index
    );
});