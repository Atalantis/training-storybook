#!/usr/bin/env node
import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🏗️  Starting build process...\n');

// 1. Build Tailwind CSS
console.log('📦 Step 1/3: Building Tailwind CSS...');
try {
  execSync('npm run build:css', { stdio: 'inherit' });
  console.log('✅ Tailwind CSS built successfully\n');
} catch (error) {
  console.error('❌ Tailwind CSS build failed');
  process.exit(1);
}

// 2. Build Vite/Hono
console.log('📦 Step 2/3: Building Vite/Hono...');
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Vite build completed\n');
} catch (error) {
  console.error('❌ Vite build failed');
  process.exit(1);
}

// 3. Copy public/ assets to dist/ (for Cloudflare Pages)
console.log('📦 Step 3/3: Copying public assets to dist/...');
try {
  const publicDir = join(__dirname, 'public');
  const distDir = join(__dirname, 'dist');
  
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  // Copy entire public directory contents to dist
  // This includes: _headers, favicon.svg, static/*
  cpSync(publicDir, distDir, { 
    recursive: true,
    filter: (src) => {
      // Skip node_modules if any
      return !src.includes('node_modules');
    }
  });
  
  console.log('✅ Public assets copied to dist/');
  console.log('   - _headers');
  console.log('   - favicon.svg');
  console.log('   - static/tailwind.css');
  console.log('   - static/*.js, *.css');
  console.log('\n🎉 Build completed successfully!');
} catch (error) {
  console.error('❌ Failed to copy public assets:', error.message);
  process.exit(1);
}
