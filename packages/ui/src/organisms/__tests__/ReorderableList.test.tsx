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

// El gesto real de PanResponder depende del ResponderTouchHistoryStore que
// llena React Native al despachar eventos táctiles nativos: no hay forma
// confiable de simularlo invocando los handlers a mano en jest. Por eso el
// cálculo de reordenamiento vive en `move()`, exportada aparte y testeada
// como función pura; acá sólo se cubre lo que sí es observable sin gestos.
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

  // El scroll padre pide el responder apenas su gesto vertical arranca (en iOS
  // el UIScrollView además cancela los toques del contenido). Ceder ahí mata
  // el arrastre a los pocos píxeles: la fila tiene que negarse.
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

  // Sin este par de callbacks el consumidor no puede apagar el scroll que
  // envuelve a la lista, que es lo único que hace viable el arrastre en iOS.
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
    // PanResponder lee el centroide del touchHistory que llena el sistema de
    // eventos nativo; acá se pasa uno mínimo pero con la forma real.
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
});
