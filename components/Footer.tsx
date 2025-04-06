"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="py-6 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <span className="text-white/60 text-sm">© 2025 SafeIdea, LLC. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end">
              <button 
                onClick={() => {
                  console.log("Terms clicked");
                  setIsTermsOpen(true);
                }}
                className="text-white/70 hover:text-primary transition-colors text-sm"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => {
                  console.log("Privacy clicked");
                  setIsPrivacyOpen(true);
                }}
                className="text-white/70 hover:text-primary transition-colors text-sm"
              >
                Privacy Policy
              </button>
              <a 
                href="mailto:info@safeidea.ai" 
                className="text-white/70 hover:text-primary transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@safeidea.ai
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms of Service"
      >
        <div className="space-y-5 text-white/90">
          <h3 className="text-lg font-medium text-primary">1. Agreement to Terms</h3>
          <p>
            By accessing or using SafeIdea services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>

          <h3 className="text-lg font-medium text-primary">2. Use License</h3>
          <p>
            Permission is granted to temporarily access the materials on SafeIdea&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-white/80">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on SafeIdea&apos;s website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
          </ul>

          <h3 className="text-lg font-medium text-primary">3. Disclaimer</h3>
          <p>
            The materials on SafeIdea&apos;s website are provided on an &apos;as is&apos; basis. SafeIdea makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h3 className="text-lg font-medium text-primary">4. Limitations</h3>
          <p>
            In no event shall SafeIdea or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SafeIdea&apos;s website, even if SafeIdea or a SafeIdea authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
      >
        <div className="space-y-5 text-white/90">
          <h3 className="text-lg font-medium text-primary">1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us when you use our services, such as when you create an account, update your profile, use the interactive features of our services, participate in contests, promotions, or surveys, request customer support, or otherwise communicate with us.
          </p>

          <h3 className="text-lg font-medium text-primary">2. How We Use Information</h3>
          <p>We use information about you for various purposes, including to:</p>
          <ul className="list-disc pl-6 space-y-2 text-white/80">
            <li>Provide, maintain, and improve our services</li>
            <li>Provide services you request and to send you related information</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Communicate with you about products, services, offers, promotions, and events</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
          </ul>

          <h3 className="text-lg font-medium text-primary">3. Sharing of Information</h3>
          <p>
            We may share information about you as follows or as otherwise described in this Privacy Policy:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-white/80">
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
            <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of SafeIdea or others</li>
          </ul>

          <h3 className="text-lg font-medium text-primary">4. Your Choices</h3>
          <p>
            You may update, correct, or delete information about you at any time by logging into your online account and modifying your information or by emailing us. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.
          </p>
        </div>
      </Modal>
    </>
  );
}