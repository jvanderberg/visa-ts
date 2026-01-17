/**
 * Utility types for the granular feature system.
 *
 * These types convert runtime feature arrays into compile-time branded types,
 * enabling type-safe feature detection.
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────
// Core Utility Types
// ─────────────────────────────────────────────────────────────────

/**
 * Converts a union type to an intersection type.
 *
 * @example
 * ```typescript
 * type U = { a: 1 } | { b: 2 };
 * type I = UnionToIntersection<U>; // { a: 1 } & { b: 2 }
 * ```
 */
export type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;

/**
 * Converts a readonly tuple of feature IDs to an intersection of their branded types.
 *
 * @typeParam T - A readonly array of feature ID strings
 * @typeParam Map - The feature map that maps strings to brands
 *
 * @example
 * ```typescript
 * type Features = FeaturesFromArray<['ovp', 'ocp'], PsuFeatureMap>;
 * // => HasOvp & HasOcp
 * ```
 */
export type FeaturesFromArray<
  T extends readonly string[],
  Map extends Record<string, unknown>,
> = UnionToIntersection<Map[T[number]]>;

/**
 * Extracts the required property keys for a set of features.
 *
 * @typeParam T - A readonly array of feature ID strings
 * @typeParam PropMap - Maps feature IDs to their required property keys
 *
 * @example
 * ```typescript
 * type Props = RequiredPropsFromFeatures<['ovp', 'ocp'], PsuChannelFeatureProperties>;
 * // => 'ovpEnabled' | 'ovpLevel' | 'ocpEnabled' | 'ocpLevel'
 * ```
 */
export type RequiredPropsFromFeatures<
  T extends readonly string[],
  PropMap extends Record<string, string>,
> = PropMap[T[number]];

// ─────────────────────────────────────────────────────────────────
// Conditional Type Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Conditionally includes a type if a feature brand is present.
 *
 * Uses `unknown` as the "empty" type because `T & unknown = T`.
 *
 * @typeParam F - The current feature intersection
 * @typeParam Brand - The brand to check for
 * @typeParam Methods - The methods to include if brand is present
 *
 * @example
 * ```typescript
 * type Ch = ChannelBase & IfHasFeature<F, HasOvp, OvpMethods>;
 * // If F extends HasOvp, includes OvpMethods
 * // Otherwise, intersects with unknown (no change)
 * ```
 */
export type IfHasFeature<F, Brand, Methods> = F extends Brand ? Methods : unknown;

/**
 * Creates a conditional channel type that includes methods based on features.
 *
 * @typeParam F - The feature intersection derived from features array
 * @typeParam Base - The base channel interface
 * @typeParam FeatureMethodMap - Maps brands to method interfaces
 */
export type ChannelWithFeatures<F, Base, FeatureMethodMap extends Record<string, unknown>> = Base &
  UnionToIntersection<
    {
      [K in keyof FeatureMethodMap]: F extends FeatureMethodMap[K] ? FeatureMethodMap[K] : unknown;
    }[keyof FeatureMethodMap]
  >;
