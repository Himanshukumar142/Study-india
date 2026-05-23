const mongoose = require('mongoose');

const BADGE_DEFINITIONS = [
  // Streak badges
  { id: 'streak_3',    name: '3-Day Streak',     desc: 'Study 3 days in a row',          icon: '🔥', category: 'streak',   xp: 30,   rarity: 'common'   },
  { id: 'streak_7',    name: 'Week Warrior',      desc: 'Study 7 days in a row',          icon: '🏃', category: 'streak',   xp: 100,  rarity: 'rare'     },
  { id: 'streak_30',   name: 'Month Master',      desc: 'Study 30 days in a row',         icon: '👑', category: 'streak',   xp: 500,  rarity: 'epic'     },
  { id: 'streak_100',  name: 'Century Streak',    desc: 'Study 100 days in a row',        icon: '💎', category: 'streak',   xp: 2000, rarity: 'legendary'},

  // Quiz badges
  { id: 'quiz_1',      name: 'First Quiz',        desc: 'Complete your first quiz',       icon: '🎯', category: 'quiz',     xp: 10,   rarity: 'common'   },
  { id: 'quiz_10',     name: 'Quiz Enthusiast',   desc: 'Complete 10 quizzes',            icon: '📝', category: 'quiz',     xp: 50,   rarity: 'common'   },
  { id: 'quiz_50',     name: 'Quiz Pro',          desc: 'Complete 50 quizzes',            icon: '🎓', category: 'quiz',     xp: 200,  rarity: 'rare'     },
  { id: 'quiz_100',    name: 'Quiz Legend',       desc: 'Complete 100 quizzes',           icon: '🏆', category: 'quiz',     xp: 500,  rarity: 'epic'     },

  // Score badges
  { id: 'perfect_1',   name: 'Perfect Score',     desc: 'Score 100% in any quiz',         icon: '⭐', category: 'score',    xp: 100,  rarity: 'rare'     },
  { id: 'perfect_5',   name: 'Perfectionist',     desc: 'Score 100% in 5 quizzes',        icon: '🌟', category: 'score',    xp: 300,  rarity: 'epic'     },
  { id: 'score_80',    name: 'High Achiever',     desc: 'Score 80%+ in 10 quizzes',       icon: '📈', category: 'score',    xp: 150,  rarity: 'rare'     },

  // Question badges
  { id: 'q_100',       name: 'Century',           desc: 'Answer 100 questions',           icon: '💯', category: 'questions', xp: 100, rarity: 'common'   },
  { id: 'q_500',       name: 'Question Master',   desc: 'Answer 500 questions',           icon: '🧠', category: 'questions', xp: 300, rarity: 'rare'     },
  { id: 'q_1000',      name: 'Knowledge God',     desc: 'Answer 1000 questions',          icon: '🔮', category: 'questions', xp: 1000, rarity: 'legendary'},

  // Subject badges
  { id: 'physics_pro', name: 'Physics Pro',       desc: 'Complete 20 Physics quizzes',    icon: '⚡', category: 'subject',  xp: 200,  rarity: 'rare'     },
  { id: 'chem_pro',    name: 'Chem Wizard',       desc: 'Complete 20 Chemistry quizzes',  icon: '🧪', category: 'subject',  xp: 200,  rarity: 'rare'     },
  { id: 'math_pro',    name: 'Math Genius',       desc: 'Complete 20 Maths quizzes',      icon: '∞',  category: 'subject',  xp: 200,  rarity: 'rare'     },
  { id: 'bio_pro',     name: 'Bio Expert',        desc: 'Complete 20 Biology quizzes',    icon: '🌿', category: 'subject',  xp: 200,  rarity: 'rare'     },

  // XP badges
  { id: 'xp_500',      name: 'Rising Star',       desc: 'Earn 500 XP',                   icon: '✨', category: 'xp',       xp: 0,    rarity: 'common'   },
  { id: 'xp_2000',     name: 'XP Hunter',         desc: 'Earn 2000 XP',                  icon: '💫', category: 'xp',       xp: 0,    rarity: 'rare'     },
  { id: 'xp_10000',    name: 'XP Legend',         desc: 'Earn 10,000 XP',                icon: '🚀', category: 'xp',       xp: 0,    rarity: 'epic'     },

  // Special badges
  { id: 'daily_1',     name: 'Daily Challenger',  desc: 'Complete your first daily challenge', icon: '🌅', category: 'special', xp: 50, rarity: 'common' },
  { id: 'daily_7',     name: 'Challenge Addict',  desc: 'Complete 7 daily challenges',    icon: '🎪', category: 'special',  xp: 200,  rarity: 'rare'     },
  { id: 'flashcard_1', name: 'Card Starter',      desc: 'Review your first flashcard',    icon: '🃏', category: 'special',  xp: 20,   rarity: 'common'   },
  { id: 'notes_5',     name: 'Note Taker',        desc: 'Write 5 personal notes',         icon: '📓', category: 'special',  xp: 50,   rarity: 'common'   },
  { id: 'doubt_1',     name: 'Curious Mind',      desc: 'Post your first doubt',          icon: '🤔', category: 'special',  xp: 30,   rarity: 'common'   },
  { id: 'night_owl',   name: 'Night Owl',         desc: 'Study after 11 PM',              icon: '🦉', category: 'special',  xp: 30,   rarity: 'common'   },
  { id: 'early_bird',  name: 'Early Bird',        desc: 'Study before 7 AM',              icon: '🐤', category: 'special',  xp: 30,   rarity: 'common'   },
  { id: 'syllabus_25', name: 'Quarter Done',      desc: 'Complete 25% of syllabus',       icon: '📚', category: 'special',  xp: 100,  rarity: 'rare'     },
  { id: 'syllabus_50', name: 'Halfway Hero',      desc: 'Complete 50% of syllabus',       icon: '🎖️', category: 'special', xp: 300,  rarity: 'epic'     },
  { id: 'syllabus_100','name': 'Syllabus Complete','desc': 'Complete entire syllabus',    icon: '🎊', category: 'special',  xp: 1000, rarity: 'legendary'},
];

const userBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
});
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
module.exports = { UserBadge, BADGE_DEFINITIONS };
