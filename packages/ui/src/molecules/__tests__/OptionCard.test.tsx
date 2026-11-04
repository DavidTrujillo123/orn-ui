import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { OptionCard } from '../OptionCard';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('OptionCard', () => {
  it('announces itself as a radio, not a button', () => {
    render(withProvider(<OptionCard label="Cash" iconName="check" isSelected onPress={() => {}} />));
    expect(screen.getByRole('radio', { name: 'Cash' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Cash' })).not.toBeOnTheScreen();
  });

  it('reflects isSelected in the accessibility state', () => {
    render(withProvider(<OptionCard label="Cash" iconName="check" isSelected onPress={() => {}} />));
    const state = screen.getByRole('radio', { name: 'Cash' }).props.accessibilityState;
    expect(state.selected).toBe(true);
    expect(state.checked).toBe(true);
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    render(withProvider(<OptionCard label="Cash" iconName="check" isSelected={false} onPress={onPress} />));
    fireEvent.press(screen.getByRole('radio', { name: 'Cash' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without an icon', () => {
    render(withProvider(<OptionCard label="Cash" isSelected={false} onPress={() => {}} />));
    expect(screen.getByRole('radio', { name: 'Cash' })).toBeOnTheScreen();
  });

  it('reads the description as part of the name, not as a hint users can turn off', () => {
    render(
      withProvider(
        <OptionCard label="Standard" description="Arrives in 3 days" isSelected={false} onPress={() => {}} />
      )
    );
    expect(screen.getByText('Arrives in 3 days')).toBeOnTheScreen();
    const radio = screen.getByRole('radio', { name: 'Standard, Arrives in 3 days' });
    expect(radio.props.accessibilityHint).toBeUndefined();
  });

  it('keeps unselected labels in the text color and highlights only the selected one', () => {
    render(
      withProvider(
        <>
          <OptionCard label="Cash" isSelected onPress={() => {}} />
          <OptionCard label="Card" isSelected={false} onPress={() => {}} />
        </>
      )
    );
    expect(screen.getByText('Card')).toHaveStyle({ color: '#333333' });
    expect(screen.getByText('Cash')).not.toHaveStyle({ color: '#333333' });
  });

  it('the thicker selected border gives its width back in padding, so content does not shift', () => {
    const { rerender } = render(
      withProvider(<OptionCard label="Cash" isSelected={false} onPress={() => {}} testID="card" />)
    );
    const flat = (s: unknown) => Object.assign({}, ...[s].flat(Infinity).filter(Boolean));
    const off = flat(screen.getByTestId('card').props.style);
    rerender(withProvider(<OptionCard label="Cash" isSelected onPress={() => {}} testID="card" />));
    const on = flat(screen.getByTestId('card').props.style);
    expect(on.borderWidth + on.padding).toBe(off.borderWidth + off.padding);
  });

  it('disabled blocks the press and says so', () => {
    const onPress = jest.fn();
    render(withProvider(<OptionCard label="Cash" isSelected={false} disabled onPress={onPress} />));
    fireEvent.press(screen.getByRole('radio', { name: 'Cash' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Cash' })).toBeDisabled();
  });

  it.each(['horizontal', 'vertical'] as const)('%s shares the row instead of claiming a fixed width', (layout) => {
    render(
      withProvider(<OptionCard label="Cash" layout={layout} isSelected={false} onPress={() => {}} testID="card" />)
    );
    const style = screen.getByTestId('card').props.style as { flex?: number; width?: unknown };
    expect(style.flex).toBe(1);
    expect(style.width).toBeUndefined();
  });

  it('an explicit style wins over the layout default', () => {
    render(
      withProvider(
        <OptionCard label="Cash" isSelected={false} onPress={() => {}} style={{ flex: 0 }} testID="card" />
      )
    );
    expect(screen.getByTestId('card')).toHaveStyle({ flex: 0 });
  });
});
