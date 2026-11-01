import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Skeleton } from '../Skeleton';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

// El Skeleton se esconde del árbol de accesibilidad, así que las queries tienen
// que pedir explícitamente los elementos ocultos.
const getBlock = () => screen.getByTestId('sk', { includeHiddenElements: true });

describe('Skeleton', () => {
  // El pulso es un loop de Animated: sin fake timers sigue vivo después del
  // test y actualiza un árbol ya desmontado.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('renders a block with the given size', () => {
    render(withProvider(<Skeleton width={120} height={24} testID="sk" />));
    expect(getBlock()).toHaveStyle({ width: 120, height: 24 });
  });

  it('circle uses the width as diameter', () => {
    render(withProvider(<Skeleton variant="circle" width={48} testID="sk" />));
    expect(getBlock()).toHaveStyle({ width: 48, height: 48 });
  });

  it('text with several lines renders one bar per line, the last one shorter', () => {
    render(withProvider(<Skeleton variant="text" lines={3} lastLineWidth={80} testID="sk" />));
    expect(screen.getAllByTestId(/^sk-\d$/, { includeHiddenElements: true })).toHaveLength(3);
    expect(screen.getByTestId('sk-2', { includeHiddenElements: true })).toHaveStyle({ width: 80 });
  });

  it('renders without animation when animated is false', () => {
    render(withProvider(<Skeleton animated={false} testID="sk" />));
    expect(getBlock()).toHaveStyle({ opacity: 1 });
  });

  it('stays out of the accessibility tree', () => {
    render(withProvider(<Skeleton testID="sk" />));
    expect(screen.queryByTestId('sk')).toBeNull();
  });

  it('each text line takes exactly Body\'s line height (bar + half leading above and below)', () => {
    render(withProvider(<Skeleton variant="text" lines={2} testID="sk" />));
    // fontSize.md 14 + 2 × 3 = lineHeight.md 20, igual que un renglón de Body.
    expect(screen.getByTestId('sk-0', { includeHiddenElements: true })).toHaveStyle({
      height: 14,
      marginVertical: 3,
    });
  });

  it('stops pulsing when the system asks to reduce motion', async () => {
    // Once, sin mockRestore: el preset ya trae isReduceMotionEnabled como jest.fn
    // y restaurarlo le borra la implementación al resto del archivo.
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
    render(withProvider(<Skeleton testID="sk" />));
    await act(async () => {});
    // A mitad de ciclo un bloque que late ya está en 0.4; uno quieto sigue en 1.
    act(() => jest.advanceTimersByTime(700));
    expect(getBlock()).toHaveStyle({ opacity: 1 });
  });

  it('pulses by default', () => {
    render(withProvider(<Skeleton testID="sk" />));
    act(() => jest.advanceTimersByTime(700));
    expect(getBlock()).not.toHaveStyle({ opacity: 1 });
  });
});
