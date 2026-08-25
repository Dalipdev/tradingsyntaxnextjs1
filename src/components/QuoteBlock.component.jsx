import { memo } from "react";

const QuoteBlock = memo(({ quote, caption }) => (
  <blockquote 
    className="relative my-8 md:my-10 group w-full"
    itemProp="citation"
    itemScope 
    itemType="https://schema.org/Quotation"
  >
    <div className="relative backdrop-blur-sm border-l-4 rounded-r-lg px-8 md:px-12 py-8 md:py-10 shadow-sm hover:shadow-md transition-shadow duration-500">
      <svg 
        className="absolute -top-4 -left-4 w-16 h-16 md:w-20 md:h-20 opacity-5 transform group-hover:scale-110 transition-transform duration-500" 
        fill="currentColor" 
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/>
      </svg>
      <p 
        className="text-xl md:text-2xl lg:text-3xl leading-relaxed font-serif italic w-full text-[#242424] dark:text-[#F3F3F3]" 
        style={{ textRendering: 'optimizeLegibility', fontFeatureSettings: '"kern" 1' }}
        itemProp="text"
      >
        "{quote}"
      </p>
      {caption && (
        <footer className="mt-6 md:mt-8 w-full">
          <cite 
            className="text-sm md:text-base font-semibold not-italic tracking-wide opacity-75 text-[#242424] dark:text-[#F3F3F3]"
            itemProp="author"
          >
            — {caption}
          </cite>
        </footer>
      )}
    </div>
  </blockquote>
));

QuoteBlock.displayName = "QuoteBlock";

export default QuoteBlock;