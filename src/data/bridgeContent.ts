import { DocSection } from '../types/bridge';

export const CORE_FEATURES = [
  {
    id: 'remote-control',
    index: '01',
    title: 'Remote PC Control',
    summary:
      'Use your Android touchscreen as a precision touchpad with left/right clicks, scroll gestures, and text input routed to Windows SendInput.',
    platformNote: 'Includes connection quality awareness and an immediate emergency disconnect control.',
  },
  {
    id: 'screen-mirroring',
    index: '02',
    title: 'Android Screen Mirroring',
    summary:
      'View your Android screen inside a resizable or full-screen Windows viewport powered by Android MediaProjection with explicit foreground notification.',
    platformNote: 'Optional AccessibilityService interaction remains disabled unless explicitly enabled.',
  },
  {
    id: 'file-transfer',
    index: '03',
    title: 'Two-Way File Transfer',
    summary:
      'Send files between Windows and Android in either direction with chunked progress tracking, cancellation, and SHA-256 integrity checks.',
    platformNote: 'Path traversal checks and duplicate-file prompts ensure existing files are never silently overwritten.',
  },
  {
    id: 'clipboard',
    index: '04',
    title: 'Universal Clipboard',
    summary:
      'Synchronize plain-text clipboard entries between paired devices with hash-based loop prevention and an explicit on/off toggle.',
    platformNote: 'Respects Android 10+ background clipboard restrictions via explicit foreground sync.',
  },
  {
    id: 'camera-share',
    index: '05',
    title: 'Phone Camera Sharing',
    summary:
      'Stream your Android CameraX feed to an authenticated Windows preview window with resolution and frame-rate controls.',
    platformNote: 'Kernel-level virtual webcam driver integration is documented separately; current Windows module provides an in-app preview window.',
  },
  {
    id: 'mic-share',
    index: '06',
    title: 'Microphone Audio Stream',
    summary:
      'Stream Android microphone audio on explicit user action with clear recording indicators and selectable sample rates.',
    platformNote: 'Audio never records in the background without active user consent.',
  },
  {
    id: 'notifications',
    index: '07',
    title: 'Selective Notification Sharing',
    summary:
      'Forward chosen Android notification categories to your Windows desktop without retaining or indexing message histories.',
    platformNote: 'Per-category opt-in controls keep sensitive alerts private.',
  },
  {
    id: 'device-management',
    index: '08',
    title: 'Device Pairing & Trust Management',
    summary:
      'Discover peers over local Wi-Fi mDNS, confirm trust via QR URI or 6-digit pairing codes, rename endpoints, or revoke access immediately.',
    platformNote: 'Unknown devices are never automatically trusted.',
  },
];

export const WINDOWS_NAV_SCREENS = [
  { id: 'home', label: 'Home', detail: 'Connection status, paired Android device card, and local discovery trigger.' },
  { id: 'devices', label: 'Devices', detail: 'Manage paired endpoints, inspect certificate fingerprints, rename, or revoke trust.' },
  { id: 'remote', label: 'Remote Control', detail: 'Authorize or suspend Win32 SendInput mouse and keyboard sessions.' },
  { id: 'screen', label: 'Screen Mirroring', detail: 'Resizable Android screen viewer with resolution and FPS profile controls.' },
  { id: 'files', label: 'File Transfer', detail: 'Drag-and-drop transfer queue with SHA-256 verification and duplicate-file prompts.' },
  { id: 'clipboard', label: 'Clipboard', detail: 'Explicit sync switch with loop-prevention hash guard.' },
  { id: 'camera', label: 'Camera', detail: 'Authenticated in-app preview window for Android CameraX streams.' },
  { id: 'audio', label: 'Audio', detail: 'Microphone stream receiver with visible active-session indicator.' },
  { id: 'activity', label: 'Activity', detail: 'Local-only diagnostic log and transfer history without secret payload logging.' },
  { id: 'settings', label: 'Settings', detail: 'Port configuration, theme preference, and connection diagnostics.' },
];

export const ANDROID_NAV_SCREENS = [
  { id: 'home', label: 'Home', detail: 'Local NsdManager discovery, paired Windows host card, and quick module launch.' },
  { id: 'remote', label: 'Remote Touchpad', detail: 'Full-width drag touchpad, left/right click buttons, keyboard toggle, and Disconnect button.' },
  { id: 'permissions', label: 'Permissions', detail: 'Plain-language rationale for MediaProjection, Camera, Mic, Nearby Wi-Fi, and optional Accessibility.' },
];

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    category: 'Setup',
    title: 'Getting Started & Requirements',
    summary: 'System requirements and local-network prerequisites for Windows and Android.',
    steps: [
      'Windows: Windows 10 (build 19041+) or Windows 11 64-bit with .NET 8 Desktop Runtime.',
      'Android: Android 10 (API 29) or newer connected to the same local Wi-Fi subnet.',
      'Ensure local UDP multicast (239.255.77.88:47291) and TCP port 47290 are allowed on private Wi-Fi.',
    ],
  },
  {
    id: 'pairing',
    category: 'Setup',
    title: 'Pairing Devices via QR Code or 6-Digit Code',
    summary: 'Mutual authentication and certificate fingerprint pinning before any data moves.',
    steps: [
      'Open BRIDGE on Windows and select Discover Devices to announce the host on local Wi-Fi.',
      'Generate a pairing session to display a temporary 6-digit code and bridge://pair QR URI.',
      'Confirm the code and certificate fingerprint on Android to pin the Windows TLS certificate.',
    ],
  },
  {
    id: 'remote-control-setup',
    category: 'Features',
    title: 'Remote PC Control Setup',
    summary: 'How Android touchpad gestures map to authorized Windows input.',
    steps: [
      'Open Remote Control on Android after pairing is confirmed.',
      'Windows enables WindowsInputInjector only while an authenticated session is active.',
      'Use Disconnect on Android or Emergency Disconnect on Windows to halt input immediately.',
    ],
  },
  {
    id: 'screen-mirroring',
    category: 'Features',
    title: 'Screen Mirroring Permissions',
    summary: 'How MediaProjection and optional AccessibilityService operate safely.',
    steps: [
      'Android prompts the system MediaProjection consent dialog each time screen capture starts.',
      'A persistent foreground service notification remains visible while your screen is shared.',
      'AccessibilityService for remote interaction stays off unless you manually enable it in Android Settings.',
    ],
  },
  {
    id: 'file-transfer-guide',
    category: 'Features',
    title: 'Two-Way File Transfer & Integrity',
    summary: 'SHA-256 verification, filename sanitization, and collision handling.',
    steps: [
      'Both endpoints sanitize filenames to block path separators, traversal sequences, and reserved Windows device names.',
      'After transfer completion, the receiving side checks the SHA-256 digest before marking the transfer verified.',
      'If a file with the same name exists, BRIDGE prompts or renames rather than silently overwriting.',
    ],
  },
  {
    id: 'troubleshooting',
    category: 'Troubleshooting',
    title: 'Troubleshooting Discovery & Firewalls',
    summary: 'Resolving common local Wi-Fi isolation and firewall issues.',
    steps: [
      'Confirm both devices are on the same private Wi-Fi network and AP/client isolation is disabled on the router.',
      'Verify Windows Network Profile is set to Private rather than Public so local discovery packets are not blocked.',
      'Check the Activity log in BRIDGE Desktop for rejected timestamps (system clocks skewed by more than 60 seconds).',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    q: 'Does BRIDGE require an account or internet connection?',
    a: 'No. Discovery, pairing, remote control, file transfer, clipboard sync, and screen mirroring operate directly over your local Wi-Fi network with zero cloud servers or accounts.',
  },
  {
    q: 'Can BRIDGE control my phone or computer silently in the background?',
    a: 'No. Unknown devices are never auto-trusted, screen capture requires Android MediaProjection consent with a visible notification, and both platforms include an immediate disconnect control.',
  },
  {
    q: 'Why are Windows EXE and Android APK installers marked unavailable on this portal?',
    a: 'This web server runs inside a Linux Node.js environment without the Windows .NET 8 WinUI toolchain or Android SDK. Rather than fabricating fake binaries or sizes, the Downloads page reports real disk status and includes the complete Windows and Android source trees.',
  },
  {
    q: 'Does Phone Camera Sharing appear as a system webcam in third-party apps?',
    a: 'In this release, Windows provides an authenticated in-app camera preview window. Native virtual webcam and virtual audio kernel devices require separately signed Windows drivers and are not claimed until built and tested.',
  },
];
