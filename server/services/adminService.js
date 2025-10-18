exports.updateConfig = async (config) => {
  return { updated: true, config };
};

exports.reindex = async () => {
  return { status: "reindex started" };
};
