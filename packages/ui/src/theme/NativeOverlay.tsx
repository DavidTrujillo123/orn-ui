import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal, Platform, View, type ModalProps, type ViewStyle } from 'react-native';

/**
 * NativeOverlay
 * The native `Modal` every orn-ui overlay (Alert, BottomSheet, Modal, Select)
 * goes through.
 *
 * Why: iOS presents a native modal from the root view controller and only one
 * at a time. A second `<Modal>` that is not rendered inside the first one is
 * silently ignored while the first is presented, and also while it is still
 * being dismissed. In practice an Alert from `showAlert()` over an open
 * BottomSheet never showed, and neither did one opened right after closing a
 * sheet. Android opens a window per modal and never had the problem: there
 * this is a plain `Modal`.
 *
 * iOS, when an overlay becomes visible:
 * - Rendered inside another overlay (nested): plain native modal; iOS presents
 *   it from that one, which works.
 * - Another overlay is presented and this one is not inside it: it is drawn
 *   as a layer inside the topmost presented overlay instead of presenting a
 *   second native modal. Its React context then comes from that overlay's
 *   position: a provider that wraps only this overlay doesn't reach it.
 * - Another overlay is closing (exit animation or native dismissal): it waits
 *   until that one is gone, then presents.
 */

export interface NativeOverlayProps
  extends Pick<
    ModalProps,
    'transparent' | 'animationType' | 'presentationStyle' | 'statusBarTranslucent' | 'onRequestClose' | 'hardwareAccelerated'
  > {
  /**
   * The overlay is logically hidden but still mounted to play its exit
   * animation: it stays on screen, but no other overlay may layer into it.
   */
  closing?: boolean;
  /**
   * A dialog (Alert) always ends up on top: whatever gets layered into it is
   * drawn beneath its own content, and as a layer it is drawn after any
   * non-dialog layer of the same host.
   */
  dialog?: boolean;
  children: React.ReactNode;
}

type Mode = 'pending' | 'native' | 'layer' | 'wait';

interface Host {
  id: number;
  closing: boolean;
}

const fill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
/** After unmount, how long iOS may still be dismissing the native modal. */
const DISMISS_SETTLE_MS = 450;

// Module-level registry: overlays live in different React subtrees, and the
// constraint they share (one native presentation at a time) is global too.
const hosts: Host[] = [];
const layers = new Map<number, Map<number, { node: React.ReactNode; dialog: boolean }>>();
const ownerOf = new Map<number, number>();
let nextId = 1;

// Two channels, so publishing a layer (every render of a layered overlay)
// only re-renders that host's outlet, never the overlays themselves — which
// would publish again and loop.
const hostListeners = new Set<() => void>();
const layerListeners = new Map<number, Set<() => void>>();

/** The host stack changed: waiting/layered overlays re-evaluate. */
function notify() {
  hostListeners.forEach((listener) => listener());
}

/** A host's layers changed: only its outlet re-renders. */
function notifyLayers(hostId: number) {
  layerListeners.get(hostId)?.forEach((listener) => listener());
}

function useChannel(subscribe: (listener: () => void) => () => void) {
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), [subscribe]);
}

const subscribeHosts = (listener: () => void) => {
  hostListeners.add(listener);
  return () => {
    hostListeners.delete(listener);
  };
};

function liveTop(): Host | undefined {
  const top = hosts[hosts.length - 1];
  return top && !top.closing ? top : undefined;
}

function decide(parentHost: number | null): Mode {
  if (hosts.length === 0) return 'native';
  const top = liveTop();
  if (!top) return 'wait';
  // Nested inside the topmost overlay: iOS can present it from there.
  if (top.id === parentHost) return 'native';
  return 'layer';
}

function unpublish(id: number) {
  const owner = ownerOf.get(id);
  if (owner === undefined) return;
  layers.get(owner)?.delete(id);
  ownerOf.delete(id);
  notifyLayers(owner);
}

/** Takes the native slot right away, before any later overlay decides. */
function claim(id: number, closing: boolean) {
  if (hosts.some((h) => h.id === id)) return;
  hosts.push({ id, closing });
  notify();
}

function removeHost(id: number) {
  const index = hosts.findIndex((h) => h.id === id);
  if (index < 0) return;
  hosts.splice(index, 1);
  notify();
}

/** Id of the native overlay this subtree is rendered in, if any. */
const HostContext = createContext<number | null>(null);

/** Draws, inside a native host, the layers other overlays put into it. */
function LayerOutlet({ hostId }: { hostId: number }) {
  const [, setVersion] = useState(0);
  // Layout effect + an immediate re-read: a layer may have been published in
  // the same commit, before this outlet subscribed.
  useLayoutEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    if (!layerListeners.has(hostId)) layerListeners.set(hostId, new Set());
    layerListeners.get(hostId)!.add(listener);
    if (layers.get(hostId)?.size) listener();
    return () => {
      layerListeners.get(hostId)?.delete(listener);
    };
  }, [hostId]);
  const own = layers.get(hostId);
  if (!own || own.size === 0) return null;
  // Dialogs last, so they are drawn on top of sheets and modals.
  const ordered = [...own.entries()].sort(([, a], [, b]) => Number(a.dialog) - Number(b.dialog));
  return (
    <>
      {ordered.map(([key, layer]) => (
        <View key={key} style={fill} pointerEvents="box-none">
          {layer.node}
        </View>
      ))}
    </>
  );
}

export function NativeOverlay({ closing = false, dialog = false, children, ...modalProps }: NativeOverlayProps) {
  const ios = Platform.OS === 'ios';
  const parentHost = useContext(HostContext);
  const idRef = useRef(0);
  if (idRef.current === 0) idRef.current = nextId++;
  const id = idRef.current;
  useChannel(subscribeHosts);

  // Decided in a layout effect, not during render: layout effects run in tree
  // order before paint, so when two overlays mount in the same commit the
  // first one claims the native slot before the second one decides.
  const [mode, setMode] = useState<Mode>(ios ? 'pending' : 'native');

  useLayoutEffect(() => {
    if (!ios) return;
    if (mode === 'pending') {
      const next = decide(parentHost);
      if (next === 'native') claim(id, closing);
      setMode(next);
      return;
    }
    if (mode === 'wait' && !closing) {
      const next = decide(parentHost);
      if (next === 'native') claim(id, closing);
      if (next !== 'wait') setMode(next);
    }
    // The host it layered into started closing or went away: move out.
    if (mode === 'layer' && !closing) {
      const owner = ownerOf.get(id);
      const host = owner === undefined ? undefined : hosts.find((h) => h.id === owner);
      if (owner !== undefined && (!host || host.closing)) {
        unpublish(id);
        const next = decide(parentHost);
        if (next === 'native') claim(id, closing);
        setMode(next);
      }
    }
  });

  // Native host bookkeeping.
  useLayoutEffect(() => {
    if (!ios || mode !== 'native') return;
    const existing = hosts.find((h) => h.id === id);
    if (!existing) hosts.push({ id, closing });
    else if (existing.closing !== closing) existing.closing = closing;
    else return;
    notify();
  }, [ios, mode, closing, id]);

  // Layer publishing: every render, so prop changes reach the host.
  useLayoutEffect(() => {
    if (!ios || mode !== 'layer') return;
    let owner = ownerOf.get(id);
    if (owner === undefined) {
      owner = liveTop()?.id;
      // The host it chose started closing in the same commit (a sheet closed
      // and an alert opened in one tick): decide again, usually to wait.
      if (owner === undefined) {
        const next = decide(parentHost);
        if (next === 'native') claim(id, closing);
        setMode(next);
        return;
      }
      ownerOf.set(id, owner);
    }
    if (!layers.has(owner)) layers.set(owner, new Map());
    layers.get(owner)!.set(id, { node: <HostContext.Provider value={owner}>{children}</HostContext.Provider>, dialog });
    notifyLayers(owner);
  });

  // Unmount: a layer just leaves; a native host stays "closing" while iOS
  // finishes dismissing it, so the next overlay doesn't present too early.
  useEffect(
    () => () => {
      if (!ios) return;
      unpublish(id);
      const host = hosts.find((h) => h.id === id);
      if (host) {
        host.closing = true;
        notify();
        setTimeout(() => removeHost(id), DISMISS_SETTLE_MS);
      }
    },
    [ios, id]
  );

  if (!ios || mode === 'native') {
    return (
      <Modal visible {...modalProps}>
        <HostContext.Provider value={id}>
          {/* A dialog host draws what was layered into it underneath itself. */}
          {ios && dialog && <LayerOutlet hostId={id} />}
          {children}
          {ios && !dialog && <LayerOutlet hostId={id} />}
        </HostContext.Provider>
      </Modal>
    );
  }

  // 'layer' renders inside the host; 'wait' and 'pending' render nothing yet.
  return null;
}

/** Test-only: clears the registry between tests. */
export function __resetNativeOverlays() {
  hosts.splice(0);
  layers.clear();
  ownerOf.clear();
}
