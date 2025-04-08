"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Restore scrolling when modal is closed
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  console.log("Modal rendering with isOpen:", isOpen);

  // Close when clicking on backdrop (outside of modal content)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Use ReactDOM.createPortal to render the modal outside of the component hierarchy
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className={cn(
          "bg-background/95 backdrop-blur-sm w-full max-w-3xl rounded-lg shadow-lg border border-border",
          "flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-100 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
  
  // Use React Portal on the client side to ensure modal is rendered at the root level
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // On the server or during initial render, return null or a placeholder
  if (!mounted) {
    return null;
  }

  // On the client after mounting, render using createPortal
  const portalElement = document.getElementById('modal-portal');
  
  if (!portalElement) {
    console.error('Modal portal element not found');
    return modalContent; // Fallback to inline rendering
  }
  
  return createPortal(modalContent, portalElement);
}