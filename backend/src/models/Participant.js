const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  // Avatar: 'dicebear:seed' | 'custom:/uploads/avatars/...'
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: 'dicebear:star',
  },
  avatarPendingApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Array of { questionId, answer, isCorrect, pointsEarned, timeMs, bonusUsed }
  answers: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Array of active bonuses: { type, config, receivedAt }
  bonuses: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Bonuses received total: { type, config, usedAt?, usedOn? }[]
  bonusHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Socket ID (ephemeral, used during session)
  socketId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // If participant is team captain (for shared device mode)
  isCaptain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Streak tracking
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'participants',
  timestamps: true,
});

module.exports = Participant;
