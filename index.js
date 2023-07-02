const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { open } = require("./lib/connections");
const { join } = require("path");
const P = require("pino");

const logging = require("./lib/logging");

const connectReybotWhatsapp = async () => {
  let auth;
  let waWeb;
  try {
    auth = await useMultiFileAuthState(join(__dirname, "./auth"));
    waWeb = await fetchLatestBaileysVersion();
  } catch (err) {
    logging("error", "Session", err);
  }
  const { state, saveCreds } = auth;
  const reybot = makeWASocket({
    version: waWeb.version,
    printQRInTerminal: true,
    logger: P({ level: "silent" }),
    browser: ["KEZGAA", "Firefox", "2.0.0"],
    auth: state,
    generateHighQualityLinkPreview: true,
  });
  reybot.ev.on("messages.upsert", (m) => {
    const msg = m.messages[0];
    if (msg.key.remoteJid === "status@broadcast") return;
    const isGroup = msg.key.remoteJid.endsWith("@g.us");
    require("./handler/messages")({
      reybot,
      msg,
      isGroup,
      connectReybotWhatsapp,
    });
  });
  reybot.ev.on("group-participants.update", (g) => {
    require("./handler/groups")({ reybot, g });
  });
  reybot.ev.on("call", (c) => {
    require("./handler/calls")({ reybot, c });
  });
  reybot.ev.on("creds.update", saveCreds);
  reybot.ev.on("connection.update", async ({ connection }) => {
    if (connection === "close") connectReybotWhatsapp();
    if (connection === "connecting") {
      logging("info", "Connection", "Connecting");
    }
    if (connection === "masuk") {
      open(reybot);
    }
  });
};

connectReybotWhatsapp();
