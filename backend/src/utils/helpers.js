const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DEFAULT_AVATARS = [
  'dicebear:fox', 'dicebear:wolf', 'dicebear:lion', 'dicebear:tiger', 'dicebear:bear', 'dicebear:raccoon',
  'dicebear:unicorn', 'dicebear:frog', 'dicebear:butterfly', 'dicebear:dragon', 'dicebear:eagle', 'dicebear:peacock',
  'dicebear:cosmos', 'dicebear:rocket', 'dicebear:star', 'dicebear:moon', 'dicebear:phoenix', 'dicebear:diamond',
  'dicebear:trophy', 'dicebear:bolt', 'dicebear:wave', 'dicebear:clover', 'dicebear:bullseye', 'dicebear:guitar',
];

const getRandomAvatar = (usedAvatars = []) => {
  const available = DEFAULT_AVATARS.filter(a => !usedAvatars.includes(a));
  if (available.length > 0) return randomItem(available);
  return randomItem(DEFAULT_AVATARS);
};

module.exports = { generateCode, shuffle, randomItem, DEFAULT_AVATARS, getRandomAvatar };
