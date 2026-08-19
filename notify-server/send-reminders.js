// Denní "budík" spouštěný přes GitHub Actions (viz .github/workflows/streak-reminder.yml).
// Projde všechny uživatele v Firestore, a komu dnes ještě nepřibyl trénink, pošle push
// notifikaci přes Firebase Cloud Messaging. Používá firebase-admin, který bere přístup
// ze service account klíče (viz README v tomto adresáři).

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

function fmtDateUTC(d) {
  return d.toISOString().slice(0, 10);
}

function czechDaySuffix(n) {
  if (n === 1) return 'den';
  if (n >= 2 && n <= 4) return 'dny';
  return 'dní';
}

// Stejná logika jako computeStreak() v appce, jen počítaná v UTC (server nezná
// časové pásmo uživatele) — proto může být řada o den posunutá kolem půlnoci.
function computeStreak(workouts, todayStr) {
  const days = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  if (days.length === 0) return 0;
  const today = new Date(todayStr + 'T00:00:00Z');
  const mostRecent = new Date(days[0] + 'T00:00:00Z');
  const diff = Math.round((today - mostRecent) / 86400000);
  if (diff > 1) return 0;
  const daySet = new Set(days);
  let streak = 0;
  const cursor = new Date(mostRecent);
  while (daySet.has(fmtDateUTC(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function main() {
  const today = fmtDateUTC(new Date());
  const snap = await db.collection('users').get();

  let sent = 0;
  let skipped = 0;
  const jobs = [];

  snap.forEach((doc) => {
    const state = doc.data() || {};
    const token = state.fcmToken;
    if (!token) { skipped++; return; }

    const workouts = state.workouts || [];
    const trainedToday = workouts.some((w) => w.date === today);
    if (trainedToday) { skipped++; return; }

    const streak = computeStreak(workouts, today);
    const body = streak > 0
      ? `Máš řadu ${streak} ${czechDaySuffix(streak)} — dnes ještě nemáš zapsaný trénink. Nezlom si ji!`
      : 'Dnes ještě nemáš zapsaný trénink. Pojď na to! 💪';

    sent++;
    jobs.push(
      admin.messaging().send({
        token,
        notification: { title: '🔥 IronRank — denní řada', body },
        webpush: {
          fcmOptions: {
            // uprav na skutečnou adresu, kde appku hostuješ (Firebase Hosting apod.)
            link: 'https://TVOJE-DOMENA-SEM/',
          },
        },
      }).catch((err) => {
        console.error(`Odeslání selhalo pro ${doc.id}:`, err.message);
        // token vypršel / appka odinstalována — smaž ho, ať to příště nezkoušíme znovu
        if (err.code === 'messaging/registration-token-not-registered') {
          return db.collection('users').doc(doc.id).update({ fcmToken: admin.firestore.FieldValue.delete() });
        }
      })
    );
  });

  await Promise.all(jobs);
  console.log(`Hotovo. Uživatelů celkem: ${snap.size}, odesláno: ${sent}, přeskočeno: ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
