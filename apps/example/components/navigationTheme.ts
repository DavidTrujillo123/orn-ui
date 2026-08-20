// Generado por scripts/use-sdk.mjs — no editar a mano.
// Fuente: Expo SDK 57
//
// `ThemeProvider`/`DarkTheme`/`DefaultTheme` cambiaron de paquete entre SDKs:
// expo-router los reexporta desde la 56 (SDK 56), y hasta la 55 hay que
// tomarlos de @react-navigation/native, que expo-router 6/55 traen como
// dependencia y las versiones nuevas ya no usan. No hay un import estático que
// resuelva en los cuatro SDK, así que el que corresponde se escribe acá al
// cambiar de SDK y el resto de la app importa siempre desde este archivo.
export { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
