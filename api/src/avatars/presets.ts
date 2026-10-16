export const DEFAULT_AVATAR_PATH = '/avatars/default-raven.png';

// Curated product assets, shared by the API and every client; no demo data.
export const avatarPresets = [
  {
    id: 'grumpy-raven',
    name: 'Grumpy Raven',
    path: DEFAULT_AVATAR_PATH,
    isDefault: true,
  },
  {
    id: 'frazzled-owl',
    name: 'Frazzled Owl',
    path: '/avatars/frazzled-owl.png',
    isDefault: false,
  },
  {
    id: 'smug-pigeon',
    name: 'Smug Pigeon',
    path: '/avatars/smug-pigeon.png',
    isDefault: false,
  },
  {
    id: 'cranky-duck',
    name: 'Cranky Duck',
    path: '/avatars/cranky-duck.png',
    isDefault: false,
  },
  {
    id: 'bewildered-vulture',
    name: 'Bewildered Vulture',
    path: '/avatars/bewildered-vulture.png',
    isDefault: false,
  },
] as const;
