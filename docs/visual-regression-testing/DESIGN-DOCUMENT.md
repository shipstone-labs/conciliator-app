# Visual Regression Testing System Design Document

## Overview

This document describes the visual regression testing system built for SafeIdea, enabling automated screenshot capture across multiple devices and manual comparison through PowerPoint presentations.

## System Architecture

### Core Components

1. **Progress Tracker** (`progress-tracker.js`)
   - Real-time terminal progress display with spinner animations
   - 60-second timeout protection per task
   - Color-coded status reporting
   - Task timing and summary statistics

2. **Discovery Engine** (`discovery-engine.js`)
   - Automatic page discovery through link traversal
   - TestID collection and categorization
   - Auth-related content filtering
   - Page completion tracking

3. **Test Runners**
   - **Basic Runner** (`visual-test-runner.js`): Single device, discovery-based
   - **Enhanced Runner** (`enhanced-test-runner.js`): All known routes, single device
   - **Multi-Device Runner** (`multi-device-runner.js`): Multiple devices in parallel

4. **Baseline Manager** (`baseline-manager.js`)
   - Baseline creation from first run
   - Screenshot organization and comparison paths
   - Metadata extraction from test reports

5. **PowerPoint Generator** (`ppt-generator.js`)
   - Single PPTX file with all device comparisons
   - Aspect ratio preservation
   - Device-specific layout calculations
   - Side-by-side baseline vs current display

6. **Device Configuration** (`device-configs.js`)
   - Device profiles (iPhone, Android, iPad, Desktop)
   - Critical path definitions for mobile testing
   - Aspect ratio specifications

### Test Execution Flow

```
1. Launch Browser
2. For Each Device (Parallel):
   a. Create browser context with device emulation
   b. For Each Page:
      - Navigate to URL
      - Wait for page stability
      - Discover TestIDs
      - Take full-page screenshot
      - Track progress with timeout protection
3. Generate Reports
4. Create/Update Baseline
5. Generate PowerPoint Comparison
```

## Key Features

### 1. Real-Time Progress Tracking
- Unicode spinner animation (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- Live elapsed time display
- 60-second timeout with automatic task failure
- Color-coded status messages

### 2. Device Emulation
- **Mobile**: iPhone 14 Pro, Pixel 7
- **Tablet**: iPad Pro 11
- **Desktop**: Chrome 1920×1080
- Proper viewport, user agent, and touch capabilities

### 3. Smart Test Strategy
- Mobile devices test 6 critical paths only
- Desktop tests all 12 public pages
- Parallel execution for efficiency
- ~45 seconds total execution time

### 4. Screenshot Organization
```
screenshots/
├── 2025-06-05/
│   ├── desktop/
│   ├── iphone-14-pro/
│   ├── pixel-7/
│   ├── ipad-pro/
│   └── multi-device-report.json
└── baseline/
    └── [same structure]
```

### 5. PowerPoint Generation
- Single file containing all comparisons
- Device section dividers
- Preserved aspect ratios
- Centered image positioning
- Metadata inclusion (TestID counts)

## Implementation Details

### Aspect Ratio Handling
```javascript
// Device aspect ratios
desktop: 1920/1080 (1.78:1) - landscape
iphone: 393/852 (0.46:1) - portrait
pixel: 412/915 (0.45:1) - portrait
ipad: 834/1194 (0.70:1) - portrait

// Smart scaling algorithm
if (aspectRatio > 1) {
  // Start with width for landscape
} else {
  // Start with height for portrait
}
```

### Timeout Implementation
- Uses `setInterval` for progress updates
- Throws error if task exceeds 60 seconds
- Graceful cleanup on timeout

### TestID Discovery
- Queries all `[data-testid]` elements
- Filters by visibility
- Excludes auth-related patterns
- Tracks mobile-specific UI elements

## Current Limitations

1. **No Automated Comparison** - Only captures screenshots, no pixel diff
2. **Manual Baseline Management** - First run creates baseline automatically
3. **Static Route Definition** - Some routes are hardcoded
4. **No CI/CD Integration** - Runs locally only
5. **Limited Error Recovery** - Failed pages skip to next

## Next Steps

### Phase 1: Automated Comparison (Priority: High)

1. **Perceptual Hashing Implementation**
   - Use `looks-same` or `pixelmatch` library
   - Generate similarity scores
   - Create diff images highlighting changes
   - Set configurable thresholds

2. **Comparison Algorithms**
   ```javascript
   // Options to implement:
   - Pixel-by-pixel (with tolerance)
   - Perceptual hashing (recommended)
   - Structural similarity (SSIM)
   - Block-based comparison
   ```

3. **Diff Visualization**
   - Generate highlighted diff images
   - Add to PowerPoint as third image
   - Color-code change severity

### Phase 2: Enhanced Automation (Priority: Medium)

1. **CI/CD Integration**
   - GitHub Actions workflow
   - Automatic baseline updates on main
   - PR comments with results
   - Failure notifications

2. **Dynamic Content Handling**
   - Mask timestamps/dates
   - Ignore specified regions
   - Handle loading states

3. **Smart Baseline Management**
   - Version control integration
   - Baseline approval workflow
   - Historical comparison

### Phase 3: Advanced Features (Priority: Low)

1. **AI-Powered Analysis**
   - Classify changes (layout vs content)
   - Suggest root causes
   - Learn acceptable variations

2. **Performance Metrics**
   - Page load timing
   - Rendering performance
   - Resource usage

3. **Extended Device Coverage**
   - More device profiles
   - Different browsers
   - Dark/light mode testing
   - Landscape orientation

4. **Interactive Reports**
   - Web-based comparison tool
   - Slider overlays
   - Zoom capabilities
   - Annotation features

## Maintenance Considerations

1. **Device Profile Updates** - Keep device specs current
2. **Dependency Management** - Regular updates for Playwright, pptxgenjs
3. **Screenshot Storage** - Implement cleanup for old screenshots
4. **Performance Optimization** - Monitor test execution time

## Success Metrics

- Test execution under 60 seconds
- Zero false positives in visual comparison
- 100% page coverage for desktop
- PowerPoint generation under 10 seconds
- Clear identification of actual visual regressions

## Conclusion

The visual regression testing system provides a solid foundation for monitoring UI changes across devices. The manual review process via PowerPoint is effective for current needs, while the architecture supports future automation enhancements. The modular design allows incremental improvements without major refactoring.