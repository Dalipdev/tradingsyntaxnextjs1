import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { blog_id, secret } = await request.json()

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    // blog_id is optional — only needed when editing an existing blog
    if (blog_id) {
      revalidatePath(`/blog/${blog_id}`)
    }

    revalidatePath('/dashboard/blogs')
    revalidatePath('/')

    return NextResponse.json({ revalidated: true, blog_id: blog_id || null })
  } catch (err) {
    console.error('[revalidate]', err)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}