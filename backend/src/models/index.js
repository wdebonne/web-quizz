const User = require('./User');
const Quiz = require('./Quiz');
const Question = require('./Question');
const GameSession = require('./GameSession');
const Participant = require('./Participant');
const Team = require('./Team');
const Message = require('./Message');
const Bonus = require('./Bonus');
const GameHistory = require('./GameHistory');
const AppSetting = require('./AppSetting');

// Associations
User.hasMany(Quiz, { foreignKey: 'userId', as: 'quizzes' });
Quiz.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Quiz.hasMany(Question, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

Quiz.hasMany(Bonus, { foreignKey: 'quizId', as: 'bonuses', onDelete: 'CASCADE' });
Bonus.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

User.hasMany(GameSession, { foreignKey: 'creatorId', as: 'sessions' });
GameSession.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
GameSession.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

GameSession.hasMany(Participant, { foreignKey: 'sessionId', as: 'participants', onDelete: 'CASCADE' });
Participant.belongsTo(GameSession, { foreignKey: 'sessionId', as: 'session' });

GameSession.hasMany(Team, { foreignKey: 'sessionId', as: 'teams', onDelete: 'CASCADE' });
Team.belongsTo(GameSession, { foreignKey: 'sessionId', as: 'session' });
Team.hasMany(Participant, { foreignKey: 'teamId', as: 'members' });
Participant.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

GameSession.hasMany(Message, { foreignKey: 'sessionId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(GameSession, { foreignKey: 'sessionId', as: 'session' });

GameSession.hasOne(GameHistory, { foreignKey: 'sessionId', as: 'history' });
GameHistory.belongsTo(GameSession, { foreignKey: 'sessionId', as: 'session' });

module.exports = {
  User,
  Quiz,
  Question,
  GameSession,
  Participant,
  Team,
  Message,
  Bonus,
  GameHistory,
  AppSetting,
};
