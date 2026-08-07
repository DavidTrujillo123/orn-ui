import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders the three modes as tabs', () => {
    render(
      <UIProvider defaultMode="system">
        <ThemeToggle />
      </UIProvider>
    );
    expect(screen.getByRole('tab', { name: 'Auto' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Light' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Dark' })).toBeOnTheScreen();
  });

  it('marks the active mode as selected', () => {
    render(
      <UIProvider defaultMode="dark">
        <ThemeToggle />
      </UIProvider>
    );
    expect(screen.getByRole('tab', { name: 'Dark' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Light' }).props.accessibilityState.selected).toBe(false);
  });

  it('switches mode on press', () => {
    render(
      <UIProvider defaultMode="system">
        <ThemeToggle />
      </UIProvider>
    );
    fireEvent.press(screen.getByRole('tab', { name: 'Dark' }));
    expect(screen.getByRole('tab', { name: 'Dark' }).props.accessibilityState.selected).toBe(true);
  });
});
