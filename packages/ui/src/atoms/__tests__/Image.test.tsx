import React from 'react';
import { Image as RNImage, Platform, Text } from 'react-native';
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

  it('hides the loading indicator when loading={false}', () => {
    render(withProvider(<Image source={{ uri: 'https://example.com/a.png' }} loading={false} />));
    // No debe crashear ni renderizar un spinner: solo el <Image> nativo.
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
    // El <Image> nativo se desmonta al pasar a error.
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
});
