'use client'

import { redirect } from 'next/navigation'

export default function EditorRoot() {
  redirect('/editor/new')
}