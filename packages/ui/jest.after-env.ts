import { __resetNativeOverlays } from './src/theme/NativeOverlay';

// NativeOverlay keeps a module-level registry of presented overlays (one
// native presentation at a time is a global iOS constraint). Tests unmount
// between cases without waiting for the native dismissal, so each test starts
// from an empty registry.
beforeEach(() => {
  __resetNativeOverlays();
});
