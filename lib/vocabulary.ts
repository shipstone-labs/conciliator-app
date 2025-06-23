import { useFeature } from '@/hooks/useFeature'
import { useRef } from 'react'

// Define the vocabulary terms that differ between sites
const vocabularyMap = {
  // Core terms - with variations for first use, full form, and short form
  item: {
    '.net': 'Idea',
    '.ai': 'IP',
  },
  'item.first': {
    '.net': 'Idea',
    '.ai': 'Intellectual Property (IP)',
  },
  'item.full': {
    '.net': 'Idea',
    '.ai': 'Intellectual Property',
  },
  'item.plural': {
    '.net': 'Ideas',
    '.ai': 'Intellectual Property',
  },
  'item.add': {
    '.net': 'Add Idea',
    '.ai': 'Protect IP',
  },
  'item.create': {
    '.net': 'Create Idea',
    '.ai': 'Register IP',
  },
  'item.my': {
    '.net': 'My Ideas',
    '.ai': 'My IP Portfolio',
  },
  'item.explore': {
    '.net': 'Explore Ideas',
    '.ai': 'Browse IP',
  },

  // Action descriptions
  'action.upload': {
    '.net': 'Upload Your Idea',
    '.ai': 'Upload Your IP Document',
  },
  'action.encrypting': {
    '.net': 'Encrypting your idea',
    '.ai': 'Encrypting your intellectual property',
  },

  // Form placeholders
  'placeholder.title': {
    '.net': 'Enter public title for your Idea here',
    '.ai': 'Enter public title for your IP here',
  },
  'placeholder.description': {
    '.net': 'Enter public description of your Idea here',
    '.ai': 'Enter public description of your IP here',
  },

  // Page titles - introducing the acronym on first use
  'page.add.title': {
    '.net': 'Protect Your Creative Ideas',
    '.ai': 'Register Your Intellectual Property (IP)',
  },
  'page.add.description': {
    '.net': 'Secure your creative work on the blockchain',
    '.ai': 'Establish prior art and protect your IP rights',
  },

  // Step descriptions
  'step.content.title': {
    '.net': 'Securely Save Your Idea',
    '.ai': 'Securely Save Your IP',
  },
  'step.content.description': {
    '.net':
      'Now you need to add the secret document that describes your idea in detail. This is the core of your intellectual property protection.',
    '.ai':
      'Now you need to add the secret document that describes your intellectual property in detail. This is the core of your IP protection.',
  },

  // Subscription page terms
  'subscription.hero.title': {
    '.net': 'Because Your Ideas Are Worth Protecting',
    '.ai': 'Because Your Intellectual Property Needs Professional Protection',
  },
  'subscription.protect.cta': {
    '.net': 'Protect My Idea Now',
    '.ai': 'Secure My IP Now',
  },
  'subscription.innovative': {
    '.net': 'Your IP Protection Should Be As Innovative As Your Ideas',
    '.ai':
      'Your IP Protection Should Be As Innovative As Your Intellectual Property',
  },
  'subscription.ready': {
    '.net': 'Ready to Protect Your Innovative Ideas?',
    '.ai': 'Ready to Protect Your Intellectual Property?',
  },

  // Plan page titles and descriptions
  'plan.basic.title': {
    '.net': 'Basic Idea Protection Plan',
    '.ai': 'Basic IP Protection Plan',
  },
  'plan.secure.title': {
    '.net': 'Secure Ideas Protection Plan',
    '.ai': 'Secure IP Protection Plan',
  },
  'plan.complete.title': {
    '.net': 'Complete Ideas Protection Suite',
    '.ai': 'Complete IP Protection Suite',
  },
  'plan.basic.subtitle': {
    '.net':
      'Essential protection for establishing and securing your creative ideas.',
    '.ai':
      'Essential protection for establishing and securing your intellectual property.',
  },
  'plan.secure.subtitle': {
    '.net':
      'Enhanced protection with controlled sharing and NDA integration for teams and businesses.',
    '.ai':
      'Enhanced protection with controlled sharing and NDA integration for teams and businesses.',
  },
  'plan.complete.subtitle': {
    '.net': 'Enterprise-grade protection for your entire idea portfolio.',
    '.ai': 'Enterprise-grade protection for your entire IP portfolio.',
  },

  // Protection and security descriptions
  'protection.encryption.description': {
    '.net':
      'Military-grade encryption keeps your creative ideas completely private. All documents are encrypted before they leave your device, ensuring only you can access them.',
    '.ai':
      'Military-grade encryption keeps your intellectual property completely private. All documents are encrypted before they leave your device, ensuring only you can access them.',
  },
  'protection.timestamp.description': {
    '.net':
      'Create legally-defensible proof of when you created your ideas. Our timestamps are cryptographically secured and can be independently verified.',
    '.ai':
      'Create legally-defensible proof of when you created your intellectual property. Our timestamps are cryptographically secured and can be independently verified.',
  },
  'protection.storage.description': {
    '.net':
      'Store your documents, designs, code, and other creative assets in our secure cloud storage. All files remain encrypted and are backed up redundantly.',
    '.ai':
      'Store your documents, designs, code, and other intellectual property assets in our secure cloud storage. All files remain encrypted and are backed up redundantly.',
  },
  'protection.support.description': {
    '.net':
      "Get help when you need it with our responsive email support team. We're here to help you protect your creative ideas and make the most of our platform.",
    '.ai':
      "Get help when you need it with our responsive email support team. We're here to help you protect your intellectual property and make the most of our platform.",
  },

  // Use case descriptions
  'usecase.creators.description': {
    '.net':
      "Perfect for individual creators looking to establish a clear timeline of creation for their ideas. Whether you're writing a book, creating designs, or developing a new invention, the Basic plan helps you prove when you created your work.",
    '.ai':
      "Perfect for individual creators looking to establish a clear timeline of creation for their intellectual property. Whether you're writing a book, creating designs, or developing a new invention, the Basic plan helps you prove when you created your work.",
  },
  'usecase.secure.teams.description': {
    '.net':
      'Ideal for teams and collaborators who need to share their ideas securely while maintaining control over access. Perfect for creative agencies, research groups, and innovation teams.',
    '.ai':
      'Ideal for teams and collaborators who need to share their IP securely while maintaining control over access. Perfect for IP-focused firms, research groups, and innovation teams.',
  },
  'usecase.enterprise.description': {
    '.net':
      'Built for organizations managing extensive idea portfolios. Get enterprise-grade security, advanced analytics, and dedicated support for your innovation pipeline.',
    '.ai':
      'Built for organizations managing extensive IP portfolios. Get enterprise-grade security, advanced analytics, and dedicated support for your intellectual property assets.',
  },

  // CTA and general text
  'cta.secure': {
    '.net': 'Ready to Secure Your Creative Ideas?',
    '.ai': 'Ready to Secure Your Intellectual Property?',
  },
  'cta.protect.today': {
    '.net': 'Start protecting your ideas today.',
    '.ai': 'Start protecting your intellectual property today.',
  },
  'cta.establish.documentation': {
    '.net':
      'The Basic plan is perfect for establishing secure documentation and provenance for your creative work.',
    '.ai':
      'The Basic plan is perfect for establishing secure documentation and provenance for your intellectual property.',
  },

  // Secure plan specific descriptions
  'secure.sharing.description': {
    '.net':
      'Share your creative ideas with as many recipients as you need, while maintaining complete control over access permissions, expiration dates, and download restrictions.',
    '.ai':
      'Share your intellectual property with as many recipients as you need, while maintaining complete control over access permissions, expiration dates, and download restrictions.',
  },
  'secure.nda.description': {
    '.net':
      'Automatically require legally-binding non-disclosure agreements before allowing access to your creative ideas. Track agreement acceptance with timestamps and digital signatures.',
    '.ai':
      'Automatically require legally-binding non-disclosure agreements before allowing access to your intellectual property. Track agreement acceptance with timestamps and digital signatures.',
  },
  'secure.support.description': {
    '.net':
      'Get faster assistance with email and chat support from our creative protection specialists. Enjoy shorter response times and priority issue resolution.',
    '.ai':
      'Get faster assistance with email and chat support from our intellectual property specialists. Enjoy shorter response times and priority issue resolution.',
  },
  'secure.startup.description': {
    '.net':
      'Perfect for startups and businesses that need to share creative ideas with potential investors, partners, or team members. The Secure plan provides the controls and legal protections you need when involving others in your creative development.',
    '.ai':
      'Perfect for startups and businesses that need to share intellectual property with potential investors, partners, or team members. The Secure plan provides the controls and legal protections you need when involving others in your intellectual property development.',
  },
  'secure.teams.description': {
    '.net':
      'Ideal for teams working together on creative assets that require careful sharing and access management. Control who can view, edit, or download your documents while maintaining a clear record of all activities.',
    '.ai':
      'Ideal for teams working together on intellectual property assets that require careful sharing and access management. Control who can view, edit, or download your documents while maintaining a clear record of all activities.',
  },
  'secure.consultants.description': {
    '.net':
      'Great for professionals who need to share confidential work with clients while protecting their creative ideas. The NDA integration ensures your work is legally protected when sharing with clients, agencies, or other stakeholders.',
    '.ai':
      'Great for professionals who need to share confidential work with clients while protecting their intellectual property. The NDA integration ensures your work is legally protected when sharing with clients, agencies, or other stakeholders.',
  },
  'secure.storage.comparison': {
    '.net': 'Triple the storage space for all your creative documentation',
    '.ai': 'Triple the storage space for all your IP documentation',
  },
  'secure.team.faq': {
    '.net':
      'The Secure plan includes up to 5 team members who can collaborate on your creative ideas. Each team member gets their own login and access controls. Additional team members can be added for $3/month per person.',
    '.ai':
      'The Secure plan includes up to 5 team members who can collaborate on your intellectual property. Each team member gets their own login and access controls. Additional team members can be added for $3/month per person.',
  },
  'secure.nda.faq': {
    '.net':
      'Yes, our NDAs are drafted by creative industry attorneys and are legally binding in most jurisdictions. We use digital signature technology that complies with e-signature laws, and we maintain comprehensive timestamp records of agreement acceptance.',
    '.ai':
      'Yes, our NDAs are drafted by intellectual property attorneys and are legally binding in most jurisdictions. We use digital signature technology that complies with e-signature laws, and we maintain comprehensive timestamp records of agreement acceptance.',
  },
  'cta.secure.share': {
    '.net': 'Ready to Securely Share Your Creative Ideas?',
    '.ai': 'Ready to Securely Share Your Intellectual Property?',
  },
  'cta.secure.balance': {
    '.net':
      'The Secure plan gives you the perfect balance of protection and collaboration capabilities for your creative work. Start safely sharing your ideas today.',
    '.ai':
      'The Secure plan gives you the perfect balance of protection and collaboration capabilities for your intellectual property. Start safely sharing today.',
  },

  // Complete plan specific descriptions
  'complete.monitoring.description': {
    '.net':
      'Our system continuously scans the web for unauthorized use of your creative work, identifying potential infringements and providing quarterly reports to keep you informed of any issues.',
    '.ai':
      'Our system continuously scans the web for unauthorized use of your intellectual property, identifying potential infringements and providing quarterly reports to keep you informed of any issues.',
  },
  'complete.ai.description': {
    '.net':
      'Our specialized AI agents work 24/7 to monitor the internet for unauthorized use of your creative work, providing comprehensive reports with evidence and suggested actions when potential infringement is detected.',
    '.ai':
      'Our specialized AI agents work 24/7 to monitor the internet for unauthorized use of your intellectual property, providing comprehensive reports with evidence and suggested actions when potential infringement is detected.',
  },
  'complete.alerts.description': {
    '.net':
      'Receive instant notifications about important activities related to your creative work, such as unauthorized access attempts, potential infringements, sharing activity, and licensing opportunities.',
    '.ai':
      'Receive instant notifications about important activities related to your intellectual property, such as unauthorized access attempts, potential infringements, sharing activity, and licensing opportunities.',
  },
  'complete.priority.description': {
    '.net':
      'Get VIP access to our creative protection specialists with priority support channels and quarterly consultation sessions to help optimize your protection and monetization strategy.',
    '.ai':
      'Get VIP access to our intellectual property specialists with priority support channels and quarterly consultation sessions to help optimize your IP protection and monetization strategy.',
  },
  'complete.business.description': {
    '.net':
      'Perfect for businesses with significant creative assets that need comprehensive protection and monitoring. The Complete plan provides advanced security, monitoring, and monetization features for organizations that see their creative work as a core business asset.',
    '.ai':
      'Perfect for businesses with significant intellectual property assets that need comprehensive protection and monitoring. The Complete plan provides advanced security, monitoring, and monetization features for organizations that see their IP as a core business asset.',
  },
  'complete.highvalue.description': {
    '.net':
      "Ideal for protecting creative work of exceptional value, where monitoring for unauthorized use and infringement is critical. The Complete plan's monitoring capabilities help identify potential theft and misuse across the web and digital marketplaces.",
    '.ai':
      "Ideal for protecting intellectual property of exceptional value, where monitoring for unauthorized use and infringement is critical. The Complete plan's monitoring capabilities help identify potential IP theft and misuse across the web and digital marketplaces.",
  },
  'complete.protection.description': {
    '.net':
      'Perfect for creators and organizations looking to actively protect their creative work from unauthorized use. The AI agent continuously monitors the internet for potential infringement and provides comprehensive reports with evidence and suggested actions.',
    '.ai':
      'Perfect for creators and organizations looking to actively protect their intellectual property from unauthorized use. The AI agent continuously monitors the internet for potential infringement and provides comprehensive reports with evidence and suggested actions.',
  },
  'complete.monitoring.faq': {
    '.net':
      "Our system uses advanced AI and web crawling technology to scan the internet for content similar to your protected creative work. It analyzes websites, marketplaces, repositories, and other digital platforms to identify potential unauthorized use. You'll receive real-time alerts for significant matches and quarterly comprehensive reports.",
    '.ai':
      "Our system uses advanced AI and web crawling technology to scan the internet for content similar to your protected intellectual property. It analyzes websites, marketplaces, repositories, and other digital platforms to identify potential unauthorized use. You'll receive real-time alerts for significant matches and quarterly comprehensive reports.",
  },
  'complete.ai.control.faq': {
    '.net':
      'Yes, you have complete control over the AI agent. You can define parameters including pricing requirements, potential use cases, target industries, conversation boundaries, and presentation style. You can also review and approve all leads before direct contact is made.',
    '.ai':
      'Yes, you have complete control over the AI agent. You can define parameters including pricing requirements, potential use cases, target industries, conversation boundaries, and presentation style. You can also review and approve all leads before direct contact is made.',
  },
  'complete.consultation.faq': {
    '.net':
      "Each quarter, you'll have a one-hour session with a creative protection specialist who will review your current protection strategy, analyze any detected infringements, assess monetization opportunities, and provide recommendations for optimizing your portfolio management.",
    '.ai':
      "Each quarter, you'll have a one-hour session with an intellectual property specialist who will review your current protection strategy, analyze any detected infringements, assess monetization opportunities, and provide recommendations for optimizing your IP portfolio management.",
  },
  'cta.complete.ready': {
    '.net': 'Ready for Comprehensive Creative Protection?',
    '.ai': 'Ready for Comprehensive IP Protection?',
  },
  'cta.complete.ultimate': {
    '.net':
      'The Complete plan offers the ultimate protection for your valuable creative work, with monitoring, monetization, and expert assistance all included.',
    '.ai':
      'The Complete plan offers the ultimate protection for your valuable intellectual property, with monitoring, monetization, and expert assistance all included.',
  },
  'complete.storage.comparison': {
    '.net':
      'More than 3x the storage of the Secure plan for all your creative work',
    '.ai': 'More than 3x the storage of the Secure plan for all your IP',
  },
  'complete.ai.promotion': {
    '.net':
      'AI-powered agent that actively promotes your creative work to potential buyers',
    '.ai':
      'AI-powered agent that actively promotes your IP to potential buyers',
  },
  'complete.subtitle': {
    '.net':
      'Comprehensive protection with monitoring, AI-powered assistance, and advanced security features.',
    '.ai':
      'Comprehensive protection with monitoring, AI-powered assistance, and advanced security features.',
  },

  // Plans page specific vocabulary
  'plans.title': {
    '.net': 'Choose Your Creative Protection Plan',
    '.ai': 'Choose Your IP Protection Plan',
  },
  'plans.subtitle': {
    '.net':
      'Select the plan that best fits your creative needs and business goals.',
    '.ai':
      'Select the plan that best fits your intellectual property needs and business goals.',
  },
  'plans.basic.description': {
    '.net': 'Essential protection for solo creators with documentation needs',
    '.ai': 'Essential protection for solo creators with documentation needs',
  },
  'plans.basic.idealfor': {
    '.net': 'Solo creators looking to establish idea provenance',
    '.ai': 'Solo creators looking to establish IP provenance',
  },
  'plans.secure.description': {
    '.net': 'Enhanced protection with controlled sharing and NDA integration',
    '.ai': 'Enhanced protection with controlled sharing and NDA integration',
  },
  'plans.secure.idealfor': {
    '.net': 'Teams and businesses sharing creative work with partners',
    '.ai': 'Teams and businesses sharing IP with partners',
  },
  'plans.complete.description': {
    '.net':
      'Comprehensive protection with monitoring and AI-powered assistance',
    '.ai': 'Comprehensive protection with monitoring and AI-powered assistance',
  },
  'plans.complete.idealfor': {
    '.net':
      'Businesses with valuable creative assets requiring continuous protection',
    '.ai': 'Businesses with valuable IP requiring continuous protection',
  },
  'plans.encryption.description': {
    '.net': 'Military-grade encryption for all your creative documents',
    '.ai':
      'Military-grade encryption for all your intellectual property documents',
  },
  'plans.sharing.description': {
    '.net':
      'Share your ideas with specific individuals under controlled conditions',
    '.ai':
      'Share your intellectual property with specific individuals under controlled conditions',
  },
  'plans.monitoring.description': {
    '.net': 'Automated scanning for unauthorized use of your creative work',
    '.ai':
      'Automated scanning for unauthorized use of your intellectual property',
  },
  'plans.ai.description': {
    '.net':
      'AI-powered agent that monitors the internet for unauthorized use of your creative work and provides detailed reports',
    '.ai':
      'AI-powered agent that monitors the internet for unauthorized use of your IP and provides detailed reports',
  },
  'plans.cta.start': {
    '.net':
      'Start securing your ideas today with our risk-free trial. Cancel anytime during the first 30 days for a full refund.',
    '.ai':
      'Start securing your intellectual property today with our risk-free trial. Cancel anytime during the first 30 days for a full refund.',
  },

  // How it works page vocabulary
  'how.intro.description': {
    '.net':
      'SafeIdea provides a complete ecosystem for protecting your creative ideas at every stage—from initial documentation to secure sharing and continuous protection.',
    '.ai':
      'SafeIdea provides a complete ecosystem for protecting your intellectual property at every stage—from initial documentation to secure sharing and continuous protection.',
  },
  'how.document.description': {
    '.net':
      'Upload your ideas, documents, and creative assets to our secure platform. We create an immutable timestamp proof of existence that can be verified at any time.',
    '.ai':
      'Upload your ideas, documents, and intellectual property assets to our secure platform. We create an immutable timestamp proof of existence that can be verified at any time.',
  },
  'how.share.description': {
    '.net':
      'Share your ideas with potential partners, investors, or team members under controlled conditions. Use our standard NDAs or your own customized NDAs to enforce agreements with timestamped proof of access.',
    '.ai':
      'Share your intellectual property with potential partners, investors, or team members under controlled conditions. Use our standard NDAs or your own customized NDAs to enforce agreements with timestamped proof of access.',
  },
  'how.protect.title': {
    '.net': 'Protect Your Ideas',
    '.ai': 'Protect Your IP',
  },
  'how.protect.description': {
    '.net':
      'Your ideas deserve protection. Our AI agents continuously monitor the internet for unauthorized use of your creative work, providing comprehensive reports and actionable insights.',
    '.ai':
      'Your intellectual property deserves protection. Our AI agents continuously monitor the internet for unauthorized use of your IP, providing comprehensive reports and actionable insights.',
  },
  'how.timestamp.description': {
    '.net':
      'Create unforgeable documentation of when your creative work was created and uploaded. This timestamp is permanently stored on decentralized infrastructure, making it impossible to tamper with.',
    '.ai':
      'Create unforgeable documentation of when your intellectual property was created and uploaded. This timestamp is permanently stored on decentralized infrastructure, making it impossible to tamper with.',
  },
  'how.timestamp.why': {
    '.net':
      'In creative disputes, proving who created something first is often the key to establishing ownership.',
    '.ai':
      'In intellectual property disputes, proving who created something first is often the key to establishing ownership.',
  },
  'how.nda.why': {
    '.net':
      'Traditional NDAs are difficult to enforce without proof that someone actually had access to your creative work.',
    '.ai':
      'Traditional NDAs are difficult to enforce without proof that someone actually had access to your information.',
  },
  'how.nda.misused': {
    '.net':
      'Our system records exactly when someone accessed your information and under what terms. This creates a clear chain of evidence if your creative work is misused.',
    '.ai':
      'Our system records exactly when someone accessed your information and under what terms. This creates a clear chain of evidence if your intellectual property is misused.',
  },
  'how.ai.description': {
    '.net':
      'Specialized AI agents trained on your creative work continuously scan the internet for potential infringement, providing you with detailed reports and evidence when unauthorized use is detected.',
    '.ai':
      'Specialized AI agents trained on your intellectual property continuously scan the internet for potential infringement, providing you with detailed reports and evidence when unauthorized use is detected.',
  },
  'how.ai.why': {
    '.net':
      "Most creators don't have the time or resources to continuously monitor the internet for unauthorized use of their creative work.",
    '.ai':
      "Most creators don't have the time or resources to continuously monitor the internet for unauthorized use of their intellectual property.",
  },
  'how.fraud.why': {
    '.net':
      "In today's digital world, ideas can be copied instantly. Having verifiable proof of creation is essential for protecting your creative assets.",
    '.ai':
      "In today's digital world, ideas can be copied instantly. Having verifiable proof of creation is essential for protecting your intellectual assets.",
  },
  'how.patent.description': {
    '.net':
      'Patents are government-granted monopolies that require public disclosure of your invention. SafeIdea complements patents by protecting trade secrets, early-stage ideas, and digital assets that may not qualify for patent protection, while maintaining confidentiality.',
    '.ai':
      'Patents are government-granted monopolies that require public disclosure of your invention. SafeIdea complements patents by protecting trade secrets, early-stage ideas, and digital assets that may not qualify for patent protection, while maintaining confidentiality.',
  },
  'how.ai.work': {
    '.net':
      'Our AI agents are trained on your creative documents and business preferences. They can engage with potential customers, explain your offering within the parameters you set, and facilitate introductions for more complex negotiations.',
    '.ai':
      'Our AI agents are trained on your intellectual property documents and business preferences. They can engage with potential customers, explain your offering within the parameters you set, and facilitate introductions for more complex negotiations.',
  },
  'how.cta.description': {
    '.net':
      'Take our quick assessment to find the ideal protection level for your creative needs.',
    '.ai':
      'Take our quick assessment to find the ideal protection level for your intellectual property needs.',
  },

  // FAQ neutral terms (same for both sites)
  'faq.neutral.item': {
    '.net': 'IP / Ideas',
    '.ai': 'IP / Ideas',
  },
  'faq.neutral.protection': {
    '.net': 'intellectual property / ideas',
    '.ai': 'intellectual property / ideas',
  },
  'faq.neutral.safeidea.description': {
    '.net':
      'SafeIdea is a comprehensive protection platform that helps creators, inventors, and businesses secure, document, share, and protect their IP / ideas. Our services include secure documentation with immutable timestamps, controlled sharing with NDA integration, and advanced monitoring for potential infringement.',
    '.ai':
      'SafeIdea is a comprehensive protection platform that helps creators, inventors, and businesses secure, document, share, and protect their IP / ideas. Our services include secure documentation with immutable timestamps, controlled sharing with NDA integration, and advanced monitoring for potential infringement.',
  },
  'faq.neutral.types': {
    '.net':
      "SafeIdea can protect virtually any type of IP / creative work, including but not limited to: written works, software code, designs, artwork, trade secrets, business plans, inventions, formulas, processes, and methodologies. If it's a creative or innovative asset that provides value, we can help you protect it.",
    '.ai':
      "SafeIdea can protect virtually any type of IP / creative work, including but not limited to: written works, software code, designs, artwork, trade secrets, business plans, inventions, formulas, processes, and methodologies. If it's a creative or innovative asset that provides value, we can help you protect it.",
  },
  'faq.neutral.ownership': {
    '.net':
      'You retain 100% ownership of all IP / ideas you store on SafeIdea. Our Terms of Service explicitly state that we claim no rights or ownership over your content. We are simply providing tools to help you protect, document, and manage your assets.',
    '.ai':
      'You retain 100% ownership of all IP / ideas you store on SafeIdea. Our Terms of Service explicitly state that we claim no rights or ownership over your content. We are simply providing tools to help you protect, document, and manage your assets.',
  },
  'faq.neutral.secure.description': {
    '.net':
      'We use end-to-end encryption to ensure your IP / ideas are secure. Documents are encrypted before they leave your device, meaning only you and those you explicitly share with can access them. We use AES-256 encryption, and all data is stored in redundant, secure data centers with multiple layers of physical and digital security.',
    '.ai':
      'We use end-to-end encryption to ensure your IP / ideas are secure. Documents are encrypted before they leave your device, meaning only you and those you explicitly share with can access them. We use AES-256 encryption, and all data is stored in redundant, secure data centers with multiple layers of physical and digital security.',
  },
  'faq.neutral.backup.description': {
    '.net':
      'Your encrypted documents are stored with redundancy across multiple secure data centers. We perform continuous backups to ensure your IP / ideas are protected against data loss. However, since all files are encrypted with your keys, we recommend keeping secure backups of your encryption recovery information.',
    '.ai':
      'Your encrypted documents are stored with redundancy across multiple secure data centers. We perform continuous backups to ensure your IP / ideas are protected against data loss. However, since all files are encrypted with your keys, we recommend keeping secure backups of your encryption recovery information.',
  },
  'faq.neutral.ai.monitoring': {
    '.net':
      'The AI agent (available in the Complete plan) continuously monitors the internet for potential unauthorized use of your IP / ideas. It scans websites, marketplaces, and digital platforms to detect copying, derivative works, or misappropriation. When potential infringement is found, it provides comprehensive reports with evidence and suggested next steps for protecting your assets.',
    '.ai':
      'The AI agent (available in the Complete plan) continuously monitors the internet for potential unauthorized use of your IP / ideas. It scans websites, marketplaces, and digital platforms to detect copying, derivative works, or misappropriation. When potential infringement is found, it provides comprehensive reports with evidence and suggested next steps for protecting your assets.',
  },
  'faq.neutral.monitoring.scope': {
    '.net':
      'Our monitoring system (available in the Complete plan) scans websites, marketplaces, code repositories, academic papers, and other digital platforms for content that matches or is substantially similar to your protected IP / ideas. It detects potential unauthorized use, copying, derivative works, and misappropriation, providing you with alerts and evidence of possible infringement.',
    '.ai':
      'Our monitoring system (available in the Complete plan) scans websites, marketplaces, code repositories, academic papers, and other digital platforms for content that matches or is substantially similar to your protected IP / ideas. It detects potential unauthorized use, copying, derivative works, and misappropriation, providing you with alerts and evidence of possible infringement.',
  },
  'faq.neutral.filecoin': {
    '.net':
      "SafeIdea has partnered with Filecoin to establish immutable security for your IP / ideas. Filecoin is the largest decentralized storage network in the world, with approximately 3.8 exabytes of capacity distributed across thousands of independent storage providers. This massive infrastructure ensures your assets are protected with the same technology trusted by prestigious institutions like the Internet Archive, Wikipedia, MIT, and the Smithsonian.\n\nOur Filecoin integration creates an unalterable blockchain record of your IP / ideas, establishing verifiable proof of ownership and creation date. Unlike traditional storage solutions, Filecoin's decentralized approach eliminates single points of failure while providing cryptographic verification that your data remains unchanged over time. This gives you confidence that your provenance is permanently secured and legally defensible.",
    '.ai':
      "SafeIdea has partnered with Filecoin to establish immutable security for your IP / ideas. Filecoin is the largest decentralized storage network in the world, with approximately 3.8 exabytes of capacity distributed across thousands of independent storage providers. This massive infrastructure ensures your assets are protected with the same technology trusted by prestigious institutions like the Internet Archive, Wikipedia, MIT, and the Smithsonian.\n\nOur Filecoin integration creates an unalterable blockchain record of your IP / ideas, establishing verifiable proof of ownership and creation date. Unlike traditional storage solutions, Filecoin's decentralized approach eliminates single points of failure while providing cryptographic verification that your data remains unchanged over time. This gives you confidence that your provenance is permanently secured and legally defensible.",
  },
  'faq.subtitle': {
    '.net':
      "Find answers to common questions about SafeIdea's protection services for IP / ideas.",
    '.ai':
      "Find answers to common questions about SafeIdea's protection services for IP / ideas.",
  },
  'faq.contact.description': {
    '.net':
      'Our support team is here to help. Contact us with any questions about our plans, features, or protection strategies for IP / ideas.',
    '.ai':
      'Our support team is here to help. Contact us with any questions about our plans, features, or protection strategies for IP / ideas.',
  },
  'faq.cta.ready': {
    '.net': 'Ready to Protect Your IP / Ideas?',
    '.ai': 'Ready to Protect Your IP / Ideas?',
  },
  'faq.cta.start': {
    '.net':
      'Start securing your IP / ideas today with our risk-free 30-day money-back guarantee.',
    '.ai':
      'Start securing your IP / ideas today with our risk-free 30-day money-back guarantee.',
  },
} as const

export function useVocabulary() {
  const isAISiteFeature = useFeature('ai')
  const hasIntroducedIP = useRef(false)

  // Check both feature flag and URL (fallback for PR previews where env vars aren't set)
  const isAISite =
    isAISiteFeature ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('conciliator-ai') ||
        window.location.hostname.includes('app.safeidea.ai')))

  const getTerm = (
    key: keyof typeof vocabularyMap,
    options?: { forceVariant?: 'first' | 'full' | 'short' }
  ): string => {
    const site = isAISite ? '.ai' : '.net'

    // Handle special case for IP/Intellectual Property on .ai site
    if (isAISite && key === 'item' && !options?.forceVariant) {
      // First usage on the page should be "Intellectual Property (IP)"
      if (!hasIntroducedIP.current) {
        hasIntroducedIP.current = true
        return vocabularyMap['item.first'][site]
      }
      // After introduction, prefer short form but mix in full form occasionally
      // This is a simple implementation - could be made more sophisticated
      return Math.random() > 0.7
        ? vocabularyMap['item.full'][site]
        : vocabularyMap.item[site]
    }

    // Handle forced variants
    if (
      options?.forceVariant === 'first' &&
      vocabularyMap[`${key}.first` as keyof typeof vocabularyMap]
    ) {
      return vocabularyMap[`${key}.first` as keyof typeof vocabularyMap][site]
    }
    if (
      options?.forceVariant === 'full' &&
      vocabularyMap[`${key}.full` as keyof typeof vocabularyMap]
    ) {
      return vocabularyMap[`${key}.full` as keyof typeof vocabularyMap][site]
    }

    return vocabularyMap[key][site]
  }

  // Reset the introduction tracker (useful when navigating between pages)
  const resetIntroduction = () => {
    hasIntroducedIP.current = false
  }

  return { getTerm, resetIntroduction }
}
