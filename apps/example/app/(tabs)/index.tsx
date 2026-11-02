import { Redirect } from 'expo-router';

/** "/" has no content of its own: it redirects to the first real tab (Atoms). */
export default function TabsRoot() {
  return <Redirect href="/atoms" />;
}
