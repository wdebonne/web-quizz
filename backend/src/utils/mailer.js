const nodemailer = require('nodemailer');
const { AppSetting } = require('../models');

const getTransporter = async () => {
  const settings = {};
  const rows = await AppSetting.findAll({
    where: { key: ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from'] },
  });
  for (const r of rows) settings[r.key] = r.value;

  const host = settings['smtp_host'] || process.env.SMTP_HOST;
  const user = settings['smtp_user'] || process.env.SMTP_USER;
  const pass = settings['smtp_pass'] || process.env.SMTP_PASS;

  if (!host || !user) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(settings['smtp_port'] || process.env.SMTP_PORT || '587'),
    secure: (settings['smtp_secure'] || process.env.SMTP_SECURE) === 'true',
    auth: { user, pass },
  });
};

const getFrom = async () => {
  const row = await AppSetting.findOne({ where: { key: 'smtp_from' } });
  return row?.value || process.env.SMTP_FROM || 'noreply@quizz.local';
};

const sendPasswordReset = async (email, token, appName) => {
  const transporter = await getTransporter();
  if (!transporter) return;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: await getFrom(),
    to: email,
    subject: `Réinitialisation de votre mot de passe — ${appName}`,
    html: `
      <h2>${appName}</h2>
      <p>Vous avez demandé une réinitialisation de mot de passe.</p>
      <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Réinitialiser mon mot de passe
      </a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
  });
};

const sendInvitation = async (email, appUrl, appName, role) => {
  const transporter = await getTransporter();
  if (!transporter) return;
  await transporter.sendMail({
    from: await getFrom(),
    to: email,
    subject: `Invitation à rejoindre ${appName}`,
    html: `
      <h2>${appName}</h2>
      <p>Vous êtes invité(e) à rejoindre ${appName} en tant que <strong>${role}</strong>.</p>
      <p><a href="${appUrl}/register" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Créer mon compte
      </a></p>
    `,
  });
};

const sendCustomEmail = async (to, subject, html) => {
  const transporter = await getTransporter();
  if (!transporter) return;
  await transporter.sendMail({ from: await getFrom(), to, subject, html });
};

module.exports = { sendPasswordReset, sendInvitation, sendCustomEmail };
