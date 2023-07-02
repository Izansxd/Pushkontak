const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const logging = require("../lib/logging");
const { readFileSync, writeFileSync, unlinkSync } = require("fs");
const logger = require("pino");
const { join } = require("path");
const { tmpdir } = require("os");
const Crypto = require("crypto");
const ff = require("fluent-ffmpeg");
const webp = require("node-webpmux");

const saveUsers = require("../lib/saveUsers");

module.exports = async ({ reybot, msg, isGroup, connectReybotWhatsapp }) => {
  const users = JSON.parse(
    readFileSync(join(__dirname, "../database/users.json"))
  );
  const contacts = JSON.parse(
    readFileSync(join(__dirname, "../database/contacts.json"))
  );
  if (isGroup) {
    /*///////
     * {*} Only fromMe {*}
     * //*/
    if (msg.key) {
      const userId = msg.key.participant;
      const fromMe = msg.key.fromMe;
      const pushName = msg.pushName;
      saveUsers({ userId });
      const groupId = msg.key.remoteJid;
      let metadataGroup;
      let groupParticipants;
      try {
        metadataGroup = await reybot.groupMetadata(groupId);
        groupParticipants = metadataGroup.participants.map((part) => part.id);
      } catch (err) {
        logging("error", "Error Get Metadata Group", err);
      }
      if (msg.message) {
        /*///////
         * {*} Messages Types Text / Conversation {*}
         * //*/
        const msgTxt = msg.message.extendedTextMessage
          ? msg.message.extendedTextMessage.text
          : msg.message.conversation;
        if (msg.message && msgTxt) {
          /*///////
           * {*} Start Me {*}
           */ //*/
          const meRegex = new RegExp(/^\.Me(nu)?\b/i);
          if (meRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", `Get Message`, msgTxt);
            try {
              const templateMessage = {
                image: {
                  url: join(__dirname, "../groupPict.jpeg"),
                },
                caption: `*KezgaaofficialVIPヅ* | Menu\n\n🪧 *_Groups Chat_*\n▪️.menu = Menampilkan Semua Fitur\n▪️.info = Informasi Group\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Member Group)\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Member Group Dengan Gambar)\n▪️.clone [nama group] = Duplikat Group Beserta Membernya\n▪️.saveUser = Save Semua Nomor Member Group Ke Database Users\n▪️.saveContact = Save Semua Nomor Member Group Ke Database Contacts\n▪️.dropUser = Hapus Semua Data Users Di Database Users\n▪️.dropContact = Hapus Semua Data Contacts Di Database Contacts\n▪️.sticker = Membuat Sticker Di Group (Dengan Gambar)\n\n🪧 *_Private Chat_*\n▪️.menu = Menampilkan Semua Fitur\n▪️️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Orang Yang Ada Di Database Users)\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Orang Yang Ada Di Database Users Dengan Gambar)\n▪️.save [nama] = Auto Generate Contact\n▪️.exportContact = Export Contact & Generate File vcf\n▪️.dropUser = Hapus Semua Data Users Di Database Users\n▪️.dropContact = Hapus Semua Data Contacts Di Database Contacts\n▪️.sticker = Membuat Sticker (Dengan Gambar)\n\n*Tutorial :* https://youtube.com/@Kezgaaxx_\n*Instagram :* https://instagram.com/kezgaazxx_\n*Whatsapp :* wa.me/6283134291600`,
                headerType: 4,
                mentions: ["6283134291600@s.whatsapp.net"],
              };
              await reybot.sendMessage(groupId, templateMessage, {
                quoted: msg,
              });
            } catch (err) {
              logging("error", "Error endMessage", err);
            }
          }
          /*///////
           * {*} End Me
           */ //*/
          /*//////
           * {*} Get Info Groups {*}
           * //*/
          const regexInfo = new RegExp(/^\.Info\b/i);
          if (regexInfo.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", `Get Message`, msgTxt);
            try {
              const templateText = `*KezgaaVIP ヅ* | Group info\n\n*Group Name :* ${
                metadataGroup.subject
              }\n*Group ID :* ${
                metadataGroup.id.split("@")[0]
              }\n*Group Owner :* +${
                metadataGroup.owner.split("@")[0]
              }\n*Total Member Group :* ${groupParticipants.length}`;
              await reybot.sendMessage(
                groupId,
                {
                  text: templateText,
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { qouted: msg }
              );
            } catch (err) {
              logging("error", "Error get Info Group", err);
            }
          }
          /*//////
           * {*} End Get Info Groups {*}
           * //*/
          /*//////
           * {*} Start Push Contact Fitur Groups {*}
           */ //*/
          const regexPushCont = new RegExp(/^\.pushCont(act)?\s/i);
          if (regexPushCont.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            const parseMessage = msgTxt.replace(/^\.pushCont(act)?\s*/i, "");
            const messagePushCont = parseMessage.split("|")[0];
            const delayPushCont = parseInt(parseMessage.split("|")[1]);
            if (!messagePushCont) {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Format Tidak Valid\n\n*_Contoh_:* .pushCont Pesan Push Contact|3000`,
                    mentions: [`6283134291600@s.whatsapp.net`],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else if (isNaN(delayPushCont)) {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficialヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Dibelakang pesan tambahkan delay, Jeda berapa Milidetik setiap mengirim pesan & harus berformat angka\n\n*_Contoh_:* .pushCont ${messagePushCont}|3000`,
                    mentions: [`6283134291600@s.whatsapp.net`],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Push Contact Start*\n*Target :* ${groupParticipants.length} users\n*Pesan :* ${messagePushCont}\n*Delay :* ${delayPushCont} Milidetik`,
                    mentions: ["6283134291600@s.whatsapp.net"],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", err);
              }
              let sent = 0;
              const loopBroadcast = setInterval(async () => {
                if (groupParticipants.length === sent) {
                  try {
                    await reybot.sendMessage(
                      groupId,
                      {
                        text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Push Contact Selesai*\n*Pesan Berhasil dikirim ke _${sent}_ users*`,
                        mentions: ["6283134291600@s.whatsapp.net"],
                      },
                      { quoted: msg }
                    );
                  } catch (err) {
                    logging("error", "Error Send Message", err);
                  }
                  logging(
                    "success",
                    `Push Contact Successfully`,
                    `Sent to ${sent} Users`
                  );
                  clearInterval(loopBroadcast);
                } else {
                  try {
                    await reybot.sendMessage(groupParticipants[sent], {
                      text: `${messagePushCont}`,
                    });
                  } catch (err) {
                    logging("error", "Error Push Contacts", err);
                  }
                  sent++;
                  logging(
                    "error",
                    `Push Contact sent ${sent}`,
                    groupParticipants[sent - 1]
                  );
                }
              }, delayPushCont);
            }
          }
          /*//////
           * {*} End Push Contact Fitur Groups {*}
           * //*/
          /*//////
           * {*} Clone Group {*}
           */ //*/
          const cloneRegex = new RegExp(/^\.Clone\b\s/i);
          if (cloneRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                groupId,
                {
                  text: `*RaffOfficial* | Cloning Group\n\n*Cloning Group Dan Semua Member Start*`,
                },
                { quoted: msg }
              );
              const nameGroup = msgTxt.replace(/^\.Clone\b\s*/i, "");
              const groupPict = readFileSync(
                join(__dirname, "../groupPict.jpeg")
              );
              const group = await reybot.groupCreate(
                `${nameGroup}`,
                groupParticipants
              );
              await reybot.groupSettingUpdate(group.id, "locked");
              await reybot.sendMessage(group.id, {
                caption: `*Hallo Selamat datang semua di Group ${nameGroup}*`,
                image: groupPict,
                headerType: 4,
              });
              await reybot.groupSettingUpdate(group.id, "announcement");
              logging("success", "Successfully Create Group", nameGroup);
            } catch (err) {
              logging("error", "Error Cloning group", err);
            }
          }
          /*///////
           * {*} End Clone Group {*}
           */ //*/
          /*//////
           * {*} Save All Members Group to Database Users {*}
           */ //*/
          const regexSaveUsers = new RegExp(/^\.Sa?ve?Us(er)?\b/i);
          if (regexSaveUsers.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                groupId,
                {
                  text: `*KEZGAAOfficial ヅ* | Save Users\n\n*Save Users Start*\n*Total Member Group :* ${groupParticipants.length}`,
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
              const saveUsers = async () => {
                for (let i = 0; i < groupParticipants.length; i++) {
                  users.push(groupParticipants[i]);
                }
              };
              await saveUsers();
              writeFileSync(
                join(__dirname, "../database/users.json"),
                JSON.stringify(users)
              );
              logging("primary", "Save Users Successfully", groupParticipants);
            } catch (err) {
              logging("error", "Error Save User", err);
            } finally {
              await reybot.sendMessage(
                groupId,
                {
                  text: `*KEZGAAOfficial ヅ* | Save users\n\n*${groupParticipants.length} Nomor Member Dari Group Ini Telah Berhasil Disimpan Ke Database Users*`,
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
            }
          }
          /*///////
           * {*} End Save All Members Group to Database Users {*}
           */ //*/
          /*///////
           * {*} Save All Members Group to Database Contacts {*}
           */ //*/
          const saveContactsRegex = new RegExp(/^\.Sa?ve?Cont(act)?\b/i);
          if (saveContactsRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                groupId,
                {
                  text: `*KEZGAAOfficial ヅ* | Save Contacts\n\n*Save Contacts Start*\n*Total Member Group :* ${groupParticipants.length}`,
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
              const saveContact = async () => {
                for (let i = 0; i < groupParticipants.length; i++) {
                  contacts.push(groupParticipants[i]);
                }
              };
              await saveContact();
              writeFileSync(
                join(__dirname, "../database/contacts.json"),
                JSON.stringify(contacts)
              );
              logging(
                "primary",
                "Save Contacts Successfully",
                groupParticipants
              );
            } catch (err) {
              logging("error", "Error Save Contacts", err);
            } finally {
              await reybot.sendMessage(
                groupId,
                {
                  text: `*KEZGAAOfficial ヅ* | Save Contacts\n\n*${groupParticipants.length} Nomor Member Dari Group Ini Telah Berhasil Disimpan Ke Database Contacts*`,
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
            }
          }
          /*//////
           * {*} End Save All Members Group to Database Contacts {*}
           */ //*/
          /*///////
           * {*} Exports All Contacts {*}
           */ //*/
          const exportContactRegex = new RegExp(/^\.exportCont(act)?\b/i);
          if (exportContactRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            if (contacts.length === 0) {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Export Contact\n\n*Database Contact Masih Kosong*\n*Simpan Beberapa Nomor Terlebih Dahulu Jika Ingin Menggunakan Fitur Ini*`,
                    mentions: ["6283134291600@s.whatsapp.net"],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", err);
              }
            } else {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: "*6283134291600 ヅ* | Export Contact\n\n*Generate Contact*\n*Mohon tunggu Sebentar*",
                    mentions: ["KEZGAAOfficial@s.whatsapp.net"],
                  },
                  { quoted: msg }
                );
                const uniqueContacts = [...new Set(contacts)];
                const vcardContent = uniqueContacts
                  .map((contact, index) => {
                    const vcard = [
                      "BEGIN:VCARD",
                      "VERSION:3.0",
                      `FN:WA[${index}] ${contact.split("@")[0]}`,
                      `TEL;type=CELL;type=VOICE;waid=${
                        contact.split("@")[0]
                      }:+${contact.split("@")[0]}`,
                      "END:VCARD",
                      "",
                    ].join("\n");
                    return vcard;
                  })
                  .join("");
                writeFileSync(
                  join(__dirname, "../database/contacts.vcf"),
                  vcardContent,
                  "utf8"
                );
              } catch (err) {
                logging("error", "Error Send Message", err);
              } finally {
                await reybot.sendMessage(
                  groupId,
                  {
                    document: readFileSync(
                      join(__dirname, "../database/contacts.vcf")
                    ),
                    fileName: "contacts.vcf",
                    caption: "Export Contact Success",
                    mimetype: "text/vcard",
                  },
                  { quoted: msg }
                );
                contacts.splice(0, contacts.length);
                writeFileSync(
                  join(__dirname, "../database/contacts.json"),
                  JSON.stringify(contacts)
                );
              }
            }
          }
          /*////////
           * {*} Ends Exports All Contacts {*}
           */ //*/
          /*///////
           * {*} Drop All Database Users {*}
           */ //*/
          const dropUser = new RegExp(/^\.dropUs(er)?\b/i);
          if (dropUser.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                groupId,
                {
                  text: "*ReybotVIP ヅ* | Drop Database Users\n\n*Baik _Tunggu Sebentart_*",
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
              users.splice(0, users.length);
              writeFileSync(
                join(__dirname, "../database/users.json"),
                JSON.stringify(users)
              );
            } catch (err) {
              logging("error", "Error Drop Database Users", err);
            } finally {
              await reybot.sendMessage(
                groupId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Users\n\n*Done _Drop Database Users Berhasil_*",
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
            }
          }
          /*///////
           * {*} End Drop All Database Users {*}
           */ //*/
          /*///////
           * {*} Drop All Database Contacts {*}
           */ //*/
          const dropContact = new RegExp(/^\.dropCont(act)?\b/i);
          if (dropContact.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                groupId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Contacts\n\n*Baik _Tunggu Sebentart_*",
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
              contacts.splice(0, contacts.length);
              writeFileSync(
                join(__dirname, "../database/contacts.json"),
                JSON.stringify(contacts)
              );
            } catch (err) {
              logging("error", "Error Drop Database Contacts", err);
            } finally {
              await reybot.sendMessage(
                groupId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Contacts\n\n*Done _Drop Database Contacts Berhasil_*",
                  mentions: ["6283134291600@s.whatsapp.net"],
                },
                { quoted: msg }
              );
            }
          }
          /*///////
           * {*} End Drop All Database Contacts {*}
           */ //*/
        }
        /*//////
         * {*} End Messages Types Text / Conversation {*}
         * //*/
        /*//////
         * {*} Messages Types Images {*}
         * //*/
        if (msg.message && msg.message.imageMessage) {
          const caption = msg.message.imageMessage.caption;
          /*//////
           * {*} Start Push Contact With Image Message
           * //*/
          const regexPushCont = new RegExp(/^\.pushCont(act)?\s/i);
          if (regexPushCont.test(caption)) {
            if (!fromMe) return;
            logging("info", "Get Message", caption);
            const parseMessage = caption.replace(/^\.pushCont(act)?\s*/i, "");
            const messagePushCont = parseMessage.split("|")[0];
            const delayPushCont = parseInt(parseMessage.split("|")[1]);
            if (!messagePushCont) {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Format Tidak Valid\n\n*_Contoh_:* .pushCont Pesan Push Contact|3000`,
                    mentions: [`6283134291600@s.whatsapp.net`],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else if (isNaN(delayPushCont)) {
              try {
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Dibelakang pesan tambahkan delay, Jeda berapa Milidetik setiap mengirim pesan & harus berformat angka\n\n*_Contoh_:* .pushCont ${messagePushCont}|3000`,
                    mentions: [`6283134291600@s.whatsapp.net`],
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else {
              try {
                const imgPushContact = await downloadMediaMessage(
                  msg,
                  "buffer",
                  {},
                  { logger }
                );
                await reybot.sendMessage(
                  groupId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Push Contact Start*\n*Total Member :* ${groupParticipants.length}\n*Pesan :* ${messagePushCont}\n*Delay :* ${delayPushCont} Milidetik`,
                    mentions: ["6283134291600@s.whatsapp.net"],
                  },
                  { quoted: msg }
                );
                let sent = 0;
                const loopBroadcast = setInterval(async () => {
                  if (groupParticipants.length === sent) {
                    await reybot.sendMessage(
                      groupId,
                      {
                        text: `*RaffOfficial ヅ* | Push contact\n\n*Push Contact Selesai*\n*Pesan Berhasil dikirim ke _${sent}_ users*`,
                        mentions: ["6281338617304@s.whatsapp.net"],
                      },
                      { quoted: msg }
                    );
                    logging(
                      "success",
                      `Push Contact Successfully`,
                      `Sent to ${sent} Users`
                    );
                    clearInterval(loopBroadcast);
                  } else {
                    await reybot.sendMessage(groupParticipants[sent], {
                      caption: `${messagePushCont}`,
                      image: imgPushContact,
                      headerType: 4,
                    });
                    sent++;
                    logging(
                      "error",
                      `Push Contact sent ${sent}`,
                      groupParticipants[sent - 1]
                    );
                  }
                }, delayPushCont);
              } catch (err) {
                logging("error", "Failed to Push Contact", err);
              }
            }
          }
          /*///////
           * {*} End Push Contact With Images {*}
           */ //*/
          /*///////
           * {*} Create Sticker {*}
           */ //*/
          const stickerRegex = new RegExp(/^\.S(ticker)?\b/i);
          if (stickerRegex.test(caption)) {
            if (!fromMe) return;
            logging("info", "Get Message", caption);
            try {
              const img = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                { logger }
              );
              const sticker = await writeExifImg(img, {
                packname: "ReybotVIP ヅ",
                author: `${pushName}`,
              });
              await reybot.sendMessage(
                groupId,
                { sticker: { url: sticker } },
                { quoted: msg }
              );
            } catch (err) {
              logging("error", "Error create sticker", err);
            }
          }
          /*///////
           * {*} End Sticker {*}
           */ //*/
        }
        /*//////
         * {*} End Message Types Image {*}
         * //*/
      }
    }
    return;
  } else {
    if (msg.key) {
      const userId = msg.key.remoteJid;
      saveUsers({ userId });
      const pushName = msg.pushName;
      const fromMe = msg.key.fromMe;
      if (msg.message) {
        /*///////
         * {*} Message Type Text {*}
         */ //*/
        const msgTxt = msg.message.extendedTextMessage
          ? msg.message.extendedTextMessage.text
          : msg.message.conversation;
        if (msg.message && msgTxt) {
          /*///////
           * {*} Start Me {*}
           */ //*/
          const meRegex = new RegExp(/^\.Me(nu)?\b/i);
          if (meRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", `Get Message`, msgTxt);
            try {
              const templateMessage = {
                image: {
                  url: join(__dirname, "../groupPict.jpeg"),
                },
                caption: `*KEZGAAOfficial ヅ* | Menu\n\n🪧 *_Groups Chat_*\n▪️.menu = Menampilkan Semua Fitur\n▪️.info = Informasi Group\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Member Group)\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Member Group Dengan Gambar)\n▪️.clone [nama group] = Duplikat Group Beserta Membernya\n▪️.saveUser = Save Semua Nomor Member Group Ke Database Users\n▪️.saveContact = Save Semua Nomor Member Group Ke Database Contacts\n▪️.dropUser = Hapus Semua Data Users Di Database Users\n▪️.dropContact = Hapus Semua Data Contacts Di Database Contacts\n▪️.sticker = Membuat Sticker Di Group (Dengan Gambar)\n\n🪧 *_Private Chat_*\n▪️.menu = Menampilkan Semua Fitur\n▪️️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Orang Yang Ada Di Database Users)\n▪️.pushContact [pesan]|[delay] = Push Contact (Kirim Pesan Ke Semua Orang Yang Ada Di Database Users Dengan Gambar)\n▪️.save [nama] = Auto Generate Contact\n▪️.exportContact = Export Contact & Generate File vcf\n▪️.dropUser = Hapus Semua Data Users Di Database Users\n▪️.dropContact = Hapus Semua Data Contacts Di Database Contacts\n▪️.sticker = Membuat Sticker (Dengan Gambar)\n\n*Tutorial :* https://youtube.com/@Kezgaaxx_\n*Instagram :* https://instagram.com/kezgaazxx_/\n*Whatsapp :* wa.me/6283134291600`,
                headerType: 4,
                mentions: ["6283134291600@s.whatsapp.net"],
              };
              await reybot.sendMessage(userId, templateMessage, {
                quoted: msg,
              });
            } catch (err) {
              logging("error", "Error endMessage", err);
            }
          }
          /*///////
           * {*} End Me
           */ //*/
          /*/////
           * {*} Start Push Contact {*}
           */ //*/
          const regexPushCont = new RegExp(/^\.pushCont(act)?\s/i);
          if (regexPushCont.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", `Get Message`, msgTxt);
            const parseMessage = msgTxt.replace(/^\.pushCont(act)?\s*/i, "");
            const messagePushCont = parseMessage.split("|")[0];
            const delayPushCont = parseInt(parseMessage.split("|")[1]);
            if (!messagePushCont) {
              try {
                await reybot.sendMessage(
                  userId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Format Tidak Valid\n\n*_Contoh_:* .pushCont Pesan Push Contact|3000`,
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else if (isNaN(delayPushCont)) {
              try {
                await reybot.sendMessage(
                  userId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Dibelakang pesan tambahkan delay, Jeda berapa Milidetik setiap mengirim pesan & harus berformat angka\n\n*_Contoh_:* .pushCont ${messagePushCont}|3000`,
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else {
              pushContact(reybot, msg, userId, messagePushCont, delayPushCont);
            }
          }
          /*///////
           * {*} End Broadcast
           */ //*/
          /*//////
           * {*} Start Save Contacts {*}
           */ //*/
          const contactRegex = new RegExp(/^\.Sa?ve?\s/i);
          if (contactRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", `Get Message`, msgTxt);
            const contactName = msgTxt.replace(/^\.Sa?ve?\s*/i, "");
            try {
              await reybot.sendMessage(
                userId,
                {
                  sticker: {
                    url: join(__dirname, "../alzf1gcip.webp"),
                  },
                },
                { quoted: msg }
              );
              contacts.push(userId);
              writeFileSync(
                join(__dirname, "../database/contacts.json"),
                JSON.stringify(contacts)
              );
              const vcard =
                "BEGIN:VCARD\n" +
                "VERSION:3.0\n" +
                `FN:${contactName}\n` +
                `TEL;type=CELL;type=VOICE;waid=${userId.split("@")[0]}:+${
                  userId.split("@")[0]
                }\n` +
                "END:VCARD";
              await reybot.sendMessage(userId, {
                contacts: {
                  displayName: `${contactName}`,
                  contacts: [{ vcard }],
                },
              });
              await reybot.sendMessage(userId, {
                text: `*ReybotVIP ヅ* | Save\n\n*DONE Nomormu Udah Gua Save*\n*Save Back _${pushName}_*`,
              });
            } catch (err) {
              logging("error", "Error sendMessage", err);
            }
          }
          /*///////
           * {*} End Save Contact {*}
           */ //*/
          /*///////
           * {*} Exports All Contacts {*}
           */ //*/
          const exportContactRegex = new RegExp(/^\.exportCont(act)?\b/i);
          if (exportContactRegex.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            if (contacts.length === 0) {
              try {
                await reybot.sendMessage(
                  userId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Export Contact\n\n*Database Contact Masih Kosong*\n*Simpan Beberapa Nomor Terlebih Dahulu Jika Ingin Menggunakan Fitur Ini*`,
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", err);
              }
            } else {
              try {
                const uniqueContacts = [...new Set(contacts)];
                await reybot.sendMessage(
                  userId,
                  {
                    text: "*KEZGAAOfficial ヅ* | Export Contact\n\n*Generate Contact*\n*Mohon tunggu Sebentar*",
                  },
                  { quoted: msg }
                );
                const vcardContent = uniqueContacts
                  .map((contact, index) => {
                    const vcard = [
                      "BEGIN:VCARD",
                      "VERSION:3.0",
                      `FN:WA[${index}] ${contact.split("@")[0]}`,
                      `TEL;type=CELL;type=VOICE;waid=${
                        contact.split("@")[0]
                      }:+${contact.split("@")[0]}`,
                      "END:VCARD",
                      "",
                    ].join("\n");
                    return vcard;
                  })
                  .join("");
                writeFileSync(
                  join(__dirname, "../database/contacts.vcf"),
                  vcardContent,
                  "utf8"
                );
              } catch (err) {
                logging("error", "Error Send Message", err);
              } finally {
                await reybot.sendMessage(
                  userId,
                  {
                    document: readFileSync(
                      join(__dirname, "../database/contacts.vcf")
                    ),
                    fileName: "contacts.vcf",
                    caption: "Export Contact Success",
                    mimetype: "text/vcard",
                  },
                  { quoted: msg }
                );
                contacts.splice(0, contacts.length);
                writeFileSync(
                  join(__dirname, "../database/contacts.json"),
                  JSON.stringify(contacts)
                );
              }
            }
          }
          /*////////
           * {*} Ends Exports All Contacts {*}
           */ //*/
          /*///////
           * {*} Drop All Database Users {*}
           */ //*/
          const dropUser = new RegExp(/^\.dropUs(er)?\b/i);
          if (dropUser.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                userId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Users\n\n*Baik _Tunggu Sebentart_*",
                },
                { quoted: msg }
              );
              users.splice(0, users.length);
              writeFileSync(
                join(__dirname, "../database/users.json"),
                JSON.stringify(users)
              );
            } catch (err) {
              logging("error", "Error Drop Database Users", err);
            } finally {
              await reybot.sendMessage(
                userId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Users\n\n*Done _Drop Database Users Berhasil_*",
                },
                { quoted: msg }
              );
            }
          }
          /*///////
           * {*} End Drop All Database Users {*}
           */ //*/
          /*///////
           * {*} Drop All Database Contacts {*}
           */ //*/
          const dropContact = new RegExp(/^\.dropCont(act)?\b/i);
          if (dropContact.test(msgTxt)) {
            if (!fromMe) return;
            logging("info", "Get Message", msgTxt);
            try {
              await reybot.sendMessage(
                userId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Contacts\n\n*Baik _Tunggu Sebentart_*",
                },
                { quoted: msg }
              );
              contacts.splice(0, contacts.length);
              writeFileSync(
                join(__dirname, "../database/contacts.json"),
                JSON.stringify(contacts)
              );
            } catch (err) {
              logging("error", "Error Drop Database Contacts", err);
            } finally {
              await reybot.sendMessage(
                userId,
                {
                  text: "*KEZGAAOfficial ヅ* | Drop Database Contacts\n\n*Done _Drop Database Contacts Berhasil_*",
                },
                { quoted: msg }
              );
            }
          }
          /*///////
           * {*} End Drop All Database Contacts {*}
           */ //*/
        }
        /*//////
         * {*} End Message Types Text / Conversation {*}
         */ //*/
        /*//////
         * {*} Start Chat Types Image {*}
         */ //*/
        const msgImg = msg.message.imageMessage;
        if (msg.message && msgImg) {
          const caption = msg.message.imageMessage.caption;
          /*////////
           * {*} Push Contact With Images {*}
           */ //*/
          const regexPushCont = new RegExp(/^\.pushCont(act)?\s/i);
          if (regexPushCont.test(caption)) {
            if (!fromMe) return;
            logging("info", "Get Messages", caption);
            const parseCaption = caption.replace(/^\.pushCont(act)?\s*/i, "");
            const captionPushCont = parseCaption.split("|")[0];
            const delayPushCont = parseInt(parseCaption.split("|")[1]);
            if (!captionPushCont) {
              try {
                await reybot.sendMessage(
                  userId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Format Tidak Valid\n\n*_Contoh_:* .pushCont Pesan Push Contact|3000`,
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else if (isNaN(delayPushCont)) {
              try {
                await reybot.sendMessage(
                  userId,
                  {
                    text: `*KEZGAAOfficial ヅ* | Push contact\n\n*Format Perintah Yang Anda Berikan Tidak Valid*\n*Error :* Dibelakang pesan tambahkan delay, Jeda berapa Milidetik setiap mengirim pesan & harus berformat angka\n\n*_Contoh_:* .pushCont ${captionPushCont}|3000`,
                  },
                  { quoted: msg }
                );
              } catch (err) {
                logging("error", "Error Send Message", msgTxt);
              }
              return;
            } else {
              try {
                const imgPushContact = await downloadMediaMessage(
                  msg,
                  "buffer",
                  {},
                  { logger }
                );
                pushContact(
                  reybot,
                  msg,
                  userId,
                  captionPushCont,
                  delayPushCont,
                  imgPushContact
                );
              } catch (err) {
                logging("info", "Error Push Contact", err);
              }
            }
          }
          /*///////
           * {*} End Broadcast With Images {*}
           */ //*/
          /*///////
           * {*} Create Sticker {*}
           */ //*/
          const stickerRegex = new RegExp(/^\.S(ticker)?\b/i);
          if (stickerRegex.test(caption)) {
            if (!fromMe) return;
            logging("info", "Get Messages", caption);
            try {
              const img = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                { logger }
              );
              const sticker = await writeExifImg(img, {
                packname: "ReybotVIP ヅ",
                author: `${pushName}`,
              });
              await reybot.sendMessage(
                userId,
                { sticker: { url: sticker } },
                { quoted: msg }
              );
            } catch (err) {
              logging("error", "Can't Create Sticker", err);
            }
          }
          /*//////
           * {*} End Create Sticker {*}
           */ //*/
        }
        /*////////
         * {*} End Message Types Image {*}
         */ //*/
      }
    }
  }
  return;
};

const pushContact = async (
  Kezgaa,
  msg,
  userId,
  message,
  delayPushCont,
  imgMessage
) => {
  const users = JSON.parse(
    readFileSync(join(__dirname, "../database/users.json"))
  );
  const contacts = JSON.parse(
    readFileSync(join(__dirname, "../database/contacts.json"))
  );
  const filteredUsers = [...new Set(users)];
  if (filteredUsers.length <= 0) {
    try {
      await reybot.sendMessage(
        userId,
        {
          text: `*KEZGAAOfficial ヅ* | Push Contact\n\n*Database Users ${filteredUsers.length}*\n\nSilahkan join kebeberapa *Group*, Untuk mendapatkan lebih banyak target push contact`,
        },
        { quoted: msg }
      );
    } catch (err) {
      logging("error", "Error sendMessage", err);
    }
  } else {
    try {
      await reybot.sendMessage(
        userId,
        {
          text: `*KEZGAAOfficial ヅ* | Push Contact\n\n*Push Contact start*\n*Target :* ${filteredUsers.length} users\n*Pesan :* ${message}\n*Delay :* ${delayPushCont} Milidetik`,
        },
        { quoted: msg }
      );
    } catch (err) {
      logging("error", "Error sendMessage", err);
    }
    let sent = 1;
    const loopPushContact = setInterval(async () => {
      if (!imgMessage) {
        if (0 === filteredUsers.length - 1) {
          try {
            await reybot.sendMessage(userId, {
              text: `*KEZGAAOfficial ヅ* | Push Contact\n\n*Push Contact Selesai*\n*Pesan Berhasil dikirim ke _${sent}_ users*`,
            });
            clearInterval(loopPushContact);
          } catch (err) {
            logging("error", "Error sendMessage", err);
          }
        } else {
          try {
            await reybot.sendMessage(filteredUsers[0], {
              text: `${message}`,
            });
            logging("error", `Push Contact sent ${sent}`, filteredUsers[0]);
          } catch (err) {
            logging("error", `Push Contact Error ${sent}`, err);
          }
        }
      } else {
        if (0 === filteredUsers.length - 1) {
          try {
            await reybot.sendMessage(userId, {
              text: `*KEZGAAOfficial ヅ* | Push Contact\n\n*Push Contact Selesai*\n*Pesan Berhasil dikirim ke _${sent}_ users*`,
            });
            clearInterval(loopPushContact);
          } catch (err) {
            logging("error", "Error sendMessage", err);
          }
        } else {
          try {
            await reybot.sendMessage(filteredUsers[0], {
              caption: message,
              image: imgMessage,
              headerType: 4,
            });
            logging("error", `Push Contact sent ${sent}`, filteredUsers[0]);
          } catch (err) {
            logging("error", `Push Contact Error ${sent}`, err);
          }
        }
      }
      filteredUsers.splice(0, 1);
      writeFileSync(
        join(__dirname, "../database/users.json"),
        JSON.stringify(filteredUsers)
      );
      sent++;
    }, delayPushCont);
  }
};

async function imageToWebp(media) {
  const tmpFileOut = join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  const tmpFileIn = join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`
  );

  writeFileSync(tmpFileIn, media);

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });

  const buff = readFileSync(tmpFileOut);
  unlinkSync(tmpFileOut);
  unlinkSync(tmpFileIn);
  return buff;
}

async function writeExifImg(media, metadata) {
  let wMedia = await imageToWebp(media);
  const tmpFileIn = join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  const tmpFileOut = join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  writeFileSync(tmpFileIn, wMedia);

  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      "sticker-pack-id": `https://github.com/DikaArdnt/Hisoka-Morou`,
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      emojis: metadata.categories ? metadata.categories : [""],
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    unlinkSync(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return tmpFileOut;
  }
}
