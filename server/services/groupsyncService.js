exports.createGroup = async ({ users }) => {
  return { sessionId: "g123", users, items: ["Movie1", "Movie2"] };
};

exports.getGroup = async (sessionId) => {
  return { sessionId, items: ["Shared Movie A", "Shared Movie B"] };
};
