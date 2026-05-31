// ============================================================
//  loopie-ai.js  —  LOOPIE AI Core  (v1.0 Modular)
//  אחראי: ניתוח אוכל + חוק ה-3 (70/30) בלבד.
//  מניח שהמשתנה הגלובלי `state` קיים ב-nightscout.js.
//  מניח שהקבועים NS_URL, NS_TOKEN, GEMINI_KEY קיימים גלובלית.
// ============================================================

/* ─── SYSTEM PROMPT ─────────────────────────────────────────
   קבוע סגור. אסור לשנות ללא גרסה.
   תפקיד: ניתוח פחמימות + חוק ה-3 בלבד.
   אסור: דוחות סטטוס יבשים של מדדי המשאבה.
─────────────────────────────────────────────────────────────*/
const SYSTEM_PROMPT = `
אתה מנוע הבינה המלאכותית הרשמי של אפליקציית LOOPIE לניהול סוכרת מסוג 1.
תפקידך הבלעדי הוא לנתח את האוכל שהמשתמש מזין, לחשב פחמימות, ולהחיל את חוק ה-3 הטיפולי במדויק.

חוק ברזל: אסור לך לפלוט דוח סטטוס יבש של מדדי המשאבה (סוכר, IOB, COB, בזאלי וכו') כתגובה ראשית — גם אם הנתונים נמסרו לך ברקע. הם שם כהקשר בלבד.

חוקי יסוד — ניתוח ארוחות וחוק ה-3:
1. זהה את המאכל וחשב פחמימות לפי ידע תזונתי:
   פיתה=50g, לחם פרוס=15g, כוס פסטה=40g, כוס אורז=45g, בננה=25g, תפוח=15g,
   פיצה פרוסה=30g, המבורגר ללא לחמנייה=5g, לחמנייה=25g, שניצל=10g,
   קרואסון=25g, בייגלה=55g, וופל=20g, עוגיה=10g, כוס מיץ=25g, שוקו=30g.
   לכל מאכל לא מוכר — הערך הגיוני לפי הידע שלך.

2. חשב זמן ספיגה צפוי לפי סוג המאכל:
   • פחמימות מהירות (מיץ, סוכר, פרי) → 1–1.5 שעות
   • פחמימות רגילות (לחם, אורז, פסטה, פיתה) → 2–3 שעות
   • ארוחה שומנית (פיצה, המבורגר, שניצל מטוגן) → 3–5 שעות
   • ארוחה מעורבת (בשר + לחם + ירקות) → 2.5–4 שעות

3. החל פיצול חוק ה-3 למניעת היפו:
   • 70% מהפחמימות — הצהרה מיידית באייפון כעת.
   • 30% מהפחמימות — חוב לוגי; תזכורת אם סוכר > 150 בעוד ~2 שעות.

4. תזמון Pre-Bolus לפי סוג אינסולין (מגיע ב-state.insulinType):
   • Lyumjev / Fiasp → 0–2 דקות לפני האכילה.
   • Novorapid / Humalog → Pre-Bolus קשיח: 15–20 דקות לפני האכילה.

5. אם המשאבה מציעה בולוס (state.recommendedBolus > 0) — ציין בסוף: "⚠️ הלופ מציע כעת XU — אל תחרוג."

מבנה פלט חובה (עברית, ממוקד, ללא משפטי פתיחה):
• 🍏 סך פחמימות מוערך: [X] גרם.
• ⏱️ זמן ספיגה צפוי: [N–M שעות] — [סוג: מהיר/רגיל/שומני/מעורב].
• 🧮 בסיסי: ([X]÷CR=[CR_VALUE])−IOB=[IOB_VALUE]U = [תוצאה]U.
• 🎯 LOOPIE (מותאם): התחשב ב-context ותן המלצה — override/ספורט/לילה/dawn/מאכל שומני.
   override_active=true → הפחת לפי המכפיל.
   activity=during → הפחת לפי עצימות. post_activity → הפחת 20–30%.
   is_night=true → ×0.85. is_dawn=true → ×1.10.
   מאכל שומני → 60% עכשיו + 40% בעוד 90 דק'.
   כתוב: "🎯 LOOPIE: [N]U" + משפט אחד למה.
• 📊 חוק ה-3 — הצהרה עכשיו: הזן באייפון [70%×X = Y] גרם פחמימה.
• ⏳ תזמון הזרקה: [הנחיית Pre-Bolus לפי סוג האינסולין].
• 🛡️ חוב פחמימות (30%): [Z] גרם — תזכורת תישלח אם סוכר > 150 בעוד ~2 שעות.
`.trim();


/* ─── triggerLoopieAI ────────────────────────────────────────
   הפונקציה הציבורית היחידה של המודול.
   קוראת: userInput (שם/תיאור האוכל).
   עושה: פנייה ישירה ל-Gemini generateContent + מציגה Modal.
─────────────────────────────────────────────────────────────*/
async function triggerLoopieAI(userInput) {
  if (!userInput || !userInput.trim()) return;

  // ── 1. אסוף State מספרי בלבד ──────────────────────────────
  const s = (typeof state !== 'undefined') ? state : {};

  // שלוף CR מהפרופיל הנוכחי (nightscout.js)
  let crNow = s.cr ?? 15;
  try {
    const prof = (typeof fullHistory !== 'undefined' && fullHistory.profile) ? fullHistory.profile : null;
    if (prof) {
      const h = new Date().getHours();
      const crArr = prof.carbratio || prof.carbRatio || prof.ic;
      if (typeof profileValueAt === 'function') crNow = parseFloat(profileValueAt(crArr, h) || crNow);
    }
  } catch(e) {}

  // ── גורמים נוספים מהקשר LOOPIE ──────────────────────────
  let activityContext = 'none';
  let postActivity    = false;
  let activityFactor  = 1.0;
  try {
    if (typeof checkActiveActivity === 'function') {
      const actResult = checkActiveActivity();
      if (actResult) {
        const sp = actResult.sp || {};
        if (actResult.type === 'during') {
          activityContext = 'during_' + (actResult.act.intensity || 'medium');
          activityFactor  = 1 - (sp.basalReduction || 30) / 100;
        } else if (actResult.type === 'after') {
          postActivity    = true;
          activityContext = 'post_' + (actResult.act.intensity || 'medium') + '_' + (actResult.minsAgo || 0) + 'min_ago';
          activityFactor  = 1 - (sp.postReduction || 20) / 100;
        } else if (actResult.type === 'before') {
          activityContext = 'upcoming_' + (actResult.act.intensity || 'medium') + '_in_' + (actResult.minsLeft || 0) + 'min';
          activityFactor  = actResult.minsLeft < 60 ? 0.8 : 0.9;
        }
      }
    }
  } catch(e) {}

  // ── שעה ביום ──────────────────────────────────────────────
  const nowHour = new Date().getHours();
  const isNight = nowHour >= 22 || nowHour < 6;
  const isDawn  = nowHour >= 5  && nowHour < 8;

  const numericContext = [
    `SGV=${s.sgv ?? 0}`,
    `trend=${s.trend ?? 'Flat'}`,
    `IOB=${+(s.iob ?? 0).toFixed(2)}`,
    `COB=${+(s.cob ?? 0).toFixed(1)}`,
    `CR=${crNow}`,
    `ISF=${s.isf ?? 120}`,
    `insulin=${s.insulinType ?? 'Novorapid'}`,
    `pumpBolus=${s.recommendedBolus ?? 0}`,
    `override_active=${s.overrideActive ?? false}`,
    `override_name=${s.overrideName ?? 'none'}`,
    `override_multiplier=${s.overrideMultiplier ?? 1}`,
    `activity=${activityContext}`,
    `post_activity=${postActivity}`,
    `activity_factor=${activityFactor.toFixed(2)}`,
    `hour=${nowHour}`,
    `is_night=${isNight}`,
    `is_dawn=${isDawn}`,
  ].join(' | ');

  const fullPrompt =
    `[context: ${numericContext}]\n` +
    `המשתמש אוכל: ${userInput.trim()}`;

  // ── 2. פתח Modal עם Spinner ────────────────────────────────
  _aiShowModal(userInput, null, s.recommendedBolus ?? 0, true);

  // ── 3. קריאה ישירה ל-Gemini generateContent (ללא streaming) ─
  let aiText = '';
  try {
    const apiKey = (typeof geminiKey === 'function') ? geminiKey() : (typeof GEMINI_KEY !== 'undefined' ? GEMINI_KEY : '');
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err.slice(0, 120)}`);
    }

    const data = await res.json();
    aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      'לא התקבלה תשובה מג\'מיני.';
  } catch (e) {
    aiText = `⚠️ שגיאת AI: ${e.message}`;
  }

  // ── 4. עדכן Modal עם התשובה הסופית ───────────────────────
  _aiShowModal(userInput, aiText, s.recommendedBolus ?? 0, false);
}


/* ─── _aiShowModal (פנימי) ──────────────────────────────────
   מציג Modal משולב:
   • שורה עליונה — המלצת משאבה (JavaScript, מ-state.recommendedBolus)
   • גוף — פלט חוק ה-3 מג'מיני
─────────────────────────────────────────────────────────────*/
function _aiShowModal(foodInput, aiText, pumpBolus, loading) {
  const MODAL_ID = 'loopie-ai-modal';
  let modal = document.getElementById(MODAL_ID);

  // צור Modal אם לא קיים
  if (!modal) {
    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.65); backdrop-filter:blur(4px);
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  // בנה פס המשאבה — רק אם הלופ ממליץ על הזרקה חיובית
  const pumpVal = parseFloat(pumpBolus);
  let pumpBar = '';
  if (!isNaN(pumpVal) && pumpVal > 0) {
    pumpBar = `
      <div style="
        padding:10px 14px;
        background:rgba(59,130,246,0.1);
        border-right:4px solid #3b82f6;
        border-radius:8px;
        font-size:13px; font-weight:600;
        text-align:right; direction:rtl;
        margin-bottom:14px;
      ">💉 הלופ ממליץ: <b style="color:#3b82f6">${pumpVal}U</b> — אשר באייפון</div>`;
  }

  // בנה גוף תוכן
  let body = '';
  if (loading) {
    body = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:14px;">
              ⏳ מנתח עם Gemini AI...
            </div>`;
  } else {
    // המר줄 מעבר שורה ל-HTML
    const formatted = (aiText || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    body = `<div style="
              font-size:14px; line-height:1.75;
              color:#e2e8f0; direction:rtl; text-align:right;
            ">${formatted}</div>`;
  }

  modal.innerHTML = `
    <div style="
      background:#1e293b;
      border:1px solid rgba(255,255,255,0.1);
      border-radius:16px;
      padding:20px 20px 16px;
      width:min(420px,92vw);
      max-height:80vh;
      overflow-y:auto;
      box-shadow:0 25px 60px rgba(0,0,0,0.5);
      position:relative;
    ">
      <!-- כותרת -->
      <div style="
        display:flex; justify-content:space-between; align-items:center;
        margin-bottom:14px; direction:rtl;
      ">
        <span style="font-size:15px; font-weight:700; color:#f1f5f9;">
          🤖 LOOPIE AI — ${_escapeHtml(foodInput)}
        </span>
        <button onclick="document.getElementById('${MODAL_ID}').remove()"
          style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;">
          ×
        </button>
      </div>

      <!-- פס המשאבה -->
      ${pumpBar}

      <!-- פלט Gemini -->
      ${body}

      <!-- כפתור סגירה תחתון -->
      <div style="text-align:center; margin-top:16px;">
        <button onclick="document.getElementById('${MODAL_ID}').remove()"
          style="
            padding:8px 28px; border-radius:8px; border:none; cursor:pointer;
            background:rgba(99,102,241,0.2); color:#818cf8;
            font-size:13px; font-weight:600;
          ">סגור</button>
      </div>
    </div>`;
}


/* ─── עזר HTML Escape ───────────────────────────────────────*/
function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
