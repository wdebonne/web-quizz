const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const mediaDir = path.join(uploadsDir, 'media');
[uploadsDir, avatarsDir, mediaDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = req.path.includes('avatar') ? avatarsDir : mediaDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    media: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'video/mp4', 'video/webm'],
  };
  const type = req.path.includes('avatar') ? 'avatar' : 'media';
  if (allowed[type].includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /api/uploads/avatar
router.post('/avatar', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant.' });
  const url = `/uploads/avatars/${req.file.filename}`;
  res.json({ url });
});

// POST /api/uploads/media
router.post('/media', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant.' });
  const url = `/uploads/media/${req.file.filename}`;
  const mediaType = req.file.mimetype.startsWith('image') ? 'image'
    : req.file.mimetype.startsWith('audio') ? 'audio' : 'video';
  res.json({ url, mediaType });
});

// POST /api/uploads/logo
router.post('/logo', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant.' });
  const url = `/uploads/avatars/${req.file.filename}`;
  const { AppSetting } = require('../models');
  await AppSetting.upsert({ key: 'app_logo', value: url });
  res.json({ url });
});

module.exports = router;
