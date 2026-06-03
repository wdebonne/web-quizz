const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, GameHistory, AppSetting } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendInvitation } = require('../utils/mailer');

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/users
router.post('/users', authenticate, requireAdmin, [
  body('username').notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['admin', 'creator']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé.' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hash, role, mustChangePassword: true });
    res.status(201).json({
      id: user.id, username: user.username, email: user.email, role: user.role,
    });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { username, email, role, isActive, password } = req.body;
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) {
      updates.password = await bcrypt.hash(password, 12);
      updates.mustChangePassword = true;
    }

    await user.update(updates);
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    await user.destroy();
    res.json({ message: 'Utilisateur supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/invite
router.post('/invite', authenticate, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role } = req.body;
  const appName = (await AppSetting.findOne({ where: { key: 'app_name' } }))?.value || 'QuizzApp';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  try {
    await sendInvitation(email, appUrl, appName, role || 'creator');
    res.json({ message: 'Invitation envoyée.' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'invitation.' });
  }
});

// GET /api/admin/settings
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await AppSetting.findAll();
    const map = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/settings
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await AppSetting.upsert({ key, value: String(value) });
    }
    res.json({ message: 'Paramètres mis à jour.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/history/:id
router.delete('/history/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await GameHistory.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Historique supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/history
router.delete('/history', authenticate, requireAdmin, async (req, res) => {
  try {
    await GameHistory.destroy({ where: {} });
    res.json({ message: 'Tout l\'historique supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
