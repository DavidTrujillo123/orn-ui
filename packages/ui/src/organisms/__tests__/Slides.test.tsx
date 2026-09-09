import React, { useState } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Slides } from '../Slides';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const WIDTH = 300;
const HEIGHT = 240;

/** Las slides sólo se montan con el tamaño ya medido: sin layout no hay página que dimensionar. */
function layout(testID = 'slides') {
  fireEvent(screen.getByTestId(testID), 'layout', {
    nativeEvent: { layout: { width: WIDTH, height: HEIGHT, x: 0, y: 0 } },
  });
}

function momentumTo(page: number, orientation: 'horizontal' | 'vertical' = 'horizontal') {
  const offset = page * (orientation === 'horizontal' ? WIDTH : HEIGHT);
  fireEvent(screen.getByTestId('slides-scroll'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: orientation === 'horizontal' ? offset : 0, y: orientation === 'horizontal' ? 0 : offset },
      layoutMeasurement: { width: WIDTH, height: HEIGHT },
      contentSize: { width: WIDTH * 3, height: HEIGHT * 3 },
    },
  });
}

function renderSlides(props: Partial<React.ComponentProps<typeof Slides<{ id: string }>>> = {}) {
  const result = render(
    withProvider(
      <Slides
        testID="slides"
        data={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={(item, index) => <Text>{`${item.id}-${index}`}</Text>}
        {...props}
      />
    )
  );
  layout();
  return result;
}

describe('Slides', () => {
  it('renders every slide with its real index once measured', () => {
    renderSlides();
    expect(screen.getByText('a-0')).toBeOnTheScreen();
    expect(screen.getByText('b-1')).toBeOnTheScreen();
    expect(screen.getByText('c-2')).toBeOnTheScreen();
  });

  it('renders nothing until it knows its size', () => {
    render(
      withProvider(
        <Slides testID="slides" data={ITEMS} keyExtractor={(i) => i.id} renderItem={(i) => <Text>{i.id}</Text>} />
      )
    );
    expect(screen.queryByText('a')).not.toBeOnTheScreen();
  });

  it('reports the index reached by a swipe', () => {
    const onIndexChange = jest.fn();
    renderSlides({ onIndexChange });
    momentumTo(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('does not report the same index twice', () => {
    const onIndexChange = jest.fn();
    renderSlides({ onIndexChange });
    momentumTo(1);
    momentumTo(1);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it('scrolls vertically when the orientation is vertical', () => {
    const onIndexChange = jest.fn();
    renderSlides({ orientation: 'vertical', onIndexChange });
    expect(screen.getByTestId('slides-scroll').props.horizontal).toBe(false);
    momentumTo(2, 'vertical');
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  describe('indicators', () => {
    it('renders one dot per slide and marks the active one', () => {
      renderSlides();
      expect(screen.getByTestId('slides-dot-0')).toBeOnTheScreen();
      expect(screen.getByTestId('slides-dot-2')).toBeOnTheScreen();
      expect(screen.getByTestId('slides-dot-0')).toHaveStyle({ width: 20 });
      expect(screen.getByTestId('slides-dot-1')).toHaveStyle({ width: 8 });
    });

    it('numbers each indicator when asked to', () => {
      renderSlides({ indicators: 'numbers' });
      expect(screen.getByText('1')).toBeOnTheScreen();
      expect(screen.getByText('3')).toBeOnTheScreen();
      expect(screen.queryByTestId('slides-dot-0')).not.toBeOnTheScreen();
    });

    it('keeps numbering readable outside the slide too', () => {
      renderSlides({ indicators: 'numbers', indicatorPlacement: 'outside' });
      expect(screen.getByText('2')).toBeOnTheScreen();
    });

    it('hides them with indicators="none"', () => {
      renderSlides({ indicators: 'none' });
      expect(screen.queryByTestId('slides-indicators')).not.toBeOnTheScreen();
    });

    it('hides them when there is nothing to navigate between', () => {
      renderSlides({ data: [ITEMS[0] as { id: string }] });
      expect(screen.queryByTestId('slides-indicators')).not.toBeOnTheScreen();
    });

    it('jumps to the tapped slide', () => {
      const onIndexChange = jest.fn();
      renderSlides({ onIndexChange });
      fireEvent.press(screen.getByLabelText('Slide 3 of 3'));
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it('places them outside the swipeable area when asked to', () => {
      renderSlides({ indicatorPlacement: 'outside' });
      expect(screen.getByTestId('slides-indicators')).toBeOnTheScreen();
      expect(screen.getByTestId('slides-dot-0')).toBeOnTheScreen();
    });
  });

  describe('loop', () => {
    it('clones the edges so the swipe always lands on a real neighbour', () => {
      renderSlides({ loop: true });
      // 3 slides + clon de la última al principio + clon de la primera al final.
      expect(screen.getAllByText('a-0')).toHaveLength(2);
      expect(screen.getAllByText('c-2')).toHaveLength(2);
    });

    it('maps the head clone back to the last slide', () => {
      const onIndexChange = jest.fn();
      renderSlides({ loop: true, onIndexChange });
      momentumTo(0);
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it('maps the tail clone back to the first slide', () => {
      const onIndexChange = jest.fn();
      renderSlides({ loop: true, defaultIndex: 2, onIndexChange });
      momentumTo(ITEMS.length + 1);
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('reports real indexes for the pages in between', () => {
      const onIndexChange = jest.fn();
      renderSlides({ loop: true, onIndexChange });
      momentumTo(2);
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('does not clone a single slide', () => {
      renderSlides({ loop: true, data: [ITEMS[0] as { id: string }] });
      expect(screen.getAllByText('a-0')).toHaveLength(1);
    });
  });

  describe('autoPlay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      act(() => jest.runOnlyPendingTimers());
      jest.useRealTimers();
    });

    it('advances on its own', () => {
      const onIndexChange = jest.fn();
      renderSlides({ autoPlay: true, interval: 1000, onIndexChange });
      act(() => jest.advanceTimersByTime(1000));
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('stays put when it is off', () => {
      const onIndexChange = jest.fn();
      renderSlides({ interval: 1000, onIndexChange });
      act(() => jest.advanceTimersByTime(5000));
      expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('stops at the last slide when it is finite', () => {
      const onIndexChange = jest.fn();
      renderSlides({ autoPlay: true, interval: 1000, defaultIndex: 2, onIndexChange });
      act(() => jest.advanceTimersByTime(3000));
      expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('goes through the tail clone instead of rewinding when it loops', () => {
      const onIndexChange = jest.fn();
      renderSlides({ autoPlay: true, loop: true, interval: 1000, defaultIndex: 2, onIndexChange });
      act(() => jest.advanceTimersByTime(1000));
      // El índice recién cambia cuando el scroll a la clon termina.
      expect(onIndexChange).not.toHaveBeenCalled();
      momentumTo(ITEMS.length + 1);
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('pauses while the finger is dragging', () => {
      const onIndexChange = jest.fn();
      renderSlides({ autoPlay: true, interval: 1000, onIndexChange });
      fireEvent(screen.getByTestId('slides-scroll'), 'scrollBeginDrag', { nativeEvent: {} });
      act(() => jest.advanceTimersByTime(3000));
      expect(onIndexChange).not.toHaveBeenCalled();

      fireEvent(screen.getByTestId('slides-scroll'), 'scrollEndDrag', { nativeEvent: {} });
      act(() => jest.advanceTimersByTime(1000));
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });
  });

  describe('background', () => {
    it('paints a flat color when it gets a string', () => {
      renderSlides({ background: () => '#101014' });
      expect(JSON.stringify(screen.toJSON())).toContain('#101014');
    });

    it('paints a gradient when it gets several colors', () => {
      renderSlides({ background: (_item, index) => (index === 0 ? ['#004cef', '#00cae1'] : undefined) });
      expect(JSON.stringify(screen.toJSON())).toContain('#00cae1');
    });
  });

  describe('controlled index', () => {
    it('follows the prop instead of its own state', () => {
      function Controlled() {
        const [index, setIndex] = useState(0);
        return (
          <>
            <Text onPress={() => setIndex(2)}>go</Text>
            <Slides
              testID="slides"
              data={ITEMS}
              index={index}
              keyExtractor={(item) => item.id}
              renderItem={(item) => <Text>{item.id}</Text>}
            />
          </>
        );
      }
      render(withProvider(<Controlled />));
      layout();
      expect(screen.getByTestId('slides-dot-0')).toHaveStyle({ width: 20 });
      fireEvent.press(screen.getByText('go'));
      expect(screen.getByTestId('slides-dot-2')).toHaveStyle({ width: 20 });
    });

    it('clamps an out-of-range index', () => {
      renderSlides({ index: 99 });
      expect(screen.getByTestId('slides-dot-2')).toHaveStyle({ width: 20 });
    });
  });

  it('locks the swipe when asked to', () => {
    renderSlides({ swipeEnabled: false });
    expect(screen.getByTestId('slides-scroll').props.scrollEnabled).toBe(false);
  });

  it('survives an empty data array', () => {
    renderSlides({ data: [] });
    expect(screen.queryByTestId('slides-indicators')).not.toBeOnTheScreen();
  });
});
