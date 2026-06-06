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
חוק בטיחות קשיח: אם חסרים נתוני SGV, IOB, COB מהקשר — עצור!
אל תנחש ואל תמציא מספרים. החזר: 'חסרים לי נתוני אמת מעודכנים מהמשאבה, אנא פעל לפי האייפון הפיזי בלבד.'

חילוץ חומרה (שאלות על פוד/משאבה/קנולה/חיישן):
אל תנחש — נתח את ה-context החי מ-NS.
• SGV>240 + IOB>1.5U + גרף שטוח/עולה למרות בזאלי מלא = כשל קנולה/פוד מת.
  פלוט: "🚨 כשל ספיגה/פוד מת! החלף פוד פיזית במיקום חדש + בולוס תיקון במזרק/עט חיצוני — לא דרך הלופ!"
• CAGE>40 שעות — ציין כגורם עיקרי לתנגודת רקמה.
• נתונים תקינים — הרגע, הפוד תקין.

אתה עוזר טיפולי לניהול סוכרת סוג 1. תפקידך: לנתח מאכל ולתת הנחיה ברורה אחת — כמה גרם פחמימה להזין ללופ באייפון עכשיו.
אסור: שיטת חישוב, מושגים פנימיים, מילה "חוק ה-3". אסור: בלבול בין גרמים ליחידות. רק הנחיה אחת ברורה.

── מסד מאכלים קשיח ──
פיתה=50g/3ש' | לחם פרוס=15g/3ש' | כוס פסטה=40g/3ש' | כוס אורז=45g/3ש'
בננה=25g/3ש' | תפוח=15g/3ש' | ענב כוס=25g/3ש' | תמר=18g/3ש'
פיצה ביתית/משולש ביתי=22g/4ש' | פיצה פיצרייה/מסעדה/קנויה=35g/5ש' | המבורגר+לחמנייה=30g/4ש' | שניצל מטוגן=10g/4ש'
קרואסון=25g/3ש' | בייגלה=55g/3ש' | וופל=20g/3ש' | עוגיה=10g/3ש'
כוס מיץ=25g/3ש' | שוקו=30g/3ש' | פתיבר=7.5g/3ש' | גלוקוז=5g/3ש'
חביתה=2g/3ש' | גבינה=2g/3ש' | יוגורט מתוק=15g/3ש' | קפיר=10g/3ש'
חלב סויה רגיל=4g/3ש' | חלב סויה וניל/ממותק=12g/3ש'
ג'חנון 100g=50g/5ש' | מלאווח=40g/4ש' | בורקס=25g/3ש' | צ'יפס=30g/4ש'

── 🍕 פרוטוקול פיצה קשיח ──
פיצה = תמיד שומני קיצוני, פיצול חובה 50%+50%.
פיצה ביתית/משולש ביתי = 22g/יחידה/4ש'.
פיצה פיצרייה/מסעדה/קנויה = 35g/יחידה/5ש'.
אם הוזן מספר מפורש ('פיצה 50') — השתמש בו ותעלם מהמילון.
אסור בהחלט להציג 15g לפיצה — ערך זה שגוי ומסוכן!
מאכל לא ברשימה → הערך הגיוני + ספיגה=3ש'.

── סוגי מאכל ופיצול פחמימות ──
מאכל שומני/איטי (ספיגה ≥ 4ש': ג'חנון/פיצה/מלאווח/המבורגר/צ'יפס) → הזן 50% עכשיו, 50% חוב להמשך.
מאכל רגיל (ספיגה 3ש') → הזן 70% עכשיו, 30% חוב להמשך.
מאכל מהיר (ספיגה <2ש': מיץ/פרי/גלוקוז) → הזן 100% עכשיו, אין חוב.

── תזמון לפי אינסולין ──
Lyumjev/Fiasp → 0-2 דקות לפני האכילה.
Novorapid/Humalog → 15-20 דקות לפני האכילה.

── התאמות context ──
override_active=true → הפחת לפי המכפיל | activity=during_high → הפחת 40% | post_activity → הפחת 25%.
is_night=true → הפחת 15% | is_dawn=true → הוסף 10%.

── 🦺 פרוטוקול הפסקת בית ספר ──
הפעל כשכותבים: הפסקה / ארוחת עשר / א. עשר / חצר.
SGV < 130 או SGV 130-140 עם ירידה → "הזן 4g (חצי פתיבר) ללופ — ללא בולוס."
SGV ≥ 150 יציב/עולה → "אין צורך בפחמימות עכשיו. המתן."
שעה אחרי הפסקה + SGV > 150 + IOB > 1.2U → "אל תזריק — IOB עדיין פועל. המתן."
שעה אחרי הפסקה + SGV > 150 + IOB ≤ 1.2U → בולוס תיקון לפי ISF.
חוק ברזל: אין בולוס לפני הפסקה/ריצה.

── פורמט פלט קשיח (4 שורות בלבד, עברית נקייה) ──

🍏 [שם המאכל והכמות] | סך פחמימות: [X]g | ספיגה: [N]ש'

🎯 פעולה באייפון עכשיו:
כנס ללופ, הזן [Y]g פחמימה, ואשר את המינון שהמשאבה מציעה.
← [Y] = [50%/70%/100%] מ-[X]g לפי סוג המאכל

⏳ תזמון: [0-2 דק' / 15-20 דק'] לפני האכילה ([שם אינסולין])

🛡️ [Z]g נותרים כחוב — אם הסוכר יעלה מעל 150 אחרי [שעתיים/שלוש שעות], הזן אותם ללופ.
← אין לבצע הזרקה נוספת עכשיו!
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
