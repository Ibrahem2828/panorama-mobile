import { launchGroupWhatsApp, parseWhatsAppAppLink } from '../whatsappLaunch';

const VALID = 'whatsapp://chat?code=AbCdEf1234567890';

describe('parseWhatsAppAppLink', () => {
  it('accepts only whatsapp app links', () => {
    expect(parseWhatsAppAppLink(VALID)).toBe(VALID);
    expect(parseWhatsAppAppLink('whatsapp://send?phone=201001234567')).not.toBeNull();
  });

  it('refuses the https invite link and anything unexpected', () => {
    expect(parseWhatsAppAppLink('https://chat.whatsapp.com/AbCdEf1234567890')).toBeNull();
    expect(parseWhatsAppAppLink('whatsapp://chat?code=short')).toBeNull();
    expect(parseWhatsAppAppLink('whatsapp://chat?code=AbCdEf1234567890&x=1')).toBeNull();
    expect(parseWhatsAppAppLink(undefined)).toBeNull();
    expect(parseWhatsAppAppLink(42)).toBeNull();
  });
});

describe('launchGroupWhatsApp', () => {
  it('opens the deep link directly', async () => {
    const openUrl = jest.fn().mockResolvedValue(undefined);

    await expect(
      launchGroupWhatsApp({ requestAppUrl: () => Promise.resolve(VALID), openUrl }),
    ).resolves.toBe('opened');
    expect(openUrl).toHaveBeenCalledWith(VALID);
  });

  it('reports not-installed when the system cannot open the link', async () => {
    await expect(
      launchGroupWhatsApp({
        requestAppUrl: () => Promise.resolve(VALID),
        openUrl: () => Promise.reject(new Error('no handler')),
      }),
    ).resolves.toBe('not-installed');
  });

  it('fails without opening anything when the request fails or returns a bad link', async () => {
    const openUrl = jest.fn();

    await expect(
      launchGroupWhatsApp({ requestAppUrl: () => Promise.reject(new Error('403')), openUrl }),
    ).resolves.toBe('failed');
    await expect(
      launchGroupWhatsApp({
        requestAppUrl: () => Promise.resolve('https://chat.whatsapp.com/AbCdEf1234567890'),
        openUrl,
      }),
    ).resolves.toBe('failed');
    expect(openUrl).not.toHaveBeenCalled();
  });
});
