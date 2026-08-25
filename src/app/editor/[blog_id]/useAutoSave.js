// hooks/useAutoSave.js

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export const useAutoSave = (data, saveFn, options = {}) => {
    const {
        delay = 3000, // Auto-save after 3 seconds of inactivity
        enabled = true,
        onSaveStart,
        onSaveSuccess,
        onSaveError,
    } = options

    const timeoutRef = useRef(null)
    const isSavingRef = useRef(false)
    const lastSavedRef = useRef(JSON.stringify(data))

    const save = useCallback(async () => {
        if (isSavingRef.current) return
        
        const currentData = JSON.stringify(data)
        
        // Skip if no changes
        if (currentData === lastSavedRef.current) return

        isSavingRef.current = true
        onSaveStart?.()

        try {
            await saveFn(data)
            lastSavedRef.current = currentData
            onSaveSuccess?.()
        } catch (error) {
            console.error('Auto-save error:', error)
            onSaveError?.(error)
            toast.error('Failed to auto-save')
        } finally {
            isSavingRef.current = false
        }
    }, [data, saveFn, onSaveStart, onSaveSuccess, onSaveError])

    useEffect(() => {
        if (!enabled) return

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            save()
        }, delay)

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [data, delay, enabled, save])

    // Save on unmount
    useEffect(() => {
        return () => {
            if (enabled && !isSavingRef.current) {
                save()
            }
        }
    }, [enabled, save])

    return { save }
}