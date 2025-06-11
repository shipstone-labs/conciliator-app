'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function AIHomePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ipType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/ai-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: "Thank you for your interest! We'll be in touch soon.",
        })
        setFormData({ name: '', email: '', ipType: '' })
      } else {
        throw new Error(data.error || 'Something went wrong')
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to submit form',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6">
            Protect Your Intellectual Property
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Securely store your intellectual property with advanced encryption,
            share it safely with partners, and monitor for unauthorized use with
            AI
          </p>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Establish Provenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create secure, timestamped records that serve as legally
                defensible proof of your invention ownership
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Control & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Maintain full ownership with enterprise-level encryption and
                integrated NDA system. No middlemen.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                AI Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Custom AI agents trained to recognize and monitor for
                unauthorized use of your intellectual property
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Sign Up Form */}
        <section className="max-w-md mx-auto">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Apply for Early Access to SafeIdea.ai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipType">Type of IP</Label>
                  <Input
                    id="ipType"
                    name="ipType"
                    type="text"
                    placeholder="e.g., Software, Patent, Trade Secret"
                    value={formData.ipType}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {submitStatus.type && (
                  <Alert
                    variant={
                      submitStatus.type === 'error' ? 'destructive' : 'default'
                    }
                  >
                    <AlertDescription>{submitStatus.message}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Apply for Early Access'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  By submitting, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>© 2025 SafeIdea, LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
