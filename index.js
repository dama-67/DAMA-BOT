require('http').createServer((req,res)=>res.end('DAMA BOT ONLINE - WAITING FOR PAIRING CODE')).listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false // قفلنا الـ QR
    });

    // لو مفيش جلسة، اطلب كود ربط
    if (!sock.authState.creds.registered) {
        console.log("\n=================================");
        const phoneNumber = await question('📱 اكتب رقمك بكود الدولة بدون + مثال 2010xxxxxxxx: ');
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        try {
            const code = await sock.requestPairingCode(cleanNumber);
            console.log(`\n✅ كود الربط بتاعك هو: ${code}`);
            console.log("روح واتساب > الاجهزة المرتبطة > ربط جهاز > الربط برقم هاتف واكتب الكود ده\n");
            console.log("=================================\n");
        } catch (e) {
            console.log("❌ حصل خطأ في طلب الكود، اتأكد من الرقم وحاول تاني");
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("الاتصال اتقفل، بيعيد التشغيل...");
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log('✅ DAMA-BOT شغال واتربط بنجاح!');
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
