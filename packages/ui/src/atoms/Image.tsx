import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Image as RNImage,
  Platform,
  StyleSheet,
  View,
  type ImageProps as RNImageProps,
  type ImageResizeMode,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { Spinner } from './Spinner';

/**
 * The event RN's Image passes to `onError`. Taken from its own prop type:
 * react-native 0.88 (Expo SDK 58) renamed the exported name
 * (`ImageErrorEventData` -> `ImageErrorEvent`).
 */
type ImageErrorEvent = Parameters<NonNullable<RNImageProps['onError']>>[0];

export interface ImageProps {
  /** Image to load (same as React Native's `source`). */
  source: ImageSourcePropType;
  /** Width of the image slot, in pt. */
  width?: number;
  /** Height of the image slot, in pt. */
  height?: number;
  /** How the image fits its slot (same as React Native). @default 'cover' */
  resizeMode?: ImageResizeMode;
  /** Corner radius, same pattern as Avatar/Card. @default 0 */
  radius?: number;
  /** What to show while loading. `false` to show nothing. @default true (small spinner) */
  loading?: React.ReactNode | boolean;
  /** What to show if loading fails. @default placeholder with a warning icon */
  fallback?: React.ReactNode;
  /**
   * 'high' triggers Image.prefetch() on mount, before <Image> starts
   * its own load cycle — meant for the above-the-fold image of a
   * screen (the first one the user sees). No cost if it's already cached.
   * @default 'normal'
   */
  priority?: 'low' | 'normal' | 'high';
  style?: StyleProp<ViewStyle>;
  /** Called when loading finishes, successfully or not (same as RN). */
  onLoadEnd?: () => void;
  /** Describes the image for screen readers. Without it the image is decorative. */
  accessibilityLabel?: string;
  /** Called when loading fails; the `fallback` is shown. */
  onError?: (error: ImageErrorEvent) => void;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  container: { overflow: 'hidden' },
  // Only while loading or on failure: once the image has loaded, a PNG with
  // transparency (a logo) let this gray show through.
  placeholder: { backgroundColor: theme.colors.skeleton },
  overlay: { alignItems: 'center', justifyContent: 'center' },
  fallback: { flex: 1, backgroundColor: theme.colors.skeleton, alignItems: 'center', justifyContent: 'center' },
}));

function sourceUri(source: ImageSourcePropType): string | undefined {
  return typeof source === 'object' && source !== null && 'uri' in source ? source.uri : undefined;
}

/**
 * Image
 * Zero-dependency wrapper over RN's <Image>: adds loading and error state
 * (with the same placeholders as the rest of the library), and exposes
 * `priority="high"` to start the download early via Image.prefetch(). The
 * actual cache (disk/memory) is handled by RN's native image engine — this
 * doesn't reimplement it, it just keeps it from being accidentally turned off:
 * on iOS it forces `cache="force-cache"` (uses the disk even when the HTTP
 * header doesn't ask for it); on Android the native image's disk cache is
 * always on, there is no equivalent knob to touch.
 *
 * Gestalt, closure: the container takes its final size from the first frame
 * (`skeleton` background), so the layout doesn't jump when the image arrives
 * and the eye completes the shape it will fill. If loading fails, the same
 * slot shows a warning icon: the state is visible, not a silent gray.
 *
 * Success is detected with `onLoad`, not `onLoadEnd`: RN also calls
 * `onLoadEnd` on failure, and using it for "loaded" overwrote the error.
 */
export const Image = memo(
  ({
    source,
    width,
    height,
    resizeMode = 'cover',
    radius = 0,
    loading = true,
    fallback,
    priority = 'normal',
    style,
    onLoadEnd,
    onError,
    testID,
    accessibilityLabel,
  }: ImageProps) => {
    const styles = useStyles();
    const colors = useColors();
    const theme = useTheme();
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const uri = sourceUri(source);

    useEffect(() => {
      // Resets the state if the image changes (same Image instance, different
      // source: e.g. one user's avatar to another's in the same row).
      setStatus('loading');
    }, [uri ?? source]);

    useEffect(() => {
      if (priority === 'high' && uri) {
        RNImage.prefetch(uri).catch(() => {});
      }
    }, [priority, uri]);

    const handleError = useCallback(
      (e: ImageErrorEvent) => {
        setStatus('error');
        onError?.(e);
      },
      [onError]
    );

    const handleLoad = useCallback(() => {
      setStatus('loaded');
    }, []);

    return (
      <View
        style={[styles.container, status !== 'loaded' && styles.placeholder, { width, height, borderRadius: radius }, style]}
        testID={testID}
        accessible={!!accessibilityLabel}
        accessibilityRole={accessibilityLabel ? 'image' : undefined}
        accessibilityLabel={accessibilityLabel}
      >
        {status !== 'error' && (
          <RNImage
            source={source}
            resizeMode={resizeMode}
            style={StyleSheet.absoluteFill}
            fadeDuration={Platform.OS === 'android' ? theme.tokens.duration.fast : undefined}
            {...(Platform.OS === 'ios' ? { cache: 'force-cache' as const } : null)}
            onLoad={handleLoad}
            onLoadEnd={onLoadEnd}
            onError={handleError}
          />
        )}
        {status === 'loading' && loading !== false && (
          <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            {loading === true ? <Spinner size="small" fullscreen={false} /> : loading}
          </View>
        )}
        {status === 'error' && (
          // Custom fallback or the default: always centered in the slot.
          <View style={styles.fallback}>
            {fallback ?? (
              <Icon
                name="warning"
                size={Math.max(16, Math.min(32, Math.round(Math.min(width ?? 64, height ?? 64) * 0.3)))}
                color={colors.textLight}
              />
            )}
          </View>
        )}
      </View>
    );
  }
);
Image.displayName = 'Image';

/**
 * Preloads a URL before mounting the component (e.g. on receiving a list
 * response, before navigating to the detail). Re-exports RN's
 * Image.prefetch — there is nothing zero-dep to add on top.
 */
export const prefetchImage = RNImage.prefetch;
