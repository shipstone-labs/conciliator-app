'use client';

import { useState } from 'react';
import { getLilypadClient } from 'lilypad-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LilypadDemo() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get Lilypad client
      const lilypadClient = getLilypadClient();
      
      // Generate image
      const result = await lilypadClient.generateImage(prompt);
      
      // Set the image URL
      setImageUrl(result);
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Lilypad Image Generation Demo</h1>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter a prompt for image generation..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={generateImage} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
      </div>
      
      {imageUrl && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Generated Image</h2>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Generated from the prompt" 
              className="w-full"
            />
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-3">About This Demo</h2>
        <p className="mb-3">
          This demo shows the integration of Lilypad AI image generation in a Next.js application
          using a clean wrapper module pattern.
        </p>
        <p>
          The wrapper module isolates the Lilypad dependencies from the rest of the application,
          preventing dependency conflicts and providing a simple API.
        </p>
      </div>
    </div>
  );
}