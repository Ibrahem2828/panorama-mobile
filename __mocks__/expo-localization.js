// Jest picks this up automatically for the node_modules package of the same name.
// Mocking it keeps the native module out of unit tests and makes the device-locale
// fallback deterministic instead of depending on whatever machine runs the suite.
module.exports = {
  getLocales: () => [{ languageCode: 'ar', languageTag: 'ar-SY' }],
};
