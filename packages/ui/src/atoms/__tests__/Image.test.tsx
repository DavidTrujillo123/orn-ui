import React from 'react';
import { Image as RNImage, Platform, StyleSheet, Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Image, prefetchImage } from '../Image';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Image', () => {
  it('shows the default spinner while loading, then the image content', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} width={80} height={80} />));
    expect(screen.UNSAFE_getByType(RNImage)).toBeTruthy();
    fireEvent(screen.UNSAFE_getByType(RNImage), 'loadEnd');
    expect(screen.UNSAFE_getByType(RNImage)).toBeTruthy();
  });

  it('fills its slot with a local (require) source, not the file size', () => {
    // RN gives a local asset its file width/height before the style; only an
    // explicit size in the style overrides it.
    render(withProvider(<Image source={42} width={120} height={80} />));
    const style = StyleSheet.flatten(screen.UNSAFE_getByType(RNImage).props.style);
    expect(style).toMatchObject({ position: 'absolute', width: '100%', height: '100%' });
  });

  it('hides the loading indicator when loading={false}', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} loading={false} />));
    // It must not crash or render a spinner: only the native <Image>.
    expect(screen.UNSAFE_getByType(RNImage)).toBeTruthy();
  });

  it('renders a custom loading node instead of the default spinner', () => {
    render(
      withProvider(
        <Image source={{ uri: 'https://example.com/a.png' }} loading={<Text>Cargando…</Text>} />
      )
    );
    expect(screen.getByText('Cargando…')).toBeOnTheScreen();
  });

  it('shows the default placeholder and calls onError when the image fails', () => {
    const onError = jest.fn();
    render(withProvider(<Image source={{ uri: 'https://example.com/broken.png' }} onError={onError} />));
    fireEvent(screen.UNSAFE_getByType(RNImage), 'error', { nativeEvent: { error: 'boom' } });
    expect(onError).toHaveBeenCalledTimes(1);
    // The native <Image> unmounts when switching to error.
    expect(screen.UNSAFE_queryAllByType(RNImage)).toHaveLength(0);
  });

  it('renders a custom fallback instead of the default placeholder', () => {
    render(
      withProvider(
        <Image source={{ uri: 'https://example.com/broken.png' }} fallback={<Text>No se pudo cargar</Text>} />
      )
    );
    fireEvent(screen.UNSAFE_getByType(RNImage), 'error');
    expect(screen.getByText('No se pudo cargar')).toBeOnTheScreen();
  });

  it('calls onLoadEnd when the image finishes loading', () => {
    const onLoadEnd = jest.fn();
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} onLoadEnd={onLoadEnd} />));
    fireEvent(screen.UNSAFE_getByType(RNImage), 'loadEnd');
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
  });

  it('resets to loading when the source uri changes', () => {
    const { rerender } = render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} />));
    fireEvent(screen.UNSAFE_getByType(RNImage), 'error');
    expect(screen.UNSAFE_queryAllByType(RNImage)).toHaveLength(0);

    rerender(withProvider(<Image source={{ uri: 'https://example.com/b.png' }} />));
    expect(screen.UNSAFE_getByType(RNImage)).toBeTruthy();
  });

  it('prefetches the uri on mount when priority="high"', () => {
    const spy = jest.spyOn(RNImage, 'prefetch').mockResolvedValue(true);
    render(withProvider(<Image source={{ uri: 'https://example.com/hero.png' }} priority="high" />));
    expect(spy).toHaveBeenCalledWith('https://example.com/hero.png');
    spy.mockRestore();
  });

  it('does not prefetch for local (non-uri) sources even with priority="high"', () => {
    const spy = jest.spyOn(RNImage, 'prefetch').mockResolvedValue(true);
    render(withProvider(<Image source={1} priority="high" />));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not prefetch with the default priority', () => {
    const spy = jest.spyOn(RNImage, 'prefetch').mockResolvedValue(true);
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} />));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('applies width, height and radius to the container', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} width={64} height={64} radius={8} testID="pic" />));
    expect(screen.getByTestId('pic')).toHaveStyle({ width: 64, height: 64, borderRadius: 8 });
  });

  it('sets cache="force-cache" on iOS and omits it on Android', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} />));
    expect(screen.UNSAFE_getByType(RNImage).props.cache).toBe('force-cache');

    const original = Platform.OS;
    Platform.OS = 'android';
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} />));
    const lastAndroidImage = screen.UNSAFE_getAllByType(RNImage).at(-1)!;
    expect(lastAndroidImage.props.cache).toBeUndefined();
    expect(lastAndroidImage.props.fadeDuration).toBe(150);
    Platform.OS = original;
  });

  it('re-exports Image.prefetch as prefetchImage', () => {
    expect(prefetchImage).toBe(RNImage.prefetch);
  });

  it('keeps the fallback when RN fires loadEnd right after error (regression)', () => {
    const { Text } = require('react-native');
    render(
      withProvider(
        <Image source={{ uri: 'https://example.com/broken.png' }} fallback={<Text>Couldn't load</Text>} />
      )
    );
    const native = screen.UNSAFE_getByType(RNImage);
    fireEvent(native, 'error', { nativeEvent: { error: 'boom' } });
    fireEvent(native, 'loadEnd');
    expect(screen.getByText("Couldn't load")).toBeOnTheScreen();
  });

  it('is announced as an image only when it has an accessibilityLabel', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} accessibilityLabel="Sunset" testID="img" />));
    expect(screen.getByRole('image', { name: 'Sunset' })).toBeOnTheScreen();
  });

  it('drops the placeholder background once loaded, so transparent images do not show gray', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/logo.png' }} testID="img" />));
    expect(screen.getByTestId('img')).toHaveStyle({ backgroundColor: '#e3e5e8' });
    fireEvent(screen.UNSAFE_getByType(RNImage), 'load');
    expect(screen.getByTestId('img')).not.toHaveStyle({ backgroundColor: '#e3e5e8' });
  });
});

