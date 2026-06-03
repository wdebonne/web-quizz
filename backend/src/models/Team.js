const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  // Team avatar/color
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#6366f1',
  },
  avatar: {
    type: DataTypes.STRING(100),
    defaultValue: '🏆',
  },
  // Join code specific to this team (for multi-device teams)
  code: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // true = everyone answers on the same device (captain's)
  // false = each member has their own device
  isSharedDevice: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Active bonuses for the team
  bonuses: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  bonusHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'teams',
  timestamps: true,
});

module.exports = Team;
