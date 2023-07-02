const logging = require("../lib/logging");
const saveUsers = require("../lib/saveUsers");

module.exports = ({ reybot, g }) => {
  const userId = g.participants[0];
  saveUsers({ userId });
  return;
};
