# Multi-Site Deployment and Feature-Based Routing

This application is deployed to two different sites with different feature sets, allowing us to provide tailored experiences for different user segments.

## Production Deployments

- **safeidea.net** - Main site with standard features
- **app.safeidea.ai** - AI-enabled site with additional features

## PR Deployments

Pull request deployments follow a specific naming pattern:
- **pr-XXX---conciliator-55rclsk2qa-uc.a.run.app** - Standard site PR preview
- **pr-XXX---conciliator-ai-55rclsk2qa-uc.a.run.app** - AI site PR preview (note the `-ai` in the URL)

## Feature Detection System

The application uses a dual detection system to determine which site is being accessed:

### 1. Feature Flag Detection
The `useFeature('ai')` hook checks if 'ai' is included in the FEATURES environment variable. This is the primary method for production deployments where environment variables are properly configured.

### 2. URL-Based Detection
As a fallback (especially useful for PR deployments), the code checks if the hostname contains:
- `conciliator-ai` (for PR deployments)
- `app.safeidea.ai` (for production AI site)

## Implementation Example: Add Idea Routing

The "Add Idea" navigation link demonstrates this feature-based routing pattern:

- On **safeidea.net** (standard site): Routes to `/add-ip`
- On **app.safeidea.ai** (AI site): Routes to `/add-ip/protect`

### Code Example (NavigationHeader.tsx)

```javascript
// Import the feature detection hook
import { useFeature } from '@/hooks/useFeature'

// Inside the component
const isAISite = useFeature('ai')

// Determine if we're on AI site - check both feature flag and URL
const isOnAISite = isAISite || (typeof window !== 'undefined' && 
  (window.location.hostname.includes('conciliator-ai') || 
   window.location.hostname.includes('app.safeidea.ai')))

// Determine the Add Idea route based on the site
const addIdeaRoute = isOnAISite ? '/add-ip/protect' : '/add-ip'
```

## Using Feature Detection in Your Components

This pattern can be used throughout the application to:

1. **Show/Hide Features**: Display AI-specific features only on the AI site
2. **Change Routing**: Direct users to different pages based on the site
3. **Modify Content**: Show different text, images, or UI elements
4. **Toggle Functionality**: Enable/disable certain features based on the deployment

### Best Practices

1. Always use the `useFeature` hook as the primary detection method
2. Add URL-based detection as a fallback for PR deployments
3. Keep feature-specific code isolated and well-documented
4. Test both deployments when making feature-gated changes

## Environment Configuration

### Production
- Environment variables are set during deployment
- FEATURES variable contains dot-separated feature names (e.g., "stripe.lit.ai.net")

### PR Deployments
- Feature flags may not be properly configured
- URL-based detection ensures correct behavior
- Allows testing of both site variants from the same PR

## Testing

When developing feature-gated functionality:

1. Test locally by modifying the FEATURES environment variable
2. Test in PR deployments using both URLs
3. Verify production behavior matches expectations

## Future Considerations

As the platform evolves, this multi-site approach allows us to:
- A/B test features between sites
- Gradually roll out new functionality
- Maintain different user experiences for different market segments
- Provide specialized interfaces for AI-enhanced workflows