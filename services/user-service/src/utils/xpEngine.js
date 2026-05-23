/**
 * XP Engine — award XP and calculate level
 */

const XP_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000,
];

const XP_REWARDS = {
  QUIZ_CORRECT: 10,
  QUIZ_ATTEMPT: 5,
  STUDY_SESSION_MINUTE: 2,
  FOCUS_SESSION_COMPLETE: 30,
  STREAK_BONUS: 50,
  CHALLENGE_COMPLETE: 100,
  UPLOAD_CONTENT: 20,
  REVISE_MISTAKE: 5,
  BOOKMARK_ITEM: 5,
};

const getLevelFromXP = (xp) => {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};

const getNextLevelXP = (currentLevel) => {
  return XP_THRESHOLDS[currentLevel] || null; // null = max level
};

const calculateXP = (action, meta = {}) => {
  switch (action) {
    case 'QUIZ_CORRECT':
      return XP_REWARDS.QUIZ_CORRECT * (meta.count || 1);
    case 'QUIZ_ATTEMPT':
      return XP_REWARDS.QUIZ_ATTEMPT;
    case 'STUDY_SESSION':
      return Math.floor((meta.minutes || 0) * XP_REWARDS.STUDY_SESSION_MINUTE);
    case 'FOCUS_SESSION':
      return XP_REWARDS.FOCUS_SESSION_COMPLETE;
    case 'STREAK_BONUS':
      return XP_REWARDS.STREAK_BONUS;
    case 'CHALLENGE_COMPLETE':
      return XP_REWARDS.CHALLENGE_COMPLETE;
    case 'UPLOAD_CONTENT':
      return XP_REWARDS.UPLOAD_CONTENT;
    case 'REVISE_MISTAKE':
      return XP_REWARDS.REVISE_MISTAKE;
    case 'BOOKMARK_ITEM':
      return XP_REWARDS.BOOKMARK_ITEM;
    default:
      return 0;
  }
};

module.exports = { getLevelFromXP, getNextLevelXP, calculateXP, XP_REWARDS };
