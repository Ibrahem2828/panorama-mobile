# i18n

Arabic and English. Arabic is the source catalog; English must stay in step with it.

## Using a string

```tsx
import { useTranslation } from '../../../i18n';

export function SomeScreen() {
  const { t } = useTranslation();
  return <AppText>{t.settings.title}</AppText>;
}
```

`t` is the catalog itself, so keys are ordinary property access: autocompleted, checked by
the compiler, and impossible to mistype into a silent runtime miss. There is no `t('a.b')`
string lookup and no i18n runtime dependency.

Outside a component (a store, a service) read the catalog directly:

```ts
import { useLocaleStore } from '../../../i18n';

const { t } = useLocaleStore.getState();
```

## Parameterised strings

Write a function, not a placeholder template. The compiler then checks the arguments, and
each locale is free to reorder or inflect them.

```ts
// ar.ts
printing: {
  copies: (count: number) => `${count} نسخة`,
},

// en.ts
printing: {
  copies: (count: number) => `${count} ${count === 1 ? 'copy' : 'copies'}`,
},
```

## Adding a string

1. Add it to `locales/ar.ts` under the feature it belongs to.
2. Run `npm run typecheck`. It fails until `locales/en.ts` has the same key — that failure
   is the point: an untranslated string cannot reach a build.
3. Add the English text.

`npm run test` additionally rejects empty strings and Arabic text left sitting in the
English catalog, which both type-check but ship untranslated UI.

## Migrating a screen

`features/settings/screens/SettingsScreen.tsx` is the worked reference. The pattern:

1. Move every literal in the file into `ar.ts`, grouped under the feature name.
2. Translate each one in `en.ts`.
3. Replace the literals with `t.*` and add `const { t } = useTranslation();`.
4. For helpers that build strings, pass the catalog in rather than importing it, so the
   function stays pure — see `getEnvironmentLabel(t)` in that screen.

About 1,180 strings across ~150 files still hold literals. They can be migrated a screen
at a time; nothing breaks while both styles coexist.

## Known gaps

Only an Arabic wordmark exists (`assets/images/brand-logo-full-ar.png`), so the login
screen still shows Arabic branding in English. Switching it needs an English or neutral
logo asset, not a code change.

Messages returned by the backend (`normalized.message`, and notification titles and
bodies) are passed straight through. The API carries `title_ar`/`title_en` fields, so
server-side copy should be selected by locale once the client sends it.

## Direction

`useTranslation()` returns `isRTL` from `I18nManager.isRTL`, which is the direction the
running app is actually laid out in — not the selected locale. React Native fixes
direction natively at startup, so after switching language the strings change immediately
while the layout keeps its previous direction until the app restarts. `LanguageSelector`
shows the restart notice when the two disagree; `needsRestartForDirection` is that flag.

Never derive layout direction from `locale`. Use `getIsRTL()` from `utils/rtl`, or the
`isRTL` returned by the hook.
