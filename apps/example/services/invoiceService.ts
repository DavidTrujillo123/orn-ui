import { showAlert, showConfirm, showToast } from 'orn-ui';

/**
 * Pure business layer: it isn't a component, has no hooks and knows nothing
 * about React. Even so it talks to the user, which is what showToast and
 * showAlert are for.
 */
export async function deleteInvoice(id: string): Promise<boolean> {
  const confirmed = await showConfirm({
    title: 'Delete invoice',
    message: `Invoice #${id} will be gone for good.`,
    confirmText: 'Delete',
    destructive: true,
  });

  if (!confirmed) {
    showToast({ title: 'Nothing deleted', variant: 'info' });
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  showToast({ title: 'Invoice deleted', message: `#${id}`, variant: 'success' });
  return true;
}

/** The typical case: a network interceptor that reports the failure on its own. */
export async function syncInvoices(): Promise<void> {
  showToast({ title: 'Syncing…', variant: 'info', duration: 800 });
  await new Promise((resolve) => setTimeout(resolve, 800));
  await showAlert({
    title: 'Sync failed',
    message: 'The server is unreachable. Your changes are saved locally.',
    type: 'error',
  });
}
