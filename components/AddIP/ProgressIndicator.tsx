interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3
}

export default function ProgressIndicator({
  currentStep,
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-4 py-4">
      <div
        className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 1
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground'
          }`}
        >
          1
        </div>
        <span className="ml-2">Protect</span>
      </div>

      <div
        className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`}
      />

      <div
        className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 2
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground'
          }`}
        >
          2
        </div>
        <span className="ml-2">Share</span>
      </div>

      <div
        className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted-foreground'}`}
      />

      <div
        className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 3
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground'
          }`}
        >
          3
        </div>
        <span className="ml-2">Guard</span>
      </div>
    </div>
  )
}
