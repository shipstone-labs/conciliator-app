'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  MixerHorizontalIcon,
  CalendarIcon,
  BellIcon,
  PaperPlaneIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'
import type { SharingPreferenceType } from '@/lib/types'

export default function ManagePage() {
  const router = useRouter()

  // Load previous journey data to adapt UI
  const patentInterest = getJourneyData('patentInterest', null)
  // Use explicit type assertion to tell TypeScript that this can be any of the sharing preference values
  const sharingPreference = getJourneyData(
    'sharingPreference',
    'private'
  ) as SharingPreferenceType

  // Load saved data or use defaults
  const [managementTools, setManagementTools] = useState<string[]>(() =>
    getJourneyData('managementTools', [])
  )
  const [reminderFrequency, setReminderFrequency] = useState(() =>
    getJourneyData('reminderFrequency', 'monthly')
  )
  const [loading, setLoading] = useState(false)

  // Management tool options based on previous choices
  const getToolOptions = () => {
    const baseTools = [
      {
        id: 'calendar',
        label: 'Calendar Integration',
        description: 'Track key dates and deadlines',
      },
      {
        id: 'document_vault',
        label: 'Document Vault',
        description: 'Secure storage for all IP-related documents',
      },
      {
        id: 'notifications',
        label: 'Notification System',
        description: 'Get alerts for important events and deadlines',
      },
    ]

    const patentTools = [
      {
        id: 'patent_tracker',
        label: 'Patent Application Tracker',
        description: 'Monitor patent application progress',
      },
      {
        id: 'prior_art',
        label: 'Prior Art Monitoring',
        description: 'Stay updated on similar patents and applications',
      },
    ]

    const sharingTools = [
      {
        id: 'sharing_dashboard',
        label: 'Sharing Dashboard',
        description: 'Track who has access to your idea',
      },
      {
        id: 'analytics',
        label: 'Engagement Analytics',
        description: 'See how people interact with your shared content',
      },
      {
        id: 'nda_manager',
        label: 'NDA Management',
        description: 'Track and manage NDAs with recipients',
      },
    ]

    let availableTools = [...baseTools]

    if (patentInterest === 'yes' || patentInterest === 'unsure') {
      availableTools = [...availableTools, ...patentTools]
    }

    if (sharingPreference === 'selective' || sharingPreference === 'public') {
      availableTools = [...availableTools, ...sharingTools]
    }

    return availableTools
  }

  const toolOptions = getToolOptions()

  // Save state changes to storage
  useEffect(() => {
    saveJourneyData('managementTools', managementTools)
    saveJourneyData('reminderFrequency', reminderFrequency)
  }, [managementTools, reminderFrequency])

  // Toggle a management tool
  const toggleTool = (toolId: string) => {
    setManagementTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId)
      }
      return [...prev, toolId]
    })
  }

  // Client-side validation
  const isValid = () => {
    // Must select at least one management tool
    return managementTools.length > 0
  }

  // Handle continue button click
  const handleContinue = () => {
    if (!isValid()) return

    setLoading(true)

    // Mark this step as complete
    markStepComplete('manage')

    // Wait briefly to simulate processing
    setTimeout(() => {
      // Navigate to the next step
      router.push('/journey/enforce')
    }, 500)
  }

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Manage Your Intellectual Property
          </CardTitle>
          <CardDescription>
            Set up the tools and notifications to effectively manage and monitor
            your IP portfolio.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Management Tools Section */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <MixerHorizontalIcon className="w-5 h-5 mr-2 text-primary" />
              <h3 className="text-lg font-medium">
                Management Tools & Features
              </h3>
            </div>

            <p className="text-sm text-foreground/80 mb-3">
              Select the tools you'd like to use for managing your intellectual
              property:
            </p>

            <div className="space-y-3">
              {toolOptions.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={managementTools.includes(tool.id)}
                    onCheckedChange={() => toggleTool(tool.id)}
                    className="mt-1"
                    data-testid={`journey-tool-${tool.id}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`tool-${tool.id}`}
                      className="text-base font-medium"
                    >
                      {tool.label}
                    </Label>
                    <p className="text-sm text-foreground/70 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {managementTools.length === 0 && (
              <p className="text-sm text-amber-500/90 mt-2">
                Please select at least one management tool to continue.
              </p>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="p-4 border border-border/30 rounded-lg space-y-4">
            <div className="flex items-center">
              <BellIcon className="w-5 h-5 mr-2 text-primary" />
              <h3 className="text-lg font-medium">Reminder Settings</h3>
            </div>

            <p className="text-sm text-foreground/80 mb-1">
              How often would you like to receive updates and reminders about
              your IP?
            </p>

            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-foreground/70" />
              <Select
                value={reminderFrequency}
                onValueChange={setReminderFrequency}
                data-testid="journey-reminder-frequency"
              >
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="none">No reminders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-foreground/60 mt-2">
              You can change these settings at any time from your dashboard.
            </p>
          </div>

          {/* Integration Panel */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
            <div className="flex items-start gap-3">
              <PaperPlaneIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">IP Portfolio Dashboard</h3>
                <p className="text-sm text-foreground/80 mt-1">
                  After completing this journey, you'll be able to access your
                  IP Portfolio Dashboard. From there, you can manage multiple
                  IPs, track metrics, and adjust your settings as your needs
                  evolve.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/journey/share')}
            className="gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!isValid() || loading}
            className="gap-1"
            data-testid="journey-manage-continue"
          >
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <ArrowRightIcon className="w-4 h-4" />}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
