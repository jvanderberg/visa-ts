/**
 * Oscilloscope Test via TCP/IP - Query Rigol DS1202Z-E over LAN
 *
 * Usage: npx tsx examples/hardware/scope-test-tcpip.ts [ip:port]
 * Default: 169.254.245.2:5555
 */

import { createResourceManager } from '../../src/index.js';

async function main(): Promise<void> {
  // Allow IP:port override from command line
  const target = process.argv[2] ?? '169.254.245.2:5555';
  const [host, portStr] = target.split(':');
  const port = parseInt(portStr ?? '5555');

  const resourceString = `TCPIP0::${host}::${port}::SOCKET`;
  console.log(`Connecting to ${resourceString}...`);

  const rm = createResourceManager();

  const result = await rm.openResource(resourceString, {
    timeout: 2000,
  });

  if (!result.ok) {
    console.error('Failed to open:', result.error.message);
    return;
  }

  const scope = result.value;

  const idn = await scope.query('*IDN?');
  console.log('Connected to:', idn.ok ? idn.value.trim() : 'error');
  console.log('');

  // Query current state
  const queries: [string, string][] = [
    ['Timebase scale', ':TIM:SCAL?'],
    ['Timebase offset', ':TIM:OFFS?'],
    ['CH1 scale', ':CHAN1:SCAL?'],
    ['CH1 offset', ':CHAN1:OFFS?'],
    ['CH1 coupling', ':CHAN1:COUP?'],
    ['CH1 display', ':CHAN1:DISP?'],
    ['CH2 display', ':CHAN2:DISP?'],
    ['Trigger source', ':TRIG:EDG:SOUR?'],
    ['Trigger level', ':TRIG:EDG:LEV?'],
    ['Trigger mode', ':TRIG:SWE?'],
    ['Run status', ':TRIG:STAT?'],
  ];

  console.log('Current settings:');
  for (const [name, cmd] of queries) {
    const resp = await scope.query(cmd);
    console.log('  ' + name + ':', resp.ok ? resp.value.trim() : 'error');
  }

  // Measure CH1
  console.log('');
  console.log('CH1 Measurements:');
  const measurements: [string, string][] = [
    ['Frequency', ':MEAS:FREQ? CHAN1'],
    ['Period', ':MEAS:PER? CHAN1'],
    ['Vpp', ':MEAS:VPP? CHAN1'],
    ['Vavg', ':MEAS:VAV? CHAN1'],
    ['Vrms', ':MEAS:VRMS? CHAN1'],
  ];

  for (const [name, cmd] of measurements) {
    const resp = await scope.query(cmd);
    console.log('  ' + name + ':', resp.ok ? resp.value.trim() : 'error');
  }

  await scope.close();
}

main().catch(console.error);
