const bcrypt = require('bcryptjs');
const { User, AppSetting } = require('../models');

const DEFAULT_SETTINGS = [
  { key: 'app_name', value: process.env.APP_NAME || 'QuizzApp' },
  { key: 'app_logo', value: '' },
  { key: 'app_favicon', value: '' },
  { key: 'app_primary_color', value: '#6366f1' },
  { key: 'app_accent_color', value: '#f59e0b' },
  { key: 'registration_enabled', value: 'true' },
  { key: 'email_template_welcome', value: 'Bienvenue sur {{app_name}} !' },
  { key: 'email_template_reset', value: 'Réinitialisation de votre mot de passe {{app_name}}' },
];

async function setupDefaultData() {
  // Create default admin if no users exist
  const userCount = await User.count();
  if (userCount === 0) {
    const hash = await bcrypt.hash('Admin1234!', 12);
    await User.create({
      username: 'admin',
      email: 'admin@quizz.local',
      password: hash,
      role: 'admin',
      mustChangePassword: true,
    });
    console.log('✅ Admin par défaut créé: admin@quizz.local / Admin1234!');
  }

  // Create default settings
  for (const setting of DEFAULT_SETTINGS) {
    await AppSetting.findOrCreate({
      where: { key: setting.key },
      defaults: { value: setting.value },
    });
  }
  console.log('✅ Paramètres par défaut initialisés.');
}

module.exports = { setupDefaultData };
