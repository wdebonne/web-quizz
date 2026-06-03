const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Question types
const QUESTION_TYPES = [
  'single_choice',    // One correct answer from options
  'multiple_choice',  // Multiple correct answers from options
  'free_text',        // Open text input
  'true_false',       // True / False
  'ordering',         // Put items in correct order
  'matching',         // Match pairs
  'image',            // Image shown + answer options
  'audio',            // Audio played + answer options
  'video',            // Video played + answer options
  'slider',           // Numerical answer on a slider
  'poll',             // No correct answer, just gather votes
];

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  type: {
    type: DataTypes.ENUM(...QUESTION_TYPES),
    allowNull: false,
    defaultValue: 'single_choice',
  },
  // The question text
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Media URL (image/audio/video)
  mediaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'audio', 'video'),
    allowNull: true,
  },
  // Answer options array: [{ id, text, mediaUrl? }]
  options: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Correct answer(s): string | string[] | { pairs } | number (for slider)
  correctAnswer: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  // Points for this question (overrides quiz default)
  points: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true,
  },
  // Time limit in seconds (overrides quiz default, 0 = no limit)
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true,
  },
  // Explanation shown after answer
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Bonus question config
  isBonus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Bonus reward config: { type, value, config }
  bonusReward: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  // Hint text (revealed when hint bonus is used)
  hint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'questions',
  timestamps: true,
});

Question.TYPES = QUESTION_TYPES;

module.exports = Question;
