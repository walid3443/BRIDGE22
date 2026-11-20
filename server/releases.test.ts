import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateReleaseArtifacts } from './releases';

test('marks missing or empty installers unavailable and computes real SHA-256 for valid files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-release-test-'));
  fs.mkdirSync(path.join(tmpDir, 'downloads'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'downloads', 'empty.apk'), '', 'utf-8');
  const specPath = path.join(tmpDir, 'spec.json');
  fs.writeFileSync(specPath, '{"version":"1.0"}', 'utf-8');

  const results = evaluateReleaseArtifacts(tmpDir, [
    {
      id: 'win-missing',
      platform: 'windows',
      name: 'BRIDGE for Windows',
      format: 'MSI',
      supportedOs: 'Windows 11',
      localFilePath: 'downloads/Bridge-Windows-Setup.msi',
      configuredDownloadUrl: '',
      version: '1.0.0',
      releaseDate: '2026-11-20',
      releaseNotes: ['Initial'],
      buildEnvironmentNote: 'Windows only',
    },
    {
      id: 'android-empty',
      platform: 'android',
      name: 'BRIDGE for Android',
      format: 'APK',
      supportedOs: 'Android 10+',
      localFilePath: 'downloads/empty.apk',
      configuredDownloadUrl: '',
      version: '1.0.0',
      releaseDate: '2026-11-20',
      releaseNotes: ['Empty file must be rejected'],
      buildEnvironmentNote: 'Android SDK',
    },
    {
      id: 'spec-present',
      platform: 'shared',
      name: 'Protocol Spec',
      format: 'JSON',
      supportedOs: 'All',
      localFilePath: 'spec.json',
      configuredDownloadUrl: '/api/downloads/protocol-spec',
      version: '1.0.0',
      releaseDate: '2026-11-20',
      releaseNotes: ['Canonical schema'],
      buildEnvironmentNote: 'On disk',
    },
  ]);

  assert.equal(results[0].available, false);
  assert.equal(results[0].downloadUrl, null);
  assert.equal(results[0].sizeBytes, null);
  assert.equal(results[0].sha256, null);

  assert.equal(results[1].available, false);
  assert.equal(results[1].downloadUrl, null);

  assert.equal(results[2].available, true);
  assert.equal(results[2].downloadUrl, '/api/downloads/protocol-spec');
  assert.equal(results[2].sizeBytes, 17);
  assert.match(results[2].sha256 ?? '', /^[a-f0-9]{64}$/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
