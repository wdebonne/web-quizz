const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // Default point config for all questions
  defaultPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  // Penalty percentage for wrong answers (0 = no penalty)
  penaltyPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  // Global time limit in seconds (0 = no global limit)
  globalTimeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Per-question default time limit in seconds (0 = no limit)
  defaultTimeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
}, {
  tableName: 'quizzes',
  timestamps: true,
});

module.exports = Quiz;
