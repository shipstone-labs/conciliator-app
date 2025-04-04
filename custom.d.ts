// React module declarations
import * as React from 'react';

// Handle handlebars templates
declare module "*.hbs" {
  const content: string;
  export default content;
}

declare module "*.hbs?raw" {
  const content: string;
  export default content;
}

// Ensure React is available globally for JSX
declare global {
  const React: typeof import('react');
}
