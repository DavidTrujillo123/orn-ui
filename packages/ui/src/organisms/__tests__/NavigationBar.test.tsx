import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { NavigationBar, type NavigationBarItem } from '../NavigationBar';

const ITEMS: NavigationBarItem[] = [
  { key: 'home', label: 'Home', iconName: 'check' },
  { key: 'search', label: 'Search', iconName: 'search' },
  { key: 'profile', label: 'Profile', iconName: 'info', badge: 3 },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('NavigationBar', () => {
  it('renders one tab per item', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} />));
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('reports the key of the pressed tab', () => {
    const onChange = jest.fn();
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={onChange} />));
    fireEvent.press(screen.getByRole('tab', { name: 'Search' }));
    expect(onChange).toHaveBeenCalledWith('search');
  });

  it('marks the active tab as selected', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="search" onChange={() => {}} />));
    expect(screen.getByRole('tab', { name: 'Search' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('an unknown activeKey falls back to the first tab', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="nope" onChange={() => {}} />));
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
  });

  it('renders the badge count', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} />));
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('reads each label once: the cross-fade copy stays out of the accessibility tree', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} />));
    expect(screen.getAllByText('Home')).toHaveLength(1);
  });

  it('keeps the indicator out of the bottom safe area', () => {
    render(
      <UIProvider mode="light" insets={{ top: 47, right: 0, bottom: 34, left: 0 }}>
        <NavigationBar testID="bar" items={ITEMS} activeKey="home" onChange={() => {}} />
      </UIProvider>
    );

    fireEvent(screen.getByTestId('bar'), 'layout', {
      nativeEvent: { layout: { width: 390, height: 90, x: 0, y: 0 } },
    });

    const indicator = screen.getByTestId('navigation-bar-indicator');
    expect(StyleSheet.flatten(indicator.props.style).bottom).toBeGreaterThanOrEqual(34);
  });

  it('hides the labels when showLabels is false', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} showLabels={false} />));
    expect(screen.queryByText('Home')).not.toBeOnTheScreen();
  });
});
