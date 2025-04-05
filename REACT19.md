# React 19 Migration Notes

This project has been updated to work with React 19, which brings several important changes that affect how the code works.

## Key Changes in React 19

1. **React Import Requirement**

   React 19 no longer automatically imports the React object into JSX files. This means you must add:
   
   ```tsx
   import React from 'react';
   ```
   
   to the top of any file that uses JSX.

2. **Handlebars Template Imports**

   The way templates with query parameters are imported had to be updated. Instead of:
   
   ```typescript
   import templateText from "./system.hbs?raw";
   ```
   
   We now use:
   
   ```typescript
   import templateFile from "./system.hbs";
   const templateText = templateFile.toString();
   ```

3. **Webpack Configuration**

   The webpack config in `next.config.ts` was updated to handle both regular `.hbs` files and files with query parameters.

## TypeScript Configuration

The `tsconfig.json` file uses:

```json
"jsx": "preserve"
```

which is the correct setting for Next.js projects.

## Troubleshooting

If you encounter TypeScript errors related to React:

1. Make sure each file that uses JSX has `import React from 'react';` at the top
2. Check that webpack loaders are correctly configured for any special file types
3. Run `npm run dev` to restart the development server after configuration changes

For Handlebars template errors:
1. Make sure you're using the updated import syntax
2. Verify the template files exist in the expected locations