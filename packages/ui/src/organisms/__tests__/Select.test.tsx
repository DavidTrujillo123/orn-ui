import React from 'react';
import { Keyboard, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Select } from '../Select';

const OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Select', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    expect(screen.getByText('Select...')).toBeOnTheScreen();
  });

  it('shows the label of the selected option', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue="cash" onSelect={() => {}} />));
    expect(screen.getByText('Cash')).toBeOnTheScreen();
  });

  it('opens the option list on press and closes after selecting', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
    expect(screen.getByRole('radio', { name: 'Card' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Card' }));
    expect(screen.queryByRole('radio', { name: 'Card' })).not.toBeOnTheScreen();
  });

  it('calls onSelect with the chosen value', () => {
    const onSelect = jest.fn();
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={onSelect} />));
    fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Card' }));
    expect(onSelect).toHaveBeenCalledWith('card');
  });

  it('marks the active option as selected', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue="card" onSelect={() => {}} />));
    fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
    expect(screen.getByRole('radio', { name: 'Card' }).props.accessibilityState.selected).toBe(true);
  });

  it('disables opening while isLoading', () => {
    render(
      withProvider(
        <Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} isLoading />
      )
    );
    fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
    expect(screen.queryByRole('radio', { name: 'Card' })).not.toBeOnTheScreen();
  });

  it('shows a required marker when required is set', () => {
    render(withProvider(<Select label="Payment" required options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    expect(screen.getByText(/\*/)).toBeOnTheScreen();
  });

  it('falls back to the placeholder prop for the accessibility label when there is no label', () => {
    render(
      withProvider(
        <Select options={OPTIONS} selectedValue={undefined} onSelect={() => {}} placeholder="Choose one" />
      )
    );
    expect(screen.getByRole('combobox', { name: 'Choose one' })).toBeOnTheScreen();
  });

  it('shows the error message', () => {
    render(
      withProvider(
        <Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} error="Required" />
      )
    );
    expect(screen.getByText('Required')).toBeOnTheScreen();
  });

  describe('leading visuals', () => {
    const RICH = [
      { label: 'Cash', value: 'cash', emoji: '💵' },
      { label: 'Card', value: 'card', iconName: 'check' as const },
      { label: 'Transfer', value: 'transfer', emoji: '🏦', iconName: 'info' as const },
      { label: 'Crypto', value: 'crypto', disabled: true },
    ];

    it('shows the emoji of the selected option in the field', () => {
      render(withProvider(<Select label="Payment" options={RICH} selectedValue="cash" onSelect={() => {}} />));
      expect(screen.getByText('💵')).toBeOnTheScreen();
    });

    it('shows emojis in the open list', () => {
      render(withProvider(<Select label="Payment" options={RICH} selectedValue={undefined} onSelect={() => {}} />));
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      expect(screen.getByText('💵')).toBeOnTheScreen();
      expect(screen.getByText('🏦')).toBeOnTheScreen();
    });

    it('the emoji wins over the icon when both are given', () => {
      render(withProvider(<Select label="Payment" options={RICH} selectedValue="transfer" onSelect={() => {}} />));
      expect(screen.getByText('🏦')).toBeOnTheScreen();
    });

    it('a disabled option cannot be picked', () => {
      const onSelect = jest.fn();
      render(withProvider(<Select label="Payment" options={RICH} selectedValue={undefined} onSelect={onSelect} />));
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      fireEvent.press(screen.getByRole('radio', { name: 'Crypto' }));
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('radio', { name: 'Crypto' })).toBeDisabled();
    });
  });

  describe('dropdown behaviour', () => {
    const MANY = Array.from({ length: 20 }, (_, i) => ({ label: `Option ${i + 1}`, value: `o${i + 1}` }));

    it('closes when the backdrop is tapped, without selecting', () => {
      const onSelect = jest.fn();
      render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={onSelect} />));
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      fireEvent.press(screen.getByTestId('select-backdrop'));
      expect(screen.queryByRole('radio', { name: 'Card' })).not.toBeOnTheScreen();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('reports open and close through onOpenChange', () => {
      const onOpenChange = jest.fn();
      render(
        withProvider(
          <Select
            label="Payment"
            options={OPTIONS}
            selectedValue={undefined}
            onSelect={() => {}}
            onOpenChange={onOpenChange}
          />
        )
      );
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      fireEvent.press(screen.getByTestId('select-backdrop'));
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('scrolls a long list instead of growing past the screen', () => {
      const { UNSAFE_getByType } = render(
        withProvider(<Select label="Payment" options={MANY} selectedValue={undefined} onSelect={() => {}} />)
      );
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
      expect(screen.getAllByRole('radio')).toHaveLength(20);
    });

    it('searchable filters the options and says when nothing matches', () => {
      render(
        withProvider(
          <Select label="Payment" searchable options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />
        )
      );
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));

      fireEvent.changeText(screen.getByLabelText('Search...'), 'ca');
      expect(screen.getByRole('radio', { name: 'Card' })).toBeOnTheScreen();
      expect(screen.queryByRole('radio', { name: 'Cash' })).toBeOnTheScreen();

      fireEvent.changeText(screen.getByLabelText('Search...'), 'zzz');
      expect(screen.queryByRole('radio')).not.toBeOnTheScreen();
      expect(screen.getByText('No results found')).toBeOnTheScreen();
    });

    it('has no search box unless asked', () => {
      render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
      fireEvent.press(screen.getByRole('combobox', { name: 'Payment' }));
      expect(screen.queryByLabelText('Search...')).not.toBeOnTheScreen();
    });

    it('disabled does not open and announces itself', () => {
      render(
        withProvider(<Select label="Payment" disabled options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />)
      );
      const field = screen.getByRole('combobox', { name: 'Payment' });
      expect(field).toBeDisabled();
      fireEvent.press(field);
      expect(screen.queryByRole('radio', { name: 'Card' })).not.toBeOnTheScreen();
    });


    it('flips above the field when the keyboard eats the space below', () => {
      const handlers: Record<string, (e?: unknown) => void> = {};
      const addListener = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
        handlers[event] = handler as (e?: unknown) => void;
        return { remove: jest.fn() } as never;
      });
      // measureInWindow no responde en tests: se ancla a mano bajo la mitad de
      // la pantalla, que es donde el teclado decide la dirección.
      jest
        .spyOn(View.prototype, 'measureInWindow')
        .mockImplementation((cb) => cb(16, 900, 300, 50));

      render(
        withProvider(
          <Select label="Country" searchable options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />
        )
      );
      fireEvent.press(screen.getByRole('combobox', { name: 'Country' }));

      const styleOf = () => StyleSheet.flatten(screen.getByTestId('select-list').props.style) as ViewStyle;
      expect(styleOf().top).toBe(958);

      act(() => handlers.keyboardWillShow?.({ endCoordinates: { height: 336 } }));
      expect(styleOf().top).toBeUndefined();
      expect(styleOf().bottom).toBeGreaterThan(0);

      addListener.mockRestore();
      jest.restoreAllMocks();
    });

    it('announces the selected option as the field value', () => {
      render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue="card" onSelect={() => {}} />));
      expect(screen.getByRole('combobox', { name: 'Payment' }).props.accessibilityValue).toEqual({ text: 'Card' });
    });
  });
});
