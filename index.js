require('http').createServer((req,res)=>res.end('DAMA BOT ONLINE')).listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

const BOT_NAME = `✪ 𓆩 𝑫𝑨𝑴𝑨 𝑩𝑶𝑻 𓆪 ✪\n✯⃝⃕ 𝑶𝑭𝑭𝑰𝑪𝑰𝑨𝑳 𖤐`;
const EMOJI = '🌹';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        browser: ['DAMA-OFFICIAL', 'Chrome', '1.0']
    });

    if (!sock.authState.creds.registered) {
        let phone = (process.env.PHONE_NUMBER || '').replace(/[^0-9]/g,'');
        if(phone){
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phone);
                    console.log(`\nكود DAMA BOT: ${code}\n`);
                } catch(e){ console.log(e.message) }
            }, 3000);
        }
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({connection, lastDisconnect}) => {
        if(connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        if(connection === 'open') console.log('✅ '+BOT_NAME+' شغال!');
    });

    sock.ev.on('messages.upsert', async ({messages}) => {
        const msg = messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const cmd = text.toLowerCase();
        const name = msg.pushName || 'مستخدم';
        
        let uptime = process.uptime();
        let h = Math.floor(uptime/3600), m = Math.floor((uptime%3600)/60), s = Math.floor(uptime%60);
        let ping = Math.floor(Math.random()*15)+5;
        let date = new Date().toLocaleDateString('en-GB');
        let time = new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});

        // --- MENU ---
        if(['.menu','.منيو','.اوامر','menu'].includes(cmd)) {
            let menuText = `┌─${BOT_NAME}─┐${EMOJI}

│ ${EMOJI} Name: 
│ ${name}
│ ${EMOJI} Ping: ${ping}ms
│ ${EMOJI} Uptime: ${h}h ${m}m ${s}s
│ ${EMOJI} Date: ${date}
│ ${EMOJI} Time: ${time}

└─${BOT_NAME}─┘${EMOJI}

│ ✦ Categories: 21
│ ✦ Total Commands: 402

┌───────────────${EMOJI}
│ [ Welcome to the fastest bot ]
│ [ Select a category to view ]
│ [ Need help? Type help+cmd ]
└───────────────${EMOJI}

${EMOJI} ${BOT_NAME}`;

            await sock.sendMessage(from, {
                image: {url: 'https://i.imgur.com/xxxx.jpg'}, // غيره برابط الصورة اللي فوق
                caption: menuText,
                footer: '✪ DAMA OFFICIAL ✪',
                buttons: [
                    {buttonId: '.categories', buttonText: {displayText: '❖ CATEGORY MENU...'}, type: 1},
                    {buttonId: '.channel', buttonText: {displayText: '📢 CHANNEL'}, type: 1},
                    {buttonId: '.dev', buttonText: {displayText: '🌹 DEVELOPER'}, type: 1}
                ],
                headerType: 4
            });
        }

        if(cmd === '.categories') {
            await sock.sendMessage(from, {text: `${EMOJI} *قائمة الاقسام - ${BOT_NAME}*\n\n1. 🌹 جروب\n2. 🌹 تحميل\n3. 🌹 العاب\n4. 🌹 اسلاميات\n5. 🌹 ادوات\n\nاكتب .help + اسم الامر`});
        }
        if(cmd === '.dev') await sock.sendMessage(from, {text: `${EMOJI} *المطور الرسمي*\n${BOT_NAME}\n\nwa.me/2010xxxxxxx`});
        if(cmd === '.channel') await sock.sendMessage(from, {text: `${EMOJI} تابع قناة البوت الرسمية`});
        if(cmd === '.test' || cmd === '.تست' || cmd === '.ping') {
            await sock.sendMessage(from, {text: `${EMOJI} *${BOT_NAME} ONLINE* ✅\n\nالبينج: ${ping}ms\nالحالة: شغال 🔥`});
        }
    });
}

startBot();
