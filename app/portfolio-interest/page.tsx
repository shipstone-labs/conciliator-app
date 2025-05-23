'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircledIcon,
  ArrowRightIcon,
  PersonIcon,
  ArrowLeftIcon,
} from '@radix-ui/react-icons'
import { Logo } from '@/components/Logo'

interface FormData {
  name: string
  email: string
  organizationName: string
  organizationType: string
  expectedTimeline: string
  painPoints: string
  referralSource: string
}

export default function PortfolioInterestPage() {
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organizationName: '',
    organizationType: '',
    expectedTimeline: '',
    painPoints: '',
    referralSource: '',
  })

  // UI state
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when field is changed
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when field is changed
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required'
    }

    if (!formData.organizationType) {
      newErrors.organizationType = 'Organization type is required'
    }

    if (!formData.expectedTimeline) {
      newErrors.expectedTimeline = 'Expected timeline is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission to Google Forms
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Create a temporary form to submit to Google Forms
    const googleForm = document.createElement('form')
    googleForm.method = 'POST'
    googleForm.action =
      'https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/formResponse'
    googleForm.target = '_blank'

    // Add form fields (these entry IDs are placeholders - replace with actual Google Form entry IDs)
    const fields = [
      { name: 'entry.000000001', value: formData.name },
      { name: 'entry.000000002', value: formData.email },
      { name: 'entry.000000003', value: formData.organizationName },
      { name: 'entry.000000004', value: formData.organizationType },
      { name: 'entry.000000005', value: formData.expectedTimeline },
      { name: 'entry.000000006', value: formData.painPoints },
      { name: 'entry.000000007', value: formData.referralSource },
    ]

    fields.forEach((field) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = field.name
      input.value = field.value
      googleForm.appendChild(input)
    })

    // Submit the form
    document.body.appendChild(googleForm)
    googleForm.submit()
    document.body.removeChild(googleForm)

    // Show success message after a brief delay
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
    }, 1000)
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="container mx-auto flex justify-center py-8">
          <Logo />
        </div>

        {/* Success Message */}
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 mx-auto">
                <CheckCircledIcon className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Thank You for Your Interest!
              </h1>
              <p className="text-lg text-foreground/80 mb-6">
                Your information has been submitted successfully. We'll be in
                touch as we develop features for IP portfolio managers.
              </p>
              <p className="text-foreground/70 mb-8">
                Your input will help shape what we build. We'll reach out in the
                coming months to gather more feedback and keep you updated on
                our progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/subscription/home')}
                  variant="outline"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
                <Button onClick={() => router.push('/subscription/assessment')}>
                  Explore Individual Plans
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="container mx-auto flex justify-center py-8">
        <Logo />
      </div>

      {/* Header Section */}
      <section className="w-full max-w-3xl mx-auto text-center px-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
          <PersonIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Help Shape SafeIdea for Portfolio Managers
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-6">
          We're researching features for IP portfolio managers, patent
          attorneys, and research teams. Your insights will help us build the
          right tools for managing multiple IP assets.
        </p>
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <p className="text-foreground/80">
            <strong>Research Phase:</strong> We're targeting late 2025 for
            portfolio management features. Early participants will help define
            what we build and get priority access when available.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Tell Us About Your Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@organization.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Your organization or firm name"
                  className={
                    errors.organizationName ? 'border-destructive' : ''
                  }
                />
                {errors.organizationName && (
                  <p className="text-sm text-destructive">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationType">Organization Type *</Label>
                <Select
                  value={formData.organizationType}
                  onValueChange={(value) =>
                    handleSelectChange('organizationType', value)
                  }
                >
                  <SelectTrigger
                    className={
                      errors.organizationType ? 'border-destructive' : ''
                    }
                  >
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law_firm">Law Firm</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="research_lab">Research Lab</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.organizationType && (
                  <p className="text-sm text-destructive">
                    {errors.organizationType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedTimeline">
                  When would you need these features? *
                </Label>
                <Select
                  value={formData.expectedTimeline}
                  onValueChange={(value) =>
                    handleSelectChange('expectedTimeline', value)
                  }
                >
                  <SelectTrigger
                    className={
                      errors.expectedTimeline ? 'border-destructive' : ''
                    }
                  >
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q3_2025">Q3 2025</SelectItem>
                    <SelectItem value="q4_2025">Q4 2025</SelectItem>
                    <SelectItem value="h1_2026">H1 2026</SelectItem>
                    <SelectItem value="h2_2026">H2 2026</SelectItem>
                    <SelectItem value="unsure">Unsure</SelectItem>
                  </SelectContent>
                </Select>
                {errors.expectedTimeline && (
                  <p className="text-sm text-destructive">
                    {errors.expectedTimeline}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="painPoints">
                  Current pain points in managing IP portfolios
                </Label>
                <Textarea
                  id="painPoints"
                  name="painPoints"
                  value={formData.painPoints}
                  onChange={handleInputChange}
                  placeholder="What challenges do you face when managing multiple IP assets? (optional)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralSource">
                  How did you hear about SafeIdea?
                </Label>
                <Input
                  id="referralSource"
                  name="referralSource"
                  type="text"
                  value={formData.referralSource}
                  onChange={handleInputChange}
                  placeholder="Search engine, colleague, conference, etc. (optional)"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/subscription/home')}
                  className="sm:w-auto w-full"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:flex-1 w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Join Research Program'}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
