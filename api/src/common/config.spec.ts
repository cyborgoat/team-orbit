import { validateEnvironment } from './config';

describe('service configuration', () => {
  const base = {
    DATABASE_URL: 'file:./test.db',
    JWT_SECRET: 'test-secret',
    PUBLIC_BASE_URL: 'https://orbit.example/',
  };
  it('canonicalizes the public origin and resolves the upload directory', () => {
    const config = validateEnvironment(base);
    expect(config.PUBLIC_BASE_URL).toBe('https://orbit.example');
    expect(config.UPLOAD_DIR).toMatch(/\/uploads$/);
    expect(config.PORT).toBe(3000);
  });
  it.each(['DATABASE_URL', 'JWT_SECRET', 'PUBLIC_BASE_URL'])(
    'rejects missing %s',
    (key) => {
      expect(() => validateEnvironment({ ...base, [key]: '' })).toThrow(
        `${key} is required`,
      );
    },
  );
  it.each([
    'file:///tmp',
    'https://orbit.example/path',
    'https://orbit.example?x=1',
    'https://user:pass@orbit.example',
  ])('rejects a non-origin public URL %s', (value) => {
    expect(() =>
      validateEnvironment({ ...base, PUBLIC_BASE_URL: value }),
    ).toThrow();
  });
  it.each(['invalid', 0, 65536])('rejects invalid port %s', (PORT) => {
    expect(() => validateEnvironment({ ...base, PORT })).toThrow('PORT must');
  });
});
