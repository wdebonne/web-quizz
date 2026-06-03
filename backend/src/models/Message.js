const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // 'creator' | 'participant' | 'system'
  fromType: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  // Creator ID or Participant ID
  fromId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fromName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // 'all' | 'team' | 'participant' | 'creator'
  toType: {
    type: DataTypes.STRING(20),
    defaultValue: 'all',
  },
  // Team ID or Participant ID when targeted
  toId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  toName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // 'text' | 'system' | 'bonus_alert'
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'text',
  },
}, {
  tableName: 'messages',
  timestamps: true,
  updatedAt: false,
});

module.exports = Message;
