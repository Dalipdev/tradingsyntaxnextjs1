'use client';

import { useState, useEffect, useRef, useCallback, Children } from 'react';

const InPageNavigation = ({
  routes = [],
  defaultActiveIndex = 0,
  children,
  onTabChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const buttonRefs = useRef([]);
  const activeLineRef = useRef(null);

  const updateUnderlinePosition = useCallback((index) => {
    const targetBtn = buttonRefs.current[index];
    if (targetBtn && activeLineRef.current) {
      activeLineRef.current.style.width = `${targetBtn.offsetWidth}px`;
      activeLineRef.current.style.left = `${targetBtn.offsetLeft}px`;
    }
  }, []);

  const handleTabSelection = useCallback((index, route) => {
    setActiveIndex(index);
    updateUnderlinePosition(index);
    if (onTabChange) onTabChange(index, route);
  }, [onTabChange, updateUnderlinePosition]);

  useEffect(() => {
    updateUnderlinePosition(activeIndex);
  }, [activeIndex, updateUnderlinePosition]);

  const childrenArray = Children.toArray(children);

  return (
    <div className="ts_navigation_container">
      <div className="ts_navigation_tabs_wrapper" role="tablist">
        {routes.map((route, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={route}
              ref={(el) => (buttonRefs.current[i] = el)}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabSelection(i, route)}
              className={`ts_navigation_tab_btn ${isActive ? 'ts_navigation_tab_btn_active' : ''}`}
            >
              {route.replace(/-/g, ' ')}
            </button>
          );
        })}
        <span ref={activeLineRef} className="ts_navigation_active_line" />
      </div>
      <div className="ts_navigation_panel" role="tabpanel">
        {childrenArray[activeIndex] || null}
      </div>
    </div>
  );
};

export default InPageNavigation;