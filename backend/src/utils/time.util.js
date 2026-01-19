exports.diffInMinutes = (start, end) => {
  return Math.max(0, Math.floor((end - start) / (1000 * 60)));
};
