const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Short join code (6 chars, alphanumeric)
  code: {
    type: DataTypes.STRING(8),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('lobby', 'active', 'paused', 'finished'),
    defaultValue: 'lobby',
  },
  // projection = questions on big screen, answers on devices
  // device = everything on participant devices
  mode: {
    type: DataTypes.ENUM('projection', 'device'),
    defaultValue: 'projection',
  },
  currentQuestionIndex: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
  },
  // Question start timestamp for timer calculation
  questionStartedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Override quiz settings for this session
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // Allow teams
  teamsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Max participants
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  finishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'game_sessions',
  timestamps: true,
});

module.exports = GameSession;
