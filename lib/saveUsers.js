const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const logging = require("./logging");

module.exports = ({ userId }) => {
  const users = JSON.parse(
    readFileSync(join(__dirname, "../database/users.json"))
  );
  if (!userId.endsWith("@s.whatsapp.net")) return;
  const isExistUser = users.some((user) => user === userId);
  if (isExistUser) return;
  try {
    users.push(userId);
    writeFileSync(
      join(__dirname, "../database/users.json"),
      JSON.stringify(users)
    );
  } catch (err) {
    logging("error", "Error Save Users", err);
  } finally {
    logging("primary", "New Users", userId.split("@")[0]);
  }
};
