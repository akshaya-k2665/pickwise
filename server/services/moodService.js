exports.setMood = async (userId, { mood }) => {
  return { userId, mood, updated: true };
};
