import { Redirect } from 'expo-router';

/** "/" no tiene contenido propio: redirige al primer tab real (Atoms). */
export default function TabsRoot() {
  return <Redirect href="/atoms" />;
}
