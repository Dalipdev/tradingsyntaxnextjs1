'use client'

import { createContext, useContext } from "react";

export const BlogContext = createContext({
  blog: null,
  setBlog: () => {},

  loading: true,
  setLoading: () => {},

  commentsWrapper: false,
  setCommentsWrapper: () => {},

  totalParentCommentsLoaded: 0,
  setTotalParentCommentsLoaded: () => {},

  isLikedByUser: false,
  setIsLikedByUser: () => {},

  similarBlogs: null,
  setSimilarBlogs: () => {},
});

BlogContext.displayName = 'BlogContext';

export const useBlogContext = () => {
  const context = useContext(BlogContext);

  if (!context) {
    throw new Error('useBlogContext must be used within a BlogProvider');
  }

  return context;
};