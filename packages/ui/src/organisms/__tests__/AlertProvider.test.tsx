import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { AlertProvider, useAlert, showAlert, showConfirm, hideAlert } from '../AlertProvider';

function withProvider(children: React.ReactNode) {
  return (
    <UIProvider mode="light">
      <AlertProvider>{children}</AlertProvider>
    </UIProvider>
  );
}

describe('useAlert', () => {
  it('throws when used outside AlertProvider', () => {
    function Bare() {
      useAlert();
      return null;
    }
    expect(() =>
      render(
        <UIProvider mode="light">
          <Bare />
        </UIProvider>
      )
    ).toThrow(/AlertProvider/);
  });

  it('alert() shows the dialog and resolves when the OK button is pressed', async () => {
    let resolved = false;
    function Trigger() {
      const { alert } = useAlert();
      return (
        <TouchableOpacity onPress={() => alert({ title: 'Saved' }).then(() => (resolved = true))}>
          <Text>trigger</Text>
        </TouchableOpacity>
      );
    }
    render(withProvider(<Trigger />));
    fireEvent.press(screen.getByText('trigger'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByText('OK'));
    });
    expect(resolved).toBe(true);
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('confirm() with destructive:true resolves true when confirmed', async () => {
    let result: boolean | undefined;
    function Trigger() {
      const { confirm } = useAlert();
      return (
        <TouchableOpacity
          onPress={() => confirm({ title: 'Delete?', destructive: true }).then((v) => (result = v))}
        >
          <Text>trigger</Text>
        </TouchableOpacity>
      );
    }
    render(withProvider(<Trigger />));
    fireEvent.press(screen.getByText('trigger'));
    await act(async () => {
      fireEvent.press(screen.getByText('OK'));
    });
    expect(result).toBe(true);
  });

  it('hide() dismisses the dialog directly', async () => {
    function Trigger() {
      const { alert, hide } = useAlert();
      return (
        <>
          <TouchableOpacity onPress={() => alert({ title: 'Saved' })}>
            <Text>trigger</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={hide}>
            <Text>hide</Text>
          </TouchableOpacity>
        </>
      );
    }
    render(withProvider(<Trigger />));
    fireEvent.press(screen.getByText('trigger'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByText('hide'));
    });
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('confirm() resolves true on confirm and false on cancel', async () => {
    let result: boolean | undefined;
    function Trigger() {
      const { confirm } = useAlert();
      return (
        <TouchableOpacity onPress={() => confirm({ title: 'Delete?' }).then((v) => (result = v))}>
          <Text>trigger</Text>
        </TouchableOpacity>
      );
    }
    render(withProvider(<Trigger />));
    fireEvent.press(screen.getByText('trigger'));
    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    expect(result).toBe(false);
  });
});

describe('showAlert / showConfirm (imperative, outside React)', () => {
  it('opens an alert without a hook or a component', async () => {
    render(withProvider(<Text>app</Text>));
    let resolved = false;
    act(() => {
      showAlert({ title: 'Saved from a service' }).then(() => {
        resolved = true;
      });
    });
    expect(screen.getByText('Saved from a service')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(resolved).toBe(true));
  });

  it('confirm resolves true or false from the pressed button', async () => {
    render(withProvider(<Text>app</Text>));
    let answer: boolean | undefined;
    act(() => {
      showConfirm({ title: 'Delete?', destructive: true }).then((value) => {
        answer = value;
      });
    });
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(answer).toBe(false));
  });

  it('hideAlert closes the open alert', () => {
    render(withProvider(<Text>app</Text>));
    act(() => {
      showAlert({ title: 'Saved' });
    });
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    act(() => hideAlert());
    expect(screen.queryByText('Saved')).not.toBeOnTheScreen();
  });

  it('resolves right away when no provider is mounted, so an await never hangs', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(showAlert({ title: 'nowhere' })).resolves.toBeUndefined();
    await expect(showConfirm({ title: 'nowhere' })).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('AlertProvider'));
    warn.mockRestore();
  });
});
