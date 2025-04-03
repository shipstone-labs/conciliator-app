"use client";

import React, { useState } from "react";

export function ModalTest() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Open Test Modal
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 w-full max-w-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Test Modal</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="text-white">
              <p>This is a simple test modal to debug the functionality.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}