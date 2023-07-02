const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const contacts = JSON.parse(
  readFileSync(join(__dirname, "../database/contacts.json"))
);

module.exports = ({ userId }) => {
  if (!userId || !userId.endsWith("@s.whatsapp.net")) return;
  const isContactExist = contacts.some((contact) => contact === userId);
  if (isContactExist) return;
  contacts.push(userId);
  writeFileSync(
    join(__dirname, "../database/contacts.json"),
    JSON.stringify(userId)
  );
};
