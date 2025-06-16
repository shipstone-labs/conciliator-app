# Mobile & Multi-Device Visual Testing

Extension of the visual regression testing system to support multiple devices with parallel execution.

## Features

- 📱 **Device Emulation** - Tests on real device profiles (iPhone, Android, iPad)
- ⚡ **Parallel Execution** - Tests multiple devices simultaneously
- 🎯 **Smart Path Selection** - Mobile devices test critical paths only
- 📊 **Comparison Analysis** - Identifies device-specific UI differences
- 📁 **Organized Screenshots** - Separate folders per device
- 🔍 **Mobile UI Detection** - Finds hamburger menus and touch elements

## Quick Start

### Run multi-device tests
```bash
node multi-device-runner.js
```

### Analyze results
```bash
node device-comparison-analyzer.js screenshots/YYYY-MM-DD/multi-device-report.json
```

## Device Profiles

### Mobile Devices
- **iPhone 14 Pro** - Latest iOS device
- **iPhone SE** - Smaller screen testing  
- **Pixel 7** - Android testing
- **Galaxy S23** - Samsung-specific testing

### Tablets
- **iPad Pro 11** - iOS tablet
- **Galaxy Tab S8** - Android tablet

### Desktop
- **Desktop Chrome** - 1920x1080 baseline

## Testing Strategy

### Critical Paths (Mobile/Tablet)
Mobile devices focus on 6 critical user journeys:
1. Homepage
2. Subscription Home
3. Assessment
4. Plans
5. FAQ
6. Signup

### Full Coverage (Desktop)
Desktop tests all 12 public pages for comprehensive coverage.

## Output Structure

```
screenshots/
└── 2025-06-05/
    ├── desktop/
    │   ├── 01-home.png
    │   ├── 02-subscription-home.png
    │   └── ...
    ├── iphone-14-pro/
    │   ├── 01-home.png
    │   └── ...
    ├── pixel-7/
    │   └── ...
    └── multi-device-report.json
```

## Report Contents

The JSON report includes:
- Device-specific TestID counts
- Mobile-only UI elements
- Screenshot paths per device
- Success/failure status
- Comparison matrix
- Recommendations

## Mobile-Specific Detection

The system automatically detects:
- Hamburger menus
- Touch-only elements
- Responsive components
- Device-specific TestIDs

## Performance

- Desktop: ~40 seconds for 12 pages
- Mobile: ~20 seconds for 6 critical paths
- Total with parallelization: ~45-50 seconds

## Next Steps

1. **Visual Diff** - Add pixel comparison between devices
2. **Touch Testing** - Test swipe and touch interactions
3. **Orientation** - Add portrait/landscape testing
4. **Network** - Test on slow 3G conditions
5. **CI Integration** - Add to build pipeline