import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 border-t border-gray-800 text-center text-gray-400">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="mb-4 md:mb-0">
            <span className="footer-copyright">© 2025 SafeIdea, LLC. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-300 hover:text-gray-100">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-300 hover:text-gray-100">
              Privacy Policy
            </Link>
            <a 
              href="mailto:info@safeidea.ai" 
              className="text-gray-300 hover:text-gray-100"
            >
              info@safeidea.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}