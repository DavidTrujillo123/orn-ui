import { UIProvider, type UIProviderProps } from '../theme/UIProvider';

/**
 * @deprecated Use `UIProvider` from 'orn-ui': it now measures the safe area
 * insets itself (react-native-safe-area-context is a required peer). This
 * alias stays for one minor version so existing imports keep working.
 */
export type SafeAreaUIProviderProps = UIProviderProps;

/** @deprecated Use `UIProvider` from 'orn-ui' — same component. */
export const SafeAreaUIProvider = UIProvider;
