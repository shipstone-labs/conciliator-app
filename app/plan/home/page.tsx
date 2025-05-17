'use client'

import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRightIcon,
  LockClosedIcon,
  TargetIcon,
  Share2Icon,
  CheckIcon,
} from '@radix-ui/react-icons'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Because Your Ideas Are Worth Protecting
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8">
          Securely store your intellectual property with encryption, share it
          safely with partners, and protect it from unauthorized use – all from
          just $9/month.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/plan/assessment')}
            data-testid="plan-primary-cta"
          >
            Protect My Idea Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/plan/how-it-works')}
            data-testid="plan-secondary-cta"
          >
            Learn How It Works
          </Button>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your IP Protection Should Be As Innovative As Your Ideas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefit cards */}
          {BENEFIT_ITEMS.map((benefit, index) => (
            <Card
              key={index}
              className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  {benefit.icon}
                  <CardTitle>{benefit.heading}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{benefit.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Complete Protection Throughout Your Invention Journey
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service plans */}
          {SERVICE_PLANS.map((plan, index) => (
            <Card
              key={index}
              className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-primary mb-1">
                      {plan.tag}
                    </div>
                    <CardTitle>{plan.heading}</CardTitle>
                  </div>
                  {plan.icon}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 mb-4">{plan.text}</p>
                <div className="font-bold text-lg text-foreground">
                  {plan.price}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => router.push(plan.link)}
                  data-testid={`plan-${plan.id}-button`}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Trusted by Inventors and Creators
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial cards */}
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden"
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mb-4" />
                  <p className="text-foreground/80 italic mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-auto">
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-foreground/60">
                      {testimonial.title}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Protect Your Innovative Ideas?
        </h2>

        <Button
          size="lg"
          className="mb-4"
          onClick={() => router.push('/plan/assessment')}
          data-testid="plan-final-cta"
        >
          Start Your Protection Now
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-foreground/80">
          Try risk-free with our 30-day money-back guarantee.
        </p>
      </section>
    </div>
  )
}

// Data for the page sections
const BENEFIT_ITEMS = [
  {
    icon: <CheckIcon className="w-6 h-6 text-primary" />,
    heading: 'Establish Provenance',
    text: "Secure timestamped records create legally defensible proof of your invention's existence and ownership.",
  },
  {
    icon: <LockClosedIcon className="w-6 h-6 text-primary" />,
    heading: 'You Maintain Control',
    text: 'Your intellectual property remains yours alone. We provide the tools to help you protect and manage it.',
  },
  {
    icon: <TargetIcon className="w-6 h-6 text-primary" />,
    heading: 'Security Made Simple',
    text: 'Complex IP protection streamlined into an easy-to-use platform that works for inventors, not lawyers.',
  },
  {
    icon: <TargetIcon className="w-6 h-6 text-primary" />,
    heading: 'Focus on Innovation',
    text: 'Stop worrying about your ideas being stolen and concentrate on what you do best — creating and inventing.',
  },
]

const SERVICE_PLANS = [
  {
    id: 'basic',
    tag: '$9/month',
    heading: 'Secure Storage & Timestamping',
    text: 'Encrypted storage with immutable timestamps that create provable documentation of your intellectual property.',
    icon: <CheckIcon className="w-6 h-6 text-primary" />,
    price: '$9/month',
    link: '/plan/basic',
  },
  {
    id: 'secure',
    tag: 'Most Popular',
    heading: 'Controlled Access & NDA Integration',
    text: 'Share your IP with partners and investors while maintaining control through secure access protocols and NDA tracking.',
    icon: <Share2Icon className="w-6 h-6 text-primary" />,
    price: '$19/month',
    link: '/plan/secure',
  },
  {
    id: 'complete',
    tag: '$29/month',
    heading: 'Monitoring & Infringement Detection',
    text: 'Active monitoring of the web for unauthorized use of your intellectual property with quarterly reports and alerts.',
    icon: <TargetIcon className="w-6 h-6 text-primary" />,
    price: '$29/month',
    link: '/plan/complete',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'SafeIdea has transformed how I document my inventions. The timestamp feature alone has already helped me prove my ownership in a dispute with a former colleague.',
    name: 'Michaela Rodriguez',
    title: 'Independent Inventor, 3 Patents Filed',
  },
  {
    quote:
      'The secure sharing feature saved us countless hours of back-and-forth with NDAs. Now we can safely share our IP with potential investors with just a few clicks.',
    name: 'Alex Johnson',
    title: 'Founder, NanoTech Solutions',
  },
  {
    quote:
      'I recommend SafeIdea to all my clients as a first step in their IP protection strategy. It creates an excellent foundation of documentation before we even file a provisional patent.',
    name: 'Sarah Williams, Esq.',
    title: 'Patent Attorney',
  },
]
