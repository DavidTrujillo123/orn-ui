import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider, useTheme } from '../../theme/UIProvider';
import { ThemeToggle } from '../ThemeToggle';

function Scheme() {
  return <Text>{useTheme().scheme}</Text>;
}

describe('ThemeToggle', () => {
  it('renders the three modes as radios', () => {
    render(
      <UIProvider defaultMode="system">
        <ThemeToggle />
      </UIProvider>
    );
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeOnTheScreen();
  });

  it('marks the active mode as selected', () => {
    render(
      <UIProvider defaultMode="dark">
        <ThemeToggle />
      </UIProvider>
    );
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeSelected();
  });

  it('switches the resolved theme on press', () => {
    render(
      <UIProvider defaultMode="light">
        <ThemeToggle />
        <Scheme />
      </UIProvider>
    );
    expect(screen.getByText('light')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeSelected();
    expect(screen.getByText('dark')).toBeOnTheScreen();
  });

  it('reports the mode to a controlled provider instead of switching on its own', () => {
    const onModeChange = jest.fn();
    render(
      <UIProvider mode="light" onModeChange={onModeChange}>
        <ThemeToggle />
        <Scheme />
      </UIProvider>
    );

    fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    expect(onModeChange).toHaveBeenCalledWith('dark');
    expect(screen.getByText('light')).toBeOnTheScreen();
  });

  it('accepts custom labels', () => {
    render(
      <UIProvider defaultMode="system">
        <ThemeToggle labels={{ system: 'System', dark: 'Night' }} />
      </UIProvider>
    );
    expect(screen.getByRole('radio', { name: 'System' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Night' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeOnTheScreen();
  });
});
