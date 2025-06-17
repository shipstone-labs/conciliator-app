'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestContextPage() {
  const { formData, updateFormData, clearFormData } = useAddIPContext()

  // Function to show sessionStorage content
  const getSessionStorageContent = () => {
    if (typeof window === 'undefined') return 'N/A (SSR)'
    try {
      return sessionStorage.getItem('safeidea_add_ip_form') || 'Empty'
    } catch {
      return 'Error accessing sessionStorage'
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Add IP Context Test Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current Context Values</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SessionStorage Content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded overflow-auto text-sm">
            {getSessionStorageContent()}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Protect Page Fields:</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => updateFormData({ title: 'Test Innovation' })}
                variant="outline"
                size="sm"
              >
                Set Title
              </Button>
              <Button
                onClick={() =>
                  updateFormData({ description: 'A groundbreaking test idea' })
                }
                variant="outline"
                size="sm"
              >
                Set Description
              </Button>
              <Button
                onClick={() =>
                  updateFormData({ fileName: 'test-document.pdf' })
                }
                variant="outline"
                size="sm"
              >
                Set FileName
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Share Page Fields:</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => updateFormData({ sharingStartDate: new Date() })}
                variant="outline"
                size="sm"
              >
                Set Start Date
              </Button>
              <Button
                onClick={() => {
                  const endDate = new Date()
                  endDate.setDate(endDate.getDate() + 30)
                  updateFormData({ sharingEndDate: endDate })
                }}
                variant="outline"
                size="sm"
              >
                Set End Date (+30d)
              </Button>
              <Button
                onClick={() =>
                  updateFormData({ legalDocuments: 'generic-nda' })
                }
                variant="outline"
                size="sm"
              >
                Generic NDA
              </Button>
              <Button
                onClick={() =>
                  updateFormData({ showInDatabase: !formData.showInDatabase })
                }
                variant="outline"
                size="sm"
              >
                Toggle Visibility
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Guard Page Fields:</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => updateFormData({ enableAI: !formData.enableAI })}
                variant="outline"
                size="sm"
              >
                Toggle AI Agent
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={clearFormData} variant="destructive">
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Navigate to other pages and come back to see if values persist
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                window.location.href = '/add-ip/protect'
              }}
              variant="outline"
            >
              Go to Protect
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/add-ip/share'
              }}
              variant="outline"
            >
              Go to Share
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/add-ip/guard'
              }}
              variant="outline"
            >
              Go to Guard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
