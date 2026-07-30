/**
 * Vedic Vivah Sanskar — FRONTEND CONTENT (the soul of the flow)
 * ==================================================================
 * All the *rich, touching, authentic* content lives here in the app and is
 * mapped to the backend catalog by `slug`. The backend (VedicSuperAdmin →
 * Panditji At Request → "Vedic Vivah Sanskar") supplies ONLY the dynamic
 * bits — ritual name, base price, samagri price and the Sampooran package
 * pricing. Everything below — descriptions, significance, mantras, imagery,
 * assurances — is content the product/pandit team curates.
 *
 * Mantras are drawn from the internal research brief (Rig Veda Mandala 10.85,
 * the Grihya Sutras / EkAgni Kanda, and cited customary shlokas) and should
 * receive a final proof by a verified pandit for the specific family tradition
 * before publishing, as recitation details vary by Veda-shakha and region.
 *
 * NOTE: intentionally free of `duration` — the Vivah flow never quotes a
 * ritual "duration" anywhere.
 */

export type MantraBlock = {
  devanagari: string;
  transliteration: string;
  meaning: string;
};

export type SaptapadiStep = {
  step: number;
  devanagari: string;
  transliteration: string;
  blessing: string;
};

export type RitualContent = {
  slug: string;
  part: "pre" | "core" | "post";
  titleEng: string; // display fallback if the backend name is missing
  titleHindi: string;
  transliteration: string;
  subtitle: string; // one short line under the title
  microLine: string; // warm, emotive marketing one-liner
  whatHappens: string;
  significance: string;
  includes?: string[]; // sub-rituals folded into this service
  mantra?: MantraBlock;
  saptapadi?: SaptapadiStep[]; // only for the Seven Steps
  friendshipVow?: MantraBlock; // Saptapadi's sakha declaration
  icon: string; // emoji, safe across platforms
  color: string; // accent color for the card
};

/** Saffron / gold / maroon palette for the ritual cards. */
const C = {
  saffron: "#E86A17",
  gold: "#C9962E",
  maroon: "#8E2C3B",
  deepRed: "#B3202E",
  rose: "#C0567E",
  amber: "#D98324",
  vermilion: "#D33A2C",
  indigo: "#5A4FA3",
  teal: "#1F8A80",
};

/** Canonical ceremony order (the app still respects backend sortOrder). */
export const VIVAH_RITUAL_ORDER: string[] = [
  "kundali-milan",
  "vivah-muhoorat",
  "shagun",
  "ganesh-gauri-puja",
  "haldi-ceremony",
  "mandap-sthapana",
  "vivah-sanskar",
  "mandir-darshan",
  "post-vivah-live-darshan",
];

export const VIVAH_RITUAL_CONTENT: Record<string, RitualContent> = {
  "kundali-milan": {
    slug: "kundali-milan",
    part: "pre",
    titleEng: "Kundali Milan (Guna Milan)",
    titleHindi: "कुंडली मिलान",
    transliteration: "Kuṇḍalī Milān",
    subtitle: "Ashtakoot horoscope matching — 36 guna compatibility",
    microLine:
      "Before two hearts say yes, let the stars whisper their blessing — so your ‘forever’ begins in harmony.",
    whatHappens:
      "Our jyotishi compares the janma-kundalis of the bride and groom through the eight-fold Ashtakoot system — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi — scoring compatibility out of 36 gunas. Nadi, Bhakoot and Mangal (Manglik) dosha are checked, and gentle remedies advised where needed.",
    significance:
      "Marriage in Sanatana Dharma is a lifelong sanskar, not a contract. Guna Milan is the elders' loving diligence — seeing whether two life-energies will harmonise in temperament, mind, health and destiny — so the household begins on a foundation of cosmic goodwill.",
    mantra: {
      devanagari:
        "बृहस्पते अति यदर्यो अर्हाद् द्युमद्विभाति क्रतुमज्जनेषु ॥",
      transliteration:
        "Bṛhaspate ati yad aryo arhād, dyumad vibhāti kratumaj janeṣu.",
      meaning:
        "O Brihaspati (Guru), that which is worthy and supreme, which shines with brilliance and power among people — may it be revealed to us. (An invocation to the lord of wisdom and marriage for right judgement. Rig Veda 2.23.15.)",
    },
    icon: "🔯",
    color: C.indigo,
  },

  "vivah-muhoorat": {
    slug: "vivah-muhoorat",
    part: "pre",
    titleEng: "Vivah Muhurat",
    titleHindi: "विवाह मुहूर्त",
    transliteration: "Vivāha Muhūrta",
    subtitle: "The most auspicious date & time for your wedding",
    microLine:
      "There is a perfect moment written in the sky for your union — let us find it, so heaven itself leans in to bless you.",
    whatHappens:
      "After Panchang Shuddhi, our Pandit Ji fixes the exact auspicious window by aligning Tithi, Nakshatra, Vaar, Yoga, Karana and an auspicious Lagna — avoiding periods when Guru or Shukra are combust. If your date is already fixed, we find the best sacred window within it.",
    significance:
      "A muhurat is a doorway in time. Choosing the moment when the Moon, the stars and the ascendant all lean toward union and longevity is an act of reverence — timing the sacred fire to the rhythm of the heavens, so the vows are witnessed under the kindest possible sky.",
    mantra: {
      devanagari:
        "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥",
      transliteration:
        "Oṁ bhūr bhuvaḥ svaḥ, tat savitur vareṇyaṁ, bhargo devasya dhīmahi, dhiyo yo naḥ pracodayāt.",
      meaning:
        "We meditate upon the adorable effulgence of the radiant Savitr; may He illumine and guide our intellect. (The Gayatri, Rig Veda 3.62.10 — invoked to sanctify the chosen time.)",
    },
    icon: "🕉️",
    color: C.amber,
  },

  shagun: {
    slug: "shagun",
    part: "pre",
    titleEng: "Shagun / Sagai (Tilak)",
    titleHindi: "सगाई / तिलक",
    transliteration: "Sagāī / Tilak",
    subtitle: "The engagement — the sacred word given between two families",
    microLine:
      "A word given with love is a promise the heart never forgets — let the tilak seal two families becoming one.",
    whatHappens:
      "The two families formally commit the alliance. The bride's father or brother applies a tilak to the groom's forehead and offers shagun — sweets, clothes and a token sum — signifying acceptance. Rings may be exchanged, often preceded by a small Ganesh puja.",
    significance:
      "This is the sacred word given and received — the promise before the promise. The tilak seals the families' consent with the mark of Vishnu's blessing on the groom's brow, and shagun sets prosperity flowing between two families now becoming one.",
    mantra: {
      devanagari:
        "शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् । प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥",
      transliteration:
        "Śuklāmbara-dharaṁ Viṣṇuṁ śaśi-varṇaṁ catur-bhujam, prasanna-vadanaṁ dhyāyet sarva-vighnopaśāntaye.",
      meaning:
        "I meditate upon Vishnu, clad in white, moon-hued, four-armed, with a serene face — for the calming of all obstacles.",
    },
    icon: "💍",
    color: C.gold,
  },

  "ganesh-gauri-puja": {
    slug: "ganesh-gauri-puja",
    part: "pre",
    titleEng: "Ganesh–Gauri Puja",
    titleHindi: "गणेश-गौरी पूजा",
    transliteration: "Gaṇeśa–Gaurī Pūjā",
    subtitle: "The auspicious beginning — remover of every obstacle",
    microLine:
      "With the first prayer, every obstacle bows away — and a mother-goddess smiles upon the bride's new beginning.",
    whatHappens:
      "Before any major rite, Lord Ganesha (Vighnaharta) is worshipped so the ceremony proceeds without hindrance, and Goddess Gauri (Parvati) — the ideal of an auspicious, devoted wife — is invoked, especially by the bride, for a blessed married life.",
    significance:
      "Every sacred undertaking opens with Ganesha, so the path ahead is clear. Gauri's worship carries the bride's prayer to embody the grace and strength of Parvati and to receive the blessing of a long, unbroken marriage (akhand saubhagya).",
    mantra: {
      devanagari:
        "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
      transliteration:
        "Vakratuṇḍa mahākāya sūryakoṭi samaprabha, nirvighnaṁ kuru me deva sarva-kāryeṣu sarvadā.",
      meaning:
        "O Lord of the curved trunk and mighty form, radiant as ten million suns — make all my endeavours free of obstacles, always and in every act.",
    },
    icon: "🐘",
    color: C.saffron,
  },

  "haldi-ceremony": {
    slug: "haldi-ceremony",
    part: "pre",
    titleEng: "Haldi Ceremony",
    titleHindi: "हल्दी",
    transliteration: "Haldī",
    subtitle: "Turmeric anointing — the family's love, painted on",
    microLine:
      "Golden hands, golden hearts — the whole family's love, painted onto the skin, so the couple glows from within.",
    whatHappens:
      "A paste of turmeric, sandalwood and rosewater is lovingly applied by family members to the bride and groom in the days before the wedding — a joyous, music-filled ritual that leaves a natural glow.",
    significance:
      "Turmeric's golden hue is the colour of the sun, of prosperity and of Vishnu. It purifies, protects and beautifies the couple before they step into the sacred fire, wards off the evil eye, and lets the whole family bless them with a touch.",
    mantra: {
      devanagari:
        "ॐ हरिद्रे हरिद्रे शुभे मङ्गलदायिनि । लक्ष्मीस्वरूपिणि देवि सर्वदोषान् निवारय ॥",
      transliteration:
        "Oṁ haridre haridre śubhe maṅgala-dāyini, Lakṣmī-svarūpiṇi devi sarva-doṣān nivāraya.",
      meaning:
        "O Turmeric, auspicious one, giver of good fortune, Goddess who is the very form of Lakshmi — remove all impurities and ill. (Customary; corresponds to the classical Mangala-snana purification.)",
    },
    icon: "🌼",
    color: C.gold,
  },

  "mandap-sthapana": {
    slug: "mandap-sthapana",
    part: "pre",
    titleEng: "Mandap & Kalash Sthapana",
    titleHindi: "मण्डप एवं कलश स्थापना",
    transliteration: "Maṇḍapa evaṁ Kalaśa Sthāpanā",
    subtitle: "Consecrating the sacred pavilion & altar",
    microLine:
      "Four pillars, one sacred flame, and a pot that holds all the gods — the little heaven under which your vows will live.",
    whatHappens:
      "The mandap and the vedi (fire-altar) are consecrated, and a Kalash — a pot of water crowned with mango leaves and a coconut — is installed as the seat of all deities and sacred rivers. Punyahavachan, Navagraha, Matrika puja, Ankurarpan and Nandi Shraddha prepare the ground.",
    significance:
      "The mandap becomes a miniature cosmos and the kalash the vessel that draws every god, river and blessing into one spot — so the vows are spoken not in an ordinary place but in a divinely charged sanctuary, with planets pacified and ancestors present.",
    includes: [
      "Ganesh–Gauri Sthapana",
      "Punyahavachan (purification)",
      "Navagraha & Matrika Puja",
      "Ankurarpan & Nandi Shraddha",
    ],
    mantra: {
      devanagari:
        "ॐ आ कलशेषु धावति पवित्रे परि षिच्यते । उक्थैर्यज्ञेषु वर्धते ॥",
      transliteration:
        "Oṁ ā kalaśeṣu dhāvati, pavitre pari ṣicyate, ukthair yajñeṣu vardhate.",
      meaning:
        "The sacred essence flows into the pots, is poured upon the purifying strainer, and grows through hymns in the sacrifices. (Rig Veda 9.17.4 — chanted at Kalash Sthapana.)",
    },
    icon: "⛩️",
    color: C.teal,
  },

  "vivah-sanskar": {
    slug: "vivah-sanskar",
    part: "core",
    titleEng: "Vivah Sanskar — Complete Ceremony",
    titleHindi: "विवाह संस्कार",
    transliteration: "Vivāha Saṁskāra",
    subtitle: "Kanyadaan · Saptapadi & Pheras · Vidaai · Griha Pravesh — the whole sacred day",
    microLine:
      "By the light of a sacred flame that has witnessed a million promises, two people make the one that outlasts their lives.",
    whatHappens:
      "One continuous sacred ceremony, performed end-to-end by our verified Pandit Ji — from Var-mala and Kanyadaan through Panigrahana, the Vivaha Homa before Agni-sakshi, Laja Homa and the seven Saptapadi steps (pheras) around the fire, to Sindoor-daan and Mangalsutra-bandhan — and onward to the Vidaai farewell and the bride's Griha Pravesh into her new home. The single most important rite is the Saptapadi: in Hindu tradition the marriage becomes complete and binding only upon the seventh step.",
    significance:
      "Fire is the mouth of the gods and the incorruptible witness. Vows sworn before Agni are held unbreakable — the flame carries the couple's prayers to the deities and returns their blessings. Seven steps, seven blessings, one shared direction: the final vow transforms marriage into sakhya, friendship — the deepest Vedic ideal of a couple. The ceremony closes with the tender Vidaai and the bride's Griha Pravesh, entering her new home as Lakshmi herself.",
    includes: [
      "Var-mala (garland exchange)",
      "Kanyadaan (giving of the daughter)",
      "Panigrahana / Hastamelap (taking the hand)",
      "Vivaha Homa (sacred fire) & Laja Homa",
      "Saptapadi & Mangal Pheras (seven vows)",
      "Ashmarohana, Sindoor-daan & Mangalsutra-bandhan",
      "Dhruva–Arundhati Darshan",
      "Vidaai (the farewell)",
      "Griha Pravesh (entering the new home)",
    ],
    mantra: {
      devanagari:
        "गृभ्णामि ते सौभगत्वाय हस्तं मया पत्या जरदष्टिर्यथासः ।\nभगो अर्यमा सविता पुरन्धिर्मह्यं त्वादुर्गार्हपत्याय देवाः ॥",
      transliteration:
        "Gṛbhṇāmi te saubhagatvāya hastaṁ, mayā patyā jaradaṣṭir yathāsaḥ; bhago aryamā savitā purandhir, mahyaṁ tvādur gārhapatyāya devāḥ.",
      meaning:
        "I take your hand for the sake of good fortune, that with me as your husband you may attain a ripe old age. The gods Bhaga, Aryaman, Savitr and Purandhi have given you to me, that I may be the master of the household. (Panigrahana rk, Rig Veda 10.85.36.)",
    },
    saptapadi: [
      { step: 1, devanagari: "ॐ एकमिषे विष्णुस्त्वान्वेतु", transliteration: "Oṁ ekam iṣe Viṣṇus tvānvetu", blessing: "For food & nourishment (anna) — may Vishnu follow you" },
      { step: 2, devanagari: "ॐ द्वे ऊर्जे विष्णुस्त्वान्वेतु", transliteration: "Oṁ dve ūrje Viṣṇus tvānvetu", blessing: "For strength & vigour (bala)" },
      { step: 3, devanagari: "ॐ त्रीणि व्रताय विष्णुस्त्वान्वेतु", transliteration: "Oṁ trīṇi vratāya Viṣṇus tvānvetu", blessing: "For the keeping of vows & dharma" },
      { step: 4, devanagari: "ॐ चत्वारि मयोभवाय विष्णुस्त्वान्वेतु", transliteration: "Oṁ catvāri mayobhavāya Viṣṇus tvānvetu", blessing: "For happiness & well-being (sukha)" },
      { step: 5, devanagari: "ॐ पञ्च पशुभ्यो विष्णुस्त्वान्वेतु", transliteration: "Oṁ pañca paśubhyo Viṣṇus tvānvetu", blessing: "For wealth, cattle & progeny" },
      { step: 6, devanagari: "ॐ षट् ऋतुभ्यो विष्णुस्त्वान्वेतु", transliteration: "Oṁ ṣaṭ ṛtubhyo Viṣṇus tvānvetu", blessing: "For well-being through all seasons" },
      { step: 7, devanagari: "ॐ सप्त सप्तभ्यो होत्राभ्यो विष्णुस्त्वान्वेतु", transliteration: "Oṁ sapta saptabhyo hotrābhyo Viṣṇus tvānvetu", blessing: "For fulfilling sacred duties together" },
    ],
    friendshipVow: {
      devanagari:
        "सखा सप्तपदा भव । सख्ये ते गमेयम् । सख्यात्ते मा योषम् । सख्यान्मे मा योष्ठाः ॥",
      transliteration:
        "Sakhā saptapadā bhava; sakhye te gameyam; sakhyāt te mā yoṣam; sakhyān me mā yoṣṭhāḥ.",
      meaning:
        "By taking seven steps you have become my friend. May I attain your friendship; may I never be separated from your friendship; may you never be separated from mine.",
    },
    icon: "🔥",
    color: C.deepRed,
  },

  "mandir-darshan": {
    slug: "mandir-darshan",
    part: "post",
    titleEng: "Mandir Darshan",
    titleHindi: "मंदिर दर्शन",
    transliteration: "Mandir Darśana",
    subtitle: "The couple's first journey together — to the feet of God",
    microLine:
      "Their very first journey as one is to the feet of God — where a new marriage kneels, and rises, blessed.",
    whatHappens:
      "As one of the first acts of married life, the couple visits a temple together to seek the deity's blessing on their union — offering prayers, receiving darshan and prasad, often at their family kuladevata temple.",
    significance:
      "The wedding is crowned by surrender to the Divine: the couple's very first shared journey is toward God, dedicating their new life, home and future children to divine grace — setting the tone for a household lived in remembrance of the Lord.",
    mantra: {
      devanagari:
        "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥",
      transliteration:
        "Oṁ sarve bhavantu sukhinaḥ, sarve santu nirāmayāḥ, sarve bhadrāṇi paśyantu, mā kaścid duḥkha-bhāg bhavet.",
      meaning:
        "May all be happy; may all be free from illness; may all see auspiciousness; may none suffer sorrow. (The universal Shanti mantra, offered as the couple begin married life.)",
    },
    icon: "🛕",
    color: C.gold,
  },
  "post-vivah-live-darshan": {
    slug: "post-vivah-live-darshan",
    part: "post",
    titleEng: "After-Marriage Live Temple Darshan",
    titleHindi: "विवाह पश्चात् लाइव मंदिर दर्शन",
    transliteration: "Vivāha Paścāt Live Mandir Darśana",
    subtitle: "The newlyweds' first blessings — live from a sacred temple",
    microLine:
      "As a couple, receive your very first blessings through a live darshan streamed from a sacred temple — wherever your family is.",
    whatHappens:
      "After the wedding, our Pandit Ji arranges a live, streamed darshan at a temple — a jyotirlinga or a major shrine — where prayers and an aarti are offered in the new couple's name. The family joins the darshan live and receives prasad blessings, so the marriage begins under the deity's grace even when travel isn't possible.",
    significance:
      "The first act of the new household is devotion. A live temple darshan lets the whole family — across cities or countries — share the couple's first blessings together, uniting the marriage with the Divine from its very first day.",
    includes: [
      "Live-streamed darshan at a sacred temple",
      "Sankalp & aarti in the couple's name",
      "Prasad blessings shared with the family",
      "Convenient for NRI & distant family",
    ],
    mantra: {
      devanagari:
        "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ॥",
      transliteration:
        "Oṁ tryambakaṁ yajāmahe sugandhiṁ puṣṭi-vardhanam, urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt.",
      meaning:
        "We worship the three-eyed Lord Shiva, fragrant and nourishing; may He release the couple from bondage into liberation, as a ripe cucumber falls from its vine.",
    },
    icon: "📿",
    color: C.maroon,
  },
};

/** Content for the complete "Sampooran Vivah" package (pricing is dynamic). */
export const SAMPOORAN_CONTENT = {
  titleHindi: "सम्पूर्ण विवाह",
  titleEng: "Sampooran Vivah — Complete Wedding Package",
  microLine:
    "One sacred journey, one trusted Pandit Ji team, from the first horoscope to the first temple bell.",
  discountBadge: "Add all rituals & save 10% on your total",
  blurb:
    "Add every ritual in one tap and let our verified Pandit Ji team hold the entire journey end-to-end — from horoscope matching and muhurat, through every pre-wedding and core rite, the Saptapadi, Vidaai and Griha Pravesh, to your first temple visit as a couple. Choosing the complete package applies a flat 10% discount on your overall billing (rituals + samagri).",
  includes: [
    "Every Vedic ritual — Kundali Milan to Mandir Darshan",
    "Verified Vedic Pandit Ji for the full ceremony",
    "Muhurat & Kundali guidance included",
    "Authentic, pure samagri arranged for every rite",
    "A dedicated coordinator — end-to-end support",
    "Flat 10% off your overall billing",
  ],
  icon: "🪔",
  color: "#8E2C3B",
};

/**
 * DEFAULT pricing catalog — mirrors the server's default (8 rituals + the
 * Sampooran "add-all" package at a flat 10% discount). The app uses this as
 * (a) instant initial state and (b) an offline / failed-fetch fallback, so the
 * ritual PRICES and the full package (with its 10% discount) ALWAYS render even
 * before or without a live catalog. When the `/bookings/vedic-vivah/catalog`
 * endpoint is reachable, the admin-managed values REPLACE these defaults.
 */
export type DefaultCatalogRitual = {
  slug: string;
  name: string;
  price: number;
  samagriPrice: number;
  sortOrder: number;
  isActive: boolean;
};

export const DEFAULT_VIVAH_DISCOUNT_PERCENT = 10;

const DEFAULT_VIVAH_RITUALS: DefaultCatalogRitual[] = [
  { slug: "kundali-milan", name: "Kundali Milan (Guna Milan)", price: 1100, samagriPrice: 0, sortOrder: 1, isActive: true },
  { slug: "vivah-muhoorat", name: "Vivah Muhurat", price: 1100, samagriPrice: 0, sortOrder: 2, isActive: true },
  { slug: "shagun", name: "Shagun / Sagai (Tilak)", price: 5100, samagriPrice: 1500, sortOrder: 3, isActive: true },
  { slug: "ganesh-gauri-puja", name: "Ganesh–Gauri Puja", price: 2100, samagriPrice: 700, sortOrder: 4, isActive: true },
  { slug: "haldi-ceremony", name: "Haldi Ceremony", price: 2100, samagriPrice: 900, sortOrder: 5, isActive: true },
  { slug: "mandap-sthapana", name: "Mandap & Kalash Sthapana", price: 5100, samagriPrice: 2100, sortOrder: 6, isActive: true },
  { slug: "vivah-sanskar", name: "Vivah Sanskar — Complete Ceremony", price: 25400, samagriPrice: 8000, sortOrder: 7, isActive: true },
  { slug: "mandir-darshan", name: "Mandir Darshan", price: 3100, samagriPrice: 700, sortOrder: 8, isActive: true },
  { slug: "post-vivah-live-darshan", name: "After-Marriage Live Temple Darshan", price: 2100, samagriPrice: 300, sortOrder: 9, isActive: true },
];

export const DEFAULT_VIVAH_CATALOG = (() => {
  const fullBase = DEFAULT_VIVAH_RITUALS.reduce((s, r) => s + r.price, 0);
  const fullSamagri = DEFAULT_VIVAH_RITUALS.reduce((s, r) => s + r.samagriPrice, 0);
  const factor = 1 - DEFAULT_VIVAH_DISCOUNT_PERCENT / 100;
  return {
    isActive: true,
    rituals: DEFAULT_VIVAH_RITUALS,
    sampooranVivah: {
      name: SAMPOORAN_CONTENT.titleEng,
      packagePrice: Math.round(fullBase * factor), // 10% off the ritual sum
      samagriPrice: Math.round(fullSamagri * factor),
      discountPercent: DEFAULT_VIVAH_DISCOUNT_PERCENT,
      items: SAMPOORAN_CONTENT.includes,
      image: "",
      fullBase,
      fullSamagri,
    },
  };
})();

/** Trust / assurance themes — for badges and the assurance strip. */
export const VIVAH_ASSURANCES: { icon: string; title: string; text: string }[] = [
  {
    icon: "✅",
    title: "Verified Vedic Pandits",
    text: "Every Pandit Ji is background-verified, shastra-trained, and fluent in the correct mantras and sequence for your tradition — so your vows are spoken exactly as they have been for a thousand years.",
  },
  {
    icon: "🕉️",
    title: "Right Muhurat, Right Rituals",
    text: "We honour the sacred science — the correct muhurat, the correct pheras, the correct order — because on a day this holy, the details are the devotion.",
  },
  {
    icon: "🪔",
    title: "Authentic, Pure Samagri",
    text: "Every offering — the ghee, the grains, the kalash, the flowers — is authentic, clean, and prepared with reverence, so nothing but purity touches your sacred fire.",
  },
  {
    icon: "🤝",
    title: "End-to-End Support",
    text: "From your first question to the final aarti, one caring team walks beside your family — you carry the joy, we carry the rest.",
  },
  {
    icon: "🔒",
    title: "Dignity & Privacy",
    text: "Your family's moments, beliefs and details are held in complete confidence and treated with the respect a sacred occasion demands.",
  },
  {
    icon: "💎",
    title: "Clear, Honest Pricing",
    text: "No hidden costs, no last-minute surprises — transparent prices and samagri, so your trust is never tested on your happiest day.",
  },
];

/** How our team supports the family at every step (the end-to-end journey). */
export const VIVAH_SUPPORT_STEPS: { icon: string; title: string; text: string }[] = [
  {
    icon: "📞",
    title: "1. Talk to us first (free)",
    text: "Not sure where to begin? Request a free callback. Our Vivah expert understands your family's tradition and guides you — no obligation, no charge.",
  },
  {
    icon: "🗓️",
    title: "2. Muhurat & planning",
    text: "We help lock the auspicious date, match the right Pandit Ji to your community, and plan the rituals you need — individually or as one package.",
  },
  {
    icon: "🪔",
    title: "3. Samagri, sorted",
    text: "Bring your own samagri, or let us arrange authentic, pure materials for every rite. Your choice, priced transparently.",
  },
  {
    icon: "🔥",
    title: "4. The ceremony, held with care",
    text: "On the day, your Pandit Ji and a dedicated coordinator ensure every rite flows in the right order, in a language you're comfortable with.",
  },
  {
    icon: "🙏",
    title: "5. We stay with you till the end",
    text: "From Griha Pravesh to your first temple darshan, we're one message away on WhatsApp — right through to the final blessing.",
  },
];

/** FAQ — questions a family asks before booking a Vedic wedding pandit. */
export const VIVAH_FAQ: { q: string; a: string }[] = [
  {
    q: "Is the Pandit Ji genuinely qualified to perform a Vedic wedding?",
    a: "Yes. Every Pandit Ji is background-verified, trained in the Karmakanda (ritual science), and recites authentic mantras from the Grihya Sutras and Rig Veda. We match a Pandit Ji to your community and tradition (Rigvedi / Yajurvedi / Samavedi, and regional custom) so every rite is performed correctly.",
  },
  {
    q: "Can the ceremony be tailored to our family's regional customs?",
    a: "Absolutely. Tell us your tradition and any family-specific customs, and the Pandit Ji adapts the sequence, mantras and samagri accordingly — while keeping the essential Vedic rites (Panigrahana, Saptapadi, Laja Homa, Vivaha Homa) intact.",
  },
  {
    q: "What is included in the samagri (materials) price — and is it pure?",
    a: "Samagri covers all physical materials for the ritual: havan wood and samagri, ghee, grains and puffed rice, kumkum/sindoor, kalash, coconut, mango leaves, flowers, threads and puja items — authentic and clean, from trusted suppliers. If you prefer to arrange your own, there is no samagri charge at all.",
  },
  {
    q: "Do we get a discount if we book everything together?",
    a: "Yes. Choosing the complete Sampooran Vivah package adds every ritual at once and applies a flat 10% discount on your overall billing (rituals + samagri) — the simplest way to have one Pandit Ji team hold your entire wedding, coordinated end-to-end.",
  },
  {
    q: "Can we pay in parts, or must we pay the full amount upfront?",
    a: "Your choice. At checkout you can pay a 50% advance to confirm the booking and settle the balance after the ceremony, or pay the full amount upfront — whichever suits your family. You can also simply request a callback and pay later.",
  },
  {
    q: "How do you decide the wedding muhurat, and what if our dates are fixed?",
    a: "Our Pandit Ji performs Panchang Shuddhi and finds the most auspicious tithi, nakshatra and lagna for you. If your date is already fixed, we identify the best auspicious window within it and advise on any remedies.",
  },
  {
    q: "Can we book just one ritual, or must we take the full package?",
    a: "Either. Every ritual is individually bookable (e.g. only Haldi, only Kundali Milan, only the core Vivah Sanskar). Families who want a seamless, coordinated experience from horoscope to temple choose Sampooran Vivah, which bundles everything at a flat 10% discount.",
  },
  {
    q: "How far in advance should we book, and can you travel to our venue?",
    a: "Book as early as possible — auspicious dates and senior Pandit Ji fill quickly, especially in wedding season. Share your city and address; we confirm Pandit Ji availability, travel and samagri logistics well ahead of the date.",
  },
  {
    q: "What support do we get on the wedding day itself?",
    a: "A dedicated coordinator and your Pandit Ji ensure the rituals flow in the correct order and on time, guide the families through each step in a comfortable language, and handle the samagri and setup — so your family can be fully present in the joy.",
  },
];

/** Copy for the free-consultation section. */
export const VIVAH_CONSULT = {
  title: "Talk to a Pandit Ji — free",
  subtitle: "Not ready to book? Let us guide you first.",
  blurb:
    "Share your name and number and our Vivah expert will call you back — to understand your tradition, suggest the right muhurat and rituals, and answer every question. No charge, no obligation.",
};

/** Hero / intro copy for the top of the page. */
export const VIVAH_HERO = {
  titleHindi: "वैदिक विवाह संस्कार",
  titleEng: "Vedic Vivah Sanskar",
  tagline: "A sacred wedding, exactly as the Vedas intended — held with care from beginning to end.",
  intro:
    "Vivah Sanskara is one of the sixteen sacred sanskars — the rite that joins two souls, two families, and two destinies before Agni, the eternal witness. Choose the rituals your family needs, or let our Pandit Ji hold the entire journey for you.",
};

/**
 * "Know more about Vedic Vivah" — full explainer: what it is, its history,
 * why it matters, and why Pandit Ji At Request. Rendered as an expandable
 * long-form section with shlokas.
 */
export const VIVAH_ABOUT: {
  title: string;
  intro: string;
  sections: { heading: string; body: string; shloka?: MantraBlock }[];
  whyUs: { icon: string; title: string; text: string }[];
} = {
  title: "Know More About Vedic Vivah",
  intro:
    "In Sanatana Dharma, marriage is not a contract but a sacrament — the Vivah Sanskara, one of the sixteen sanskars that shape a Hindu life. It is a lifelong, sacred union of two souls, blessed by the gods and witnessed by Agni, the eternal fire.",
  sections: [
    {
      heading: "What is Vivah Sanskar?",
      body:
        "Vivah Sanskara is the sacred rite that unites a bride and groom into the Grihastha Ashrama — the householder's stage of life, from which all of society's dharma flows. Unlike a mere social event, it is a spiritual covenant: the couple pledge to walk together in dharma (duty), artha (prosperity), and kama (love) for life. The most solemn moment is the vow of fidelity, spoken hand in hand before the sacred fire.",
      shloka: {
        devanagari: "धर्मे च अर्थे च कामे च नातिचरामि ॥",
        transliteration: "Dharme ca arthe ca kāme ca nāticarāmi.",
        meaning:
          "\"In dharma, in prosperity, and in love — I shall never transgress you.\" The spoken pledge of lifelong fidelity, exchanged during the ceremony.",
      },
    },
    {
      heading: "History & Origins",
      body:
        "The Vedic wedding is among the oldest continuously-performed ceremonies on earth. Its core mantras are drawn from Rig Veda Mandala 10, Sukta 85 — the Surya-Soma Vivaha Sukta, the celestial marriage of Surya's daughter — and its sequence was codified in the Grihya Sutras (the household ritual manuals) over two-and-a-half millennia ago. Panigrahana, Saptapadi, Laja Homa and the pheras have been performed, almost unchanged, for a hundred generations — a living thread connecting every Hindu marriage to the Rishis themselves.",
      shloka: {
        devanagari: "इहैव स्तं मा वि यौष्टं विश्वमायुर्व्यश्नुतम् ॥",
        transliteration: "Ihaiva staṁ mā vi yauṣṭaṁ viśvam āyur vyaśnutam.",
        meaning:
          "\"Stay here together; may you never be parted; may you enjoy a full span of life.\" — Rig Veda 10.85.42, a blessing for the couple.",
      },
    },
    {
      heading: "Why It Matters",
      body:
        "Every rite carries meaning: Kanyadaan is the highest of gifts; Panigrahana places one heart into another's keeping; the Saptapadi's seven steps invoke nourishment, strength, dharma, joy, prosperity, health and sacred duty; and the final vow turns marriage into sakhya — friendship, the deepest Vedic ideal of a couple. Performed correctly, with the right muhurat and pure samagri, the ceremony sets a marriage upon the firmest possible foundation — cosmic goodwill, ancestral blessing, and the unbreakable witness of Agni.",
    },
    {
      heading: "Why Pandit Ji At Request",
      body:
        "A wedding this sacred deserves to be performed exactly right. We match you with a background-verified Pandit Ji trained in your own tradition (Rigvedi / Yajurvedi / Samavedi and regional custom), arrange authentic and pure samagri, help you lock the most auspicious muhurat, and stand beside your family end-to-end — from the first free consultation to the final aarti. Transparent pricing, complete privacy, and one caring team that carries the details, so you can carry the joy.",
    },
  ],
  whyUs: [
    { icon: "✅", title: "Verified Pandit Ji", text: "Background-verified, shastra-trained, matched to your tradition." },
    { icon: "🕉️", title: "Correct & Authentic", text: "Right muhurat, right mantras, right sequence — every time." },
    { icon: "🪔", title: "Pure Samagri", text: "Authentic, clean materials for every sacred offering." },
    { icon: "🤝", title: "End-to-End Support", text: "One caring team beside you from first call to final aarti." },
  ],
};

/* ================================================================
 * TRUST · AUTHENTICITY · SOCIAL PROOF — the "sales & elite" layer
 * ----------------------------------------------------------------
 * Curated content that makes the flow feel premium, trustworthy and
 * proven. Faces are represented by initials + gradient avatars (no
 * external image hosts, no privacy risk); each entry carries an
 * optional `image`/`proofImage` URL so real photos can be dropped in
 * later (from admin/CMS) without any code change. All counts are the
 * product team's own claims and can be edited freely in one place.
 * ================================================================ */

/** Headline stats shown in the "proof band" (kept honest & editable). */
export const VIVAH_STATS: { value: string; label: string; icon: string }[] = [
  { value: "12,400+", label: "Sacred rituals\nperformed", icon: "🔥" },
  { value: "1,800+", label: "Verified\nPandit Ji", icon: "🕉️" },
  { value: "40+", label: "Cities served\nacross India", icon: "📍" },
  { value: "4.9★", label: "Average family\nrating", icon: "⭐" },
];

/** A rotating "as trusted by / recognised for" authenticity strip. */
export const VIVAH_AUTHENTICITY: { icon: string; title: string; text: string }[] = [
  {
    icon: "shield-checkmark",
    title: "Police-Verified Pandits",
    text: "Every Pandit Ji is background-checked & ID-verified before their first ceremony.",
  },
  {
    icon: "book",
    title: "Shastra-Certified",
    text: "Trained in Karmakanda with authentic Grihya-Sutra & Rig-Veda recitation.",
  },
  {
    icon: "lock-closed",
    title: "Secure & Private",
    text: "Razorpay-secured payments and complete confidentiality for your family.",
  },
  {
    icon: "ribbon",
    title: "Satisfaction Assured",
    text: "Right muhurat, right rituals, right order — or we make it right.",
  },
];

/** Elite / premium promises — the "luxury class" positioning strip. */
export const VIVAH_ELITE: { icon: string; title: string; text: string }[] = [
  {
    icon: "💎",
    title: "Senior Acharya Ji",
    text: "A senior, ceremony-specialist Pandit Ji reserved exclusively for your muhurat.",
  },
  {
    icon: "🎀",
    title: "Dedicated Concierge",
    text: "One coordinator plans muhurat, samagri and the day-of flow, end to end.",
  },
  {
    icon: "🪔",
    title: "Premium Samagri",
    text: "Hand-picked, pure, ceremony-grade materials — presented beautifully.",
  },
  {
    icon: "🎥",
    title: "Ritual Explained Live",
    text: "The Pandit Ji narrates each vidhi so every guest understands the moment.",
  },
];

export type VivahPandit = {
  id: string;
  name: string;
  title: string; // e.g. "Vedacharya · Rigvedi"
  city: string;
  experienceYears: number;
  ceremonies: number;
  rating: number;
  languages: string[];
  specialities: string[];
  verified: boolean;
  image?: string; // drop-in real photo later; falls back to initials avatar
  accent: string; // avatar gradient accent
};

/** "Meet your Pandit Ji" showcase — real profiles can replace these later. */
export const VIVAH_PANDITS: VivahPandit[] = [
  {
    id: "p1",
    name: "Acharya Ramesh Shastri",
    title: "Vedacharya · Rigvedi",
    city: "New Delhi",
    experienceYears: 24,
    ceremonies: 900,
    rating: 4.9,
    languages: ["Hindi", "Sanskrit", "English"],
    specialities: ["Vivah Sanskar", "Saptapadi", "Kanyadaan"],
    verified: true,
    accent: "#E86A17",
  },
  {
    id: "p2",
    name: "Pandit Suresh Chandra Sharma",
    title: "Karmakandi · Yajurvedi",
    city: "Chandigarh",
    experienceYears: 19,
    ceremonies: 720,
    rating: 4.9,
    languages: ["Hindi", "Punjabi", "Sanskrit"],
    specialities: ["Mandap Sthapana", "Havan", "Muhurat"],
    verified: true,
    accent: "#8E2C3B",
  },
  {
    id: "p3",
    name: "Acharya Mohan Bhatt",
    title: "Jyotishacharya · Vedic Astrologer",
    city: "Gurugram",
    experienceYears: 27,
    ceremonies: 1100,
    rating: 5.0,
    languages: ["Hindi", "Sanskrit", "Marathi"],
    specialities: ["Kundali Milan", "Muhurat", "Graha Shanti"],
    verified: true,
    accent: "#C9962E",
  },
  {
    id: "p4",
    name: "Pandit Vishnu Prasad Dubey",
    title: "Vedacharya · Samavedi",
    city: "Noida",
    experienceYears: 21,
    ceremonies: 640,
    rating: 4.8,
    languages: ["Hindi", "Bhojpuri", "Sanskrit"],
    specialities: ["Vivah Homa", "Laja Homa", "Griha Pravesh"],
    verified: true,
    accent: "#5A4FA3",
  },
  {
    id: "p5",
    name: "Acharya Devdatt Tiwari",
    title: "Karmakandi · Rigvedi",
    city: "Panchkula",
    experienceYears: 16,
    ceremonies: 480,
    rating: 4.9,
    languages: ["Hindi", "Sanskrit", "English"],
    specialities: ["Haldi", "Shagun", "Ganesh-Gauri Puja"],
    verified: true,
    accent: "#1F8A80",
  },
];

export type VivahTestimonial = {
  id: string;
  name: string;
  city: string;
  ritual: string; // what they booked
  date: string; // human "Feb 2026"
  rating: number;
  quote: string;
  verifiedBooking: boolean;
  image?: string; // real face photo later; falls back to initials avatar
  proofImage?: string; // ceremony photo / screenshot later
  accent: string;
};

/** Testimonials with faces (initials avatars) + verified-booking proof. */
export const VIVAH_TESTIMONIALS: VivahTestimonial[] = [
  {
    id: "t1",
    name: "Aarti & Rohit Malhotra",
    city: "Zirakpur, Chandigarh",
    ritual: "Sampoorna Vivah Journey",
    date: "Feb 2026",
    rating: 5,
    quote:
      "From Kundali Milan to Griha Pravesh, one Pandit Ji team held our entire wedding. The muhurat, the mantras, the samagri — everything was perfect. Our elders were moved to tears.",
    verifiedBooking: true,
    accent: "#E86A17",
  },
  {
    id: "t2",
    name: "Sneha Verma",
    city: "Gurugram, Delhi NCR",
    ritual: "Vivah Sanskar — Core Ceremony",
    date: "Jan 2026",
    rating: 5,
    quote:
      "The Acharya Ji explained every phera in Hindi so all our guests understood the vows. It felt like a wedding straight out of the Vedas. Booking was two taps.",
    verifiedBooking: true,
    accent: "#8E2C3B",
  },
  {
    id: "t3",
    name: "Vikram & Pooja Nair",
    city: "New Delhi",
    ritual: "Mandap & Kalash Sthapana",
    date: "Dec 2025",
    rating: 5,
    quote:
      "Transparent pricing, senior Pandit Ji on time, and pure samagri arranged for us. No last-minute market runs. Worth every rupee — truly premium.",
    verifiedBooking: true,
    accent: "#C9962E",
  },
  {
    id: "t4",
    name: "Ananya Iyer",
    city: "Mohali",
    ritual: "Kundali Milan + Muhurat",
    date: "Nov 2025",
    rating: 5,
    quote:
      "We had our date fixed but were unsure of the shubh lagna. Their Jyotishacharya found the most auspicious window within our date and guided us kindly.",
    verifiedBooking: true,
    accent: "#5A4FA3",
  },
  {
    id: "t5",
    name: "Karan & Simran Gill",
    city: "Panchkula",
    ritual: "Sampoorna Vivah Journey",
    date: "Feb 2026",
    rating: 5,
    quote:
      "A dedicated coordinator on WhatsApp answered every question for weeks. On the day, the rituals flowed in perfect order. This is how a Vedic wedding should feel.",
    verifiedBooking: true,
    accent: "#1F8A80",
  },
];

/**
 * Shubh Vivah Muhurat 2026 — a curated set of the most auspicious
 * wedding dates. This is display/marketing content (the market's #1
 * demand hook); the checkout can highlight these dates later. Kept in
 * one place so a pandit can proof and the admin can extend it.
 */
export type MuhuratDate = {
  date: string; // "24 Nov 2026"
  day: string; // "Tuesday"
  month: string; // "November" (grouping)
  tithi: string;
  nakshatra: string;
  note?: string; // e.g. "Highly auspicious"
};

export const VIVAH_MUHURAT_2026: MuhuratDate[] = [
  { date: "5 Feb 2026", day: "Thursday", month: "February", tithi: "Ashtami", nakshatra: "Rohini", note: "Highly auspicious" },
  { date: "16 Feb 2026", day: "Monday", month: "February", tithi: "Chaturthi", nakshatra: "Uttara Bhadrapada" },
  { date: "22 Apr 2026", day: "Wednesday", month: "April", tithi: "Panchami", nakshatra: "Mrigashira", note: "Peak season" },
  { date: "29 Apr 2026", day: "Wednesday", month: "April", tithi: "Dwadashi", nakshatra: "Magha" },
  { date: "8 May 2026", day: "Friday", month: "May", tithi: "Saptami", nakshatra: "Hasta", note: "Highly auspicious" },
  { date: "17 Jun 2026", day: "Wednesday", month: "June", tithi: "Trayodashi", nakshatra: "Anuradha" },
  { date: "21 Nov 2026", day: "Saturday", month: "November", tithi: "Dwadashi", nakshatra: "Uttara Ashadha", note: "Highly auspicious" },
  { date: "24 Nov 2026", day: "Tuesday", month: "November", tithi: "Panchami", nakshatra: "Revati", note: "Most sought-after" },
  { date: "25 Nov 2026", day: "Wednesday", month: "November", tithi: "Shashthi", nakshatra: "Ashwini" },
  { date: "26 Nov 2026", day: "Thursday", month: "November", tithi: "Saptami", nakshatra: "Bharani" },
];

/** One-line intro for the muhurat strip. */
export const VIVAH_MUHURAT_INTRO = {
  title: "Shubh Vivah Muhurat 2026",
  subtitle: "The most auspicious wedding dates — our Pandit Ji can fix the exact lagna for you.",
};

/* ============================================================================
   Catalog-served entities (muhurats, temples, Kashi) — types + local fallbacks
   that mirror the server DEFAULT_VIVAH_* so the app renders even offline.
   ============================================================================ */

/** Muhurat shape as served by the admin catalog (DD/MM/YYYY + year). */
export type CatalogMuhurat = {
  date: string; // "20/11/2026"
  day?: string;
  month?: string;
  year?: number;
  tithi?: string;
  nakshatra?: string;
  note?: string;
  isActive?: boolean;
  sortOrder?: number;
};

const MUHURAT_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "20/11/2026" → "20 Nov 2026" for display. Falls back to the raw string. */
export const formatMuhuratDate = (d: string): string => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(d || "").trim());
  if (!m) return String(d || "");
  const day = Number(m[1]);
  const mon = Number(m[2]);
  return `${day} ${MUHURAT_MONTHS_SHORT[mon - 1] || m[2]} ${m[3]}`;
};

/** Local fallback muhurats — mirror the server DEFAULT_VIVAH_MUHURATS. */
export const DEFAULT_VIVAH_MUHURATS: CatalogMuhurat[] = [
  // ── 2026–27 wedding season ────────────────────────────────────────────────
  // Sourced from published panchang muhurat lists (Drik Panchang / Prokerala /
  // AnytimeAstro). Dates are the panchang's; exact lagna ALWAYS re-fixed by
  // the Pandit Ji for the family's city and kundalis. sortOrder is chronology.
  { date: "20/11/2026", day: "Friday",    year: 2026, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 1 },
  { date: "21/11/2026", day: "Saturday",  year: 2026, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 2 },
  { date: "25/11/2026", day: "Wednesday", year: 2026, nakshatra: "Rohini",            isActive: true, sortOrder: 3 },
  { date: "26/11/2026", day: "Thursday",  year: 2026, nakshatra: "Rohini",            isActive: true, sortOrder: 4 },
  { date: "02/12/2026", day: "Wednesday", year: 2026, nakshatra: "Uttara Phalguni",   isActive: true, sortOrder: 5 },
  { date: "03/12/2026", day: "Thursday",  year: 2026, nakshatra: "Hasta",             isActive: true, sortOrder: 6 },
  { date: "04/12/2026", day: "Friday",    year: 2026, nakshatra: "Hasta",             isActive: true, sortOrder: 7 },
  { date: "12/12/2026", day: "Saturday",  year: 2026, nakshatra: "Uttara Ashadha",    isActive: true, sortOrder: 8 },
  // ── 2027 ──────────────────────────────────────────────────────────────────
  { date: "14/01/2027", day: "Thursday",  year: 2027, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 9 },
  { date: "18/01/2027", day: "Monday",    year: 2027, nakshatra: "Rohini",            isActive: true, sortOrder: 10 },
  { date: "24/01/2027", day: "Sunday",    year: 2027, nakshatra: "Magha",             isActive: true, sortOrder: 11 },
  { date: "31/01/2027", day: "Sunday",    year: 2027, nakshatra: "Anuradha",          isActive: true, sortOrder: 12 },
  { date: "10/02/2027", day: "Wednesday", year: 2027, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 13 },
  { date: "15/02/2027", day: "Monday",    year: 2027, nakshatra: "Mrigashirsha",      isActive: true, sortOrder: 14 },
  { date: "22/02/2027", day: "Monday",    year: 2027, nakshatra: "Uttara Phalguni",   isActive: true, sortOrder: 15 },
  { date: "24/02/2027", day: "Wednesday", year: 2027, nakshatra: "Swati",             isActive: true, sortOrder: 16 },
  { date: "01/03/2027", day: "Monday",    year: 2027, nakshatra: "Moola",             isActive: true, sortOrder: 17 },
  { date: "03/03/2027", day: "Wednesday", year: 2027, nakshatra: "Uttara Ashadha",    isActive: true, sortOrder: 18 },
  { date: "10/03/2027", day: "Wednesday", year: 2027, nakshatra: "Revati",            isActive: true, sortOrder: 19 },
  { date: "14/03/2027", day: "Sunday",    year: 2027, nakshatra: "Rohini",            isActive: true, sortOrder: 20 },
  { date: "18/04/2027", day: "Sunday",    year: 2027, nakshatra: "Uttara Phalguni",   isActive: true, sortOrder: 21 },
  { date: "23/04/2027", day: "Friday",    year: 2027, nakshatra: "Anuradha",          isActive: true, sortOrder: 22 },
  { date: "25/04/2027", day: "Sunday",    year: 2027, nakshatra: "Moola",             isActive: true, sortOrder: 23 },
  { date: "03/05/2027", day: "Monday",    year: 2027, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 24 },
  { date: "07/05/2027", day: "Friday",    year: 2027, nakshatra: "Rohini",            isActive: true, sortOrder: 25 },
  { date: "16/05/2027", day: "Sunday",    year: 2027, nakshatra: "Hasta",             isActive: true, sortOrder: 26 },
  { date: "24/05/2027", day: "Monday",    year: 2027, nakshatra: "Uttara Ashadha",    isActive: true, sortOrder: 27 },
  { date: "30/05/2027", day: "Sunday",    year: 2027, nakshatra: "Uttara Bhadrapada", isActive: true, sortOrder: 28 },
  { date: "09/06/2027", day: "Wednesday", year: 2027, nakshatra: "Magha",             isActive: true, sortOrder: 29 },
  { date: "13/06/2027", day: "Sunday",    year: 2027, nakshatra: "Hasta",             isActive: true, sortOrder: 30 },
  { date: "16/06/2027", day: "Wednesday", year: 2027, nakshatra: "Anuradha",          isActive: true, sortOrder: 31 },
  { date: "20/06/2027", day: "Sunday",    year: 2027, nakshatra: "Uttara Ashadha",    isActive: true, sortOrder: 32 },
  { date: "07/07/2027", day: "Wednesday", year: 2027, nakshatra: "Magha",             isActive: true, sortOrder: 33 },
  { date: "12/07/2027", day: "Monday",    year: 2027, nakshatra: "Swati",             isActive: true, sortOrder: 34 },
  { date: "22/11/2027", day: "Monday",    year: 2027, nakshatra: "Uttara Phalguni",   isActive: true, sortOrder: 35 },
  { date: "24/11/2027", day: "Wednesday", year: 2027, nakshatra: "Hasta",             isActive: true, sortOrder: 36 },
  { date: "29/11/2027", day: "Monday",    year: 2027, nakshatra: "Moola",             isActive: true, sortOrder: 37 },
  { date: "02/12/2027", day: "Thursday",  year: 2027, nakshatra: "Uttara Ashadha",    isActive: true, sortOrder: 38 },
  { date: "08/12/2027", day: "Wednesday", year: 2027, nakshatra: "Revati",            isActive: true, sortOrder: 39 },
];


/** Live-darshan temple as served by the catalog. */
export type VivahTemple = {
  templeId: string;
  name: string;
  city?: string;
  deity?: string;
  image?: string;
  price: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
};

/** Local fallback temples — mirror the server DEFAULT_VIVAH_TEMPLES. */
export const DEFAULT_VIVAH_TEMPLES: VivahTemple[] = [
  { templeId: "kashi-vishwanath", name: "Kashi Vishwanath", city: "Varanasi", deity: "Lord Shiva", price: 5100, description: "The couple's first darshan at the eternal city of Kashi.", isActive: true, sortOrder: 1 },
  { templeId: "mahakaleshwar", name: "Mahakaleshwar Jyotirlinga", city: "Ujjain", deity: "Lord Shiva", price: 5100, description: "Bhasma-aarti blessings for a long, prosperous marriage.", isActive: true, sortOrder: 2 },
  { templeId: "somnath", name: "Somnath Jyotirlinga", city: "Gujarat", deity: "Lord Shiva", price: 4100, description: "Darshan at the first among the twelve Jyotirlingas.", isActive: true, sortOrder: 3 },
  { templeId: "siddhivinayak", name: "Siddhivinayak", city: "Mumbai", deity: "Lord Ganesha", price: 3100, description: "Vighnaharta's blessings for an obstacle-free life together.", isActive: true, sortOrder: 4 },
  { templeId: "tirupati-balaji", name: "Tirupati Balaji", city: "Tirumala", deity: "Lord Venkateshwara", price: 6100, description: "Balaji's darshan for the newlyweds' abundance.", isActive: true, sortOrder: 5 },
  { templeId: "vaishno-devi", name: "Vaishno Devi", city: "Katra", deity: "Mata Rani", price: 4100, description: "Mata Rani's aashirwad for the new household.", isActive: true, sortOrder: 6 },
];

/** Featured Kashi pandit + the highlighted "invite a Kashi Pandit Ji" section. */
export type VivahKashiPandit = {
  name: string;
  photo?: string;
  experienceYears?: number;
  specialization?: string;
  temple?: string;
  languages?: string[];
};

export type VivahKashi = {
  enabled: boolean;
  title: string;
  hindiName?: string;
  description?: string;
  image?: string;
  premiumPrice: number;
  note?: string;
  pandits: VivahKashiPandit[];
  isActive?: boolean;
};

/** Local fallback Kashi section — mirror the server DEFAULT_VIVAH_KASHI. */
export const DEFAULT_VIVAH_KASHI: VivahKashi = {
  enabled: true,
  title: "Invite a Pandit Ji from Kashi",
  hindiName: "काशी से पंडित जी",
  description:
    "Have your vivah sanskar performed by a revered Vedacharya from Kashi (Varanasi) — the spiritual heart of Sanatan Dharma. Steeped in the Kashi Vivah Paddhati, they bring the blessings of Baba Vishwanath and the Ganga to your ceremony.",
  image:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/kashi-ghat_11zon.png",
  premiumPrice: 21000,
  note: "Premium covers the Kashi Acharya's travel, stay and a special Ganga-Aarti sankalp for the couple.",
  pandits: [
    { name: "Acharya Pt. Rajeshwar Dwivedi", experienceYears: 28, specialization: "Kashi Vishwanath Rudrabhishek & Vivah Sanskar", temple: "Kashi Vishwanath, Varanasi", languages: ["Hindi", "Sanskrit", "Bhojpuri"] },
    { name: "Pt. Omkarnath Tiwari", experienceYears: 22, specialization: "Vedic Vivah & Kashi Ganga Aarti", temple: "Dashashwamedh Ghat, Varanasi", languages: ["Hindi", "Sanskrit"] },
    { name: "Pt. Vishwanath Shastri", experienceYears: 35, specialization: "Maithil & Kashi Vivah Paddhati", temple: "Sankat Mochan, Varanasi", languages: ["Hindi", "Sanskrit", "Maithili"] },
  ],
  isActive: true,
};

/** "What you receive" — per-ritual value chips (replaces the old generic
 *  Kundali-only chips that showed on every ritual). Falls back to a warm
 *  default for any slug without a bespoke set. */
export const VIVAH_RECEIVE: Record<string, { icon: string; label: string }[]> = {
  "kundali-milan": [
    { icon: "sparkles", label: "36-Guna\nreport" },
    { icon: "shield-checkmark", label: "Dosha\nremedies" },
    { icon: "people", label: "Jyotishi\nconsultation" },
  ],
  "vivah-muhoorat": [
    { icon: "calendar", label: "Auspicious\nlagna" },
    { icon: "book", label: "Panchang\nshuddhi" },
    { icon: "chatbubbles", label: "Pandit Ji\nguidance" },
  ],
  shagun: [
    { icon: "gift", label: "Tilak\nvidhi" },
    { icon: "flower", label: "Ganesh\npuja" },
    { icon: "hand-left", label: "Family\nblessings" },
  ],
  "ganesh-gauri-puja": [
    { icon: "flower", label: "Vighnaharta\npuja" },
    { icon: "female", label: "Gauri\naaradhana" },
    { icon: "leaf", label: "Pure\nsamagri" },
  ],
  "haldi-ceremony": [
    { icon: "color-fill", label: "Mangala\nsnaan" },
    { icon: "musical-notes", label: "Joyous\nrituals" },
    { icon: "sunny", label: "Auspicious\nglow" },
  ],
  "mandap-sthapana": [
    { icon: "home", label: "Mandap\nvedi" },
    { icon: "water", label: "Kalash\nsthapana" },
    { icon: "planet", label: "Navagraha\nshanti" },
  ],
  "vivah-sanskar": [
    { icon: "flame", label: "Agni\nsakshi" },
    { icon: "footsteps", label: "Saptapadi\n& pheras" },
    { icon: "heart", label: "Sacred\nvows" },
  ],
  "mandir-darshan": [
    { icon: "business", label: "Temple\nvisit" },
    { icon: "sparkles", label: "Deity's\nblessing" },
    { icon: "gift", label: "Prasad\n& aashirwad" },
  ],
};

export const VIVAH_RECEIVE_DEFAULT: { icon: string; label: string }[] = [
  { icon: "checkmark-circle", label: "Authentic\nvidhi" },
  { icon: "leaf", label: "Pure\nsamagri" },
  { icon: "people", label: "Pandit Ji\nguidance" },
];

export const getVivahReceive = (slug: string) => VIVAH_RECEIVE[slug] || VIVAH_RECEIVE_DEFAULT;

/** Compute clean initials for an avatar from a full name. */
export const initialsOf = (name: string): string => {
  const parts = (name || "").trim().split(/[\s&]+/).filter(Boolean);
  if (parts.length === 0) return "जी";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Merge the backend catalog row (name/price/samagri) with the curated
 * content. Falls back gracefully if the admin adds a slug we don't have
 * bespoke content for yet.
 */
export const getVivahContent = (slug: string): RitualContent => {
  const found = VIVAH_RITUAL_CONTENT[slug];
  if (found) return found;
  return {
    slug,
    part: "core",
    titleEng: slug,
    titleHindi: "",
    transliteration: "",
    subtitle: "A sacred Vedic ritual performed by a verified Pandit Ji.",
    microLine: "Performed with authentic mantras and pure devotion.",
    whatHappens:
      "This ritual is performed by a verified Vedic Pandit Ji with the correct mantras and samagri for your tradition.",
    significance:
      "Each rite of the Vivah Sanskara carries deep meaning, sanctifying the union before the gods.",
    icon: "🪔",
    color: "#E86A17",
  };
};

/* ================================================================
 * 2026-07 REDESIGN CONTENT — copy for the new royal cream/gold flow
 * (landing → packages → build-your-own → pandits → support), matching
 * the approved design mockups word-for-word where shown.
 * ================================================================ */

/** One-line ritual descriptions for the "Build Your Own Ritual Journey" rows. */
export const VIVAH_SHORT_DESC: Record<string, string> = {
  "kundali-milan": "Compatibility guidance",
  "vivah-muhoorat": "Date & timing guidance",
  shagun: "Engagement rituals",
  "ganesh-gauri-puja": "Blessings before marriage",
  "haldi-ceremony": "Pre-wedding purification",
  "mandap-sthapana": "Sacred setup",
  "vivah-sanskar": "Core wedding ceremony",
  "mandir-darshan": "First darshan together",
};
export const getVivahShortDesc = (slug: string) =>
  VIVAH_SHORT_DESC[slug] || getVivahContent(slug).subtitle;

/** Landing trust chips (top row under the hero). */
export const VIVAH_TRUST_CHIPS: { icon: string; l1: string; l2: string }[] = [
  { icon: "shield-checkmark-outline", l1: "Verified", l2: "Pandits" },
  { icon: "flower-outline", l1: "Pure", l2: "Samagri" },
  { icon: "calendar-outline", l1: "Muhurat", l2: "Help" },
  { icon: "cash-outline", l1: "Transparent", l2: "Pricing" },
];

/** "Why choose us" 2×2 grid. */
export const VIVAH_WHY_US: { icon: string; label: string }[] = [
  { icon: "shield-checkmark-outline", label: "Verified" },
  { icon: "calendar-outline", label: "Muhurat" },
  { icon: "flower-outline", label: "Samagri" },
  { icon: "headset-outline", label: "Support" },
];

/** End-to-End Support — the 4-step journey. */
export const VIVAH_STEPS: { icon: string; label1: string; label2: string }[] = [
  { icon: "chatbubbles-outline", label1: "Share", label2: "tradition" },
  { icon: "calendar-outline", label1: "Confirm", label2: "muhurat" },
  { icon: "person-outline", label1: "Pandit", label2: "assigned" },
  { icon: "flower-outline", label1: "Ceremony", label2: "support" },
];

/** "Why families trust us" cards (Support screen). */
export const VIVAH_TRUST_CARDS: { icon: string; title: string; text: string }[] = [
  { icon: "shield-checkmark-outline", title: "Police-Verified Pandits", text: "Verified for your peace of mind." },
  { icon: "book-outline", title: "Shastra-Certified Vidhi", text: "Rituals performed as per vedic scriptures." },
  { icon: "flower-outline", title: "Pure Samagri", text: "Sourced with care, offered with purity." },
  { icon: "lock-closed-outline", title: "Secure & Private", text: "Your information is always protected." },
];

/** Short quote cards for "Loved by Families". */
export const VIVAH_QUOTES: { quote: string; name: string }[] = [
  { quote: "The ceremony was beautiful and deeply meaningful.", name: "Riya & Ankit" },
  { quote: "Pandit Ji guided us with so much clarity and warmth.", name: "Meera Sharma" },
];

/** Curated 4-item FAQ (short titles, reuses the detailed answers above). */
export const VIVAH_FAQ_SHORT: { q: string; a: string }[] = [
  { q: "Is the Pandit Ji qualified?", a: VIVAH_FAQ[0].a },
  { q: "Can rituals match our customs?", a: VIVAH_FAQ[1].a },
  { q: "Can we pay in parts?", a: VIVAH_FAQ[4].a },
  { q: "How early should we book?", a: VIVAH_FAQ[7].a },
];

/** Footer trust strip (Support screen). */
export const VIVAH_FOOTER_TRUST: { icon: string; title: string; text: string }[] = [
  { icon: "shield-checkmark-outline", title: "100% Confidential", text: "Your privacy is our priority." },
  { icon: "flower-outline", title: "Shastra-Vidhi Seva", text: "Rituals by the book, with devotion." },
  { icon: "people-outline", title: "Trusted by Thousands", text: "Thousands of families across India." },
];

/** Elite Vivah Experience band (Pandits screen). */
export const VIVAH_ELITE_BAND: { icon: string; label1: string; label2: string }[] = [
  { icon: "people-outline", label1: "Dedicated", label2: "coordination" },
  { icon: "ribbon-outline", label1: "Priority", label2: "matching" },
  { icon: "flower-outline", label1: "Samagri", label2: "planning" },
  { icon: "notifications-outline", label1: "Ceremony-day", label2: "support" },
];

