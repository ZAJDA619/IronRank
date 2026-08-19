# Denní push oznámení o řadě — návod na zapojení (zdarma)

Tohle zařídí, že appka pošle push notifikaci na telefon i když ji máš úplně
zavřenou — jednou denně zkontroluje, kdo dnes ještě necvičil, a pošle mu
připomínku. Nic z toho nestojí peníze a nepotřebuješ platební kartu.

Funguje to takhle: appka si při zapnutí oznámení uloží k tvému účtu "adresu"
telefonu (FCM token). Jednou denně se v GitHub Actions (zdarma) spustí malý
skript, který se podívá do Firestore, kdo dnes necvičil, a pošle mu přes
Firebase Cloud Messaging (taky zdarma, bez limitu) push notifikaci.

---

## Krok 1 — vygeneruj VAPID klíč (Firebase Console)

1. Jdi na https://console.firebase.google.com → tvůj projekt **ironrank-fd81f**.
2. ⚙️ *Project settings* → záložka **Cloud Messaging**.
3. Sekce "Web configuration" → tlačítko **Generate key pair**.
4. Zkopíruj vygenerovaný klíč (dlouhý řetězec znaků).
5. V [index.html](../index.html) najdi řádek:
   ```js
   const FCM_VAPID_KEY = 'PASTE_YOUR_VAPID_KEY_HERE';
   ```
   a `PASTE_YOUR_VAPID_KEY_HERE` nahraď tím klíčem (i s uvozovkami kolem).

## Krok 2 — stáhni service account klíč (Firebase Console)

1. ⚙️ *Project settings* → záložka **Service accounts**.
2. Tlačítko **Generate new private key** → stáhne se ti JSON soubor.
3. **Tenhle soubor nikam nenahrávej ani necommituj do gitu** — je to plný
   admin přístup k tvému Firebase projektu. Za chvíli ho vložíš jako GitHub
   secret (krok 4) a pak ho z počítače smaž.

## Krok 3 — appku nasaď někam, kde má https adresu

Push notifikace (a service workery obecně) fungují jen na `https://` adrese,
ne na obyčejném `file://` (tj. ne když si jen dvakrát klikneš na
`index.html`). Nejjednodušší cesta je **Firebase Hosting** — je zdarma a máš
k němu už projekt založený. Postup je pro Windows (PowerShell).

### 3.1 — nainstaluj Node.js (pokud ho nemáš)

Firebase nástroje se instalují přes `npm`, který je součástí Node.js.

1. Jdi na https://nodejs.org a stáhni **LTS verzi** (velké zelené tlačítko).
2. Spusť stažený instalátor a proklikej se přes něj (všude stačí nechat
   výchozí nastavení, jen "Next" → "Next" → "Install").
3. Po instalaci **zavři a znovu otevři PowerShell/terminál** (jinak nový
   příkaz `node` nenajde).
4. Ověř, že to funguje:
   ```powershell
   node -v
   npm -v
   ```
   Mělo by se vypsat číslo verze u obou (např. `v20.11.0`). Pokud vidíš
   chybu "not recognized", restartuj počítač a zkus to znovu.

### 3.2 — nainstaluj Firebase CLI

V PowerShellu spusť:

```powershell
npm install -g firebase-tools
```

Chvíli to bude stahovat, počkej, až se vrátíš na normální řádek. Ověř:

```powershell
firebase --version
```

### 3.3 — přihlas se ke svému Google/Firebase účtu

```powershell
firebase login
```

Otevře se ti okno v prohlížeči — přihlas se stejným Google účtem, pod kterým
máš vytvořený Firebase projekt **ironrank-fd81f**, a klikni "Allow"/"Povolit".
Pak se vrať do terminálu, kde by mělo být napsáno něco jako
`✔ Success! Logged in as tvuj@email.cz`.

### 3.4 — přejdi do složky s projektem

V PowerShellu se přesuň do složky, kde máš `index.html` (tuhle složku):

```powershell
cd "C:\Users\zajda\ClaudeCode\liftoff-app"
```

### 3.5 — inicializuj Hosting

```powershell
firebase init hosting
```

Nástroj se tě zeptá na několik věcí — na co odpovědět:

| Otázka | Co odpovědět |
|---|---|
| `Are you ready to proceed?` | `Y` (Enter) |
| `Please select an option:` | šipkami vyber **Use an existing project** → Enter |
| (seznam projektů) | vyber **ironrank-fd81f** → Enter |
| `What do you want to use as your public directory?` | napiš **`.`** (jedna tečka) a Enter — znamená to "tahle složka", protože tvůj `index.html` je přímo tady, ne v podsložce |
| `Configure as a single-page app (rewrite all urls to /index.html)?` | `N` (ne) |
| `Set up automatic builds and deploys with GitHub?` | `N` (ne — o to se ti už stará vlastní GitHub Actions workflow) |
| `File index.html already exists. Overwrite?` | **`N` (NE!)** — tohle je důležité, řekni ne, jinak by ti to přepsalo tvoji appku prázdnou ukázkovou stránkou |

Po dokončení se ti ve složce objeví dva nové soubory: `firebase.json` a
`.firebaserc` — to je normální, nech je tam.

### 3.6 — nahraj appku na internet

```powershell
firebase deploy
```

Po chvíli se vypíše něco jako:

```
✔  Deploy complete!
Hosting URL: https://ironrank-fd81f.web.app
```

Tahle adresa (`https://ironrank-fd81f.web.app`) je tvoje appka na `https://`
— tu si otevři v mobilu/prohlížeči a odtamtud appku "Přidej na plochu".
Zkopíruj si ji i do [send-reminders.js](send-reminders.js) místo
`https://TVOJE-DOMENA-SEM/`.

> **Pozn.:** kdykoliv appku upravíš (např. znovu se mnou), stačí ve složce
> znovu spustit `firebase deploy` a nová verze se nahraje na stejnou adresu.

## Krok 4 — založ si GitHub repo a přidej secret

1. Pokud ještě nemáš, založ si zdarma účet na https://github.com.
2. Vytvoř nový repozitář (může být i private — GitHub Actions cron funguje
   v obou) a nahraj do něj celý tenhle projekt (`index.html`, `sw.js`,
   `notify-server/`, `.github/`, ...).
3. V repozitáři: **Settings → Secrets and variables → Actions → New
   repository secret**. Objeví se formulář se dvěma poli:
   - **Name** — sem napiš přesně `FIREBASE_SERVICE_ACCOUNT` (velkými
     písmeny, přesně takhle — pod tímhle názvem ho čte
     [send-reminders.js](send-reminders.js) i workflow soubor).
   - **Secret** (hodnota) — otevři JSON soubor z kroku 2 v poznámkovém
     bloku, zkopíruj **celý jeho obsah** (od první `{` po poslední `}`) a
     vlož ho sem.
4. Klikni **Add secret**.

## Krok 5 — otestuj ručně, ať nemusíš čekat do večera

Máš dvě možnosti, jak si to hned vyzkoušet, aniž bys čekal(a) na naplánovaný
čas.

### A) Spustit celý denní skript ručně přes GitHub Actions

- V GitHub repozitáři → záložka **Actions** → vyber workflow "Streak
  reminders" → tlačítko **Run workflow**.
- Zkontroluje se přes všechny uživatele v appce najednou, přesně to samé,
  co by se stalo automaticky večer.
- Klikni na proběhlý run a rozklikni krok "node send-reminders.js" — uvidíš,
  kolika lidem to poslalo oznámení a jestli něco selhalo.

### B) Poslat si jednu testovací notifikaci přímo z Firebase Console

Tohle je rychlejší na vyzkoušení, jestli push vůbec dojde na tvůj telefon,
bez nutnosti spouštět skript.

1. Nejdřív potřebuješ svůj **FCM token** — v appce klikni "🔔 Povolit
   oznámení o řadě" a povol to. Token se ti uloží do Firestore k tvému účtu
   (pole `fcmToken` v dokumentu `users/{tvoje uid}`) — najdeš ho ve Firebase
   Console → **Firestore Database** → kolekce `users` → tvůj dokument →
   zkopíruj hodnotu pole `fcmToken`.
2. Firebase Console → **Engage** (v levém menu) → **Messaging** → **New
   campaign** → **Notifications**.
3. Otevře se formulář na vytvoření zprávy. Vyplň postupně:

   | Pole ve formuláři | Co tam napsat |
   |---|---|
   | **Notification name** | Interní název jen pro tebe (v appce ho nikdo neuvidí, slouží Firebase k statistikám). Např. `streak-reminder-test`. |
   | **Notification title** | Text, co se zobrazí jako **titulek** notifikace na telefonu. Např. `🔥 IronRank — denní řada`. |
   | **Notification text** | Text **těla** notifikace pod titulkem. Např. `Máš řadu 5 dní — dnes ještě nemáš zapsaný trénink. Nezlom si ji!` (přesně tenhle formát textu appka i skript sami skládají za tebe, tady je jen zadáváš ručně pro test.) |
   | **Notification image** *(nepovinné)* | URL obrázku, co se zobrazí v notifikaci (např. ikonka appky). Klidně nech prázdné — appka místo toho stejně používá ikonu z `icon-192.png` nastavenou v service workeru. |

4. Vpravo nahoře klikni **Send test message** (ne hlavní "Review"/"Publish"
   — to by šlo hromadně všem podle Target, viz níž — "Send test message"
   pošle jen tobě, na jeden konkrétní token, a Target vůbec neřešíš).
5. Do pole **Add an FCM registration token** vlož token, co jsi zkopíroval(a)
   v bodě 1, a klikni **Test**.
6. Notifikace by se ti měla objevit na telefonu během pár vteřin — i když
   appku máš zavřenou.

### Jak nastavit Target, aby fungoval na tvoji appku (PWA)

Pokud chceš místo "Send test message" použít hromadné publikování (dolní
tlačítko "Review"/"Publish", co pošle zprávu všem najednou), potřebuješ v
sekci **Target** vybrat appku:

1. Tvoje appka musí být ve Firebase zaregistrovaná jako **Web app** — to už
   je (přesně to je ten `firebaseConfig` blok v `index.html`). Ověříš to ve
   ⚙️ *Project settings* → dole sekce **Your apps** → měla by tam být
   položka s ikonou `</>` (web).
2. Aby appka šla v Target vůbec **vybrat**, musí mít Firebase zaznamenaný
   aspoň jeden aktivní FCM token z ní — tzn. appku musíš mít už nasazenou
   na `https://` (krok 3 výše) a **aspoň jednou v ní kliknout "🔔 Povolit
   oznámení o řadě"**. Bez toho se ve výběru appka nenabídne, protože
   Firebase zatím neví, že z ní někdo Messaging používá.
3. V sekci **Target** zvol:
   - **App** → z dropdownu vyber svoji appku (objeví se pod platformou
     "Web").
   - Níž "User segment" nech na **All users**, pokud chceš poslat všem.
4. Klikni **Review** → **Publish now** (nebo si to naplánuj na konkrétní
   čas tlačítkem "Schedule").

**Důležité:** Tenhle hromadný "Target: App" broadcast pošle **úplně
stejnou** zprávu úplně všem najednou — nejde takhle nikomu poslat jeho
vlastní počet dní v řadě, protože to má každý jiné. Na to je určený právě
skript [send-reminders.js](send-reminders.js) — ten neposílá přes Target,
ale každému uživateli zvlášť rovnou na jeho vlastní `fcmToken` z Firestore,
s jeho osobním textem ("Máš řadu X dní..."). Target v Console se ti proto
bude hodit spíš na jednorázová hromadná oznámení (např. "appka má novou
funkci!"), ne na denní řadu — tu už za tebe řeší GitHub Actions workflow.

## Poznámky / omezení

- **Guest (host) mode nedostane real push** — token se ukládá jen k účtu
  synchronizovanému do Firestore. Host pořád dostane alespoň lokální
  připomínku, když appku otevře (to funguje bez tohohle nastavení).
- **Časové pásmo:** skript v `send-reminders.js` běží na serveru v UTC a
  neví, v jakém pásmu jsi ty. U lidí v časových pásmech před UTC (např.
  střední Evropa) se tak může výpočet řady kolem půlnoci občas lišit o den
  od toho, co appka počítá lokálně na telefonu — je to jen odhad pro
  připomínku, na reálné XP/ranky to nemá vliv.
- Automatický čas spouštění je v
  [.github/workflows/streak-reminder.yml](../.github/workflows/streak-reminder.yml)
  na řádku `cron: '0 18 * * *'` (18:00 UTC = 19:00/20:00 podle letního
  času). Uprav si to podle sebe — [crontab.guru](https://crontab.guru)
  pomůže se zápisem.
- Chceš-li push úplně vypnout, stačí smazat/zakázat workflow v GitHub
  Actions — appka bez něj dál normálně funguje (jen bez připomínek na
  pozadí, kdy je appka zavřená).
