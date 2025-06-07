# TypeScript Compilation Blocking Commits Issue

## Issue Description

The pre-commit hook is configured to run TypeScript compilation checks on all staged files, including JavaScript files. When TypeScript runs, it checks the **entire project** for compilation errors, not just the staged files. This means that existing TypeScript errors anywhere in the codebase will block commits of unrelated files.

## Current Pre-Commit Configuration

From `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "biome lint --no-errors-on-unmatched",
    "biome check --no-errors-on-unmatched",
    "bash -c 'tsc --noEmit --jsx preserve'"  // <-- This line causes the issue
  ],
  "*.json": [
    "biome check --no-errors-on-unmatched"
  ]
}
```

## Specific Errors Blocking Commits (as of Jan 2025)

```
components/ui/switch.tsx(4,34): error TS2307: Cannot find module '@radix-ui/react-switch' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(3,37): error TS2307: Cannot find module '@storacha/client' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(4,29): error TS2307: Cannot find module '@storacha/client/stores/memory' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(5,23): error TS2307: Cannot find module '@storacha/client/proof' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(6,24): error TS2307: Cannot find module '@storacha/client/principal/ed25519' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(10,8): error TS2307: Cannot find module '@storacha/client/types' or its corresponding type declarations.
packages/web-storage-wrapper/src/index.ts(11,22): error TS2307: Cannot find module '@ipld/dag-ucan/did' or its corresponding type declarations.
```

## Impact

- Developers cannot commit JavaScript-only changes when there are unrelated TypeScript errors in the codebase
- This blocks normal development workflow even when the changes being committed are valid
- The visual regression testing system (pure JavaScript) was blocked from being committed due to these unrelated TypeScript errors

## Temporary Workaround

Use `--no-verify` flag to bypass pre-commit hooks:
```bash
git commit --no-verify -m "your commit message"
```

**Note**: This bypasses ALL pre-commit checks, including linting, so use with caution.

## Recommended Solutions

1. **Fix the missing dependencies** - Install the missing packages:
   - @radix-ui/react-switch
   - @storacha/client and related packages

2. **Modify lint-staged configuration** to only check TypeScript files with tsc:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": [
       "biome lint --no-errors-on-unmatched",
       "biome check --no-errors-on-unmatched",
       "bash -c 'tsc --noEmit --jsx preserve'"
     ],
     "*.{js,jsx}": [
       "biome lint --no-errors-on-unmatched",
       "biome check --no-errors-on-unmatched"
     ],
     "*.json": [
       "biome check --no-errors-on-unmatched"
     ]
   }
   ```

3. **Use project references** or **composite projects** in TypeScript to isolate compilation units

4. **Add a skipLibCheck option** to tsconfig.json as a temporary measure

## History

- **January 2025**: Visual regression testing system (JavaScript) could not be committed due to TypeScript errors in unrelated UI components and packages
- Commit `64be696` was made with `--no-verify` flag to bypass the issue