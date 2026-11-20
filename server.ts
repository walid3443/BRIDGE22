import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { validateBridgeMessage } from './shared/protocol/bridgeProtocol.ts';
import {
  computeFileDigestAndSize,
  loadRawConfiguredArtifacts,
  loadReleasesManifest,
} from './server/releases.ts';

const ROOT_DIR = process.cwd();
const PORT = Number(process.env.PORT ?? 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', product: 'BRIDGE', protocolVersion: '1.0' });
  });

  app.get('/api/releases', (_req, res) => {
    const artifacts = loadReleasesManifest(ROOT_DIR);
    res.json({ artifacts });
  });

  app.get('/api/site-config', (_req, res) => {
    const sitePath = path.join(ROOT_DIR, 'config', 'site.json');
    if (!fs.existsSync(sitePath)) {
      res.status(404).json({ error: 'Site config missing' });
      return;
    }
    res.json(JSON.parse(fs.readFileSync(sitePath, 'utf-8')));
  });

  app.get('/api/protocol/schema', (_req, res) => {
    const schemaPath = path.join(ROOT_DIR, 'protocol', 'bridge-protocol.v1.json');
    res.json(JSON.parse(fs.readFileSync(schemaPath, 'utf-8')));
  });

  app.post('/api/protocol/validate', (req, res) => {
    const result = validateBridgeMessage(req.body);
    res.status(200).json(result);
  });

  app.get('/api/downloads/protocol-spec', (_req, res) => {
    const specPath = path.join(ROOT_DIR, 'protocol', 'bridge-protocol.v1.json');
    if (!fs.existsSync(specPath)) {
      res.status(404).json({ error: 'Protocol specification file not found' });
      return;
    }
    const { sha256 } = computeFileDigestAndSize(specPath);
    res.setHeader('X-Checksum-SHA256', sha256);
    res.download(specPath, 'bridge-protocol.v1.json');
  });

  app.get('/api/downloads/artifact/:id', (req, res) => {
    const configured = loadRawConfiguredArtifacts(ROOT_DIR).find((a) => a.id === req.params.id);
    if (!configured) {
      res.status(404).json({ error: 'Unknown artifact id' });
      return;
    }
    const filePath = path.resolve(ROOT_DIR, configured.localFilePath);
    if (!filePath.startsWith(path.resolve(ROOT_DIR)) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Installer binary not built in this environment' });
      return;
    }
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) {
      res.status(404).json({ error: 'Installer binary is empty or invalid' });
      return;
    }
    const { sha256 } = computeFileDigestAndSize(filePath);
    res.setHeader('X-Checksum-SHA256', sha256);
    res.download(filePath, path.basename(filePath));
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BRIDGE web portal listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BRIDGE server:', err);
  process.exit(1);
});
