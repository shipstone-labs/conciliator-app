'use client'

import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
      // We're no longer preventing page scrolling here
      // This allows scrolling the main page while modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
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

  // The modal content
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-background/95 backdrop-blur-sm w-full max-w-3xl rounded-lg shadow-lg border border-border',
          'flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150'
        )}
        data-testid="nav-account-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-100 transition-colors"
              data-testid="modal-close-button"
            >
              &times;
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-6rem)]">
          {children}
        </div>
      </div>
    </div>
  )

  // Use createPortal to render the modal at the document body level
  return typeof document === 'undefined'
    ? null
    : createPortal(modalContent, document.body)
}
