"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncomingMessage = handleIncomingMessage;
const WhatsappSession_model_1 = __importDefault(require("../model/whatsapp/WhatsappSession.model"));
const WhatsappBooking_model_1 = __importDefault(require("../model/whatsapp/WhatsappBooking.model"));
const pinnacle_service_1 = require("./pinnacle.service");
const PUJA_LIST = [
    'Rudrabhishek',
    'Grah Shanti',
    'Pitra Dosh Puja',
    'Griha Pravesh Puja',
    'Other Puja',
];
const MAIN_MENU = `Namaste 🙏\nPandit Ji At Request mein aapka swagat hai.\n\n` +
    `Aap kya karna chahenge?\n\n` +
    `1️⃣ Puja Book Karni Hai\n` +
    `2️⃣ Pandit Ji Se Baat Karni Hai\n` +
    `3️⃣ Puja Price Dekhna Hai\n` +
    `4️⃣ Apni Booking Check Karni Hai`;
const PUJA_MENU = `Kaunsi puja book karni hai?\n\n` +
    `1️⃣ Rudrabhishek\n` +
    `2️⃣ Grah Shanti\n` +
    `3️⃣ Pitra Dosh Puja\n` +
    `4️⃣ Griha Pravesh Puja\n` +
    `5️⃣ Other Puja`;
function normalize(text) {
    return text.trim().toLowerCase();
}
function buildConfirmationSummary(data) {
    return (`Kripya details confirm karein:\n\n` +
        `*Puja:* ${data.pujaName}\n` +
        `*Name:* ${data.name}\n` +
        `*Gotra:* ${data.gotra || 'N/A'}\n` +
        `*City:* ${data.city}\n` +
        `*Date:* ${data.preferredDate}\n` +
        `*Mode:* ${data.mode}\n\n` +
        `Reply *1* to Confirm ✅\n` +
        `Reply *2* to Edit ✏️`);
}
async function saveBooking(phone, data) {
    try {
        const booking = await WhatsappBooking_model_1.default.create({
            source: 'whatsapp',
            phone,
            name: data.name,
            gotra: data.gotra || '',
            pujaName: data.pujaName,
            city: data.city,
            preferredDate: data.preferredDate,
            mode: data.mode,
            status: 'pending',
            paymentStatus: 'pending',
        });
        console.log(`[WhatsApp Bot] Booking created: ${String(booking._id)} for phone ${phone}`);
        await (0, pinnacle_service_1.sendTextMessage)(phone, `Aapki booking request receive ho gayi hai 🙏\n\n` +
            `Hamari team jaldi hi pandit ji assign karke payment link WhatsApp par share karegi.\n\n` +
            `*Booking Status:* Pending\n` +
            `*Booking ID:* ${String(booking._id)}\n\n` +
            `Dhanyawad! 🙏\n"menu" type karein kuch aur karne ke liye.`);
    }
    catch (error) {
        console.error('[WhatsApp Bot] Failed to save booking:', error?.message);
        await (0, pinnacle_service_1.sendTextMessage)(phone, `Khed hai, booking save karne mein kuch samasya aa gayi. ` +
            `Kripya thodi der baad dobara try karein ya helpline par call karein.`);
    }
}
async function handleIncomingMessage(phone, messageText) {
    const input = normalize(messageText);
    // Get or create session
    let session = await WhatsappSession_model_1.default.findOne({ phone });
    if (!session) {
        session = new WhatsappSession_model_1.default({ phone, step: 'START', data: {}, lastMessage: '' });
    }
    // Global override commands — work from any step
    if (input === 'menu' || input === 'main menu') {
        session.step = 'START';
        session.data = {};
        session.markModified('data');
        await session.save();
        await (0, pinnacle_service_1.sendTextMessage)(phone, MAIN_MENU);
        return;
    }
    if (input === 'cancel') {
        session.step = 'START';
        session.data = {};
        session.markModified('data');
        await session.save();
        await (0, pinnacle_service_1.sendTextMessage)(phone, `Aapki request cancel kar di gayi hai. 🙏\n\n` +
            `Dobara shuru karne ke liye "hi" bhejein ya "menu" type karein.`);
        return;
    }
    session.lastMessage = messageText;
    switch (session.step) {
        // ── ENTRY POINT ──────────────────────────────────────────────────────────
        case 'START':
        case 'DONE': {
            const greetings = ['hi', 'hello', 'namaste', 'namaskar', 'hii', 'hey', 'book'];
            if (greetings.some((g) => input.includes(g)) || input === '1') {
                session.step = 'MAIN_MENU';
                await session.save();
                await (0, pinnacle_service_1.sendTextMessage)(phone, MAIN_MENU);
            }
            else {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Namaste 🙏\n\nSwagat hai! "hi" type karein ya "menu" bhejein shuru karne ke liye.`);
            }
            break;
        }
        // ── MAIN MENU SELECTION ──────────────────────────────────────────────────
        case 'MAIN_MENU': {
            if (input === '1' || input.includes('book') || input.includes('puja')) {
                session.step = 'ASK_PUJA';
                await session.save();
                await (0, pinnacle_service_1.sendTextMessage)(phone, PUJA_MENU);
            }
            else if (input === '2' || input.includes('baat') || input.includes('pandit')) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Pandit Ji se baat karne ke liye hamare helpline par call karein.\n\n` +
                    `"menu" type karein wapas jaane ke liye.`);
            }
            else if (input === '3' || input.includes('price') || input.includes('dakshina')) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Puja prices ke liye hamari website visit karein ya helpline par call karein.\n\n` +
                    `"menu" type karein wapas jaane ke liye.`);
            }
            else if (input === '4' || input.includes('check') || input.includes('booking status')) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Booking status check karne ke liye helpline par call karein.\n\n` +
                    `"menu" type karein wapas jaane ke liye.`);
            }
            else {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya sahi option chunein:\n\n` +
                    `1️⃣ Puja Book Karni Hai\n` +
                    `2️⃣ Pandit Ji Se Baat Karni Hai\n` +
                    `3️⃣ Puja Price Dekhna Hai\n` +
                    `4️⃣ Apni Booking Check Karni Hai\n\n` +
                    `Sirf number type karein (1, 2, 3, ya 4)`);
            }
            break;
        }
        // ── PUJA SELECTION ───────────────────────────────────────────────────────
        case 'ASK_PUJA': {
            let pujaName = null;
            if (input === '1')
                pujaName = PUJA_LIST[0];
            else if (input === '2')
                pujaName = PUJA_LIST[1];
            else if (input === '3')
                pujaName = PUJA_LIST[2];
            else if (input === '4')
                pujaName = PUJA_LIST[3];
            else if (input === '5')
                pujaName = PUJA_LIST[4];
            else {
                // Allow user to type puja name directly
                const matched = PUJA_LIST.find((p) => input.includes(p.toLowerCase()));
                if (matched)
                    pujaName = matched;
            }
            if (pujaName) {
                session.data = { ...session.data, pujaName };
                session.markModified('data');
                session.step = 'ASK_NAME';
                await session.save();
                await (0, pinnacle_service_1.sendTextMessage)(phone, `✅ Puja selected: *${pujaName}*\n\nAapka poora naam kya hai?`);
            }
            else {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya sahi option chunein:\n\n${PUJA_MENU}\n\nSirf number type karein (1 se 5)`);
            }
            break;
        }
        // ── NAME ─────────────────────────────────────────────────────────────────
        case 'ASK_NAME': {
            const name = messageText.trim();
            if (name.length < 2) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya apna poora naam likhein (kam se kam 2 akshar).`);
                break;
            }
            session.data = { ...session.data, name };
            session.markModified('data');
            session.step = 'ASK_GOTRA';
            await session.save();
            await (0, pinnacle_service_1.sendTextMessage)(phone, `Dhanyawad! 🙏\n\nAapka *Gotra* kya hai?\n(Agar malum nahi hai toh "nahi pata" likhein)`);
            break;
        }
        // ── GOTRA ────────────────────────────────────────────────────────────────
        case 'ASK_GOTRA': {
            const gotra = messageText.trim();
            session.data = { ...session.data, gotra };
            session.markModified('data');
            session.step = 'ASK_CITY';
            await session.save();
            await (0, pinnacle_service_1.sendTextMessage)(phone, `Aap kis *city* mein hain?\n(Apne sheher ka naam likhein)`);
            break;
        }
        // ── CITY ─────────────────────────────────────────────────────────────────
        case 'ASK_CITY': {
            const city = messageText.trim();
            if (city.length < 2) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya apne sheher ka naam likhein.`);
                break;
            }
            session.data = { ...session.data, city };
            session.markModified('data');
            session.step = 'ASK_DATE';
            await session.save();
            await (0, pinnacle_service_1.sendTextMessage)(phone, `Aapko puja *kab* karwani hai?\n\nDate likhein (jaise: 15 June 2025 ya 15/06/2025)`);
            break;
        }
        // ── DATE ─────────────────────────────────────────────────────────────────
        case 'ASK_DATE': {
            const preferredDate = messageText.trim();
            if (preferredDate.length < 3) {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya preferred date likhein (jaise: 15 June 2025).`);
                break;
            }
            session.data = { ...session.data, preferredDate };
            session.markModified('data');
            session.step = 'ASK_MODE';
            await session.save();
            await (0, pinnacle_service_1.sendTextMessage)(phone, `Puja *kahan* karwani hai?\n\n` +
                `1️⃣ Home (Ghar pe)\n` +
                `2️⃣ Temple (Mandir mein)\n` +
                `3️⃣ Online (Video call pe)\n\n` +
                `Sirf number type karein (1, 2, ya 3)`);
            break;
        }
        // ── PUJA MODE ────────────────────────────────────────────────────────────
        case 'ASK_MODE': {
            let mode = null;
            if (input === '1' || input.includes('home') || input.includes('ghar'))
                mode = 'Home';
            else if (input === '2' || input.includes('temple') || input.includes('mandir'))
                mode = 'Temple';
            else if (input === '3' || input.includes('online'))
                mode = 'Online';
            if (mode) {
                session.data = { ...session.data, mode };
                session.markModified('data');
                session.step = 'CONFIRM_BOOKING';
                await session.save();
                await (0, pinnacle_service_1.sendTextMessage)(phone, buildConfirmationSummary(session.data));
            }
            else {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya sahi option chunein:\n\n1️⃣ Home\n2️⃣ Temple\n3️⃣ Online\n\nSirf 1, 2, ya 3 type karein.`);
            }
            break;
        }
        // ── CONFIRM OR EDIT ──────────────────────────────────────────────────────
        case 'CONFIRM_BOOKING': {
            const isConfirm = input === '1' ||
                input.includes('confirm') ||
                input.includes('yes') ||
                input.includes('haan') ||
                input.includes('ok');
            const isEdit = input === '2' || input.includes('edit') || input.includes('change') || input.includes('nahi');
            if (isConfirm) {
                const dataSnapshot = { ...session.data };
                session.step = 'DONE';
                session.data = {};
                session.markModified('data');
                await session.save();
                await saveBooking(phone, dataSnapshot);
            }
            else if (isEdit) {
                session.step = 'ASK_PUJA';
                session.data = {};
                session.markModified('data');
                await session.save();
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Theek hai! Aao dobara shuru karte hain. 🙏\n\n${PUJA_MENU}`);
            }
            else {
                await (0, pinnacle_service_1.sendTextMessage)(phone, `Kripya sirf *1* (Confirm) ya *2* (Edit) type karein.\n\n${buildConfirmationSummary(session.data)}`);
            }
            break;
        }
        // ── FALLBACK ─────────────────────────────────────────────────────────────
        default: {
            session.step = 'START';
            session.data = {};
            session.markModified('data');
            await session.save();
            await (0, pinnacle_service_1.sendTextMessage)(phone, MAIN_MENU);
        }
    }
}
