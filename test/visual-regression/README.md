# Visual Regression Testing

Automated visual regression testing system for SafeIdea with multi-device support and PowerPoint-based manual review.

## Quick Start

```bash
# Install dependencies
npm install

# Run multi-device tests
npm run test:devices

# Generate PowerPoint comparison
node ppt-generator.js ./screenshots/YYYY-MM-DD

# View results
open ~/Downloads/visual-regression-YYYY-MM-DD.pptx
```

## Features

- 🚀 **Real-time Progress** - Live terminal updates with 60s timeout protection
- 📱 **Multi-Device Testing** - iPhone, Android, iPad, and Desktop
- 📸 **Smart Screenshots** - Full-page captures with proper aspect ratios
- 📊 **PowerPoint Reports** - Side-by-side baseline vs current comparisons
- 🎯 **Critical Path Focus** - Mobile tests only essential pages for speed
- ⚡ **Parallel Execution** - All devices tested simultaneously

## Directory Structure

```
visual-regression/
├── README.md                    # This file
├── DESIGN-DOCUMENT.md          # Detailed system design
├── package.json                # Dependencies and scripts
│
├── Core Components/
│   ├── progress-tracker.js     # Real-time progress display
│   ├── discovery-engine.js     # Page discovery logic
│   └── device-configs.js       # Device specifications
│
├── Test Runners/
│   ├── visual-test-runner.js   # Basic single-device test
│   ├── enhanced-test-runner.js # All pages, single device
│   └── multi-device-runner.js  # Multi-device parallel tests
│
├── Analysis Tools/
│   ├── baseline-manager.js     # Baseline management
│   ├── ppt-generator.js        # PowerPoint generation
│   └── device-comparison-analyzer.js # Results analysis
│
└── Output/
    └── screenshots/            # Test results
        ├── YYYY-MM-DD/        # Daily test runs
        │   ├── desktop/
        │   ├── iphone-14-pro/
        │   ├── pixel-7/
        │   └── ipad-pro/
        └── baseline/          # Reference screenshots
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run test:devices` | Run multi-device visual tests |
| `npm run test:enhanced` | Test all pages on desktop |
| `npm run analyze` | Analyze test results |
| `node ppt-generator.js <dir>` | Generate PowerPoint report |

## Workflow

### First Run (Create Baseline)
1. Run tests: `npm run test:devices`
2. Generate PPT: `node ppt-generator.js ./screenshots/YYYY-MM-DD`
3. System creates baseline automatically

### Subsequent Runs (Compare Changes)
1. Run tests: `npm run test:devices`
2. Generate PPT: `node ppt-generator.js ./screenshots/YYYY-MM-DD`
3. Review side-by-side comparisons in PowerPoint

## Device Coverage

| Device | Resolution | Type | Pages Tested |
|--------|------------|------|--------------|
| Desktop Chrome | 1920×1080 | Landscape | All 12 pages |
| iPhone 14 Pro | 393×852 | Portrait | 6 critical |
| Pixel 7 | 412×915 | Portrait | 6 critical |
| iPad Pro 11 | 834×1194 | Portrait | 6 critical |

## Next Steps

See [DESIGN-DOCUMENT.md](./DESIGN-DOCUMENT.md) for planned enhancements including:
- Automated visual comparison with perceptual hashing
- CI/CD integration
- AI-powered change detection
- Interactive web-based reports

## Troubleshooting

### Tests timing out
- Check network connectivity to safeidea.net
- Verify no auth walls blocking public pages
- Increase timeout in device runner if needed

### PowerPoint generation fails
- Ensure screenshots exist in specified directory
- Check baseline directory has been created
- Verify all dependencies installed

### Images appear distorted
- Update to latest version (aspect ratio fix implemented)
- Check device-configs.js has correct aspect ratios

## Contributing

When adding new features:
1. Update DESIGN-DOCUMENT.md with architectural changes
2. Add new device profiles to device-configs.js
3. Include progress tracking in new components
4. Maintain 60-second timeout pattern