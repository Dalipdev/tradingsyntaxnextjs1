import { memo } from "react";

const listItemStyles = {
  textRendering: 'optimizeLegibility',
  fontFeatureSettings: '"kern" 1, "liga" 1',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale'
};

const ListBlock = memo(({ style, items }) => (
  <div className="my-6 md:my-8 w-full">
    {style === "ordered" ? (
      <ol className="space-y-4 md:space-y-5 w-full">
        {items.map((item, i) => (
          <li key={i} className="relative pl-16 md:pl-20 group w-full">
            <div className="absolute left-0 top-0.5 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
              <span className="text-lg md:text-xl font-black">{i + 1}</span>
            </div>
            <div 
              className="text-lg md:text-xl leading-relaxed w-full group-hover:translate-x-1 transition-transform duration-300" 
              style={listItemStyles}
              dangerouslySetInnerHTML={{ __html: item }} 
            />
          </li>
        ))}
      </ol>
    ) : (
      <ul className="space-y-4 md:space-y-5 w-full">
        {items.map((item, i) => (
          <li key={i} className="relative pl-10 md:pl-12 group w-full">
            <div className="absolute left-0 top-2.5 w-2.5 h-2.5 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <div 
              className="text-lg md:text-xl leading-relaxed w-full group-hover:translate-x-1 transition-transform duration-300" 
              style={listItemStyles}
              dangerouslySetInnerHTML={{ __html: item }} 
            />
          </li>
        ))}
      </ul>
    )}
  </div>
));

ListBlock.displayName = "ListBlock";

export default ListBlock;