import { showAlert, showConfirm, showToast } from 'orn-ui';

/**
 * Capa de negocio pura: no es un componente, no tiene hooks y no sabe nada de
 * React. Aun así habla con el usuario, que es para lo que están showToast y
 * showAlert.
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

/** El caso típico: un interceptor de red que reporta el fallo por su cuenta. */
export async function syncInvoices(): Promise<void> {
  showToast({ title: 'Syncing…', variant: 'info', duration: 800 });
  await new Promise((resolve) => setTimeout(resolve, 800));
  await showAlert({
    title: 'Sync failed',
    message: 'The server is unreachable. Your changes are saved locally.',
    type: 'error',
  });
}
