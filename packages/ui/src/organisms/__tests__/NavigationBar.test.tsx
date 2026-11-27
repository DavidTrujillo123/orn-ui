import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import {
  NavigationBar,
  NAVIGATION_BAR_FLOATING_HEIGHT,
  navigationBarFloatingOffset,
  type NavigationBarItem,
} from '../NavigationBar';

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

  it('announces the badge count as the tab value', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} />));
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAccessibilityValue({ text: '3' });
    expect(screen.getByRole('tab', { name: 'Home' }).props.accessibilityValue?.text).toBeUndefined();
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

  it('centers the indicator over the active tab', () => {
    const width = 390;
    render(
      <UIProvider mode="light" insets={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <NavigationBar testID="bar" items={ITEMS} activeKey="home" onChange={() => {}} />
      </UIProvider>
    );

    fireEvent(screen.getByTestId('bar'), 'layout', {
      nativeEvent: { layout: { width, height: 90, x: 0, y: 0 } },
    });

    // The bar has `xs` (4) horizontal padding and the indicator is positioned
    // against the edge, so its center only lands on the tab's if `left`
    // includes that padding.
    const barPaddingHorizontal = 4;
    const itemWidth = (width - barPaddingHorizontal * 2) / ITEMS.length;
    const style = StyleSheet.flatten(screen.getByTestId('navigation-bar-indicator').props.style);
    const indicatorCenter = style.left + style.width / 2;

    expect(indicatorCenter).toBeCloseTo(barPaddingHorizontal + itemWidth / 2);
  });

  it('hides the labels when showLabels is false', () => {
    render(withProvider(<NavigationBar items={ITEMS} activeKey="home" onChange={() => {}} showLabels={false} />));
    expect(screen.queryByText('Home')).not.toBeOnTheScreen();
  });

  it('exposes the space the floating pill needs behind the content', () => {
    expect(NAVIGATION_BAR_FLOATING_HEIGHT).toBe(64);
    expect(navigationBarFloatingOffset()).toBe(76);
    expect(navigationBarFloatingOffset(34)).toBe(110);
  });

  describe('variant="floating"', () => {
    it('renders a centered pill instead of a full-width bar', () => {
      render(
        withProvider(<NavigationBar testID="bar" variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />)
      );
      expect(StyleSheet.flatten(screen.getByTestId('bar-overlay').props.style).position).toBe('absolute');
      const barStyle = StyleSheet.flatten(screen.getByTestId('bar').props.style);
      expect(barStyle.borderRadius).toBe(9999);
      expect(barStyle.height).toBe(64);
    });

    it('shows the active label only, keeping every tab accessible by name', () => {
      render(withProvider(<NavigationBar variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />));
      expect(screen.getByText('Home')).toBeOnTheScreen();
      expect(screen.queryByText('Search')).not.toBeOnTheScreen();
      expect(screen.getByRole('tab', { name: 'Search' })).toBeOnTheScreen();
    });

    it('keeps the indicator inside the pill and applies the inset to the row once', () => {
      render(
        <UIProvider mode="light" insets={{ top: 0, right: 0, bottom: 34, left: 0 }}>
          <NavigationBar testID="bar" variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />
        </UIProvider>
      );
      fireEvent(screen.getByTestId('bar'), 'layout', {
        nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
      });
      expect(StyleSheet.flatten(screen.getByTestId('navigation-bar-indicator').props.style).bottom).toBe(8);
      expect(StyleSheet.flatten(screen.getByTestId('bar-row').props.style).paddingBottom).toBe(46);
    });

    it('reserves the label row on inactive tabs so the icon does not jump', () => {
      render(withProvider(<NavigationBar variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />));
      expect(screen.getAllByTestId('navigation-bar-label-slot')).toHaveLength(ITEMS.length - 1);
      expect(screen.getByText('Home')).toBeOnTheScreen();
    });

    it('keeps the indicator centered inside the 1pt dark border', () => {
      render(
        <UIProvider mode="dark" insets={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <NavigationBar testID="bar" variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />
        </UIProvider>
      );
      fireEvent(screen.getByTestId('bar'), 'layout', {
        nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
      });
      const indicator = StyleSheet.flatten(screen.getByTestId('navigation-bar-indicator').props.style);
      expect(indicator.width).toBeCloseTo((390 - 8 - 2) / ITEMS.length - 8);
    });

    it('ignores position and applies overlayStyle to the overlay', () => {
      render(
        withProvider(
          <NavigationBar
            testID="bar"
            variant="floating"
            position="top"
            items={ITEMS}
            activeKey="home"
            onChange={() => {}}
            overlayStyle={{ bottom: 20 }}
          />
        )
      );
      expect(StyleSheet.flatten(screen.getByTestId('bar-overlay').props.style).bottom).toBe(20);
    });

    it('centers the tab content vertically inside the fixed-height pill', () => {
      render(withProvider(<NavigationBar variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />));
      for (const tab of screen.getAllByRole('tab')) {
        expect(StyleSheet.flatten(tab.props.style).justifyContent).toBe('center');
      }
    });

    it('adds no action button to the pill', () => {
      render(withProvider(<NavigationBar variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} />));
      expect(screen.queryByRole('button')).not.toBeOnTheScreen();
      expect(screen.getAllByRole('tab')).toHaveLength(ITEMS.length);
    });

    it('caps the width when maxWidth is passed', () => {
      render(
        withProvider(
          <NavigationBar testID="bar" variant="floating" items={ITEMS} activeKey="home" onChange={() => {}} maxWidth={420} />
        )
      );
      expect(StyleSheet.flatten(screen.getByTestId('bar-row').props.style).maxWidth).toBe(420);
    });
  });
});
