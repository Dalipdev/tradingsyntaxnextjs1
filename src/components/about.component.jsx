import Link from "next/link";
import { memo } from "react";
import { getFullDay } from "@/lib/date";

// Social media platform configuration for better maintainability and SEO
const SOCIAL_PLATFORMS = {
    facebook: { icon: "fi-brands-facebook", label: "Facebook" },
    twitter: { icon: "fi-brands-twitter", label: "Twitter" },
    instagram: { icon: "fi-brands-instagram", label: "Instagram" },
    youtube: { icon: "fi-brands-youtube", label: "YouTube" },
    github: { icon: "fi-brands-github", label: "GitHub" },
    linkedin: { icon: "fi-brands-linkedin", label: "LinkedIn" },
    website: { icon: "fi-rr-globe", label: "Website" }
};

const AboutUser = memo(({ className = "", bio, social_links, joinedAt }) => {
    // Validate and filter social links
    const validSocialLinks = social_links 
        ? Object.entries(social_links).filter(([_, link]) => link?.trim())
        : [];

    return (
        <div className={`md:w-[90%] md:mt-7 ${className}`}>
            {/* Bio section with semantic HTML */}
            <p className="text-xl leading-7 text-gray-800">
                {bio?.trim() || "Nothing to read here"}
            </p>

            {/* Social links section */}
            {validSocialLinks.length > 0 && (
                <div 
                    className="flex gap-x-7 gap-y-2 flex-wrap my-7 items-center text-dark-grey"
                    role="list"
                    aria-label="Social media links"
                >
                    {validSocialLinks.map(([platform, link]) => {
                        const platformConfig = SOCIAL_PLATFORMS[platform] || { 
                            icon: "fi-rr-link", 
                            label: platform 
                        };

                        return (
                            <Link 
                                href={link} 
                                key={platform} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="transition-colors duration-200 hover:text-black focus:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded"
                                aria-label={`Visit ${platformConfig.label} profile`}
                                prefetch={false}
                            >
                                <i 
                                    className={`fi ${platformConfig.icon} text-2xl`}
                                    aria-hidden="true"
                                />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Join date */}
            {joinedAt && (
                <p className="text-xl text-dark-grey leading-7">
                    Joined on <time dateTime={joinedAt}>{getFullDay(joinedAt)}</time>
                </p>
            )}
        </div>
    );
});

AboutUser.displayName = "AboutUser";

export default AboutUser;