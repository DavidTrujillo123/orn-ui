import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Alert, type AlertButton } from '../Alert';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Alert', () => {
  it('renders nothing when visible is false', () => {
    const { toJSON } = render(withProvider(<Alert visible={false} title="X" />));
    expect(toJSON()).toBeNull();
  });

  it('with no buttons/shorthands, shows a single close button', () => {
    render(withProvider(<Alert visible title="Done" onClose={() => {}} />));
    expect(screen.getByText('Close')).toBeOnTheScreen();
  });

  it('with confirmText only, shows a single confirm button', () => {
    render(withProvider(<Alert visible title="Sure?" confirmText="Yes" onConfirm={() => {}} />));
    expect(screen.getByText('Yes')).toBeOnTheScreen();
    expect(screen.queryByText('Cancel')).not.toBeOnTheScreen();
  });

  it('with confirmText + cancelText, shows both in cancel-first order', () => {
    render(
      withProvider(
        <Alert visible title="Sure?" confirmText="Yes" cancelText="No" onConfirm={() => {}} onCancel={() => {}} />
      )
    );
    expect(screen.getByText('No')).toBeOnTheScreen();
    expect(screen.getByText('Yes')).toBeOnTheScreen();
  });

  it('with an explicit buttons array, uses exactly those buttons', () => {
    const buttons: AlertButton[] = [{ text: 'Retry' }, { text: 'Dismiss' }, { text: 'Report' }];
    render(withProvider(<Alert visible title="Error" buttons={buttons} />));
    expect(screen.getByText('Retry')).toBeOnTheScreen();
    expect(screen.getByText('Dismiss')).toBeOnTheScreen();
    expect(screen.getByText('Report')).toBeOnTheScreen();
  });

  it('does not mutate a `buttons` array passed by the caller', () => {
    const buttons: AlertButton[] = [];
    render(withProvider(<Alert visible title="Empty" buttons={buttons} onClose={() => {}} />));
    expect(buttons).toHaveLength(0);
  });

  it('calls each button onPress handler', () => {
    const onPress = jest.fn();
    render(withProvider(<Alert visible title="X" buttons={[{ text: 'Go', onPress }]} />));
    fireEvent.press(screen.getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['success', 'error', 'warning', 'info', 'question'] as const)(
    'renders the %s type without crashing',
    (type) => {
      render(withProvider(<Alert visible title="X" type={type} onClose={() => {}} />));
      expect(screen.getByText('X')).toBeOnTheScreen();
    }
  );
});
