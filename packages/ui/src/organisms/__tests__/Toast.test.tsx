import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Toast } from '../Toast';
import { ToastProvider, useToast, showToast, hideAllToasts, hideToast } from '../ToastProvider';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

function withToastProvider(children: React.ReactNode, props = {}) {
  return (
    <UIProvider mode="light">
      <ToastProvider {...props}>{children}</ToastProvider>
    </UIProvider>
  );
}

describe('Toast', () => {
  it('renders title and message', () => {
    render(withProvider(<Toast title="Saved" message="Invoice #1042" />));
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(screen.getByText('Invoice #1042')).toBeOnTheScreen();
  });

  it('calls onDismiss from the close button', () => {
    const onDismiss = jest.fn();
    render(withProvider(<Toast title="Saved" onDismiss={onDismiss} />));
    fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides the close button when hideCloseButton is set', () => {
    render(withProvider(<Toast title="Saved" onDismiss={() => {}} hideCloseButton />));
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeOnTheScreen();
  });

  it.each(['success', 'error', 'warning', 'info'] as const)('renders the %s variant', (variant) => {
    render(withProvider(<Toast title="X" variant={variant} />));
    expect(screen.getByText('X')).toBeOnTheScreen();
  });
});

describe('useToast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  function Trigger({ options = {} as any, label = 'show' }) {
    const { show, hideAll } = useToast();
    return (
      <>
        <TouchableOpacity onPress={() => show({ title: 'Saved', ...options })}>
          <Text>{label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={hideAll}>
          <Text>hideAll</Text>
        </TouchableOpacity>
      </>
    );
  }

  it('throws when used outside ToastProvider', () => {
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(withProvider(<Bare />))).toThrow(/ToastProvider/);
  });

  it('shows a toast on demand', () => {
    render(withToastProvider(<Trigger />));
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
    fireEvent.press(screen.getByText('show'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();
  });

  it('auto-dismisses after the duration elapses', () => {
    render(withToastProvider(<Trigger options={{ duration: 1000 }} />));
    fireEvent.press(screen.getByText('show'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('does not auto-dismiss when duration is 0', () => {
    render(withToastProvider(<Trigger options={{ duration: 0 }} />));
    fireEvent.press(screen.getByText('show'));
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(screen.getByText('Saved')).toBeOnTheScreen();
  });

  it('drops the oldest toast beyond maxVisible', () => {
    function Multi() {
      const { show } = useToast();
      return (
        <TouchableOpacity
          onPress={() => {
            show({ title: 'first', duration: 0 });
            show({ title: 'second', duration: 0 });
            show({ title: 'third', duration: 0 });
          }}
        >
          <Text>burst</Text>
        </TouchableOpacity>
      );
    }
    render(withToastProvider(<Multi />, { maxVisible: 2 }));
    fireEvent.press(screen.getByText('burst'));
    expect(screen.queryByText('first')).not.toBeOnTheScreen();
    expect(screen.getByText('second')).toBeOnTheScreen();
    expect(screen.getByText('third')).toBeOnTheScreen();
  });

  it('hideAll clears every visible toast', () => {
    render(withToastProvider(<Trigger options={{ duration: 0 }} />));
    fireEvent.press(screen.getByText('show'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('hideAll'));
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('a toast with onPress fires it and closes', () => {
    const onPress = jest.fn();
    render(withToastProvider(<Trigger options={{ duration: 0, onPress }} />));
    fireEvent.press(screen.getByText('show'));
    fireEvent.press(screen.getByRole('button', { name: 'Saved' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('renders the host at the bottom when position="bottom"', () => {
    render(withToastProvider(<Trigger options={{ duration: 0 }} />, { position: 'bottom' }));
    fireEvent.press(screen.getByText('show'));
    expect(screen.getByTestId('toast-host')).toBeOnTheScreen();
  });
});

describe('showToast (imperative, outside React)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('shows a toast without a hook or a component', () => {
    render(withToastProvider(<Text>app</Text>));
    act(() => {
      showToast({ title: 'Saved from a service' });
    });
    expect(screen.getByText('Saved from a service')).toBeOnTheScreen();
  });

  it('hides by id and hides them all', () => {
    render(withToastProvider(<Text>app</Text>, { maxVisible: 3 }));
    let id = '';
    act(() => {
      id = showToast({ title: 'first', duration: 0 });
      showToast({ title: 'second', duration: 0 });
    });

    act(() => hideToast(id));
    expect(screen.queryByText('first')).not.toBeOnTheScreen();
    expect(screen.getByText('second')).toBeOnTheScreen();

    act(() => hideAllToasts());
    expect(screen.queryByText('second')).not.toBeOnTheScreen();
  });

  it('warns and does nothing when no provider is mounted', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(showToast({ title: 'nowhere' })).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ToastProvider'));
    warn.mockRestore();
  });

  it('stops reaching a provider that unmounted', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = render(withToastProvider(<Text>app</Text>));
    unmount();
    expect(showToast({ title: 'nowhere' })).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
