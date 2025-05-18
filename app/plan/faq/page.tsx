'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackFunnelPageVisit } from '../PlanStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRightIcon,
  QuestionMarkCircledIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'

// FAQ categories and questions
const FAQ_CATEGORIES = [
  {
    id: 'general',
    name: 'General Questions',
    questions: [
      {
        id: 'what-is-safeidea',
        question: 'What is SafeIdea?',
        answer:
          'SafeIdea is a comprehensive intellectual property protection platform that helps creators, inventors, and businesses secure, document, share, and monetize their intellectual property. Our services include secure documentation with immutable timestamps, controlled sharing with NDA integration, and advanced monitoring for potential infringement.',
      },
      {
        id: 'different-from-patent',
        question: 'How is SafeIdea different from a patent?',
        answer:
          'Patents are government-granted monopolies that require public disclosure of your invention. SafeIdea complements patents by protecting trade secrets, early-stage ideas, and digital assets that may not qualify for patent protection, while maintaining confidentiality. We focus on establishing provenance, secure sharing, and monitoring rather than public registration.',
      },
      {
        id: 'types-of-ip',
        question: 'What types of intellectual property can I protect?',
        answer:
          "SafeIdea can protect virtually any type of intellectual property, including but not limited to: written works, software code, designs, artwork, trade secrets, business plans, inventions, formulas, processes, and methodologies. If it's a creative or innovative asset that provides value, we can help you protect it.",
      },
      {
        id: 'legal-protection',
        question: 'Does SafeIdea provide legal protection?',
        answer:
          'SafeIdea provides important documentation and evidence that can be used in legal proceedings, but we are not a substitute for legal registration or professional legal advice. Our immutable timestamps and access logs create legally defensible evidence of creation and ownership, while our NDA integration helps establish contractual protection when sharing.',
      },
    ],
  },
  {
    id: 'plans-pricing',
    name: 'Plans & Pricing',
    questions: [
      {
        id: 'plan-differences',
        question: 'What are the differences between the plans?',
        answer:
          'Our Basic Plan ($9/month) provides essential protection with secure storage, encryption, and timestamping. The Secure Plan ($19/month) adds unlimited sharing with access controls, NDA integration, and detailed activity tracking. The Complete Plan ($29/month) includes all features plus IP monitoring, infringement detection, AI sales agent capabilities, and expert consultation.',
      },
      {
        id: 'change-plans',
        question: 'Can I change plans later?',
        answer:
          "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. When upgrading, you'll immediately gain access to the new features while keeping all your existing intellectual property documentation and history.",
      },
      {
        id: 'free-trial',
        question: 'Do you offer a free trial?',
        answer:
          "While we don't offer a free trial, we do provide a 30-day money-back guarantee on all plans. If you're not completely satisfied with our service within the first 30 days, contact our support team for a full refund.",
      },
      {
        id: 'additional-storage',
        question: 'Can I purchase additional storage?',
        answer:
          'Yes, additional storage can be purchased in increments of 10GB for $3/month. Simply go to your account settings after signing up and select "Add Storage" to increase your storage capacity beyond what\'s included in your plan.',
      },
    ],
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    questions: [
      {
        id: 'data-security',
        question: 'How secure is my data?',
        answer:
          'We use end-to-end encryption to ensure your intellectual property is secure. Documents are encrypted before they leave your device, meaning only you and those you explicitly share with can access them. We use AES-256 encryption, and all data is stored in redundant, secure data centers with multiple layers of physical and digital security.',
      },
      {
        id: 'staff-access',
        question: 'Can SafeIdea staff access my documents?',
        answer:
          "No, SafeIdea staff cannot access the contents of your encrypted documents. Our system uses zero-knowledge encryption, meaning we don't have the keys to decrypt your files. This ensures your intellectual property remains completely private, even from our own team members.",
      },
      {
        id: 'data-backups',
        question: 'How are my documents backed up?',
        answer:
          'Your encrypted documents are stored with redundancy across multiple secure data centers. We perform continuous backups to ensure your intellectual property is protected against data loss. However, since all files are encrypted with your keys, we recommend keeping secure backups of your encryption recovery information.',
      },
      {
        id: 'data-ownership',
        question: 'Who owns the intellectual property I store?',
        answer:
          'You retain 100% ownership of all intellectual property you store on SafeIdea. Our Terms of Service explicitly state that we claim no rights or ownership over your content. We are simply providing tools to help you protect, document, and manage your intellectual assets.',
      },
    ],
  },
  {
    id: 'features',
    name: 'Features & Functionality',
    questions: [
      {
        id: 'timestamp-work',
        question: 'How do the immutable timestamps work?',
        answer:
          'When you upload a document, our system creates a cryptographic hash (a unique digital fingerprint) of the file and records this in a secure, tamper-proof database with a timestamp. This process creates verifiable proof of when the document existed in that exact form, which can be independently validated at any time without revealing the actual contents.',
      },
      {
        id: 'nda-enforcement',
        question: 'Are the NDAs legally enforceable?',
        answer:
          'Yes, our NDAs are created by intellectual property attorneys and are legally binding in most jurisdictions. We use proper electronic signature technology that complies with e-signature laws, and we timestamp and record all agreement acceptances. However, as with any legal document, enforcement may vary by jurisdiction.',
      },
      {
        id: 'ai-agent-work',
        question: 'How does the AI sales agent work?',
        answer:
          'The AI sales agent (available in the Complete plan) is trained on your intellectual property documents and your specific business parameters. It can engage with potential customers, explain your offering within your defined boundaries, answer basic questions, and facilitate introductions for more complex negotiations—all while operating 24/7 to maximize opportunity discovery.',
      },
      {
        id: 'monitoring-scope',
        question: 'What does the monitoring system check for?',
        answer:
          'Our monitoring system (available in the Complete plan) scans websites, marketplaces, code repositories, academic papers, and other digital platforms for content that matches or is substantially similar to your protected intellectual property. It detects potential unauthorized use, copying, derivative works, and misappropriation, providing you with alerts and evidence of possible infringement.',
      },
    ],
  },
  {
    id: 'technical',
    name: 'Technical Questions',
    questions: [
      {
        id: 'file-types',
        question: 'What file types are supported?',
        answer:
          'SafeIdea supports a wide variety of file formats including PDFs, Word documents, Excel spreadsheets, PowerPoint presentations, images (JPG, PNG, SVG, etc.), CAD files, code files, text documents, ZIP archives, and more. The maximum file size is 100MB per document, though this limit is higher for enterprise clients.',
      },
      {
        id: 'browser-compatibility',
        question: 'Which browsers are supported?',
        answer:
          'SafeIdea works with all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. We recommend keeping your browser updated to the latest version for optimal security and performance. Our platform also works on mobile browsers, though we recommend using our mobile apps (available for iOS and Android) for the best mobile experience.',
      },
      {
        id: 'api-integration',
        question: 'Do you offer API access?',
        answer:
          "Yes, we offer API access for businesses that want to integrate SafeIdea's protection features into their existing workflows or applications. API access is available on the Complete plan and for Enterprise customers. Our REST API allows you to programmatically create timestamps, manage sharing, track access, and more.",
      },
      {
        id: 'export-data',
        question: 'Can I export my data?',
        answer:
          'Yes, you can export all your data at any time. This includes your documents, timestamp certificates, access logs, and sharing histories. We provide your data in industry-standard formats along with detailed documentation to ensure you always have access to your information, even if you decide to leave our service.',
      },
    ],
  },
]

export default function FAQPage() {
  const router = useRouter()
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>(
    {}
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFAQs, setFilteredFAQs] = useState(FAQ_CATEGORIES)

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('faq')
  }, [])

  // Toggle question open/closed
  const toggleQuestion = (questionId: string) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFAQs(FAQ_CATEGORIES)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = FAQ_CATEGORIES.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(term) ||
          q.answer.toLowerCase().includes(term)
      ),
    })).filter((category) => category.questions.length > 0)

    setFilteredFAQs(filtered)
  }, [searchTerm])

  return (
    <div className="flex flex-col items-center" data-testid="faq-container">
      {/* Header Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-8">
          Find answers to common questions about SafeIdea's intellectual
          property protection services.
        </p>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto mb-12">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="faq-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <MinusIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </section>

      {/* FAQ Content */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-12">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try a different search term or browse our categories below.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchTerm('')}
            >
              Reset Search
            </Button>
          </div>
        ) : (
          filteredFAQs.map((category) => (
            <div
              key={category.id}
              className="mb-10"
              data-testid={`faq-category-${category.id}`}
            >
              <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {category.name}
              </h2>

              <div className="space-y-4">
                {category.questions.map((q) => (
                  <Card
                    key={q.id}
                    className="border border-border/30 overflow-hidden"
                    data-testid={`faq-question-${q.id}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
                      onClick={() => toggleQuestion(q.id)}
                      aria-expanded={openQuestions[q.id]}
                      data-testid={`faq-question-toggle-${q.id}`}
                    >
                      <div className="flex items-center">
                        <QuestionMarkCircledIcon className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                        <h3 className="font-medium">{q.question}</h3>
                      </div>
                      {openQuestions[q.id] ? (
                        <MinusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    {openQuestions[q.id] && (
                      <CardContent className="pt-0 pb-4 px-4 border-t border-border/30">
                        <div className="pl-7">
                          {' '}
                          {/* Align with question icon */}
                          <p className="text-foreground/80">{q.answer}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Contact Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Didn't Find Your Answer?</h2>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">
            Our support team is here to help. Contact us with any questions
            about our plans, features, or intellectual property protection
            strategies.
          </p>
          <Button variant="outline" onClick={() => router.push('/contact')}>
            Contact Support
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Protect Your Intellectual Property?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          Start securing your ideas today with our risk-free 30-day money-back
          guarantee.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/plan/assessment')}
            data-testid="assessment-cta"
          >
            Find Your Ideal Plan
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/plan/plans')}
            data-testid="plans-cta"
          >
            Compare Plans
          </Button>
        </div>
      </section>
    </div>
  )
}
