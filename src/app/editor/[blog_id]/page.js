'use client'

import { useContext, useEffect, useState, useCallback, useMemo, useTransition } from "react"
import { UserContext } from "@/components/Providers"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { EditorContext } from "@/lib/editor-context"
import Loader from "@/components/loader.component"
import { toast } from "react-hot-toast"

const BlogEditor = dynamic(() => import("@/components/blog-editor.component"), {
    loading: () => <Loader />,
    ssr: false,
})

const PublishForm = dynamic(() => import("@/components/publish-form.component"), {
    loading: () => <Loader />,
    ssr: false,
})

const blogStructure = {
    title: '',
    banner: '',
    content: [],
    tags: [],
    des: '',
    author: { personal_info: {} }
}

const Editor = () => {
    const params = useParams()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const blog_id = params?.blog_id === 'new' ? null : params?.blog_id

    const [blog, setBlog] = useState(blogStructure)
    const [editorState, setEditorState] = useState("editor")
    const [textEditor, setTextEditor] = useState({ isReady: false })
    const [loading, setLoading] = useState(!!blog_id)
    const [error, setError] = useState(null)

    const { userAuth: { access_token, isAdmin } } = useContext(UserContext)

    useEffect(() => {
        if (access_token === null) {
            router.replace("/signin")
        } else if (access_token && !isAdmin) {
            router.replace("/")
            toast.error("Unauthorized access")
        }
    }, [access_token, isAdmin, router])

    const fetchBlogData = useCallback(async (retryCount = 0) => {
        if (!blog_id || !access_token) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-blog`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    },
                    body: JSON.stringify({ blog_id, draft: true, mode: 'edit' }),
                    signal: controller.signal
                }
            )

            clearTimeout(timeoutId)
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

            const data = await response.json()
            if (!data.blog) throw new Error('Blog not found')

            startTransition(() => setBlog(data.blog))

        } catch (err) {
            if (retryCount < 2 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
                console.warn(`Fetch failed, retrying (${retryCount + 1})...`)
                return setTimeout(() => fetchBlogData(retryCount + 1), 2000)
            }
            console.error('Final Fetch Error:', err)
            setError(err.message)
            toast.error("Server connection failed. Please refresh.")
            startTransition(() => setBlog(null))
        } finally {
            setLoading(false)
        }
    }, [blog_id, access_token])

    useEffect(() => {
        if (blog_id && access_token && isAdmin) {
            fetchBlogData()
        } else if (!blog_id) {
            setBlog(blogStructure)
            setLoading(false)
        }
    }, [blog_id, access_token, isAdmin, fetchBlogData])

    // Stable setTextEditor that won't cause re-renders in the editor
    const handleSetTextEditor = useCallback((editor) => {
        setTextEditor(editor)
    }, [])

    const contextValue = useMemo(() => ({
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor: handleSetTextEditor,
        blog_id,
        refreshBlog: fetchBlogData,
    }), [blog, editorState, textEditor, blog_id, fetchBlogData, handleSetTextEditor])

    if (access_token === null || !isAdmin) {
        return <div className="min-h-screen flex items-center justify-center"><Loader /></div>
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader /></div>
    }

    if (error && blog === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-4">Connection Error</h2>
                    <p className="text-gray-600 mb-6">The server might be waking up. Try refreshing.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        )
    }

    return (
        <EditorContext.Provider value={contextValue}>
            {isPending && (
                <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    <span className="text-sm">Updating...</span>
                </div>
            )}
            {editorState === "editor" ? <BlogEditor /> : <PublishForm />}
        </EditorContext.Provider>
    )
}

export default Editor