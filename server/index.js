import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set; using the built-in development secret. Set JWT_SECRET in production.');
}

// Serve the built React app (run `npm run build` first) with SPA fallback for client-side routes
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  console.warn('⚠️  dist/ not found; serving API only. Run `npm run build` to serve the frontend.');
}

// Unknown API routes return JSON instead of Express's HTML 404 page
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`🚀 CareQueue server running on http://localhost:${PORT}`);
  console.log(`🔒 JWT Authentication & Role-based Access Control Active`);
});
