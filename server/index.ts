import http from 'http';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './routes/api';
import { marketSyncEngine } from './services/market-sync-engine';
import { marketAnalysisEngine } from './services/market-analysis-engine';
import { marketNewsService } from './services/market-news-service';

async function startServer() {
  const app = express();
  const rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  // Port 8080 is reserved for nginx reverse proxy in the container environment; app runs on port 3000
  const PORT = (rawPort === 8080 || isNaN(rawPort)) ? 3000 : rawPort;

  // Default data provider to richbourse for live daily market variations
  process.env.BRVM_DATA_PROVIDER = process.env.BRVM_DATA_PROVIDER || 'richbourse';

  // Allow larger payload for audio files/chunks base64
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'Bourse Facile',
      provider: process.env.BRVM_DATA_PROVIDER || 'demo',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // API router
  app.use('/api', apiRouter);

  // Vite Middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Express HTTP server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bourse Facile] Serveur actif sur http://0.0.0.0:${PORT}`);
    // Start background 5-minute synchronization engine and 15-minute analysis engine
    marketSyncEngine.start();
    marketAnalysisEngine.start();
    marketNewsService.getLatestNews(false).catch(e => console.warn('[Server] Initial news prefetch:', e.message));
  });
}

startServer().catch(err => {
  console.error('Erreur démarrage serveur:', err);
});

