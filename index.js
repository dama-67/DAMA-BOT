const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log('✅ DAMA-BOT شغال!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if(!msg.message) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const from = msg.key.remoteJid;

        if(text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: '🏓 Pong! DAMA-BOT شغال تمام' });
        }
        if(text.toLowerCase() === '.منيو') {
            await sock.sendMessage(from, { text: '*قائمة DAMA-BOT:*\n\n.ping - فحص البوت\n.منيو - عرض القائمة' });
        }
    });
}

startBot();
require('http').createServer((req,res)=>res.end('DAMA BOT ONLINE')).listen(process.env.PORT || 3000)
