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

This is how the whole app was migrated, a feature at a time. Nothing breaks while both
styles coexist, so new screens can follow the same route.

## Migration status

Every product screen is migrated: no Arabic literal remains in UI code. The files that
still contain Arabic do so deliberately:

| File                                                  | Why                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `locales/ar.ts`                                       | the Arabic catalog itself                                                       |
| `locales/en.ts`                                       | one entry: the language name "العربية", shown in its own script in both locales |
| `providers/RootErrorBoundary.tsx`                     | bilingual copy inlined on purpose — see the comment there                       |
| `config/env.ts`                                       | build-time assertions that only ever reach a developer                          |
| `constants/app.ts`                                    | `displayNameAr`, explicitly the Arabic brand name                               |
| `features/dev/screens/DesignSystemShowcaseScreen.tsx` | unrouted developer showcase, not product UI                                     |
| `__tests__` fixtures                                  | test data, not shown to anyone                                                  |

Running `npm run test` fails if an English entry is missing, empty, or still holds Arabic
text, so the catalogs cannot drift apart.

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
