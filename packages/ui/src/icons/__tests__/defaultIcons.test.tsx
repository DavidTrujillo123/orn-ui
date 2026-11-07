import React from 'react';
import { render } from '@testing-library/react-native';
import { renderDefaultIcon, BUILT_IN_ICON_NAMES, onColor } from '../defaultIcons';

const ALL_NAMES = BUILT_IN_ICON_NAMES;

describe('renderDefaultIcon', () => {
  it.each(ALL_NAMES)('renders %s without throwing', (name) => {
    const { toJSON } = render(<>{renderDefaultIcon(name, { size: 20, color: '#000' })}</>);
    expect(toJSON()).toBeTruthy();
  });

  it('lists all 26 built-in glyphs once', () => {
    expect(ALL_NAMES).toHaveLength(26);
    expect(new Set(ALL_NAMES).size).toBe(26);
  });

  it('renders nothing for an unknown name and warns once in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(renderDefaultIcon('calendar', { size: 20, color: '#000' })).toBeNull();
    renderDefaultIcon('calendar', { size: 20, color: '#000' });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it.each([
    ['#d32f2f', '#fff'],
    ['#ffcdd2', '#000'],
    ['#fff', '#000'],
    ['#1e1e1e', '#fff'],
    ['rgb(0,0,0)', '#fff'],
  ])('onColor(%s) picks %s for the glyph inside a filled icon', (fill, expected) => {
    expect(onColor(fill)).toBe(expected);
  });
});

