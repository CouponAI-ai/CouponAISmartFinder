/* Brand logo resolution using Google's favicon service (extremely reliable).
   Google's favicon cache works for every major brand and has no CORS restrictions. */

/* Brand name → domain for logo lookup */
const BRAND_DOMAINS: Record<string, string> = {
  // Fast food & restaurants
  "mcdonald's": "mcdonalds.com",
  "mcdonalds": "mcdonalds.com",
  "subway": "subway.com",
  "taco bell": "tacobell.com",
  "tacobell": "tacobell.com",
  "burger king": "bk.com",
  "wendy's": "wendys.com",
  "wendys": "wendys.com",
  "chick-fil-a": "chick-fil-a.com",
  "chickfila": "chick-fil-a.com",
  "chick fil a": "chick-fil-a.com",
  "domino's": "dominos.com",
  "dominos": "dominos.com",
  "domino's pizza": "dominos.com",
  "pizza hut": "pizzahut.com",
  "papa john's": "papajohns.com",
  "papa johns": "papajohns.com",
  "little caesars": "littlecaesars.com",
  "sonic": "sonicdrivein.com",
  "sonic drive-in": "sonicdrivein.com",
  "sonic drive in": "sonicdrivein.com",
  "popeyes": "popeyes.com",
  "kfc": "kfc.com",
  "panda express": "pandaexpress.com",
  "starbucks": "starbucks.com",
  "dunkin": "dunkindonuts.com",
  "dunkin'": "dunkindonuts.com",
  "dunkin donuts": "dunkindonuts.com",
  "dunkin' donuts": "dunkindonuts.com",
  "whataburger": "whataburger.com",
  "hardee's": "hardees.com",
  "hardees": "hardees.com",
  "arby's": "arbys.com",
  "arbys": "arbys.com",
  "jimmy john's": "jimmyjohns.com",
  "jimmy johns": "jimmyjohns.com",
  "chipotle": "chipotle.com",
  "chipotle mexican grill": "chipotle.com",
  "five guys": "fiveguys.com",
  "raising cane's": "raisingcanes.com",
  "raising canes": "raisingcanes.com",
  "wingstop": "wingstop.com",
  "buffalo wild wings": "buffalowildwings.com",
  "applebee's": "applebees.com",
  "olive garden": "olivegarden.com",
  "red lobster": "redlobster.com",
  "denny's": "dennys.com",
  "ihop": "ihop.com",
  "waffle house": "wafflehouse.com",
  "cracker barrel": "crackerbarrel.com",
  "chili's": "chilis.com",
  "outback steakhouse": "outback.com",
  "texas roadhouse": "texasroadhouse.com",
  "panera bread": "panerabread.com",
  "panera": "panerabread.com",
  "shake shack": "shakeshack.com",
  "in-n-out": "in-n-out.com",
  "in-n-out burger": "in-n-out.com",
  "jack in the box": "jackinthebox.com",
  "carl's jr": "carlsjr.com",
  "dairy queen": "dairyqueen.com",
  "culver's": "culvers.com",
  "del taco": "deltaco.com",
  "zaxby's": "zaxbys.com",
  "bojangles": "bojangles.com",
  "church's chicken": "churchs.com",
  "churchs chicken": "churchs.com",
  "golden corral": "goldencorral.com",

  // Retail & big box
  "walmart": "walmart.com",
  "target": "target.com",
  "amazon": "amazon.com",
  "costco": "costco.com",
  "sam's club": "samsclub.com",
  "best buy": "bestbuy.com",
  "home depot": "homedepot.com",
  "the home depot": "homedepot.com",
  "lowe's": "lowes.com",
  "lowes": "lowes.com",
  "dollar general": "dollargeneral.com",
  "dollar tree": "dollartree.com",
  "family dollar": "familydollar.com",
  "five below": "fivebelow.com",
  "big lots": "biglots.com",
  "ross": "rossstores.com",
  "tjmaxx": "tjmaxx.com",
  "tj maxx": "tjmaxx.com",
  "marshalls": "marshalls.com",
  "burlington": "burlington.com",
  "nordstrom": "nordstrom.com",
  "macy's": "macys.com",
  "macys": "macys.com",
  "kohl's": "kohls.com",
  "kohls": "kohls.com",
  "jcpenney": "jcpenney.com",
  "bed bath & beyond": "bedbathandbeyond.com",
  "michaels": "michaels.com",
  "hobby lobby": "hobbylobby.com",
  "joann": "joann.com",
  "jo-ann": "joann.com",
  "dick's sporting goods": "dickssportinggoods.com",
  "dicks sporting goods": "dickssportinggoods.com",
  "academy sports": "academy.com",
  "rei": "rei.com",
  "bass pro shops": "basspro.com",
  "cabela's": "cabelas.com",
  "petco": "petco.com",
  "petsmart": "petsmart.com",
  "office depot": "officedepot.com",
  "staples": "staples.com",
  "gamestop": "gamestop.com",
  "bath & body works": "bathandbodyworks.com",
  "victoria's secret": "victoriassecret.com",
  "sephora": "sephora.com",
  "ulta": "ulta.com",
  "ulta beauty": "ulta.com",
  "gap": "gap.com",
  "old navy": "oldnavy.com",
  "h&m": "hm.com",
  "zara": "zara.com",
  "forever 21": "forever21.com",
  "foot locker": "footlocker.com",
  "nike": "nike.com",
  "adidas": "adidas.com",
  "under armour": "underarmour.com",

  // Grocery
  "kroger": "kroger.com",
  "safeway": "safeway.com",
  "publix": "publix.com",
  "whole foods": "wholefoods.com",
  "whole foods market": "wholefoods.com",
  "trader joe's": "traderjoes.com",
  "aldi": "aldi.us",
  "winn-dixie": "winndixie.com",
  "food lion": "foodlion.com",
  "heb": "heb.com",
  "h-e-b": "heb.com",
  "meijer": "meijer.com",
  "wegmans": "wegmans.com",
  "sprouts": "sprouts.com",

  // Pharmacy / health
  "walgreens": "walgreens.com",
  "cvs": "cvs.com",
  "cvs pharmacy": "cvs.com",
  "rite aid": "riteaid.com",

  // Automotive
  "autozone": "autozone.com",
  "auto zone": "autozone.com",
  "o'reilly auto parts": "oreillyauto.com",
  "oreilly auto parts": "oreillyauto.com",
  "o'reilly": "oreillyauto.com",
  "advance auto parts": "advanceautoparts.com",
  "jiffy lube": "jiffylube.com",
  "valvoline": "valvoline.com",
  "firestone": "firestonecompleteautocare.com",
  "midas": "midas.com",
  "pep boys": "pepboys.com",
  "goodyear": "goodyear.com",
  "napa auto parts": "napaonline.com",

  // Entertainment
  "amc theatres": "amctheatres.com",
  "amc": "amctheatres.com",
  "regal": "regmovies.com",
  "regal cinemas": "regmovies.com",
  "cinemark": "cinemark.com",
  "netflix": "netflix.com",
  "hulu": "hulu.com",
  "disney+": "disneyplus.com",
  "disney plus": "disneyplus.com",
  "spotify": "spotify.com",

  // Gas / convenience
  "7-eleven": "7-eleven.com",
  "7 eleven": "7-eleven.com",
  "circle k": "circlek.com",
  "shell": "shell.com",
  "bp": "bp.com",
  "exxon": "exxon.com",
  "chevron": "chevron.com",
  "wawa": "wawa.com",
  "sheetz": "sheetz.com",

  // Tech / software
  "godaddy": "godaddy.com",
  "hostgator": "hostgator.com",
  "hostinger": "hostinger.com",
  "bluehost": "bluehost.com",
  "norton": "norton.com",
  "mcafee": "mcafee.com",
  "expressvpn": "expressvpn.com",
  "nordvpn": "nordvpn.com",
  "hola vpn": "hola.org",
  "adobe": "adobe.com",
  "microsoft": "microsoft.com",
  "acronis": "acronis.com",
  "ashampoo": "ashampoo.com",

  // Coffee
  "dutch bros": "dutchbros.com",
  "tim hortons": "timhortons.com",
  "caribou coffee": "cariboucoffee.com",
};

/* Brand-specific Unsplash photos for known chains — used as image background
   when logo alone isn't enough to identify the brand visually */
export const BRAND_PHOTOS: Record<string, string> = {
  "mcdonald's":        "https://images.unsplash.com/photo-1619881590738-a111d176d906?w=400&q=75",
  "mcdonalds":         "https://images.unsplash.com/photo-1619881590738-a111d176d906?w=400&q=75",
  "subway":            "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=75",
  "taco bell":         "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=75",
  "burger king":       "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75",
  "wendy's":           "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=75",
  "wendys":            "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=75",
  "chick-fil-a":       "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=75",
  "domino's":          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=75",
  "dominos":           "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=75",
  "pizza hut":         "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=75",
  "kfc":               "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=75",
  "starbucks":         "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&q=75",
  "dunkin":            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75",
  "dunkin'":           "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75",
  "dunkin donuts":     "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75",
  "sonic":             "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=75",
  "popeyes":           "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=75",
  "panda express":     "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=75",
  "chipotle":          "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=75",
  "panera bread":      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75",
  "panera":            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75",
  "whataburger":       "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75",
  "arby's":            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75",
  "papa john's":       "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=75",
  "little caesars":    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=75",
  "jimmy john's":      "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=75",
  "five guys":         "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75",
  "raising cane's":    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=75",
  "wingstop":          "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=75",
  "buffalo wild wings":"https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=75",
  "olive garden":      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75",
  "applebee's":        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75",
  "cracker barrel":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75",
  "texas roadhouse":   "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75",
  "ihop":              "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=75",
  "denny's":           "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75",
  "waffle house":      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=75",
  // Retail
  "walmart":           "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=75",
  "target":            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=75",
  "amazon":            "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&q=75",
  "best buy":          "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=75",
  "dollar general":    "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?w=400&q=75",
  "home depot":        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75",
  "the home depot":    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75",
  "lowe's":            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75",
  "gamestop":          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=75",
  "sephora":           "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=75",
  "ulta":              "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=75",
  "ulta beauty":       "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=75",
  "bath & body works": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=75",
  // Automotive
  "autozone":          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=75",
  "auto zone":         "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=75",
  "o'reilly auto parts":"https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=75",
  "jiffy lube":        "https://images.unsplash.com/photo-1616455579100-2ceaa4ec2d37?w=400&q=75",
  "valvoline":         "https://images.unsplash.com/photo-1616455579100-2ceaa4ec2d37?w=400&q=75",
  // Entertainment
  "amc theatres":      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=75",
  "amc":               "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=75",
  "regal":             "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=75",
  "cinemark":          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=75",
  // Pharmacy
  "walgreens":         "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75",
  "cvs":               "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75",
  "cvs pharmacy":      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75",
  // Coffee
  "starbucks coffee":  "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&q=75",
  "dutch bros":        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75",
};

/* Deterministic color palette from store name */
const AVATAR_COLORS = [
  "#16a34a", "#d97706", "#2563eb", "#9333ea", "#dc2626",
  "#0891b2", "#ea580c", "#65a30d", "#db2777", "#0d9488",
];

function stringToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[''`]/g, "'").replace(/\s+/g, " ").trim();
}

/* Returns a Google-cached favicon logo URL for any major brand, or null */
export function getBrandLogoUrl(storeName: string): string | null {
  const key = normalizeKey(storeName);
  let domain: string | null = null;

  // Exact match
  if (BRAND_DOMAINS[key]) {
    domain = BRAND_DOMAINS[key];
  } else {
    // Partial match
    for (const [brand, d] of Object.entries(BRAND_DOMAINS)) {
      if (key.includes(brand) || brand.includes(key)) { domain = d; break; }
    }
  }

  if (!domain) return null;
  // Use Google's favicon service — reliable, no auth, no CORS issues
  return `https://www.google.com/s2/favicons?sz=256&domain_url=https://${domain}`;
}

/* Returns a brand-specific Unsplash photo URL for known chains, or null */
export function getBrandPhoto(storeName: string): string | null {
  const key = normalizeKey(storeName);
  if (BRAND_PHOTOS[key]) return BRAND_PHOTOS[key];
  // partial match
  for (const [brand, url] of Object.entries(BRAND_PHOTOS)) {
    if (key.includes(brand) || brand.includes(key)) return url;
  }
  return null;
}

export function getBrandColor(storeName: string): string {
  return stringToColor(storeName);
}

export function getStoreInitials(storeName: string): string {
  return getInitials(storeName);
}
