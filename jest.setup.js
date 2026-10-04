// React Native's entry point reads __DEV__, which Metro defines at bundle time and Jest
// does not. The i18n store imports I18nManager, so anything that touches the catalog
// pulls react-native in and needs this global.
globalThis.__DEV__ = true;
