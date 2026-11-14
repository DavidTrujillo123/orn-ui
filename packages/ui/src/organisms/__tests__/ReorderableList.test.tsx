import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { ReorderableList, move } from '../ReorderableList';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const ITEM_HEIGHT = 50;

// The real PanResponder gesture depends on the ResponderTouchHistoryStore that
// React Native fills when dispatching native touch events: there is no
// reliable way to simulate it by invoking the handlers by hand in jest. That's
// why the reorder calculation lives in `move()`, exported separately and tested
// as a pure function; here we only cover what is observable without gestures.
describe('move', () => {
  it('moves an item forward, shifting the ones in between back', () => {
    expect(move(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward, shifting the ones in between forward', () => {
    expect(move(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c'];
    move(original, 0, 2);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});

describe('ReorderableList', () => {
  it('renders every item in order', () => {
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          itemHeight={ITEM_HEIGHT}
          keyExtractor={(i) => i.id}
          onReorder={() => {}}
          renderItem={(item) => <Text testID={`row-${item.id}`}>{item.id}</Text>}
        />
      )
    );
    expect(screen.getByTestId('row-a')).toBeOnTheScreen();
    expect(screen.getByTestId('row-b')).toBeOnTheScreen();
    expect(screen.getByTestId('row-c')).toBeOnTheScreen();
  });

  it('attaches drag responders to each row by default', () => {
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          itemHeight={ITEM_HEIGHT}
          keyExtractor={(i) => i.id}
          onReorder={() => {}}
          renderItem={(item) => <Text testID={`row-${item.id}`}>{item.id}</Text>}
        />
      )
    );
    const row = screen.getByTestId('row-a').parent!.parent!;
    expect(row.props.onStartShouldSetResponder({})).toBe(true);
  });

  it('does not attach drag responders when disabled', () => {
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          itemHeight={ITEM_HEIGHT}
          disabled
          keyExtractor={(i) => i.id}
          onReorder={() => {}}
          renderItem={(item) => <Text testID={`row-${item.id}`}>{item.id}</Text>}
        />
      )
    );
    const row = screen.getByTestId('row-a').parent!.parent!;
    expect(row.props.onStartShouldSetResponder({})).toBe(false);
  });

  // The parent scroll requests the responder as soon as its vertical gesture
  // starts (on iOS the UIScrollView also cancels the content's touches).
  // Yielding there kills the drag after a few pixels: the row has to refuse.
  it('refuses to hand the responder back to a parent scroll mid-drag', () => {
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          itemHeight={ITEM_HEIGHT}
          keyExtractor={(i) => i.id}
          onReorder={() => {}}
          renderItem={(item) => <Text testID={`row-${item.id}`}>{item.id}</Text>}
        />
      )
    );
    const row = screen.getByTestId('row-a').parent!.parent!;
    expect(row.props.onResponderTerminationRequest({})).toBe(false);
  });

  // Without this pair of callbacks the consumer can't turn off the scroll
  // wrapping the list, which is the only thing that makes dragging viable on iOS.
  it('reports drag start and end so the parent scroll can be locked', () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          itemHeight={ITEM_HEIGHT}
          keyExtractor={(i) => i.id}
          onReorder={() => {}}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          renderItem={(item) => <Text testID={`row-${item.id}`}>{item.id}</Text>}
        />
      )
    );
    const row = screen.getByTestId('row-b').parent!.parent!;
    // PanResponder reads the centroid from the touchHistory filled by the
    // native event system; here we pass a minimal one with the real shape.
    const event = {
      nativeEvent: { changedTouches: [], identifier: 1, target: 1, timestamp: 0, touches: [] },
      touchHistory: {
        indexOfSingleActiveTouch: 0,
        mostRecentTimeStamp: 0,
        numberActiveTouches: 1,
        touchBank: [{ currentPageX: 0, currentPageY: 0, currentTimeStamp: 0, touchActive: true }],
      },
    };

    act(() => row.props.onResponderGrant(event));
    expect(onDragStart).toHaveBeenCalledWith(1);
    expect(onDragEnd).not.toHaveBeenCalled();

    act(() => row.props.onResponderRelease(event));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('offers Move up / Move down to screen readers, which reorder like a drop', () => {
    const onReorder = jest.fn();
    render(
      withProvider(
        <ReorderableList
          data={ITEMS}
          keyExtractor={(item) => item.id}
          itemHeight={ITEM_HEIGHT}
          renderItem={(item) => <Text>{item.id}</Text>}
          onReorder={onReorder}
        />
      )
    );
    const rows = screen.UNSAFE_root.findAll(
      (n) => typeof n.type === 'string' && Array.isArray(n.props.accessibilityActions) && !!n.props.onAccessibilityAction
    );
    const names = (row: (typeof rows)[number]) => row.props.accessibilityActions.map((a: { name: string }) => a.name);
    // The first row can't go up, the last can't go down.
    expect(names(rows[0]!)).toEqual(['moveDown']);
    expect(names(rows[2]!)).toEqual(['moveUp']);
    expect(rows[1]!.props.accessibilityActions.map((a: { label: string }) => a.label)).toEqual(['Move up', 'Move down']);
    act(() => rows[1]!.props.onAccessibilityAction({ nativeEvent: { actionName: 'moveUp' } }));
    expect(onReorder).toHaveBeenCalledWith([{ id: 'b' }, { id: 'a' }, { id: 'c' }]);
  });
});
