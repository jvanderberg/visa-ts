/**
 * Oscilloscope Screenshot via TCP/IP - Capture display from Rigol DS1202Z-E over LAN
 *
 * Usage: npx tsx examples/hardware/scope-screenshot-tcpip.ts [ip:port]
 * Default: 169.254.245.2:5555
 */

import { createResourceManager } from '../../src/index.js';
import { writeFileSync } from 'fs';

async function main(): Promise<void> {
  // Allow IP:port override from command line
  const target = process.argv[2] ?? '169.254.245.2:5555';
  const [host, portStr] = target.split(':');
  const port = parseInt(portStr ?? '5555');

  const resourceString = `TCPIP0::${host}::${port}::SOCKET`;
  console.log(`Connecting to ${resourceString}...`);

  const rm = createResourceManager();

  const result = await rm.openResource(resourceString, {
    timeout: 15000, // Screenshots can take a while
  });

  if (!result.ok) {
    console.error('Failed to open:', result.error.message);
    return;
  }

  const scope = result.value;

  const idn = await scope.query('*IDN?');
  console.log('Connected to:', idn.ok ? idn.value.trim() : 'error');

  console.log('Capturing screenshot (this takes a few seconds)...');

  // Send the command
  const writeResult = await scope.write(':DISP:DATA? ON,OFF,PNG');
  if (!writeResult.ok) {
    console.error('Failed to send command:', writeResult.error);
    await scope.close();
    return;
  }

  // Read binary data
  scope.chunkSize = 1024 * 1024; // 1MB chunk size
  const screenshot = await scope.readBinary();

  if (!screenshot.ok) {
    console.error('Failed to capture:', screenshot.error);
    await scope.close();
    return;
  }

  const filename = 'scope-screenshot.png';
  writeFileSync(filename, screenshot.value);
  console.log(`Saved to ${filename} (${screenshot.value.length} bytes)`);

  await scope.close();
}

main().catch(console.error);
