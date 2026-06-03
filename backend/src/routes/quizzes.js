const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Quiz, Question, Bonus } = require('../models');
const { authenticate, requireCreator } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/quizzes
router.get('/', authenticate, requireCreator, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const quizzes = await Quiz.findAll({
      where,
      include: [{ model: Question, as: 'questions', attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(quizzes.map(q => ({
      ...q.toJSON(),
      questionCount: q.questions.length,
      questions: undefined,
    })));
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/quizzes/:id
router.get('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        { model: Question, as: 'questions', order: [['order', 'ASC']] },
        { model: Bonus, as: 'bonuses' },
      ],
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable.' });
    if (quiz.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    res.json(quiz);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/quizzes
router.post('/', authenticate, requireCreator, [
  body('title').notEmpty().trim().isLength({ max: 200 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const quiz = await Quiz.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(quiz);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/quizzes/:id
router.put('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable.' });
    if (quiz.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await quiz.update(req.body);
    res.json(quiz);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/quizzes/:id
router.delete('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable.' });
    if (quiz.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await quiz.destroy();
    res.json({ message: 'Quiz supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// --- Questions ---

// POST /api/quizzes/:id/questions
router.post('/:id/questions', authenticate, requireCreator, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz || (quiz.userId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const count = await Question.count({ where: { quizId: quiz.id } });
    const question = await Question.create({
      ...req.body,
      quizId: quiz.id,
      order: count,
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/quizzes/:id/questions/:qid
router.put('/:id/questions/:qid', authenticate, requireCreator, async (req, res) => {
  try {
    const question = await Question.findOne({ where: { id: req.params.qid, quizId: req.params.id } });
    if (!question) return res.status(404).json({ error: 'Question introuvable.' });
    await question.update(req.body);
    res.json(question);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/quizzes/:id/questions/:qid
router.delete('/:id/questions/:qid', authenticate, requireCreator, async (req, res) => {
  try {
    const question = await Question.findOne({ where: { id: req.params.qid, quizId: req.params.id } });
    if (!question) return res.status(404).json({ error: 'Question introuvable.' });
    await question.destroy();
    // Reorder remaining questions
    const remaining = await Question.findAll({ where: { quizId: req.params.id }, order: [['order', 'ASC']] });
    for (let i = 0; i < remaining.length; i++) {
      await remaining[i].update({ order: i });
    }
    res.json({ message: 'Question supprimée.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/quizzes/:id/questions/reorder
router.put('/:id/questions/reorder', authenticate, requireCreator, async (req, res) => {
  const { orderedIds } = req.body;
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await Question.update({ order: i }, { where: { id: orderedIds[i], quizId: req.params.id } });
    }
    res.json({ message: 'Ordre mis à jour.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// --- Bonuses ---

// GET /api/quizzes/:id/bonuses
router.get('/:id/bonuses', authenticate, requireCreator, async (req, res) => {
  try {
    const bonuses = await Bonus.findAll({ where: { quizId: req.params.id } });
    res.json(bonuses);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/quizzes/:id/bonuses
router.post('/:id/bonuses', authenticate, requireCreator, async (req, res) => {
  try {
    const bonus = await Bonus.create({ ...req.body, quizId: req.params.id });
    res.status(201).json(bonus);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/quizzes/:id/bonuses/:bid
router.delete('/:id/bonuses/:bid', authenticate, requireCreator, async (req, res) => {
  try {
    await Bonus.destroy({ where: { id: req.params.bid, quizId: req.params.id } });
    res.json({ message: 'Bonus supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
