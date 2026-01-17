/**
 * Oscilloscope feature brands and types for granular type safety.
 *
 * Features are optional capabilities that vary between oscilloscope models.
 * Base capabilities (FFT, math, reference, zoom, persistence) are on all
 * scopes and defined in the base interface.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';

// ─────────────────────────────────────────────────────────────────
// Feature Brand Tags (unique symbols for nominal typing)
// ─────────────────────────────────────────────────────────────────

declare const DecodeTag: unique symbol;
declare const DigitalTag: unique symbol;
declare const MaskTag: unique symbol;
declare const HistogramTag: unique symbol;
declare const SegmentedTag: unique symbol;
declare const WavegenTag: unique symbol;
declare const SearchTag: unique symbol;
declare const BodeTag: unique symbol;
declare const PowerTag: unique symbol;
declare const JitterTag: unique symbol;

// ─────────────────────────────────────────────────────────────────
// Feature Brands (phantom types for compile-time checking)
// ─────────────────────────────────────────────────────────────────

/** Brand indicating protocol decode support */
export type HasDecode = { readonly [DecodeTag]: true };

/** Brand indicating digital/MSO channel support */
export type HasDigital = { readonly [DigitalTag]: true };

/** Brand indicating mask/limit testing support */
export type HasMask = { readonly [MaskTag]: true };

/** Brand indicating histogram analysis support */
export type HasHistogram = { readonly [HistogramTag]: true };

/** Brand indicating segmented memory acquisition support */
export type HasSegmented = { readonly [SegmentedTag]: true };

/** Brand indicating built-in waveform generator support */
export type HasWavegen = { readonly [WavegenTag]: true };

/** Brand indicating search and mark support */
export type HasSearch = { readonly [SearchTag]: true };

/** Brand indicating Bode plot analysis support */
export type HasBode = { readonly [BodeTag]: true };

/** Brand indicating power analysis measurements support */
export type HasPower = { readonly [PowerTag]: true };

/** Brand indicating jitter analysis support */
export type HasJitter = { readonly [JitterTag]: true };

// ─────────────────────────────────────────────────────────────────
// Feature String Literals
// ─────────────────────────────────────────────────────────────────

/** Oscilloscope feature string literal type */
export type OscFeatureId =
  | 'decode'
  | 'digital'
  | 'mask'
  | 'histogram'
  | 'segmented'
  | 'wavegen'
  | 'search'
  | 'bode'
  | 'power'
  | 'jitter';

// ─────────────────────────────────────────────────────────────────
// String → Brand Mapping
// ─────────────────────────────────────────────────────────────────

/** Maps Oscilloscope feature string literals to their branded types */
export type OscFeatureMap = {
  decode: HasDecode;
  digital: HasDigital;
  mask: HasMask;
  histogram: HasHistogram;
  segmented: HasSegmented;
  wavegen: HasWavegen;
  search: HasSearch;
  bode: HasBode;
  power: HasPower;
  jitter: HasJitter;
};

// ─────────────────────────────────────────────────────────────────
// Feature Method Interfaces
// ─────────────────────────────────────────────────────────────────

/** Protocol types for decode */
export type Protocol = 'I2C' | 'SPI' | 'UART' | 'CAN' | 'LIN' | 'I2S' | 'FLEXRAY' | '1WIRE';

/** Protocol decode methods added when 'decode' feature is present */
export interface DecodeMethods {
  getDecodeEnabled(bus: number): Promise<Result<boolean, Error>>;
  setDecodeEnabled(bus: number, enabled: boolean): Promise<Result<void, Error>>;
  getDecodeProtocol(bus: number): Promise<Result<Protocol, Error>>;
  setDecodeProtocol(bus: number, protocol: Protocol): Promise<Result<void, Error>>;
}

/** Digital channel interface */
export interface DigitalChannel {
  readonly channelNumber: number;
  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getThreshold(): Promise<Result<number, Error>>;
  setThreshold(volts: number): Promise<Result<void, Error>>;
}

/** Digital/MSO methods added when 'digital' feature is present */
export interface DigitalMethods {
  readonly digitalChannelCount: number;
  digitalChannel(n: number): DigitalChannel;
}

/** Mask test result */
export interface MaskTestResult {
  passed: boolean;
  failCount: number;
  totalCount: number;
}

/** Mask testing methods added when 'mask' feature is present */
export interface MaskMethods {
  getMaskEnabled(): Promise<Result<boolean, Error>>;
  setMaskEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getMaskSource(): Promise<Result<number, Error>>;
  setMaskSource(channel: number): Promise<Result<void, Error>>;
  getMaskTestResult(): Promise<Result<MaskTestResult, Error>>;
  resetMaskTest(): Promise<Result<void, Error>>;
}

/** Histogram axis type */
export type HistogramAxis = 'vertical' | 'horizontal';

/** Histogram methods added when 'histogram' feature is present */
export interface HistogramMethods {
  getHistogramEnabled(): Promise<Result<boolean, Error>>;
  setHistogramEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getHistogramSource(): Promise<Result<number, Error>>;
  setHistogramSource(channel: number): Promise<Result<void, Error>>;
  getHistogramAxis(): Promise<Result<HistogramAxis, Error>>;
  setHistogramAxis(axis: HistogramAxis): Promise<Result<void, Error>>;
}

/** Segmented memory methods added when 'segmented' feature is present */
export interface SegmentedMethods {
  getSegmentCount(): Promise<Result<number, Error>>;
  setSegmentCount(count: number): Promise<Result<void, Error>>;
  getSegmentIndex(): Promise<Result<number, Error>>;
  setSegmentIndex(index: number): Promise<Result<void, Error>>;
}

/** Waveform generator function type */
export type WavegenFunction = 'SINE' | 'SQUARE' | 'RAMP' | 'PULSE' | 'NOISE' | 'DC' | 'ARB';

/** Waveform generator methods added when 'wavegen' feature is present */
export interface WavegenMethods {
  getWavegenEnabled(): Promise<Result<boolean, Error>>;
  setWavegenEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getWavegenFunction(): Promise<Result<WavegenFunction, Error>>;
  setWavegenFunction(func: WavegenFunction): Promise<Result<void, Error>>;
  getWavegenFrequency(): Promise<Result<number, Error>>;
  setWavegenFrequency(hz: number): Promise<Result<void, Error>>;
  getWavegenAmplitude(): Promise<Result<number, Error>>;
  setWavegenAmplitude(volts: number): Promise<Result<void, Error>>;
  getWavegenOffset(): Promise<Result<number, Error>>;
  setWavegenOffset(volts: number): Promise<Result<void, Error>>;
}

/** Search event type */
export type SearchType = 'EDGE' | 'PULSE' | 'RUNT' | 'TRANSITION' | 'PATTERN';

/** Search mark */
export interface SearchMark {
  position: number;
  type: SearchType;
}

/** Search and mark methods added when 'search' feature is present */
export interface SearchMethods {
  getSearchType(): Promise<Result<SearchType, Error>>;
  setSearchType(type: SearchType): Promise<Result<void, Error>>;
  getSearchSource(): Promise<Result<number, Error>>;
  setSearchSource(channel: number): Promise<Result<void, Error>>;
  getSearchMarks(): Promise<Result<SearchMark[], Error>>;
  navigateToMark(index: number): Promise<Result<void, Error>>;
}

/** Bode plot methods added when 'bode' feature is present */
export interface BodeMethods {
  getBodeStartFrequency(): Promise<Result<number, Error>>;
  setBodeStartFrequency(hz: number): Promise<Result<void, Error>>;
  getBodeStopFrequency(): Promise<Result<number, Error>>;
  setBodeStopFrequency(hz: number): Promise<Result<void, Error>>;
  getBodeAmplitude(): Promise<Result<number, Error>>;
  setBodeAmplitude(volts: number): Promise<Result<void, Error>>;
  startBodePlot(): Promise<Result<void, Error>>;
  stopBodePlot(): Promise<Result<void, Error>>;
}

/** Power analysis type */
export type PowerAnalysisType =
  | 'QUALITY'
  | 'HARMONICS'
  | 'SWITCHING'
  | 'INRUSH'
  | 'MODULATION'
  | 'RIPPLE';

/** Power analysis methods added when 'power' feature is present */
export interface PowerMethods {
  getPowerSource(): Promise<Result<number, Error>>;
  setPowerSource(channel: number): Promise<Result<void, Error>>;
  getPowerAnalysisType(): Promise<Result<PowerAnalysisType, Error>>;
  setPowerAnalysisType(type: PowerAnalysisType): Promise<Result<void, Error>>;
}

/** Jitter measurement type */
export type JitterMeasurement = 'TIE' | 'PERIOD' | 'CYCLE' | 'SKEW' | 'SETUP' | 'HOLD';

/** Jitter analysis methods added when 'jitter' feature is present */
export interface JitterMethods {
  getJitterSource(): Promise<Result<number, Error>>;
  setJitterSource(channel: number): Promise<Result<void, Error>>;
  getJitterMeasurement(): Promise<Result<JitterMeasurement, Error>>;
  setJitterMeasurement(type: JitterMeasurement): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Feature Properties (for spec enforcement)
// ─────────────────────────────────────────────────────────────────

/** Maps Oscilloscope features to their required property keys */
export type OscFeatureProperties = {
  decode: 'decodeEnabled' | 'decodeProtocol';
  digital: 'digitalChannelEnabled' | 'digitalThreshold';
  mask: 'maskEnabled' | 'maskSource';
  histogram: 'histogramEnabled' | 'histogramSource' | 'histogramAxis';
  segmented: 'segmentCount' | 'segmentIndex';
  wavegen:
    | 'wavegenEnabled'
    | 'wavegenFunction'
    | 'wavegenFrequency'
    | 'wavegenAmplitude'
    | 'wavegenOffset';
  search: 'searchType' | 'searchSource';
  bode: 'bodeStartFrequency' | 'bodeStopFrequency' | 'bodeAmplitude';
  power: 'powerSource' | 'powerAnalysisType';
  jitter: 'jitterSource' | 'jitterMeasurement';
};
