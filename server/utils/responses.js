exports.ok = (data) => ({ success: true, data });
exports.fail = (code, message) => ({
  success: false,
  error: { code, message },
});
