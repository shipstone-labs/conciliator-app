// Simple test file for lilypad-wrapper
import { getLilypadClient } from './dist/index.js';

async function test() {
  try {
    const lilypad = getLilypadClient();
    
    // Test WASM functionality
    console.log('Testing WASM integration...');
    try {
      const result = await lilypad.processData('Hello from test!');
      console.log('WASM result:', result);
    } catch (error) {
      console.error('WASM test failed:', error);
    }
    
    // Test Lilypad API functionality
    console.log('\nTesting Lilypad API integration...');
    try {
      const imageUrl = await lilypad.generateImage('A beautiful sunset');
      console.log('Generated image URL:', imageUrl);
    } catch (error) {
      console.error('Lilypad API test failed:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
