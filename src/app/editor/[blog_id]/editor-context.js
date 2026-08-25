// lib/editor-context.js

'use client'

import { createContext, useContext } from 'react'

export const EditorContext = createContext({
    blog: null,
    setBlog: () => {},
    editorState: 'editor',
    setEditorState: () => {},
    textEditor: { isReady: false },
    setTextEditor: () => {},
    blog_id: null,
    refreshBlog: async () => {},
})

export const useEditor = () => {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error('useEditor must be used within EditorContext.Provider')
    }
    return context
}