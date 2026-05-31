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
אתה מנוע חישוב טיפולי של LOOPIE לניהול סוכרת סוג 1.
תפקיד: ניתוח מאכל, חישוב פחמימות, חוק ה-3 (70/30), תזמון לפי סוג אינסולין.
אסור: דוח סטטוס יבש של מדדים. אסור: שיטת חישוב — רק תוצאות.

── מסד מאכלים (ערכים קשיחים — השתמש בהם תמיד) ──
פיתה=50g/3ש' | לחם פרוס=15g/3ש' | כוס פסטה=40g/4ש' | כוס אורז=45g/3ש'
בננה=25g/1.5ש' | תפוח=15g/1.5ש' | ענב כוס=25g/1.5ש' | תמר=18g/1.5ש'
פיצה פרוסה=30g/4ש' | המבורגר (עם לחמנייה)=30g/4ש' | שניצל מטוגן=10g/4ש'
קרואסון=25g/3ש' | בייגלה=55g/3ש' | וופל=20g/2ש' | עוגיה=10g/2ש'
כוס מיץ=25g/1ש' | שוקו=30g/2ש' | פתיבר=7.5g/1ש' | גלוקוז/סוכריה=5g/0.5ש'
חביתה=2g/1ש' | גבינה=2g/1ש' | יוגורט מתוק=15g/2ש' | קפיר=10g/2ש'
ג'חנון 100g=50g/5ש' | מלאווח=40g/4ש' | בורקס=25g/3ש'

── מאכל לא מוכר: ברירת מחדל 3 שעות ──
אם המאכל לא ברשימה — הערך הגיוני + ספיגה=3ש'.

── תזמון הזרקה לפי סוג אינסולין (insulin=... מה-context) ──
Lyumjev / Fiasp / lyumjev / fiasp → הזרק 0-2 דקות לפני האכילה (אינסולין מהיר מאוד!)
Novorapid / Humalog / novorapid / humalog → Pre-Bolus: 15-20 דקות לפני האכילה

── חוק ה-3 (70/30) ──
70% מהפחמימות → הצהרה מיידית באייפון.
30% מהפחמימות → חוב; תזכורת אם סוכר > 150 בעוד ~2ש'.

── המלצת LOOPIE (מותאמת) ──
חשב: (פחמימות ÷ CR) − IOB = בסיס.
אז התאם לפי context:
• override_active=true → הכפל במכפיל override
• activity=during_high → ×0.60 | during_medium → ×0.75 | during_low → ×0.90
• post_activity → ×0.70 עד ×0.80 (סכנת היפו מאוחר!)
• is_night=true → ×0.85
• is_dawn=true → ×1.10
• מאכל שומני (ספיגה>3.5ש') → 60% עכשיו + 40% בעוד 90 דק'

פלט — 5 שורות בדיוק, ללא משפטי פתיחה, ללא שיטת חישוב:
🍏 [שם מאכל]: [X]g | ⏱️ ספיגה: [N]ש'
🎯 LOOPIE: [N]U עכשיו[אם שומני: + [M]U בעוד 90 דק'] — [סיבה אם שונה מבסיסי, אחרת ריק]
📊 חוק ה-3: הזן [Y]g (70%) באייפון עכשיו
⏳ תזמון: [0-2 דק' / 15-20 דק'] לפני האכילה ([שם אינסולין])
🛡️ חוב: [Z]g (30%) — תזכורת אם סוכר > 150
`.trim();


/* ─── triggerLoopieAI ────────────────────────────────────────
   הפונקציה הציבורית היחידה של המודול.
   קוראת: userInput (שם/תיאור האוכל).
   עושה: פנייה ישירה ל-Gemini generateContent + מציגה Modal.
─────────────────────────────────────────────────────────────*/
async function triggerLoopieAI(userInput) {
  if (!userInput || !userInput.trim()) return;
  // מפנה ל-askGeminiAdvisor שמכיל את כל הלוגיקה הנכונה עם buildGeminiPrompt
  if (typeof askGeminiAdvisor === 'function') {
    askGeminiAdvisor(userInput);
  }
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
