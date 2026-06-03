const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameHistory = sequelize.define('GameHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quizTitle: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  mode: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  teamsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  participantCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  questionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Full results snapshot
  results: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // Leaderboard: [{name, score, rank, avatar, teamName?}]
  leaderboard: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  finishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'game_histories',
  timestamps: true,
  updatedAt: false,
});

module.exports = GameHistory;
