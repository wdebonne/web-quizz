const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Built-in bonus types
const BONUS_TYPES = {
  IMMUNITY: {
    id: 'immunity',
    name: 'Immunité',
    icon: '🛡️',
    description: 'Protège des bonus négatifs pendant 1 question',
    category: 'defense',
  },
  DOUBLE_POINTS: {
    id: 'double_points',
    name: 'Double Points',
    icon: '✖️2',
    description: 'Double les points sur la prochaine question',
    category: 'boost',
  },
  EXTRA_TIME: {
    id: 'extra_time',
    name: 'Temps Bonus',
    icon: '⏰',
    description: '+15 secondes sur la prochaine question',
    category: 'boost',
  },
  FREE_ANSWER: {
    id: 'free_answer',
    name: 'Réponse Libre',
    icon: '🎯',
    description: 'La prochaine réponse est validée quoi qu\'il arrive',
    category: 'boost',
  },
  STEAL_POINTS: {
    id: 'steal_points',
    name: 'Vol de Points',
    icon: '💸',
    description: 'Vole 10% des points d\'une équipe/participant cible',
    category: 'attack',
  },
  FREEZE: {
    id: 'freeze',
    name: 'Gel',
    icon: '🧊',
    description: 'Le timer de la cible s\'accélère x2',
    category: 'attack',
  },
  SKIP_QUESTION: {
    id: 'skip_question',
    name: 'Passer',
    icon: '⏭️',
    description: 'Passe la prochaine question sans pénalité',
    category: 'neutral',
  },
  HINT: {
    id: 'hint',
    name: 'Indice',
    icon: '💡',
    description: 'Élimine une mauvaise réponse',
    category: 'boost',
  },
  REVERSE: {
    id: 'reverse',
    name: 'Inversé',
    icon: '🔄',
    description: 'La cible perd les points qu\'elle gagnerait',
    category: 'attack',
  },
  EXTRA_WRONG: {
    id: 'extra_wrong',
    name: 'Erreur Gratuite',
    icon: '✅',
    description: 'Une mauvaise réponse supplémentaire sans pénalité',
    category: 'boost',
  },
  BLIND: {
    id: 'blind',
    name: 'Aveugle',
    icon: '🙈',
    description: 'Cache les options à la cible pendant 10 secondes',
    category: 'attack',
  },
  SWAP_SCORES: {
    id: 'swap_scores',
    name: 'Échange',
    icon: '🔀',
    description: 'Échange vos scores avec la cible',
    category: 'attack',
  },
};

// Custom bonus model (creator-defined)
const Bonus = sequelize.define('Bonus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '⭐',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(20),
    defaultValue: 'boost',
  },
  // Custom configuration for the bonus behavior
  config: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  isBuiltin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'bonuses',
  timestamps: true,
});

Bonus.TYPES = BONUS_TYPES;

module.exports = Bonus;
