#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildCSS() {
  console.log('🎨 Building Tailwind CSS...');
  
  try {
    // Build Tailwind CSS
    await execAsync(
      'npx tailwindcss -i ./src/styles.css -o ./public/static/tailwind.css --minify'
    );
    
    console.log('✅ Tailwind CSS built successfully → public/static/tailwind.css');
  } catch (error) {
    console.error('❌ Error building CSS:', error);
    process.exit(1);
  }
}

buildCSS();
