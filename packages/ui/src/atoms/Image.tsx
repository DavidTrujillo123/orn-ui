import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Image as RNImage,
  Platform,
  StyleSheet,
  View,
  type ImageErrorEventData,
  type ImageResizeMode,
  type ImageSourcePropType,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { Spinner } from './Spinner';

export interface ImageProps {
  source: ImageSourcePropType;
  width?: number;
  height?: number;
  /** @default 'cover' */
  resizeMode?: ImageResizeMode;
  /** Radio de las esquinas, mismo patrón que Avatar/Card. @default 0 */
  radius?: number;
  /** Qué mostrar mientras carga. `false` para no mostrar nada. @default true (spinner chico) */
  loading?: React.ReactNode | boolean;
  /** Qué mostrar si la carga falla. @default un placeholder gris, sin contenido */
  fallback?: React.ReactNode;
  /**
   * 'high' dispara Image.prefetch() al montar, antes de que <Image> arranque
   * su propio ciclo de carga — pensado para la imagen above-the-fold de una
   * pantalla (la primera que el usuario ve). Sin costo si ya está en caché.
   * @default 'normal'
   */
  priority?: 'low' | 'normal' | 'high';
  style?: StyleProp<ViewStyle>;
  onLoadEnd?: () => void;
  onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  container: { overflow: 'hidden', backgroundColor: theme.colors.skeleton },
  overlay: { alignItems: 'center', justifyContent: 'center' },
  fallback: { flex: 1, backgroundColor: theme.colors.skeleton },
}));

function sourceUri(source: ImageSourcePropType): string | undefined {
  return typeof source === 'object' && source !== null && 'uri' in source ? source.uri : undefined;
}

/**
 * Image
 * Wrapper cero-dependencias sobre <Image> de RN: agrega estado de carga y
 * error (con los mismos placeholders que el resto de la librería), y expone
 * `priority="high"` para adelantar la descarga vía Image.prefetch(). El
 * cache real (disco/memoria) lo maneja el motor de imágenes nativo de RN —
 * esto no lo reimplementa, solo no lo deja apagado por accidente: en iOS
 * fuerza `cache="force-cache"` (usa el disco aunque el header HTTP no lo
 * pida); en Android el cache de disco de la imagen nativa ya está siempre
 * activo, no hay knob equivalente que tocar.
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
  }: ImageProps) => {
    const styles = useStyles();
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const uri = sourceUri(source);

    useEffect(() => {
      // Resetea el estado si cambia la imagen (misma instancia de Image,
      // source distinto: p.ej. avatar de un usuario a otro en la misma fila).
      setStatus('loading');
    }, [uri ?? source]);

    useEffect(() => {
      if (priority === 'high' && uri) {
        RNImage.prefetch(uri).catch(() => {});
      }
    }, [priority, uri]);

    const handleError = useCallback(
      (e: NativeSyntheticEvent<ImageErrorEventData>) => {
        setStatus('error');
        onError?.(e);
      },
      [onError]
    );

    const handleLoadEnd = useCallback(() => {
      setStatus('loaded');
      onLoadEnd?.();
    }, [onLoadEnd]);

    return (
      <View style={[styles.container, { width, height, borderRadius: radius }, style]} testID={testID}>
        {status !== 'error' && (
          <RNImage
            source={source}
            resizeMode={resizeMode}
            style={StyleSheet.absoluteFill}
            fadeDuration={Platform.OS === 'android' ? 150 : undefined}
            {...(Platform.OS === 'ios' ? { cache: 'force-cache' as const } : null)}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
        )}
        {status === 'loading' && loading !== false && (
          <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            {loading === true ? <Spinner size="small" fullscreen={false} /> : loading}
          </View>
        )}
        {status === 'error' && (fallback ?? <View style={styles.fallback} />)}
      </View>
    );
  }
);
Image.displayName = 'Image';

/**
 * Precarga una URL antes de montar el componente (p.ej. al recibir la
 * respuesta de un listado, antes de navegar al detalle). Re-exporta
 * Image.prefetch de RN — no hay nada zero-dep que agregarle encima.
 */
export const prefetchImage = RNImage.prefetch;
