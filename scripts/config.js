// ---------------------------------------------------------------
//  नेपाल ताजा — central settings.  Edit this file to customise.
// ---------------------------------------------------------------

export const SITE_NAME = 'नेपाल ताजा';
export const SITE_TAGLINE = 'हरेक घण्टा अपडेट हुने नेपाली समाचार';
export const SITE_DESCRIPTION =
  'राजनीति, अर्थ, खेलकुद, स्वास्थ्य, मनोरञ्जन, प्रविधिलगायतका ताजा नेपाली समाचार एकै ठाउँमा। हरेक घण्टा आफैँ अपडेट हुन्छ।';

// Categories shown on the site (order = order in the menu).
// `hint` is given to Gemini; `keywords` are used only if Gemini is unavailable.
export const CATEGORIES = [
  {
    slug: 'rajniti', name: 'राजनीति', icon: '🏛️',
    hint: 'सरकार, राजनीतिक दल, संसद, निर्वाचन, नेपालको कूटनीति',
    keywords: ['प्रधानमन्त्री', 'मन्त्री', 'सांसद', 'संसद', 'कांग्रेस', 'एमाले', 'माओवादी', 'राप्रपा', 'सरकार', 'निर्वाचन', 'चुनाव', 'मतदान', 'राष्ट्रपति', 'सभापति', 'राजनीति', 'मन्त्रिपरिषद्', 'minister', 'parliament', 'election', 'government'],
  },
  {
    slug: 'artha', name: 'अर्थ', icon: '💰',
    hint: 'अर्थतन्त्र, बैंक, शेयर बजार, व्यापार, बजेट, उद्योग, ऊर्जा',
    keywords: ['अर्थ', 'बजेट', 'शेयर', 'नेप्से', 'बैंक', 'राजस्व', 'व्यापार', 'लगानी', 'सुन', 'चाँदी', 'रेमिट्यान्स', 'ब्याज', 'मुद्रास्फीति', 'पुँजी', 'निर्यात', 'आयात', 'उद्योग', 'बीमा', 'economy', 'bank', 'nepse', 'market', 'trade', 'budget', 'inflation', 'investment'],
  },
  {
    slug: 'khelkud', name: 'खेलकुद', icon: '🏏',
    hint: 'क्रिकेट, फुटबल र अन्य सबै खेलकुद',
    keywords: ['खेल', 'क्रिकेट', 'फुटबल', 'खेलाडी', 'च्याम्पियन', 'प्रतियोगिता', 'मैच', 'गोल', 'विश्वकप', 'स्वर्ण', 'पदक', 'cricket', 'football', 'match', 'tournament', 'medal', 'league', 'cup'],
  },
  {
    slug: 'swasthya', name: 'स्वास्थ्य', icon: '🩺',
    hint: 'स्वास्थ्य, अस्पताल, रोग, औषधि, पोषण',
    keywords: ['स्वास्थ्य', 'अस्पताल', 'रोग', 'डेंगु', 'कोरोना', 'औषधि', 'डाक्टर', 'उपचार', 'क्यान्सर', 'मधुमेह', 'खोप', 'चिकित्सक', 'health', 'hospital', 'disease', 'vaccine', 'doctor', 'medical'],
  },
  {
    slug: 'manoranjan', name: 'मनोरञ्जन', icon: '🎬',
    hint: 'चलचित्र, संगीत, कलाकार, सेलिब्रेटी, कला',
    keywords: ['फिल्म', 'चलचित्र', 'गायक', 'गायिका', 'कलाकार', 'सिनेमा', 'गीत', 'नायक', 'नायिका', 'बलिउड', 'कलिउड', 'मनोरञ्जन', 'मनोरन्जन', 'अभिनेता', 'अभिनेत्री', 'film', 'movie', 'singer', 'actor', 'actress', 'bollywood', 'music'],
  },
  {
    slug: 'prabidhi', name: 'प्रविधि', icon: '📱',
    hint: 'प्रविधि, मोबाइल, इन्टरनेट, एआई, साइबर, स्टार्टअप',
    keywords: ['प्रविधि', 'मोबाइल', 'इन्टरनेट', 'एआई', 'कृत्रिम बुद्धिमत्ता', 'सफ्टवेयर', 'साइबर', 'गुगल', 'एप्पल', 'फेसबुक', 'टेलिकम', 'स्मार्टफोन', 'technology', 'tech', 'app', 'ai', 'software', 'cyber', 'google', 'apple', 'internet'],
  },
  {
    slug: 'antarrastriya', name: 'अन्तर्राष्ट्रिय', icon: '🌏',
    hint: 'विदेशका समाचार र विश्व घटना',
    keywords: ['अमेरिका', 'चीन', 'भारत', 'रुस', 'युक्रेन', 'इजरायल', 'गाजा', 'इरान', 'पाकिस्तान', 'बंगलादेश', 'जापान', 'बेलायत', 'संयुक्त राष्ट्र', 'ट्रम्प', 'विश्व', 'अन्तर्राष्ट्रिय', 'युद्ध', 'world', 'china', 'india', 'russia', 'ukraine', 'israel', 'gaza', 'united nations', 'trump', 'war'],
  },
  {
    slug: 'samaj', name: 'समाज', icon: '👥',
    hint: 'अपराध, दुर्घटना, शिक्षा, विपद्, मौसम, जीवनशैली, स्थानीय समाचार र अन्य सबै',
    keywords: [],
  },
];

export const DEFAULT_CATEGORY = 'samaj';

// News sources (RSS).  A feed that is down is simply skipped.
// lang: 'ne' = Nepali, 'en' = English (Gemini translates the headline to Nepali).
export const FEEDS = [
  { name: 'अनलाइनखबर',   url: 'https://www.onlinekhabar.com/feed',          lang: 'ne' },
  { name: 'सेतोपाटी',    url: 'https://www.setopati.com/feed',              lang: 'ne' },
  { name: 'रातोपाटी',    url: 'https://www.ratopati.com/feed',              lang: 'ne' },
  { name: 'राजधानी',     url: 'https://rajdhanidaily.com/feed',             lang: 'ne' },
  { name: 'न्युज अफ नेपाल', url: 'https://newsofnepal.com/feed',            lang: 'ne' },
  { name: 'बीबीसी नेपाली', url: 'https://feeds.bbci.co.uk/nepali/rss.xml',  lang: 'ne' },
  { name: 'कान्तिपुर',   url: 'https://ekantipur.com/rss',                  lang: 'ne' },
  { name: 'काठमाडौं पोष्ट', url: 'https://kathmandupost.com/rss',           lang: 'en' },
  { name: 'हिमालयन टाइम्स', url: 'https://thehimalayantimes.com/rssFeed/14', lang: 'en' },
  { name: 'नेपाली टाइम्स', url: 'https://nepalitimes.com/feed',             lang: 'en' },
];

export const SETTINGS = {
  maxAgeHours: 48,      // ignore items older than this when first seen
  keepHours: 72,        // remove stories older than this from the site
  maxStored: 400,       // hard cap on stories kept
  maxNewPerRun: 60,     // max new stories sent to Gemini per run
  batchSize: 20,        // stories per Gemini request
  maxImageLookups: 30,  // max article pages opened per run to find a missing image
  perFeedLimit: 40,     // items read from each feed
};
