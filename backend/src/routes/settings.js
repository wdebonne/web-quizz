const router = require('express').Router();
const { AppSetting } = require('../models');

// GET /api/settings/public — Public settings (app name, logo, colors)
router.get('/public', async (req, res) => {
  try {
    const keys = ['app_name', 'app_logo', 'app_favicon', 'app_primary_color', 'app_accent_color'];
    const settings = await AppSetting.findAll({ where: { key: keys } });
    const map = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
