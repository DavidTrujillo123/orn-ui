import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { OptionWheel, type OptionWheelOption } from '../OptionWheel';

const SIZES: OptionWheelOption<string>[] = [
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm' },
  { label: 'Large', value: 'l' },
  { label: 'X-Large', value: 'xl' },
];

const ITEM_HEIGHT = 44;

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

/** Deja la rueda quieta en `y`, como al final de la inercia. */
function settleAt(y: number, event: 'momentumScrollEnd' | 'scrollEndDrag' = 'momentumScrollEnd') {
  fireEvent(screen.getByTestId('wheel-scroll'), event, {
    nativeEvent: { contentOffset: { y } },
  });
}

describe('OptionWheel', () => {
  // El efecto que centra la selección usa scrollTo, que agenda trabajo.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('renders every option', () => {
    render(withProvider(<OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} testID="wheel" />));
    for (const option of SIZES) expect(screen.getByText(option.label)).toBeOnTheScreen();
  });

  it('pushes the offset into the animated value when it jumps without animating', () => {
    // El salto sin animar no siempre emite `onScroll`, y de ahí sale el
    // progreso que apaga y achica las filas: sin empujarlo a mano la rueda
    // aparece con la fila centrada tan tenue como las de los bordes.
    const setValue = jest.spyOn(Animated.Value.prototype, 'setValue');
    render(withProvider(<OptionWheel options={SIZES} selectedValue="xl" onSelect={jest.fn()} testID="wheel" />));

    expect(setValue).toHaveBeenCalledWith(3 * ITEM_HEIGHT);
    setValue.mockRestore();
  });

  it('re-centres the selection once the layout arrives', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="l" onSelect={onSelect} testID="wheel" />));

    // El primer render no sabe el alto todavía; el layout es el momento en el
    // que la rueda puede ponerse en su valor sin animar hasta él.
    fireEvent(screen.getByTestId('wheel-scroll'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 5 * ITEM_HEIGHT } },
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reports the option left in the centre', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="m" onSelect={onSelect} testID="wheel" />));

    settleAt(2 * ITEM_HEIGHT);
    expect(onSelect).toHaveBeenCalledWith('l');
  });

  it('also reports at the end of the drag, for Android drags with no momentum', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="m" onSelect={onSelect} testID="wheel" />));

    settleAt(3 * ITEM_HEIGHT, 'scrollEndDrag');
    expect(onSelect).toHaveBeenCalledWith('xl');
  });

  it('stays quiet when the centre is already the selected option', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="m" onSelect={onSelect} testID="wheel" />));

    settleAt(ITEM_HEIGHT);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('snaps to the nearest row even when the scroll stops between two', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="s" onSelect={onSelect} testID="wheel" />));

    // 60px: más cerca de la fila 1 (44) que de la 2 (88).
    settleAt(60);
    expect(onSelect).toHaveBeenCalledWith('m');
  });

  it('clamps an overscroll past the last row', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={SIZES} selectedValue="s" onSelect={onSelect} testID="wheel" />));

    settleAt(40 * ITEM_HEIGHT);
    expect(onSelect).toHaveBeenCalledWith('xl');
  });

  it('refuses to settle on a disabled option and picks the nearest enabled one', () => {
    const onSelect = jest.fn();
    const options: OptionWheelOption<string>[] = [
      { label: 'Small', value: 's' },
      { label: 'Medium', value: 'm', disabled: true },
      { label: 'Large', value: 'l' },
    ];
    render(withProvider(<OptionWheel options={options} selectedValue="s" onSelect={onSelect} testID="wheel" />));

    settleAt(ITEM_HEIGHT);
    expect(onSelect).toHaveBeenCalledWith('l');
  });

  it('says nothing when every option is disabled', () => {
    const onSelect = jest.fn();
    const options: OptionWheelOption<string>[] = [
      { label: 'Small', value: 's', disabled: true },
      { label: 'Medium', value: 'm', disabled: true },
    ];
    render(withProvider(<OptionWheel options={options} selectedValue={undefined} onSelect={onSelect} testID="wheel" />));

    settleAt(0);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('survives an empty list', () => {
    const onSelect = jest.fn();
    render(withProvider(<OptionWheel options={[]} selectedValue={undefined} onSelect={onSelect} testID="wheel" />));

    settleAt(0);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('forces an odd number of rows, so one of them is the centre', () => {
    const { rerender } = render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} visibleCount={4} testID="wheel" />
      )
    );
    // 4 pedidas -> 5 filas: con un número par no hay fila central que alinear
    // con la ventana.
    expect(screen.getByTestId('wheel-viewport')).toHaveStyle({ height: 5 * ITEM_HEIGHT });

    rerender(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} visibleCount={3} testID="wheel" />
      )
    );
    expect(screen.getByTestId('wheel-viewport')).toHaveStyle({ height: 3 * ITEM_HEIGHT });
  });

  it('announces itself as adjustable, with the selected label as its value', () => {
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="l" onSelect={jest.fn()} label="Size" testID="wheel" />
      )
    );

    const wheel = screen.getByLabelText('Size');
    expect(wheel).toHaveProp('accessibilityRole', 'adjustable');
    expect(wheel).toHaveProp('accessibilityValue', { text: 'Large' });
  });

  it('increment and decrement walk the options', () => {
    const onSelect = jest.fn();
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={onSelect} label="Size" testID="wheel" />
      )
    );

    const wheel = screen.getByLabelText('Size');
    fireEvent(wheel, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onSelect).toHaveBeenCalledWith('l');

    fireEvent(wheel, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onSelect).toHaveBeenCalledWith('s');
  });

  it('increment at the last option does nothing', () => {
    const onSelect = jest.fn();
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="xl" onSelect={onSelect} label="Size" testID="wheel" />
      )
    );

    fireEvent(screen.getByLabelText('Size'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled blocks the scroll and the accessibility actions', () => {
    const onSelect = jest.fn();
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={onSelect} label="Size" disabled testID="wheel" />
      )
    );

    expect(screen.getByTestId('wheel-scroll')).toHaveProp('scrollEnabled', false);
    fireEvent(screen.getByLabelText('Size'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('a value that is not in the options leaves the wheel uncommitted', () => {
    const onSelect = jest.fn();
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="xxl" onSelect={onSelect} label="Size" testID="wheel" />
      )
    );

    expect(screen.getByLabelText('Size')).toHaveProp('accessibilityValue', { text: undefined });
    fireEvent(screen.getByLabelText('Size'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the unit next to the selected row only', () => {
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} unit="EU" testID="wheel" />
      )
    );
    expect(screen.getAllByText('EU')).toHaveLength(1);
  });

  it("variant='spotlight' drops the centre band and smears the rows that are not picked", () => {
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} variant="spotlight" testID="wheel" />
      )
    );

    // Dos copias corridas por fila, más el texto real: sin desenfoque nativo,
    // la superposición es lo que emborrona la fila que no está elegida.
    expect(screen.getAllByText('Medium')).toHaveLength(3);
  });

  it("variant='window' keeps a single copy of each label", () => {
    render(withProvider(<OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} testID="wheel" />));
    expect(screen.getAllByText('Medium')).toHaveLength(1);
  });

  it('perspective={false} drops the tilt', () => {
    render(
      withProvider(
        <OptionWheel options={SIZES} selectedValue="m" onSelect={jest.fn()} perspective={false} testID="wheel" />
      )
    );
    expect(screen.getByTestId('wheel-item-0')).toBeTruthy();
  });
});
