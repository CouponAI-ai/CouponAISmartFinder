/* Comprehensive brand → Clearbit domain mapping for logo lookups.
   Priority: stored storeLogoUrl → Clearbit by this map → colored initials avatar */

const BRAND_DOMAINS: Record<string, string> = {
  // Fast food & restaurants
  "mcdonald's": "mcdonalds.com",
  "mcdonalds": "mcdonalds.com",
  "subway": "subway.com",
  "taco bell": "tacobell.com",
  "burger king": "bk.com",
  "wendy's": "wendys.com",
  "wendys": "wendys.com",
  "chick-fil-a": "chick-fil-a.com",
  "chickfila": "chick-fil-a.com",
  "chick fil a": "chick-fil-a.com",
  "domino's": "dominos.com",
  "dominos": "dominos.com",
  "pizza hut": "pizzahut.com",
  "papa john's": "papajohns.com",
  "papa johns": "papajohns.com",
  "little caesars": "littlecaesars.com",
  "sonic": "sonicdrivein.com",
  "sonic drive-in": "sonicdrivein.com",
  "popeyes": "popeyes.com",
  "kfc": "kfc.com",
  "panda express": "pandaexpress.com",
  "starbucks": "starbucks.com",
  "dunkin": "dunkindonuts.com",
  "dunkin'": "dunkindonuts.com",
  "dunkin donuts": "dunkindonuts.com",
  "whataburger": "whataburger.com",
  "hardee's": "hardees.com",
  "hardees": "hardees.com",
  "arby's": "arbys.com",
  "arbys": "arbys.com",
  "jimmy john's": "jimmyjohns.com",
  "jimmy johns": "jimmyjohns.com",
  "chipotle": "chipotle.com",
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
  "longhorn steakhouse": "longhornsteakhouse.com",
  "panera": "panerabread.com",
  "panera bread": "panerabread.com",
  "shake shack": "shakeshack.com",
  "in-n-out": "in-n-out.com",
  "jack in the box": "jackinthebox.com",
  "carl's jr": "carlsjr.com",
  "dairy queen": "dairyqueen.com",
  "culver's": "culvers.com",
  "white castle": "whitecastle.com",
  "churchs chicken": "churchs.com",
  "church's chicken": "churchs.com",
  "golden corral": "goldencorral.com",
  "noodles & company": "noodles.com",
  "el pollo loco": "elpolloloco.com",
  "del taco": "deltaco.com",
  "moe's southwest grill": "moes.com",
  "zaxby's": "zaxbys.com",
  "bojangles": "bojangles.com",

  // Retail
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
  "sears": "sears.com",
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
  "napa auto parts": "napaonline.com",
  "goodyear": "goodyear.com",

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

  // Tech / software (common in online deals)
  "godaddy": "godaddy.com",
  "hostgator": "hostgator.com",
  "hostinger": "hostinger.com",
  "bluehost": "bluehost.com",
  "norton": "norton.com",
  "mcafee": "mcafee.com",
  "kaspersky": "kaspersky.com",
  "malwarebytes": "malwarebytes.com",
  "expressvpn": "expressvpn.com",
  "nordvpn": "nordvpn.com",
  "hola vpn": "hola.org",
  "adobe": "adobe.com",
  "microsoft": "microsoft.com",
  "acronis": "acronis.com",
  "ashampoo": "ashampoo.com",

  // Coffee
  "dutch bros": "dutchbros.com",
  "caribou coffee": "cariboucoffee.com",
  "tim hortons": "timhortons.com",
  "biggby coffee": "biggby.com",
  "coffee bean": "coffeebean.com",
};

/* Deterministic color palette from store name (no two adjacent stores same color) */
const AVATAR_COLORS = [
  "#16a34a", // green
  "#d97706", // amber
  "#2563eb", // blue
  "#9333ea", // purple
  "#dc2626", // red
  "#0891b2", // cyan
  "#ea580c", // orange
  "#65a30d", // lime
  "#db2777", // pink
  "#0d9488", // teal
];

function stringToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* Normalize store name for domain lookup */
function normalize(name: string): string {
  return name.toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/* Get the best Clearbit logo URL for a store, or null */
export function getBrandLogoUrl(storeName: string): string | null {
  const key = normalize(storeName);
  // exact match
  if (BRAND_DOMAINS[key]) return `https://logo.clearbit.com/${BRAND_DOMAINS[key]}`;
  // partial match — key starts with a known brand
  for (const [brand, domain] of Object.entries(BRAND_DOMAINS)) {
    if (key.startsWith(brand) || brand.startsWith(key)) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }
  return null;
}

/* Get the background color for an avatar */
export function getBrandColor(storeName: string): string {
  return stringToColor(storeName);
}

/* Get initials for a store */
export function getStoreInitials(storeName: string): string {
  return getInitials(storeName);
}
