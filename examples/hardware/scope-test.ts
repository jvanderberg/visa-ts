/**
 * Oscilloscope Test - Query Rigol DS1202Z-E
 */

import { createResourceManager } from '../../src/index.js';

async function main(): Promise<void> {
  const rm = createResourceManager();

  const result = await rm.openResource('USB0::0x1AB1::0x0517::DS1ZE26CM00683::INSTR', {
    timeout: 2000,
  });

  if (!result.ok) {
    console.error('Failed to open:', result.error);
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
