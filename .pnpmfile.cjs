/**
 * pnpm configuration file
 * This file is only read by pnpm and won't affect yarn in submodules
 */

module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Prevent hoisting for wrapper packages to avoid conflicts
      if (pkg.name === 'lilypad-wrapper' || 
          pkg.name === 'lit-wrapper' || 
          pkg.name === 'web-storage-wrapper') {
        // Mark all dependencies as needing isolation
        if (pkg.dependencies) {
          pkg.dependenciesMeta = pkg.dependenciesMeta || {};
          for (const dep of Object.keys(pkg.dependencies)) {
            pkg.dependenciesMeta[dep] = pkg.dependenciesMeta[dep] || {};
            pkg.dependenciesMeta[dep].injected = true;
          }
        }
      }
      return pkg;
    }
  }
};