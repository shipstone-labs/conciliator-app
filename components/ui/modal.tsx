'use client'

import { useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose?: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    if (!onClose) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])
  // Close when clicking on backdrop (outside of modal content) if not prevented
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && onClose) onClose()
    },
    [onClose]
  )

  if (!isOpen) return null

  console.log('Modal rendering with isOpen:', isOpen)

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-background/95 backdrop-blur-sm w-full max-w-3xl rounded-lg shadow-lg border border-border',
          'flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-100 transition-colors"
            >
              &times;
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
