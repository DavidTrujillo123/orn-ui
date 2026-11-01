import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Divider } from '../Divider';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <UIProvider mode="light">
        <Divider testID="divider" />
      </UIProvider>
    );
    expect(toJSON()).toBeTruthy();
  });

  const at = (el: React.ReactElement) => render(<UIProvider mode="light">{el}</UIProvider>);

  it('is a full-width 1pt line with no margin by default', () => {
    at(<Divider testID="d" />);
    expect(screen.getByTestId('d', { includeHiddenElements: true })).toHaveStyle({ height: 1, width: '100%', marginVertical: 0 });
  });

  it('spacing adds token-sized air on both sides', () => {
    at(<Divider testID="d" spacing="md" />);
    expect(screen.getByTestId('d', { includeHiddenElements: true })).toHaveStyle({ marginVertical: 12 });
  });

  it('vertical stretches to the row and spaces horizontally', () => {
    at(<Divider testID="d" orientation="vertical" spacing="sm" />);
    expect(screen.getByTestId('d', { includeHiddenElements: true })).toHaveStyle({ width: 1, alignSelf: 'stretch', marginHorizontal: 8 });
  });

  it('is hidden from screen readers (decorative)', () => {
    at(<Divider testID="d" />);
    expect(screen.getByTestId('d', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
  });
});

