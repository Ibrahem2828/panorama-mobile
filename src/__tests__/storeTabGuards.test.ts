import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { ar } from '../i18n/locales/ar';
import { en } from '../i18n/locales/en';

const SRC = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(SRC, file), 'utf8').replace(/\r\n/g, '\n');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);

    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);

    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('bottom tab bar', () => {
  it('has five tabs: Home, Stationery, Groups, Printing, Account (Stationery second from the right)', () => {
    const source = read('navigation/AppTabsNavigator.tsx');
    const order = [
      'TabRoutes.Home',
      'TabRoutes.Store',
      'TabRoutes.Groups',
      'TabRoutes.Printing',
      'TabRoutes.Profile',
    ].map((route) => source.indexOf(`name={${route}}`));

    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('labels the store tab «القرطاسية» / Stationery and has no Subjects tab label', () => {
    expect(ar.tabs.store).toBe('القرطاسية');
    expect(en.tabs.store).toBe('Stationery');
    expect(Object.keys(ar.tabs)).toEqual(['home', 'groups', 'printing', 'store', 'profile']);
    expect(Object.keys(en.tabs)).toEqual(Object.keys(ar.tabs));
  });

  it('keeps the Subjects stack registered but out of the bar, so every route and push target still resolves', () => {
    const navigator = read('navigation/AppTabsNavigator.tsx');
    const bar = read('navigation/AppTabBar.tsx');

    expect(navigator).toContain('name={TabRoutes.Subjects}');
    expect(bar).toMatch(/HIDDEN_TABS[^=]*=\s*\[TabRoutes\.Subjects\]/u);
    expect(bar).toContain('.filter((route) => !isHiddenTab(route.name))');
    // Notification and search targets still go through the Subjects tab.
    expect(read('features/notifications/services/notificationNavigation.ts')).toContain(
      'TabRoutes.Subjects',
    );
  });

  it('keeps the cart badge on the store tab', () => {
    expect(read('navigation/AppTabBar.tsx')).toMatch(
      /route\.name === TabRoutes\.Store && cartCount > 0/u,
    );
  });
});

describe('subjects entry on Home', () => {
  it('has one card for subjects and no duplicate subjects tile', () => {
    const home = read('features/home/screens/HomeScreen.tsx');

    expect(home).toContain('<MySubjectsCard');
    expect(home).not.toMatch(/key: 'subjects', title/u);
    expect(ar.home.mySubjects.title).toBe('موادي ومحاضراتي');
  });
});

describe('the store is fully dynamic', () => {
  it('has no hardcoded brands, categories, products or bundled pictures in its code', () => {
    const files = sourceFiles(path.join(SRC, 'features', 'store'));
    const offenders: string[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');

      if (/require\(|from '[^']*assets\/|\.(png|jpe?g|webp)'/u.test(text))
        offenders.push(`${file}: asset`);
      if (/أقلام|دفاتر|بيك|فابر|\bPilot\b|\bFaber\b|\bBIC\b/u.test(text))
        offenders.push(`${file}: catalogue text`);
    }

    expect(offenders).toEqual([]);
  });

  it('says the store is empty with the owner wording', () => {
    expect(ar.store.home.emptyTitle).toBe('لم تُضف منتجات بعد');
  });
});

describe('onboarding', () => {
  it('still has four slides and the last one mentions stationery', () => {
    expect(ar.onboarding.slides).toHaveLength(4);
    expect(en.onboarding.slides).toHaveLength(4);
    expect(ar.onboarding.slides[3]?.description).toContain('قرطاسية');
    expect(en.onboarding.slides[3]?.description.toLowerCase()).toContain('stationery');
  });
});
