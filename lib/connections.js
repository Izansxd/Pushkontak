const logging = require("./logging");
const parsePhoneNumber = require("libphonenumber-js");

const options = async (number) => {
  /*///////
   * {*} Prerelease {*}
   */ //*/
  try {
    const phoneNumber = await parsePhoneNumber(`+${number}`);
    if (!phoneNumber?.isValid()) {
      logging("error", "Gagal Mendaftarkan nomor", `${number} Tidak Valid\n`);
      process.exit();
    }
  } catch (err) {
    logging("error", "Connection", "Reybot Maintance");
  }
};

const open = async (reybot) => {
  try {
    await reybot.sendMessage(`${reybot.user.id.split(":")[0]}@s.whatsapp.net`, {
      text: "Connected",
    });
    logging("success", "Connected", reybot.user.name);
  } catch (err) {}
};

module.exports = { options, open };
