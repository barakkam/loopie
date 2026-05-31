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
1. זהה את המאכל וחשב פחמימות לפי ידע תזונתי (דוגמאות: פיתה = ~50g, כוס פסטה = ~40g, בננה = ~25g, לחם פרוס = ~15g).
2. החל פיצול חוק ה-3 למניעת היפו בשעה הראשונה:
   • 70% מהפחמימות — הצהרה מיידית באייפון כעת.
   • 30% מהפחמימות — נשארות כ"חוב לוגי"; המשתמש יקבל תזכורת רק אם הסוכר יחצה 150 בעוד שעתיים.
3. תזמון Pre-Bolus לפי סוג אינסולין (מגיע ב-state.insulinType):
   • Lyumjev / Fiasp → המתן 0–2 דקות בלבד לפני האכילה.
   • Novorapid / Humalog → Pre-Bolus קשיח: 15–20 דקות לפני האכילה.
4. אם המשאבה מציעה בולוס (state.recommendedBolus) — אל תציע ערך אחר. ציין בסוף בלבד: "⚠️ הלופ מציע כעת XU — אל תחרוג."

מבנה פלט חובה (ענה תמיד בעברית, ממוקד, ללא משפטי פתיחה):
• 🍏 סך פחמימות מוערך: [X] גרם.
• 📊 חוק ה-3 — הצהרה עכשיו: הזן באייפון [70% מ-X = Y] גרם פחמימה.
• ⏳ תזמון: [הנחיית Pre-Bolus לפי סוג האינסולין].
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

  const numericContext = [
    `SGV=${s.sgv ?? 0}`,
    `trend=${s.trend ?? 'Flat'}`,
    `IOB=${+(s.iob ?? 0).toFixed(2)}`,
    `COB=${+(s.cob ?? 0).toFixed(1)}`,
    `CR=${s.cr ?? 15}`,
    `ISF=${s.isf ?? 120}`,
    `insulin=${s.insulinType ?? 'Novorapid'}`,
    `pumpBolus=${s.recommendedBolus ?? 0}`,
  ].join(' | ');

  const fullPrompt =
    `[context: ${numericContext}]\n` +
    `המשתמש אוכל: ${userInput.trim()}`;

  // ── 2. פתח Modal עם Spinner ────────────────────────────────
  _aiShowModal(userInput, null, s.recommendedBolus ?? 0, true);

  // ── 3. קריאה ישירה ל-Gemini generateContent (ללא streaming) ─
  let aiText = '';
  try {
    const apiKey = (typeof GEMINI_KEY !== 'undefined') ? GEMINI_KEY : '';
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
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

  // בנה פס המשאבה
  const pumpVal = parseFloat(pumpBolus);
  let pumpBar = '';
  if (!isNaN(pumpVal) && pumpVal >= 0) {
    const pumpColor = pumpVal === 0 ? '#ef4444' : '#3b82f6';
    const pumpMsg  = pumpVal === 0
      ? '🚫 בלימה מלאה! אל תזריק.'
      : `💉 המלצת המשאבה (JavaScript): <b style="color:${pumpColor}">${pumpVal}U</b>`;
    pumpBar = `
      <div style="
        padding:10px 14px;
        background:rgba(59,130,246,0.1);
        border-right:4px solid ${pumpColor};
        border-radius:8px;
        font-size:13px; font-weight:600;
        text-align:right; direction:rtl;
        margin-bottom:14px;
      ">${pumpMsg}</div>`;
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
