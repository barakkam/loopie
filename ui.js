// ============================================================
//  ui.js  —  LOOPIE UI Functions  (v1.0 Modular)
//
//  מכיל את כל פונקציות ה-UI שחיות בדפדפן:
//  showPopup, closePopup, switchTab, askOmnibox,
//  askGeminiAdvisor, drawMiniChart, generateReport,
//  loadLogs, filterLogs, exportLogs, showMemoryHistory,
//  _clearImage, _onImageSelected, renderProfile ועוד.
//
//  תלויות: nsData, fullHistory, nsGet (מ-nightscout.js)
//          triggerLoopieAI (מ-loopie-ai.js)
// ============================================================

// ─── Food Database ────────────────────────────────────────────
var FOOD_DB = {
    "פיתה":         { carbs: 50,  durationH: 3, notes: "פחמימות מהירות-בינוניות" },
    "פיצה ביתית":   { carbs: 25,  durationH: 5, notes: "שומן גבוה — ספיגה איטית", perUnit: "חתיכה" },
    "פיצה מסעדה":   { carbs: 40,  durationH: 5, notes: "שומן גבוה — ספיגה איטית (40g לסלייס)", perUnit: "חתיכה" },
    "המבורגר":      { carbs: 50,  durationH: 5, notes: "שומן+חלבון — ספיגה איטית" },
    "ציפס":         { carbs: 1.5, durationH: 3, notes: "יחידה אחת (10 יח'=15g)", perUnit: "יחידה" },
    "צ'יפס":        { carbs: 1.5, durationH: 3, notes: "יחידה אחת (10 יח'=15g)", perUnit: "יחידה" },
    "פסטה":         { carbs: 30,  durationH: 5, notes: "כוס מבושלת — ספיגה איטית", perUnit: "כוס" },
    "אורז":         { carbs: 5,   durationH: 3, notes: "כף", perUnit: "כף" },
    // מאכלים ישראליים נוספים
    "ג'חנון":       { carbs: 50,  durationH: 6, notes: "100g — שומן גבוה, ספיגה איטית מאוד" },
    "מלאווח":       { carbs: 45,  durationH: 6, notes: "100g — שומן גבוה, ספיגה איטית" },
    "תפוח":         { carbs: 15,  durationH: 2, notes: "תפוח בינוני — GI נמוך" },
    "בננה":         { carbs: 25,  durationH: 2, notes: "בננה בינונית — GI בינוני" },
    "ענבים":        { carbs: 15,  durationH: 1.5, notes: "כוס — GI בינוני-גבוה" },
    "ענב":          { carbs: 15,  durationH: 1.5, notes: "כוס — GI בינוני-גבוה" },
    "תמר":          { carbs: 18,  durationH: 1, notes: "תמר אחד — GI גבוה", perUnit: "תמר" },
    "לחם":          { carbs: 15,  durationH: 2, notes: "פרוסה — GI בינוני", perUnit: "פרוסה" },
    "במבה":         { carbs: 10,  durationH: 2, notes: "שקית קטנה 25g" },
    "קרואסון":      { carbs: 30,  durationH: 3, notes: "שומן בינוני — ספיגה בינונית" },
    "גבינה לבנה":   { carbs: 3,   durationH: 1, notes: "100g — פחמימות נמוכות" },
    "יוגורט":       { carbs: 12,  durationH: 1, notes: "גביע — GI נמוך" },
    "חלב":          { carbs: 12,  durationH: 1, notes: "כוס 250ml" },
    "שוקולד":       { carbs: 20,  durationH: 2, notes: "קוביית שוקולד 40g" },
    "עוגייה":       { carbs: 10,  durationH: 2, notes: "עוגייה אחת", perUnit: "עוגייה" },
    "גלידה":        { carbs: 20,  durationH: 3, notes: "כדור — GI גבוה + שומן מאט ספיגה", perUnit: "כדור" },
    "מיץ תפוזים":   { carbs: 26,  durationH: 1, notes: "כוס 250ml — GI גבוה" },
    "טילון":        { carbs: 40,  durationH: 1, notes: "ארטיק — GI גבוה מאוד" },
    "ארטיק":        { carbs: 20,  durationH: 1, notes: "GI גבוה" },
    "פופסיקל":      { carbs: 15,  durationH: 1, notes: "GI גבוה" },
    "בורקס":        { carbs: 30,  durationH: 5, notes: "שומן גבוה — ספיגה איטית" },
    "בורקס גבינה":  { carbs: 28,  durationH: 5, notes: "שומן גבוה" },
    "בורקס תפוח אדמה": { carbs: 32, durationH: 5, notes: "עמילן + שומן — ספיגה איטית" },
    "שניצל":        { carbs: 15,  durationH: 3, notes: "ציפוי — GI בינוני" },
    "פלאפל":        { carbs: 20,  durationH: 3, notes: "3 כדורים" },
    "חומוס":        { carbs: 15,  durationH: 3, notes: "מנה — GI נמוך" },
    "אבטיח":        { carbs: 15,  durationH: 1, notes: "פרוסה — GI גבוה" },
    "מלון":         { carbs: 12,  durationH: 1, notes: "פרוסה — GI בינוני" },
    "תות":          { carbs: 8,   durationH: 1, notes: "כוס — GI נמוך" },
    "אפרסק":        { carbs: 12,  durationH: 1.5, notes: "בינוני" },
    "דובדבן":       { carbs: 12,  durationH: 1, notes: "כוס" },
    "מנגו":         { carbs: 20,  durationH: 1.5, notes: "GI בינוני-גבוה" },
    "פיצוחים":      { carbs: 5,   durationH: 2, notes: "חופן — פחמימות נמוכות" },
    "קרקרים":       { carbs: 15,  durationH: 2, notes: "6 קרקרים", perUnit: "קרקר" },
    "ביסלי":        { carbs: 12,  durationH: 2, notes: "שקית קטנה 25g" },
    "חטיף":         { carbs: 15,  durationH: 2, notes: "שקית קטנה" },
    "פיצה פטה":     { carbs: 20,  durationH: 3, notes: "2 פרוסות קטנות" },
    "חלב סויה":     { carbs: 12,  durationH: 1.5, notes: "כוס 250ml — GI נמוך" },
    "חלב שקדים":    { carbs: 4,   durationH: 1.5, notes: "כוס 250ml" },
    "חלב":          { carbs: 12,  durationH: 1.5, notes: "כוס 250ml" },
    "פתיבר":        { carbs: 7.5, durationH: 2,   notes: "פתיבר שלם — פחמימות איטיות" },
    "חצי פתיבר":    { carbs: 4,   durationH: 2,   notes: "חצי פתיבר" },
    "גלוקוז":       { carbs: 15,  durationH: 0.5, notes: "טבלית גלוקוז — מהיר מאוד" },
    "חצי גלוקוז":   { carbs: 7.5, durationH: 0.5, notes: "חצי טבלית" }
};

// === פחמימות חילוץ (rescue carbs) ===
var RESCUE_DB = {
    "פתיבר":        { carbs: 7.5,  unit: "חתיכה",  fast: false },
    "חצי פתיבר":   { carbs: 4,    unit: "חצי",    fast: false },
    "גלוקוז":       { carbs: 15,   unit: "טבלייה", fast: true  },
    "חצי גלוקוז":  { carbs: 7.5,  unit: "חצי",    fast: true  },
    "מיץ 2 שלוקים":{ carbs: 7.5,  unit: "2 שלוקים",fast: true  },
    "מיץ 4 שלוקים":{ carbs: 15,   unit: "4 שלוקים",fast: true  },
    "מיץ":          { carbs: 15,   unit: "כוס",    fast: true  }
};

// כלל: מיץ/גלוקוז תמיד מלווה בפתיבר
// בנה תוכנית חילוץ לפי כמות פחמימות הנדרשת

function buildRescuePlan(carbsNeeded, sgv, iob) {
    carbsNeeded = Math.round(carbsNeeded);
    var plans = [];

    // אפשרות א — מהיר + איטי (מיץ/גלוקוז + פתיבר)
    if (carbsNeeded >= 15) {
        var fastC  = Math.min(15, carbsNeeded);
        var slowC  = carbsNeeded - fastC;
        var fastItem = fastC >= 15 ? "גלוקוז (15g)" : "חצי גלוקוז (7.5g)";
        var slowItem = slowC >= 7.5 ? "פתיבר (7.5g)" : slowC >= 4 ? "חצי פתיבר (4g)" : "";
        plans.push({
            label: "מהיר + מייצב",
            items: [
                { name: fastItem, carbs: fastC, fast: true },
                slowItem ? { name: slowItem, carbs: slowC > 7.5 ? 7.5 : slowC, fast: false } : null
            ].filter(Boolean),
            totalCarbs: fastC + (slowItem ? Math.min(7.5, slowC) : 0),
            color: "#ef4444"
        });
    }

    // אפשרות ב — מיץ + פתיבר
    if (carbsNeeded >= 7.5) {
        var juiceC = carbsNeeded >= 15 ? 15 : 7.5;
        var barC   = carbsNeeded >= 15 ? 7.5 : 4;
        plans.push({
            label: "מיץ + פתיבר",
            items: [
                { name: (juiceC>=15 ? "4 שלוקים מיץ (15g)" : "2 שלוקים מיץ (7.5g)"), carbs: juiceC, fast: true },
                { name: (barC>=7.5 ? "פתיבר שלם (7.5g)" : "חצי פתיבר (4g)"),          carbs: barC,   fast: false }
            ],
            totalCarbs: juiceC + barC,
            color: "#f59e0b"
        });
    }

    // אפשרות ג — פתיבר בלבד (אם נמוך קל)
    if (carbsNeeded <= 10) {
        var bars = carbsNeeded >= 7.5 ? [{ name: "פתיבר שלם (7.5g)", carbs: 7.5, fast: false }]
                                      : [{ name: "חצי פתיבר (4g)",   carbs: 4,   fast: false }];
        plans.push({
            label: "פתיבר בלבד",
            items: bars,
            totalCarbs: bars[0].carbs,
            color: "#10b981"
        });
    }

    // האם לרשום ב-Loop?
    // עקרון רפואי: Loop משתמש בנתוני פחמימות לחיזוי וכיול עתידי.
    // IOB גבוה = אינסולין פעיל שעלול להמשיך להוריד סוכר — חובה לרשום.
    var loopNote = "";
    if (iob > 1.5 && sgv < 90) {
        loopNote = "⚠️ רשום ב-Loop: פחמימות " + carbsNeeded + "g | אינסולין: 0U (חילוץ)";
    } else if (iob > 0.5) {
        loopNote = "📱 רשום ב-Loop: פחמימות " + carbsNeeded + "g | אינסולין: 0U";
    } else {
        loopNote = "ℹ️ לא חייב לרשום ב-Loop — IOB נמוך";
    }

    return { plans: plans, loopNote: loopNote };
}

// חישוב כמות חילוץ נדרשת
function calcRescueCarbs(sgv, targetBG, iob, isf) {
    targetBG = targetBG || 120;
    var fromSGV  = Math.max(0, Math.ceil((targetBG - sgv) * 0.04 * 10)); // כ-4g לכל 10 נקודות
    var fromIOB  = Math.round(iob * (isf || 50) / 10);                   // IOB עלול להוריד עוד
    return Math.max(fromSGV, fromIOB, 0);
}

// נרמול שמות — טיפול בוריאציות כתיב
function normalizeFood(name) {
    if (!name) return '';
    return name.trim().toLowerCase()
        .replace(/צ['']?יפס|ציפס|chips/g, 'ציפס')
        .replace(/המבורגר|המבורגרר|burger|המבורגם/g, 'המבורגר')
        .replace(/פיצ['']?ה|פיצה|פיצא|pizza/g, 'פיצה')
        .replace(/פית['']?ה|פיתה|פיתא/g, 'פיתה')
        .replace(/[''`]/g, '');
}

// חיפוש מאכל במאגר — עם תמיכה בחיפוש חלקי ועברית חסרה
function findFood(name) {
    if (!name || !name.trim()) return null;
    var n = normalizeFood(name);
    var keys = Object.keys(FOOD_DB);
    // התאמה מדויקת
    for (var i = 0; i < keys.length; i++) {
        if (n === normalizeFood(keys[i])) return { key: keys[i], data: FOOD_DB[keys[i]] };
    }
    // חיפוש חלקי — הקלט מוכל במפתח
    for (var i = 0; i < keys.length; i++) {
        var nk = normalizeFood(keys[i]);
        if (nk.includes(n) && n.length >= 2) return { key: keys[i], data: FOOD_DB[keys[i]] };
    }
    // חיפוש חלקי — המפתח מוכל בקלט
    for (var i = 0; i < keys.length; i++) {
        var nk2 = normalizeFood(keys[i]);
        if (n.includes(nk2) && nk2.length >= 2) return { key: keys[i], data: FOOD_DB[keys[i]] };
    }
    return null;
}

function detectFoodName(text) {
    var t = text.trim();
    var lower = t.toLowerCase();

    // בדוק אימוג'ים מוכרים
    var emojis = extractEmojis(t);
    for (var i = 0; i < emojis.length; i++) {
        if (EMOJI_MAP[emojis[i]]) return EMOJI_MAP[emojis[i]];
    }

    // הסר מילות פעולה ושאלה
    var cleaned = t
        .replace(/כמה\s+להזריק\s+(על\s+)?/gi,'')
        .replace(/כמה\s+אינסולין\s+(על\s+)?/gi,'')
        .replace(/כמה\s+פחמימות\s+(ב|ב-)?/gi,'')
        .replace(/מינון\s+(על\s+)?/gi,'')
        .replace(/^על\s+/,'')
        .replace(/\?/g,'').trim();

    if (!cleaned || cleaned.length < 2) return null;

    // דלג על מילות שאלה
    var questionWords = ['כמה','מה','האם','איפה','מתי','למה','איך','לפני','אחרי',
                         'iob','cob','smb','תיקון','בזאלי','פרופיל','isf','cr'];
    var cl = cleaned.toLowerCase();
    if (questionWords.some(function(w){ return cl === w || cl.startsWith(w + ' '); })) return null;

    // דלג על מילים קצרות מאוד שאינן שמות אוכל
    if (cleaned.length < 2) return null;

    return cleaned;
}

// שליפת היסטוריית מאכל ספציפי מ-NS
function fetchFoodHistory(foodName) {
    try {
        var from90 = new Date(Date.now() - 90*86400000).toISOString();
        var tr = fullHistory.treatments || [];

        // מצא הזרקות שקשורות למאכל לפי notes
        var normalize = function(s){ return (s||'').toLowerCase().replace(/['"׳`]/g,''); };
        var fn = normalize(foodName);

        var foodTreats = tr.filter(function(t){
            return t.carbs > 0 && (
                normalize(t.notes).includes(fn) ||
                normalize(t.eventType).includes(fn)
            );
        }).slice(0, 10); // עד 10 אירועים אחרונים

        if (foodTreats.length === 0) return null;

        // לכל ארוחה — מצא את הסוכר לפני ו-2ש' אחרי
        var history = [];
        var entries = fullHistory.entries || [];

        foodTreats.forEach(function(t) {
            var mealTime = new Date(t.created_at).getTime();
            var ago = Math.round((Date.now() - mealTime) / 86400000);

            // סוכר לפני (±10 דק')
            var beforeE = entries.filter(function(e){
                var d = Math.abs(new Date(e.dateString||e.date).getTime() - mealTime);
                return d < 10*60000;
            });
            var sgvBefore = beforeE.length ? beforeE[0].sgv : null;

            // סוכר 2ש' אחרי (±15 דק')
            var afterE = entries.filter(function(e){
                var d = new Date(e.dateString||e.date).getTime() - mealTime;
                return d > 90*60000 && d < 150*60000;
            });
            var sgvAfter = afterE.length ? afterE[0].sgv : null;

            // מה היה הבולוס
            var bolus = tr.filter(function(b){
                var d = Math.abs(new Date(b.created_at).getTime() - mealTime);
                return d < 30*60000 && parseFloat(b.insulin||0) > 0.1 && !b.carbs;
            }).reduce(function(sum, b){ return sum + parseFloat(b.insulin||0); }, 0);
            if (!bolus) bolus = parseFloat(t.insulin||0);

            history.push({
                ago: ago,
                carbs: t.carbs,
                insulin: Math.round(bolus*100)/100,
                sgvBefore: sgvBefore,
                sgvAfter: sgvAfter,
                outcome: sgvAfter ? (sgvAfter > 180 ? 'high' : sgvAfter < 70 ? 'low' : 'ok') : null
            });
        });

        return history;
    } catch(e) {
        console.error('fetchFoodHistory error:', e);
        return null;
    }
}


function buildNSContext() {
    var nowH = new Date().getHours();
    var prof  = fullHistory && fullHistory.profile;
    var dev   = fullHistory && fullHistory.devStatus;

    var ctx = {
        sgv:   nsData.currentSgv || 0,
        trend: nsData.trend      || 'Flat',
        delta: nsData.delta      || 0,
        iob:   parseFloat(nsData.iob) || 0,
        cob:   parseFloat(nsData.cob) || 0,
        basal: nsData.basal      || 0,
        cr:    prof ? parseFloat(profileValueAt(prof.carbratio||prof.carbRatio||prof.ic, nowH)||15) : (nsData.cr||15),
        isf:   prof ? parseFloat(profileValueAt(prof.sens||prof.sensitivity, nowH)||120)            : (nsData.isf||120),
        target:prof ? parseFloat(profileValueAt(prof.target_low||prof.target, nowH)||100)           : 100,
        cage:  _lastKnownCage,
        sage:  _lastKnownSage,
        time:  new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false}),
        day:   ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][new Date().getDay()],
        insulinName:   getInsulinProfile().name,
        insulinPreMeal: getInsulinProfile().preMeal,
        insulinPeak:   getInsulinProfile().peak,
        insulinOnset:  getInsulinProfile().onset
    };

    // תחזית Loop
    try {
        if (dev) {
            var po = dig(dev,'loop.predicted');
            if (po && po.values && po.values.length) {
                var vals = po.values;
                ctx.p30 = Math.round(vals[Math.min(6,  vals.length-1)]);
                ctx.p60 = Math.round(vals[Math.min(12, vals.length-1)]);
                ctx.pEv = Math.round(vals[vals.length-1]);
            }
            ctx.loopRec            = dig(dev,'loop.recommendedBolus');
            ctx.loopEnacted        = dig(dev,'loop.enacted.rate');
            ctx.overrideActive     = nsData.overrideActive     || false;
            ctx.overrideName       = nsData.overrideName       || null;
            ctx.overrideMultiplier = nsData.overrideMultiplier || null;
        }
    } catch(e) {}

    // ארוחות והזרקות 3 שעות אחרונות — מנתונים שכבר טעונים
    try {
        var since3h = Date.now() - 3*3600000;
        var recentTr = (fullHistory.treatments || []).filter(function(t){
            return new Date(t.created_at).getTime() > since3h;
        });
        ctx.meals = recentTr.filter(function(t){return t.carbs>0;}).map(function(t){
            return (t.notes||t.eventType||'ארוחה')+' '+t.carbs+'g לפני '+Math.round((Date.now()-new Date(t.created_at))/60000)+' דק\'';
        });
        ctx.boluses = recentTr.filter(function(t){return parseFloat(t.insulin||0)>0.3;}).map(function(t){
            return parseFloat(t.insulin).toFixed(1)+'U לפני '+Math.round((Date.now()-new Date(t.created_at))/60000)+' דק\'';
        });
    } catch(e) {}

    return ctx;
}

function buildGeminiPrompt(ctx, q) {
    var lines = [
        "היום: יום " + ctx.day + " | שעה: " + ctx.time,
        "סוכר: " + ctx.sgv + " " + ctx.trend + " (שינוי " + (ctx.delta>=0?"+":"") + ctx.delta + " ל-5דק')",
        "אינסולין פעיל: " + ctx.iob + "U | פחמימות פעילות: " + ctx.cob + "g | בזאלי: " + ctx.basal + "U/ש'",
        "יחס CR: " + ctx.cr.toFixed(1) + " | ISF: " + ctx.isf + " | יעד: " + ctx.target,
        "סוג אינסולין: " + (ctx.insulinName||'ליומג\'ב') + " (שיא " + ctx.insulinPeak + "דק', המתן " + ctx.insulinPreMeal + "דק' לפני)"
    ];
    if (ctx.p30 != null)         lines.push("תחזית המשאבה: בעוד 30דק'=" + ctx.p30 + " | eventual=" + ctx.pEv);
    if (ctx.loopRec != null)     lines.push("המשאבה מציעה: " + ctx.loopRec + "U");
    if (ctx.overrideActive)      lines.push("⚠️ Override פעיל: " + ctx.overrideName + (ctx.overrideMultiplier ? " (מכפיל: " + ctx.overrideMultiplier + ")" : "") + " — הפחת המלצות בהתאם!");
    if (ctx.cage != null)        lines.push("גיל פוד: " + Math.floor(ctx.cage/24) + "d " + Math.round(ctx.cage%24) + "h");
    if (ctx.sage != null)        lines.push("גיל חיישן: " + Math.floor(ctx.sage/24) + "d " + Math.round(ctx.sage%24) + "h");

    // לוח בזאלי מלא מהפרופיל
    try {
        var prof2 = fullHistory && fullHistory.profile;
        if (prof2 && prof2.basal) {
            var basalSched = prof2.basal;
            if (Array.isArray(basalSched) && basalSched.length) {
                var schedStr = basalSched.map(function(b, i){
                    var nextTime = basalSched[i+1] ? basalSched[i+1].time : '24:00';
                    return b.time + '–' + nextTime + ': ' + b.value + 'U/ש\'';
                }).join(' | ');
                lines.push("לוח בזאלי יומי: " + schedStr);
            }
        }
    } catch(e) {}
    if (ctx.meals   && ctx.meals.length)   lines.push("ארוחות אחרונות: " + ctx.meals.join(" | "));
    if (ctx.boluses && ctx.boluses.length) lines.push("הזרקות אחרונות: " + ctx.boluses.join(" | "));
    if (ctx.foodHistory && ctx.foodHistory.length) {
        lines.push("היסטוריה [" + ctx.foodHistory.length + " פעמים]:");
        ctx.foodHistory.forEach(function(h, i) {
            var outcome = h.outcome === 'high' ? 'יצא גבוה' : h.outcome === 'low' ? 'יצא נמוך' : 'יצא טוב';
            lines.push("  " + (i+1) + ". לפני " + h.ago + "ימ: " + h.carbs + "g→" + h.insulin + "U" +
                (h.sgvBefore ? " לפני:" + h.sgvBefore : "") +
                (h.sgvAfter  ? " אחרי:" + h.sgvAfter  : "") +
                " — " + outcome);
        });
    }
    lines.push("שאלה: " + q);
    return lines.join("\n");
}



// ─── Popup ───────────────────────────────────────────────────
function showPopup(title, html) {
    var ot = document.getElementById('popup-title');
    var ob = document.getElementById('popup-body');
    var oo = document.getElementById('popup-overlay');
    if (ot) ot.innerText = title;
    if (ob) ob.innerHTML = html;
    if (oo) oo.classList.add('show');
}

function closePopup(e) {
    if (e && e.target !== document.getElementById('popup-overlay')) return;
    var oo = document.getElementById('popup-overlay');
    if (oo) oo.classList.remove('show');
}


// ─── Tab switching ────────────────────────────────────────────
function switchTab(id, el) {
    try {
        ['tab-home','tab-activity','tab-reports','tab-ns','tab-logs','tab-profile'].forEach(function(t) {
            var el2 = document.getElementById(t);
            if (el2) el2.classList.add('hidden');
        });
        var target = document.getElementById(id);
        if (target) target.classList.remove('hidden');
        document.querySelectorAll('.nav-tab').forEach(function(t){ t.classList.remove('active'); });
        if (el) el.classList.add('active');
        if (id === 'tab-activity') { try { renderActivities(); } catch(e){} }
        if (id === 'tab-ns')       { try { loadNSFrame();       } catch(e){} }
        if (id === 'tab-logs')     { try { loadLogs('all');      } catch(e){} }
        if (id === 'tab-profile')  { try { renderProfile();      } catch(e){} }
    } catch(e) { console.error('switchTab:', e); }
}


// ─── NS iframe ───────────────────────────────────────────────
function loadNSFrame() {
    var url    = nsUrl();
    if (!url) return;
    var iframe = document.getElementById('ns-iframe');
    var msgEl  = document.getElementById('ns-frame-msg');
    if (!iframe) return;
    if (iframe.src !== url) {
        iframe.src = url;
        iframe.onload = function() {
            try {
                var doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && doc.body && msgEl) msgEl.style.display = 'none';
            } catch(e) {
                if (msgEl) msgEl.style.display = 'none'; // cross-origin = OK
            }
        };
        iframe.onerror = function() {
            if (msgEl) msgEl.style.display = 'flex';
        };
        setTimeout(function() {
            try {
                var iDoc = iframe.contentDocument;
                if (!iDoc || iDoc.URL === 'about:blank') {
                    if (msgEl) msgEl.style.display = 'flex';
                }
            } catch(e) {
                if (msgEl) msgEl.style.display = 'none';
            }
        }, 5000);
    }
}

function reloadNSFrame() {
    var iframe = document.getElementById('ns-iframe');
    if (iframe) { var s = iframe.src; iframe.src = ''; iframe.src = s; }
}

function openNSExternal() {
    var url = nsUrl();
    if (url) window.open(url, '_blank');
}


// ─── Image (camera) ───────────────────────────────────────────
var _pendingImageB64  = null;
var _pendingImageType = 'image/jpeg';

function _onImageSelected(input) {
    var file = input.files[0];
    if (!file) return;
    _pendingImageType = file.type || 'image/jpeg';
    var reader = new FileReader();
    reader.onload = function(e) {
        _pendingImageB64 = e.target.result.split(',')[1];
        var prev = document.getElementById('img-preview');
        var wrap = document.getElementById('img-preview-wrap');
        if (prev) prev.src = e.target.result;
        if (wrap) wrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function _clearImage() {
    _pendingImageB64 = null;
    var wrap = document.getElementById('img-preview-wrap');
    var prev = document.getElementById('img-preview');
    if (wrap) wrap.style.display = 'none';
    if (prev) prev.src = '';
}


// ─── Omnibox ─────────────────────────────────────────────────
async function askOmnibox() {
    var input = document.getElementById('omnibox');
    var q     = input.value.trim();
    var ql    = q.toLowerCase();
    if (!q) return;

    // ציוד — CAGE/SAGE
    if (ql === 'ציוד' || ql === 'חיישן' || ql === 'פוד' || ql === 'pod' ||
        ql === 'סנסור' || ql.includes('גיל פוד') || ql.includes('גיל חיישן') || ql.includes('החלפ')) {
        input.value = '';
        await showEquipmentStatus();
        return;
    }

    // מציג "מנתח..." בפופאפ בינוני
    showPopup("Loopie 🧠", "<div style='text-align:center;padding:20px;color:#888'>מנתח... 🧠</div>");

    var tr   = fullHistory.treatments || [];
    var ent  = fullHistory.entries    || [];
    var prof = fullHistory.profile;
    var dev  = fullHistory.devStatus;
    var ans  = "";
    var nowH = new Date().getHours();

    // === מספר מאכלים ביחד (מופרדים ב-ו/,/+) ===
    var multiSep = /\s+ו[-]?\s*|\s*,\s*|\s*\+\s*/;
    var qParts = q.split(multiSep).map(function(p){ return p.trim(); }).filter(function(p){ return p.length > 1; });
    if (qParts.length > 1) {
        // בדוק שכולם מאכלים (לא פקודות)
        var allFoods = qParts.every(function(p){
            var pl = p.toLowerCase();
            var nonF = ['פוד','חיישן','ציוד','בזאלי','isf','cr','iob','cob','תיקון','ספורט','smb'];
            return !nonF.some(function(w){ return pl === w; });
        });
        if (allFoods) {
            var totalCarbs2 = 0, maxDur2 = 0, foodNames2 = [];
            var allFound2 = true;
            qParts.forEach(function(part) {
                // חלץ כמות מתחילת המחרוזת
                var qtyMatchM = part.match(/^(\d+\.?\d*)\s+/); // מספר בהתחלה = כמות
                var carbsMatchM = part.match(/\s+(\d+\.?\d*)g?$/); // מספר בסוף = פחמימות
                var qty2 = 1, manualCarbsM = null;
                var fname2 = part;
                if (qtyMatchM) { qty2 = parseFloat(qtyMatchM[1]); fname2 = part.replace(qtyMatchM[0],'').trim(); }
                else if (carbsMatchM) { manualCarbsM = parseFloat(carbsMatchM[1]); fname2 = part.replace(carbsMatchM[0],'').trim(); }
                var fd2 = findFood(fname2);
                if (fd2) {
                    var c2 = manualCarbsM !== null ? manualCarbsM : fd2.data.carbs * qty2;
                    totalCarbs2 += c2;
                    if (fd2.data.durationH > maxDur2) maxDur2 = fd2.data.durationH;
                    foodNames2.push(qty2 > 1 ? qty2 + ' ' + fd2.key : fd2.key);
                } else {
                    allFound2 = false;
                }
            });
            if (allFound2 && totalCarbs2 > 0) {
                LAST_FOOD_QUERY = foodNames2.join(' + ');
                closePopup();
                askGeminiAdvisor(foodNames2.join(' + ') + " — " + Math.round(totalCarbs2) + " גרם סה\"כ");
                input.value = '';
                return;
            }
        }
    }

    // === חסימה מוקדמת — מילים שאינן מאכל ===
    var nonFoodWords = ['פוד','pod','חיישן','סנסור','ציוד','בזאלי','isf','cr','iob','cob',
                        'אינסולין','insulin','תיקון','ספורט','אימון','ים','בריכה','smb','זיכרון','דוח','לוגים',
                        'ניתוח','מצב','סטטוס','status','פרופיל','profile','מה המצב',
                        'היסטוריה','מאכלים','רשימה','חילוץ','היפו','נמוך','גבוה',
                        'המלצות','המלצה','ניתוח','הצע','הצג','הראה','רשימת','מה אכלתי',
                        'ביהס','בית ספר','לוח','פעילות','חוג','כשל','בדוק',
                        'הוסף','הכנס','הזן','מחק','הסר','בימי','בשעות','עד שעה'];
    var isNonFood = nonFoodWords.some(function(w){ return ql === w || ql.startsWith(w+' ') || ql.endsWith(' '+w); });

    // זיהוי ישיר של שם מאכל ללא מילות שאלה
    var directFood = isNonFood ? null : detectFoodName(q);
    var knownInDB  = directFood ? findFood(directFood) : null;
    var knownEmoji = directFood && Object.values(EMOJI_MAP).some(function(v){
        return v && v.toLowerCase() === directFood.toLowerCase();
    });
    var isKnownFood  = !!(knownInDB || knownEmoji);
    var isUnknownFood = directFood && !isKnownFood && directFood.length >= 2;

    var hasKeyword = ql.includes("להזריק") || ql.includes("כמה אינסולין") ||
        ql.includes("מינון") || ql.includes("לתקן") || ql.includes("correction") ||
        (ql.includes("כמה") && (ql.includes("יחידות") || ql.includes("יח'"))) ||
        (ql.includes("תיקון") && !ql.includes("isf") && !ql.includes("רגישות") && !ql.includes("פרופיל"));

    // --- כל מאכל (מוכר או לא) וכל שאלת מינון → Gemini ===
    if (hasKeyword || isKnownFood || isUnknownFood) {
        closePopup();
        input.value = '';
        askGeminiAdvisor(q);
        return;
    }

    // ── SMB ──
    if (ql === 'smb' || ql === 'מיקרובולוס' || ql === 'סמב') {
        showPopup('💉 SMB אחרון', "<div style='text-align:center;padding:16px'><span class='spinner'></span></div>");
        (async function() {
            try {
                var since2h = new Date(Date.now() - 2*3600000).toISOString();
                var res = await nsGet('/api/v1/treatments.json?find[created_at][$gte]=' + since2h + '&count=50');
                if (!res.ok) throw new Error('NS error');
                var treats = await res.json();

                var smbs = treats.filter(function(t) {
                    var ev = (t.eventType||'').toLowerCase();
                    var ins = parseFloat(t.insulin||0);
                    return (ev.includes('smb') || ev.includes('microbolus') ||
                            (ins > 0 && ins < 0.5 && !t.carbs));
                });

                if (!smbs.length) {
                    showPopup('💉 SMB', "<div style='text-align:right;font-size:14px'>לא נמצאו SMB ב-2 שעות האחרונות.</div>");
                    return;
                }

                var totalSMB = smbs.reduce(function(s,t){ return s + parseFloat(t.insulin||0); }, 0);
                var html = "<div style='font-size:13px;text-align:right;line-height:1.8'>";
                html += "<div style='margin-bottom:10px;color:#888'>סה\"כ " + smbs.length + " SMB — <b style='color:#3b82f6'>" + totalSMB.toFixed(2) + "U</b> ב-2ש' האחרונות</div>";

                smbs.slice(0,8).forEach(function(t) {
                    var minsAgo = Math.round((Date.now() - new Date(t.created_at).getTime()) / 60000);
                    var ins = parseFloat(t.insulin||0).toFixed(2);
                    html += "<div style='background:#0a0a14;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between'>" +
                        "<span>💉 <b>" + ins + "U</b></span>" +
                        "<span style='color:#888'>לפני " + minsAgo + " דק'</span></div>";
                });
                html += "</div>";
                showPopup('💉 SMB ב-2 שעות אחרונות', html);
            } catch(e) {
                showPopup('💉 SMB', 'שגיאה: ' + e.message);
            }
        })();
        return;
    }

    // כל שאלה שלא טופלה → Gemini
    closePopup();
    input.value = '';
    askGeminiAdvisor(q);
    return;
}


// ─── Local Activity Parser ────────────────────────────────────
function _parseActivityLocally(q) {
    var DAY_MAP = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
    var DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

    function normTime(t) {
        if (!t) return null;
        t = String(t).replace('.', ':');
        if (!t.includes(':')) t = t.length <= 2 ? t + ':00' : t.slice(0,-2) + ':' + t.slice(-2);
        var p = t.split(':');
        return p[0].padStart(2,'0') + ':' + (p[1]||'00').padStart(2,'0');
    }

    var isAdd    = /^(הוסף|הכנס|צור|הוסיף)\s/i.test(q);
    var isUpdate = /^(עדכן|שנה|ערוך|העבר)\s/i.test(q);
    var isDelete = /^(מחק|הסר|מחק)\s/i.test(q);

    // שעות
    var timeRx   = /(\d{1,2}[:.:]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.:]?\d{0,2})/;
    var tMatch   = q.match(timeRx);
    var fromTime = tMatch ? normTime(tMatch[1]) : null;
    var toTime   = tMatch ? normTime(tMatch[2]) : null;

    // ימים
    var dayRx = new RegExp('(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)', 'g');
    var dayMatches = [], dm;
    while ((dm = dayRx.exec(q)) !== null) dayMatches.push({name: dm[1], idx: dm.index});

    // עצימות
    var intensity = 'medium';
    if (/נמוכ|קל |יוגה|הליכה|פילאטיס/i.test(q)) intensity = 'low';
    if (/גבוה|מאומץ|mma|ריצה|hiit|אגרוף|קראטה/i.test(q)) intensity = 'high';

    // שם — הסר מילות פעולה, ימים, שעות
    var actName = q
        .replace(/^(הוסף|הכנס|צור|עדכן|שנה|ערוך|מחק|הסר|חוג|אימון|שיעור|פעילות)\s*/gi, '')
        .replace(new RegExp('(ב?יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)', 'g'), '')
        .replace(timeRx, '')
        .replace(/במקום|ב-?שעה|בשעות|מ-|עד|עצימות.*/gi, '')
        .replace(/\s+/g, ' ').trim();

    if (isAdd && actName && dayMatches.length > 0 && fromTime) {
        return { action: 'add_routine', name: actName, day: DAY_NAMES[DAY_MAP[dayMatches[0].name]], startTime: fromTime, endTime: toTime, intensity: intensity, _rawDays: dayMatches };
    }
    if (isUpdate && dayMatches.length >= 1) {
        return { action: 'update_routine', name: actName, day: DAY_NAMES[DAY_MAP[dayMatches[0].name]], startTime: fromTime, endTime: toTime, intensity: null, _rawDays: dayMatches };
    }
    if (isDelete && actName) {
        return { action: 'delete_routine', name: actName };
    }
    return null;
}

function _handleActivityObj(actObj, userQuestion) {
    var DAY_MAP2   = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
    var DAY_NAMES2 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    function toEn(v) { if(!v)return'medium'; v=String(v).toLowerCase(); if(v==='גבוהה'||v==='high')return'high'; if(v==='נמוכה'||v==='low')return'low'; return'medium'; }
    function save() { try { localStorage.setItem('loopie_activities', JSON.stringify(ACTIVITIES)); saveMemory('activities', ACTIVITIES).catch(function(){}); } catch(e){} }

    if (actObj.action === 'add_routine') {
        // ריבוי ימים
        var rawDays = actObj._rawDays || [];
        var slots = [];
        // בדוק שעות נפרדות לכל יום
        var timeRxM = /(\d{1,2}[:.:]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.:]?\d{0,2})/g;
        function normT(t) { if(!t)return null; t=String(t).replace('.',':'); if(!t.includes(':')) t=t.length<=2?t+':00':t.slice(0,-2)+':'+t.slice(-2); var p=t.split(':'); return p[0].padStart(2,'0')+':'+(p[1]||'00').padStart(2,'0'); }
        var allTimes2 = []; var tm3; while((tm3=timeRxM.exec(userQuestion))!==null) allTimes2.push({from:normT(tm3[1]),to:normT(tm3[2]),idx:tm3.index});

        if (rawDays.length > 1 && allTimes2.length >= rawDays.length) {
            // שעות נפרדות לכל יום
            rawDays.forEach(function(d,i) {
                var t = allTimes2[i] || allTimes2[0];
                slots.push({ day: DAY_MAP2[d.name], from: t.from, to: t.to });
            });
        } else {
            rawDays.forEach(function(d) {
                slots.push({ day: DAY_MAP2[d.name], from: actObj.startTime, to: actObj.endTime });
            });
        }
        if (!slots.length && DAY_MAP2[actObj.day] !== undefined)
            slots = [{ day: DAY_MAP2[actObj.day], from: actObj.startTime, to: actObj.endTime }];

        slots.forEach(function(sl) {
            ACTIVITIES.push({ id: Date.now() + sl.day + Math.random(), name: actObj.name, day: sl.day, from: sl.from||'00:00', to: sl.to||'01:00', intensity: toEn(actObj.intensity) });
        });
        save(); try { renderActivities(); } catch(e) {}
        var summary = slots.map(function(sl){ return 'יום ' + DAY_NAMES2[sl.day] + ' ' + (sl.from||'') + '–' + (sl.to||''); }).join('<br>');
        showPopup('✅ חוג נוסף!', '<b>' + actObj.name + '</b><br>' + summary);

    } else if (actObj.action === 'update_routine') {
        // העבר ל-update_routine handler הקיים
        var dayMap2 = DAY_MAP2, dayNames2 = DAY_NAMES2;
        var _toEn2 = toEn, _saveActs = save;
        // בנה actObj תואם לפורמט הישן
        var actObj2 = { action:'update_routine', name: actObj.name, day: actObj.day, startTime: actObj.startTime, endTime: actObj.endTime, intensity: actObj.intensity };
        // שלח לטיפול
        var fakeData = { candidates:[{ content:{ parts:[{ text: JSON.stringify(actObj2) }] } }] };
        var fakeText = JSON.stringify(actObj2);
        var fakeMatch = fakeText.match(/\{[\s\S]*?\}/);
        if (fakeMatch) {
            try {
                var parsedAct = JSON.parse(fakeMatch[0]);
                // העבר ישירות לטיפול
                _processUpdateRoutine(parsedAct, userQuestion);
            } catch(e) {}
        }

    } else if (actObj.action === 'delete_routine') {
        var beforeD = ACTIVITIES.length;
        ACTIVITIES = ACTIVITIES.filter(function(a){ return !a.name.toLowerCase().includes((actObj.name||'').toLowerCase()); });
        save(); try { renderActivities(); } catch(e) {}
        showPopup(ACTIVITIES.length < beforeD ? '🗑️ נמחק' : '❓',
            ACTIVITIES.length < beforeD ? "<b>" + actObj.name + "</b> — " + (beforeD-ACTIVITIES.length) + " רשומות הוסרו." : "לא מצאתי חוג בשם '" + actObj.name + "'.");
    }
}

function _processUpdateRoutine(actObj, userQuestion) {
    var DAY_MAP3   = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
    var DAY_NAMES3 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    function toEn3(v) { if(!v)return'medium'; v=String(v).toLowerCase(); if(v==='גבוהה'||v==='high')return'high'; if(v==='נמוכה'||v==='low')return'low'; return'medium'; }
    function save3() { try { localStorage.setItem('loopie_activities',JSON.stringify(ACTIVITIES)); saveMemory('activities',ACTIVITIES).catch(function(){}); } catch(e){} }

    function normT3(t) { if(!t)return null; t=String(t).replace('.',':'); if(!t.includes(':')) t=t.length<=2?t+':00':t.slice(0,-2)+':'+t.slice(-2); var p=t.split(':'); return p[0].padStart(2,'0')+':'+(p[1]||'00').padStart(2,'0'); }
    var timeRx3 = /(\d{1,2}[:.:]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.:]?\d{0,2})/;
    var tM3 = userQuestion.match(timeRx3);
    if (!actObj.startTime && tM3) actObj.startTime = normT3(tM3[1]);
    if (!actObj.endTime   && tM3) actObj.endTime   = normT3(tM3[2]);

    // זיהוי שינוי יום
    var DAYS_RX3 = '(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)';
    var fromDay3 = null, toDay3 = null;
    var swM = userQuestion.match(new RegExp('ב?יום\s+' + DAYS_RX3 + '[\s\S]*?במקום[\s\S]*?ב?יום\s+' + DAYS_RX3));
    var chM = userQuestion.match(new RegExp('מ(?:יום\s+|ב)?' + DAYS_RX3 + '[\s\S]*?ל(?:יום\s+|ב)?' + DAYS_RX3));
    if (swM) { toDay3=DAY_MAP3[swM[1]]; fromDay3=DAY_MAP3[swM[2]]; }
    else if (chM) { fromDay3=DAY_MAP3[chM[1]]; toDay3=DAY_MAP3[chM[2]]; }
    else if (actObj.day) toDay3 = DAY_MAP3[actObj.day];

    if (!actObj.name) ACTIVITIES.forEach(function(a){ if(userQuestion.toLowerCase().includes(a.name.toLowerCase())) actObj.name=a.name; });

    var updCnt3 = 0;
    ACTIVITIES.forEach(function(a) {
        var nm=a.name.toLowerCase().trim(), qn=(actObj.name||'').toLowerCase().trim();
        if (qn && !nm.includes(qn) && !qn.includes(nm)) return;
        if (fromDay3 !== null && a.day !== fromDay3) return;
        if (toDay3 !== null)   a.day = toDay3;
        if (actObj.startTime)  a.from = actObj.startTime;
        if (actObj.endTime)    a.to   = actObj.endTime;
        if (actObj.intensity)  a.intensity = toEn3(actObj.intensity);
        updCnt3++;
    });
    save3(); try { renderActivities(); } catch(e) {}

    var details = [];
    if (fromDay3!==null && toDay3!==null) details.push('📅 יום ' + DAY_NAMES3[fromDay3] + ' → ' + DAY_NAMES3[toDay3]);
    else if (toDay3!==null) details.push('📅 יום ' + DAY_NAMES3[toDay3]);
    if (actObj.startTime && actObj.endTime) details.push('🕐 ' + actObj.startTime + '–' + actObj.endTime);

    showPopup(updCnt3 > 0 ? '✅ עודכן!' : '❓',
        updCnt3 > 0 ? '<b>' + (actObj.name||'החוג') + '</b><br>' + details.join('<br>') :
        "לא מצאתי חוג בשם '" + (actObj.name||'') + "'.<br><small style='color:#888'>בדוק שהשם נכון</small>");
}


async function askGeminiAdvisor(userQuestion) {
    if (!userQuestion||!userQuestion.trim()) return;
    var qlLocal = userQuestion.toLowerCase().trim();

    // === WHITELIST — רק מילות קוד מדויקות. כל שאר → Gemini ===
    var LOCAL_STATUS  = ['מה המצב','סטטוס','מה קורה','status'];
    var LOCAL_BASAL   = ['בזאלי','בזאל','תוכנית בזאלית'];
    var LOCAL_CR      = ['cr','icr','rc','יחס פחמימות'];
    var LOCAL_ISF     = ['isf','רגישות','מדד רגישות'];
    var LOCAL_OVR     = ['override','אוברריד','תוכנית ספורט','מצב ספורט','החרגה','טמפ טרגט'];
    var LOCAL_CANCEL_OVR = ['בוטל החוג','לא הלך לחוג','בטל אובריד','ביטול החרגה','ביטול אובריד'];
    var LOCAL_MEALS   = ['מה אכלתי','היסטוריית ארוחות','ארוחות אחרונות'];
    var LOCAL_COB     = ['cob','פחמימות פעילות','כוב'];
    var LOCAL_IOB     = ['iob','אינסולין פעיל','איוב'];
    var LOCAL_WEEKLY  = ['דוח שבועי','דוח שבועי','weekly','קליניקה','weekly clinic'];
    var LOCAL_ANALYSIS = ['האם לשנות','לשנות','האם לתקן','לתקן','לשפר','מה דעתך'];

    // ניתוח — תמיד ל-Gemini
    var wantsAnalysis = LOCAL_ANALYSIS.some(function(w){ return qlLocal.includes(w); });

    // סטטוס — הכלה חלקית אבל קצר
    if (!wantsAnalysis && LOCAL_STATUS.some(function(w){ return qlLocal.includes(w); }) && qlLocal.length < 15) {
        var sgvNowL = nsData.currentSgv || 0;
        var html_s = "<div style='font-size:14px;line-height:1.9;text-align:right'>" +
            "🩸 סוכר: <b>" + sgvNowL + "</b> " + (nsData.trend||'') + "<br>" +
            "💉 IOB: <b>" + (parseFloat(nsData.iob)||0).toFixed(2) + "U</b><br>" +
            "🍞 COB: <b>" + (parseFloat(nsData.cob)||0).toFixed(0) + "g</b><br>" +
            "⏱ בזאלי: <b>" + (nsData.basal||0) + " U/ש'</b><br>" +
            (nsData.overrideActive ? "🔄 Override: <b style='color:#f59e0b'>" + nsData.overrideName + "</b>" : "") +
            "</div>";
        showPopup("🛡️ סטטוס נוכחי", html_s); return;
    }

    // COB — exact match
    if (LOCAL_COB.indexOf(qlLocal) >= 0) {
        var cobVal = parseFloat(nsData.cob||0).toFixed(1);
        showPopup("🍏 פחמימות פעילות (COB)", "<div style='font-size:16px;text-align:right'>" +
            "פחמימות פעילות כרגע:<br>" +
            "<span style='font-size:28px;color:#f59e0b;font-weight:700'>" + cobVal + "g</span>" +
            "</div>"); return;
    }

    // IOB — exact match
    if (LOCAL_IOB.indexOf(qlLocal) >= 0) {
        var iobVal = parseFloat(nsData.iob||0).toFixed(2);
        showPopup("💉 אינסולין פעיל (IOB)", "<div style='font-size:16px;text-align:right'>" +
            "אינסולין פעיל כרגע:<br>" +
            "<span style='font-size:28px;color:#3b82f6;font-weight:700'>" + iobVal + "U</span>" +
            "</div>"); return;
    }
    // ביטול Override — includes כי המשתמש כותב משפט
    if (LOCAL_CANCEL_OVR.some(function(w){ return qlLocal.includes(w); })) {
        var targetNow = nsData.target || 100;
        showPopup("🛑 ביטול Override", "<div style='font-size:14px;line-height:1.9;text-align:right'>" +
            "⚠️ <b>החוג/הפעילות בוטלו — פעולה נדרשת!</b><br><br>" +
            "📱 <b>כנס ללופ וכבה את ה-Override עכשיו!</b><br><br>" +
            "🎯 <b>למה קריטי:</b> אם Override נשאר פעיל, המשאבה לא תיתן מספיק בזאלי בבית — הסוכר יזנק ל-200+.<br><br>" +
            "המערכת צריכה לחזור ליעד הרגיל: <b>" + targetNow + " mg/dL</b>." +
            "</div>");
        return;
    }

    // דוח שבועי — Loopie Clinic
    if (LOCAL_WEEKLY.indexOf(qlLocal) >= 0 || qlLocal.includes('דוח שבועי')) {
        showPopup("📊 Loopie Clinic", "<div style='text-align:center;padding:20px'><div style='font-size:24px'>📊</div><br><small style='color:#888'>אוסף נתוני 14 ימים מ-NS...</small></div>");
        _runWeeklyClinic();
        return;
    }

    if (!wantsAnalysis && LOCAL_CR.indexOf(qlLocal) >= 0) {
        var nowH3 = new Date().getHours();
        var prof3 = fullHistory && fullHistory.profile;
        var crNow3 = prof3 ? parseFloat(profileValueAt(prof3.carbratio||prof3.carbRatio||prof3.ic, nowH3)||15) : (nsData.cr||15);
        var crRows = prof3 && Array.isArray(prof3.carbratio) ?
            prof3.carbratio.map(function(b,i){ var nx=prof3.carbratio[i+1]?prof3.carbratio[i+1].time:'24:00'; return '• '+b.time+'–'+nx+': 1U/'+b.value+'g'; }).join('<br>') :
            '• 00:00–24:00: 1U/' + crNow3 + 'g';
        showPopup("📊 יחס פחמימות (CR)", "<div style='font-size:14px;line-height:1.8;text-align:right'><b>כרגע:</b> 1U לכל " + crNow3 + "g<br><br>" + crRows + "</div>"); return;
    }

    // ISF — exact match בלבד
    if (!wantsAnalysis && LOCAL_ISF.indexOf(qlLocal) >= 0) {
        var nowH4 = new Date().getHours();
        var prof4 = fullHistory && fullHistory.profile;
        var isfNow4 = prof4 ? parseFloat(profileValueAt(prof4.sens||prof4.sensitivity, nowH4)||120) : (nsData.isf||120);
        var isfRows = prof4 && Array.isArray(prof4.sens) ?
            prof4.sens.map(function(b,i){ var nx=prof4.sens[i+1]?prof4.sens[i+1].time:'24:00'; return '• '+b.time+'–'+nx+': '+b.value+' mg/dL'; }).join('<br>') :
            '• 00:00–24:00: ' + isfNow4 + ' mg/dL';
        showPopup("🎯 רגישות (ISF)", "<div style='font-size:14px;line-height:1.8;text-align:right'><b>כרגע:</b> " + isfNow4 + " mg/dL ליחידה<br><br>" + isfRows + "</div>"); return;
    }

    // בזאלי — exact match בלבד
    if (!wantsAnalysis && LOCAL_BASAL.indexOf(qlLocal) >= 0) {
        var prof5 = fullHistory && fullHistory.profile;
        var basalNow5 = nsData.basal || 0;

        // חישוב סך יחידות יומי
        var totalDaily = 0;
        var basalArr = prof5 && Array.isArray(prof5.basal) ? prof5.basal : null;
        if (basalArr) {
            for (var bi = 0; bi < basalArr.length; bi++) {
                var cur = basalArr[bi], nxt = basalArr[bi+1] || {time:'24:00'};
                var toMin = function(t){ var p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]||0); };
                var durH = (toMin(nxt.time) - toMin(cur.time)) / 60;
                totalDaily += cur.value * durH;
            }
        } else { totalDaily = basalNow5 * 24; }

        var basalRows = basalArr ?
            basalArr.map(function(b,i){ var nx=basalArr[i+1]?basalArr[i+1].time:'24:00'; return '• '+b.time+'–'+nx+': '+b.value+" U/ש'"; }).join('<br>') :
            "• 00:00–24:00: " + basalNow5 + " U/ש'";

        showPopup("⏳ קצב בזאלי", "<div style='font-size:14px;line-height:1.8;text-align:right'>" +
            "⏳ <b>כרגע:</b> " + basalNow5 + " U/ש'<br>" +
            "📊 <b>סך יחידות יומי:</b> <span style='font-size:18px;color:#3b82f6;font-weight:700'>" + totalDaily.toFixed(2) + " U</span><br><br>" +
            "<b>תוכנית יומית:</b><br>" + basalRows + "</div>");
        return;
    }

    // Override — exact match
    if (LOCAL_OVR.indexOf(qlLocal) >= 0) {
        var ovRaw = nsData._overrideRaw || null;
        var html_ov = "<div style='font-size:14px;line-height:1.9;text-align:right'>";
        if (nsData.overrideActive) {
            var pctOv = nsData.overrideMultiplier ? Math.round(nsData.overrideMultiplier*100)+'%' : '';
            var tLow  = ovRaw && ovRaw.currentCorrectionRange ? ovRaw.currentCorrectionRange.minValue || '---' : '---';
            var tHigh = ovRaw && ovRaw.currentCorrectionRange ? ovRaw.currentCorrectionRange.maxValue || '---' : '---';
            var durMin = ovRaw && ovRaw.duration ? Math.round(ovRaw.duration/60) + ' דק\'' : 'לא מוגבל';
            html_ov += "🟢 <b style='color:#10b981'>החרגה פעילה כרגע!</b><br><br>" +
                "• 🏃 <b>שם:</b> " + (nsData.overrideName||'פעיל') + "<br>" +
                (pctOv ? "• 📉 <b>מכפיל:</b> " + pctOv + "<br>" : "") +
                (tLow !== '---' ? "• 🎯 <b>יעד:</b> " + tLow + "–" + tHigh + " mg/dL<br>" : "") +
                "• ⏱ <b>משך:</b> " + durMin;
        } else {
            var lastTs = ovRaw && ovRaw.timestamp ? new Date(ovRaw.timestamp).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false}) : null;
            html_ov += "⚪ <b>אין החרגה פעילה כרגע.</b><br><br>";
            if (lastTs) html_ov += "📋 עדכון אחרון: " + lastTs;
        }
        html_ov += "</div>";
        showPopup("🏃 Override / החרגה", html_ov); return;
    }

    // ארוחות אחרונות — exact match בלבד
    if (LOCAL_MEALS.indexOf(qlLocal) >= 0) {
        var rawTr = (fullHistory.treatments || []).filter(function(t){ return t.carbs > 0 || parseFloat(t.insulin||0) > 0.1; });
        function _evName(t) {
            if (t.notes && t.notes.trim()) return t.notes.trim();
            var et = (t.eventType||'').toLowerCase();
            if (et.includes('carb')) return '🍏 דיווח פחמימות';
            if (et.includes('correction bolus')) return '💉 בולוס תיקון';
            if (et.includes('bolus')) return '💉 הזרקת אינסולין';
            return t.eventType || 'ארוחה';
        }
        var merged = [], used = {};
        rawTr.forEach(function(t, i) {
            if (used[i]) return;
            var g = { time: new Date(t.created_at).getTime(), carbs: t.carbs||0, insulin: parseFloat(t.insulin||0), name: _evName(t) };
            for (var j=i+1; j<rawTr.length; j++) {
                if (used[j]) continue;
                if (Math.abs(new Date(rawTr[j].created_at).getTime()-g.time)/60000 <= 5) {
                    g.carbs += rawTr[j].carbs||0; g.insulin += parseFloat(rawTr[j].insulin||0);
                    if (rawTr[j].notes&&rawTr[j].notes.trim()) g.name = rawTr[j].notes.trim();
                    used[j] = true;
                }
            }
            merged.push(g); used[i] = true;
        });
        merged = merged.slice(0,3);
        if (!merged.length) { showPopup("📜 היסטוריה", "לא נמצאו ארוחות ב-24ש' האחרונות."); return; }
        var html3 = "<div style='font-size:13px;line-height:1.9;text-align:right'>";
        merged.forEach(function(m) {
            var a = Math.round((Date.now()-m.time)/60000);
            var aStr = a>=60 ? Math.floor(a/60)+"ש' "+(a%60)+"דק'" : a+"דק'";
            html3 += "<div style='border-bottom:1px solid #222;padding:8px 0'><b>" + (m.carbs>0&&m.insulin>0?"🍽️ ארוחה משולבת":m.name) + "</b> — לפני " + aStr + "<br>";
            if (m.carbs>0)   html3 += "&nbsp;&nbsp;🍞 " + m.carbs + "g<br>";
            if (m.insulin>0) html3 += "&nbsp;&nbsp;💉 " + m.insulin.toFixed(2) + "U<br>";
            html3 += "</div>";
        });
        showPopup("📜 3 ארוחות אחרונות", html3+"</div>"); return;
    }

    // === כל שאר → Gemini ===
    try {
        // הכן context מיד מנתונים קיימים — אין fetch!
        var ctx = buildNSContext();
        var detectedFood = (typeof detectFoodName === 'function') ? detectFoodName(userQuestion) : null;
        if (detectedFood) {
            ctx.foodHistory = fetchFoodHistory(detectedFood);
            ctx.foodName = detectedFood;
        }
        if (typeof ACTIVITIES !== 'undefined' && ACTIVITIES.length) {
            var dayN2 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
            var nowDay = new Date().getDay();
            var nowH2 = new Date().getHours();
            var nowM2 = new Date().getMinutes();
            var actLines = ACTIVITIES.map(function(a) {
                var line = a.name + ' יום ' + dayN2[a.day] + ' ' + a.from + '-' + a.to;
                if (a.day === nowDay) {
                    var fp = a.from.split(':'), diff = (parseInt(fp[0])*60+parseInt(fp[1])) - (nowH2*60+nowM2);
                    if (diff > 0 && diff < 300) line += ' (בעוד ' + diff + ' דקות!)';
                    else if (diff <= 0 && diff > -120) line += ' (מתנהל עכשיו!)';
                }
                return line;
            });
            ctx._scheduleStr = actLines.join(' | ');
        }

        var prompt = buildGeminiPrompt(ctx, userQuestion);
        if (ctx._scheduleStr) prompt += "\nלו\"ז:" + ctx._scheduleStr;

        // זיהוי סוג שאילתה — שלח לג'מיני רק מה שרלוונטי
        var ql2 = userQuestion.toLowerCase().trim();
        var isStatusCmd = ql2.includes('מה המצב') || ql2.includes('מה קורה') || ql2.includes('סטטוס') || ql2.includes('status') || ql2 === 'מצב';
        var isBasalCmd  = ql2.includes('בזאלי') || ql2.includes('תוכנית בזאלית') || ql2.includes('בזאל');
        var isCRCmd     = ql2.includes('cr') || ql2.includes('icr') || ql2.includes('rc') || ql2.includes('יחס פחמימ');
        var isISFCmd    = ql2.includes('isf') || ql2.includes('רגישות') || ql2.includes('מדד רגישות');
        var isProfileCmd = isBasalCmd || isCRCmd || isISFCmd;

        if (isStatusCmd) {
            // מצב — רק נתוני רגע, ללא טבלאות
            prompt = [
                "שאילתת סטטוס — הצג נתוני רגע בלבד, ללא טבלאות או לוחות שעות.",
                "סוכר: " + ctx.sgv + " " + ctx.trend + " Δ" + (ctx.delta>=0?"+":"") + ctx.delta,
                "אינסולין פעיל: " + ctx.iob + "U | פחמימות פעילות: " + ctx.cob + "g | בזאלי: " + ctx.basal + "U/ש'",
                ctx.overrideActive ? "Override פעיל: " + ctx.overrideName : "Override: לא פעיל",
                ctx.loopRec != null ? "המשאבה מציעה: " + ctx.loopRec + "U" : "",
                "שאלה: " + userQuestion
            ].filter(Boolean).join("\n");
        } else if (!isProfileCmd) {
            // שאילתה רגילה (לא פרופיל) — הסר טבלת בזאלי מהפרומפט
            prompt = prompt.replace(/לוח בזאלי יומי:.*$/s, '').trim();
        }
        // isProfileCmd — שלח את כל הפרומפט כולל לוחות שעות

        // אבחון חומרה אוטומטי
        var hwWarnings = [];
        if (ctx.sgv > 240 && ctx.iob > 1.0 && ctx.cage && ctx.cage > 48)
            hwWarnings.push("⚠️ חשד לכשל ספיגה: סוכר " + ctx.sgv + " למרות " + ctx.iob + "U + פוד " + Math.round(ctx.cage) + "ש'");
        if (ctx.sage && ctx.sage > 216 && ctx.basal === 0)
            hwWarnings.push("⚠️ חיישן ישן (" + Math.floor(ctx.sage/24) + " ימים) + בזאלי 0 — שקול בדיקת אצבע");
        if (hwWarnings.length) prompt += "\nאזהרת חומרה: " + hwWarnings.join(" | ");

        var insName    = ctx.insulinName    || 'ליומג\'ב';
        var insPreMeal = ctx.insulinPreMeal || 5;
        var insPeak    = ctx.insulinPeak    || 30;

        var sysPrompt = `אתה מנוע חישוב מתמטי וטיפולי קשיח עבור אפליקציית LOOPIE של הילד דניאל (בן 9).
עליך להחזיר פלט קצר, פשוט ומבצעי לפי חוקי הבית הבאים בלבד. אסור להמציא נתונים, אסור להשתמש באנגלית, ואסור לכתוב משפטי פתיחה.

🛡️ חוק פענוח קיצורים: אם המשתמש רושם "cob", "iob", "override", "בזאלי", "מצב" — דווח על הסטטוס בלבד, אל תמליץ על ארוחה.
"cob" → "כרגע יש לך [X]g פחמימות פעילות." | "iob" → "יש לך [X]U אינסולין פעיל." | "override" → "תוכנית [שם] [פעילה/לא פעילה]."
"בזאלי" → הצג: "קצב בזאלי נוכחי: [X]U/ש'." + "תוכנית בזאלית יומית:" + כל שעה בשורה "- HH:MM עד HH:MM: Y יחידות לשעה" מתוך הנתונים.

חוקי חישוב פחמימות קשיחים:
- פיתה / המבורגר = 50ג' | 3ש' ספיגה.
- ג'חנון: 100ג' משקל = 50ג' פחמימה | 5ש' ספיגה. אם ציין משקל אחר — חשב יחסית (200ג' = 100ג' פחמימה).
- פסטה/כוס = 30ג' | 5ש'. (2 כוסות = 60ג' בדיוק! כפל קשיח). אורז/כף = 5ג' | 3ש'. צ'יפס/10 = 15ג' | 3ש'. פתיבר = 7.5ג' | 3ש'. בננה = 25ג' | 2ש'. תפוח = 15ג' | 2ש'. לחם = 15ג' | 3ש'.

🔴 חוק בטיחות — סוכר ≤100:
איסור מוחלט על המתנה! "תן לדניאל לאכול מיד." הזרק רק 10-15 דק' לאחר שהתחיל לאכול.
פיצול: 50% כעת, 50% חוב. "הסוכר נמוך — נזריק פחות כדי לתת לסוכר לעלות. חוב יושלם כשיעלה מעל 140."

חוק ה-3 — פיצול קשיח 70/30:
פיתה/ג'חנון/פסטה/המבורגר: חובה לפצל!
- כעת: 70% מהפחמימות (50ג' → 35ג' כעת).
- חוב: 30% (50ג' → 15ג' חוב). לופי תתריע להשלים כשסוכר יעלה מעל 150.

תזמון לפי אינסולין (INS מהנתונים):
ליומג'ב/Lyumjev: 2-3 דק' לפני. נובורפיד/Novorapid: 20 דק' לפני.

נוסחת סימולציית לופ יבש (מנה מלאה):
(סך פחמימות / ICR) + תיקון סוכר אם נדרש = כמה הלופ היה מציע.

👁️ מודול ראייה ותרגום (Vision):
אם מתקבלת תמונה — קרא ונתח כל טקסט בכל שפה. תרגם ערכי תזונה לעברית.
זהה מוצרים ממותגים וחשב פחמימות מדויקות מהמוצר שזיהית.
השתמש בפחמימות שחילצת מהתמונה + CR הנוכחי + סוכר מ-NS, והצג המלצה לפי חוק ה-3.


אם המשתמש שואל "מה המצב הרפואי" או "בדיקות דם" — קרא מנתוני הפרופיל (שם, גיל, משקל) ותזכורות ב-state וציין:
- אילו בדיקות תקופתיות בתוקף / עומדות לפוג / באיחור.
- מתי מומלץ לעדכן גובה ומשקל (כל 3 חודשים).


כשמועברים נתוני דוח שבועי — פעל כמנהל מרפאת סוכרת. ענה בדיוק בפורמט:
⚠️ תזכורת מעקב: [המלצות קודמות יושמו/לא יושמו].
🎯 עדוף שינויים (מדחוף לפחות):
• קדימות 1 [קריטי]: [שינוי] | למה: [הסבר].
• קדימות 2 [בינוני]: [שינוי].
• קדימות 3 [נמוך]: [שינוי].
⏱️ כל שינוי = 3 ימי הסתגלות. נעל ואל תשנה נוסף.

🎯 ניתוח ISF/CR:
אם המשתמש שואל "האם לשנות ISF" או "האם לשנות CR" — נתח את הנתונים שקיבלת:
- בדוק מגמת סוכר, IOB, וגובה הסוכר הנוכחי.
- החזר המלצה קצרה: האם לשנות (כן/לא), לאיזה ערך מדויק, ובאילו שעות ביום לבצע שינוי באייפון.
- דוגמה: "כן — העלה ISF מ-120 ל-130 בשעות 02:00-06:00 בלבד, כדי למנוע ירידות לילה."


אם המשתמש מדווח שהילד עצר את הארוחה באמצע (למשל: "אכל רק חצי פיתה", "הפסיק לאכול", "לא סיים"):
1. חשב כמה גרם נאכלו בפועל לעומת כמה הוזרק עליהם.
2. בטל מיד את חוב ה-30% — אין להשלים אותו!
3. חשב את הפער: אינסולין שהוזרק על [X]ג' אבל נאכלו רק [Y]ג' → פער של [X-Y]ג' פחמימה חסרה.
4. המלץ במפורש: "תן לדניאל עכשיו [Z]ג' פחמימה מהירה (פתיבר / מיץ / גלוקוז) כדי לכסות את עודף האינסולין ולמנוע היפו!"
5. עקוב: "עקוב אחרי הסוכר בדקות הקרובות — אם יורד מתחת ל-80, הוסף עוד 15ג' מהר!"

📜 היסטוריית ארוחות:
אם המשתמש שואל "מה אכלתי?" — השתמש ב-MEALS וב-BOLUSES שקיבלת והצג 3 אחרונות בפורמט:
• [שם] לפני [X]דק': [Y]g פחמימה | [Z]U אינסולין.
אסור להמציא נתונים שאינם ב-MEALS/BOLUSES.


אם המשתמש מדווח על מאכל שנאכל בעבר ולא דווח (למשל: "אכלתי פתיבר לפני חצי שעה"):
1. חשב פחמימות לפי חוקי הבית (חצי פתיבר = 3.75ג') והסבר שעברו X דקות — הן כבר נספגו.
2. השווה מול IOB נוכחי: אם IOB מכסה את הפחמימות → "אין צורך להזריק! האינסולין הפעיל כבר בלם את האוכל."
3. סיים תמיד: "אין לדווח במשאבה — יגרום לכפל אינסולין מסוכן! לופי יעקוב ב-30 דקות הקרובות. אם סוכר יעלה מעל 150 — תגיע התראה."


Omnipod: תוקף 72ש' + Grace 8ש'. G7: תוקף 10 ימים + Grace 12ש'.
פוד >48ש' + סוכר>240 + IOB>1U → "חשד לכשל ספיגה! תיקון בעט + החלף פוד."
חיישן >9 ימים → "חיישן ישן — בדיקת אצבע."
Override פעיל → הפחת המלצות בהתאם למכפיל.
היפו לילי חוזר → Override לילה 90% + יעד 120-140 ל-4ש'.

🛡️ ניהול חוגים — JSON נקי בלבד (ללא תגיות קוד):
הוספה: {"action":"add_routine","name":"[שם]","day":"[ראשון/שני/שלישי/רביעי/חמישי/שישי/שבת]","startTime":"[HH:MM]","endTime":"[HH:MM]","intensity":"[נמוכה/בינונית/גבוהה]"}
עדכון: {"action":"update_routine","name":"[שם]","intensity":"[גבוהה/בינונית/נמוכה]","day":"","startTime":"","endTime":""}
מחיקה: {"action":"delete_routine","name":"[שם]"}

פורמט פלט חובה (לארוחות):
[שם] — סך הכל: [X]ג' פחמימה. ספיגה: [Y]ש'.
• כתוב בלופ כעת: [שם] [70%]ג'.
• הזרק כעת: [U]U ([תזמון לפי אינסולין] לפני האוכל).
• חוב להמשך: [30%]ג'. לופי תתריע להשלים את ה-[V]U כשסוכר יעלה מעל 150.
• הלופ היבש היה מציע: [Z]U על המנה המלאה (ההמלצה שלי שונה בגלל פיצול חוק ה-3).`;

        // הזרקה דינמית של ערכי פרופיל עדכניים
        var nowHD = new Date().getHours();
        var profD = fullHistory && fullHistory.profile;
        var currentCR  = profD ? parseFloat(profileValueAt(profD.carbratio||profD.carbRatio||profD.ic, nowHD)||15) : (nsData.cr||15);
        var currentISF = profD ? parseFloat(profileValueAt(profD.sens||profD.sensitivity, nowHD)||120) : (nsData.isf||120);
        sysPrompt += "\n\n📐 ערכי פרופיל נוכחיים (מה-NS, " + new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false}) + "):\n" +
            "CR = 1U לכל " + currentCR.toFixed(1) + "g פחמימה.\n" +
            "ISF = " + currentISF + " mg/dL ליחידה.\n" +
            "נוסחת לופ יבש: (פחמימות / " + currentCR.toFixed(1) + ") + תיקון לפי ISF " + currentISF + ".";

        // בדוק אם זו בקשת חוג — שלח ל-Gemini ללא Streaming (צריך JSON מלא)
        var isActivityRequest = /הוסף|הכנס|צור|שנה|עדכן|ערוך|מחק|הסר|חוג|אימון|שיעור/i.test(userQuestion) &&
                                /חוג|אימון|שיעור|פעילות|mma|כדורגל|כדורסל|שחייה|ריצה|צופים|קראטה|כושר|עצימות|אופניים|יוגה|פילאטיס|הליכה/i.test(userQuestion);
        if (isActivityRequest) {
            // ── פרסור מקומי ראשוני — לפני Gemini ──
            var localActObj = _parseActivityLocally(userQuestion);
            if (localActObj) {
                _handleActivityObj(localActObj, userQuestion);
                return;
            }
            // fallback → Gemini
            var actResp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiKey(), {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    contents: [{role:"user", parts:[{text: userQuestion}]}],
                    systemInstruction: {parts:[{text: sysPrompt}]},
                    generationConfig: {maxOutputTokens: 150, temperature: 0.0}
                })
            });
            if (actResp.ok) {
                var actData = await actResp.json();
                var actText = ((actData.candidates[0].content.parts[0].text)||'').trim();
                // ניקוי תגיות קוד
                actText = actText.replace(/```json/gi,'').replace(/```/g,'').replace(/^\s*\n/gm,'').trim();
                // מצא JSON בתשובה
                var jsonMatch = actText.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    try {
                        var actObj = JSON.parse(jsonMatch[0]);
                        var dayMap2 = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
                        var dayNames2 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
                        var _toEn2 = function(v){ if(!v)return'medium'; v=String(v).toLowerCase(); if(v==='גבוהה'||v==='high')return'high'; if(v==='נמוכה'||v==='low')return'low'; return'medium'; };
                        var _saveActs = function(){ try { localStorage.setItem('loopie_activities', JSON.stringify(ACTIVITIES)); } catch(e2) {} };

                        if (actObj.action === 'add_routine') {
                            // פרסור ריבוי ימים עם שעות נפרדות מהטקסט המקורי
                            // תמיכה ב: "יום שני 09:00-10:00 וביום רביעי 16:00-17:00"
                            var DAY_NAMES_LIST = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
                            var DAY_MAP_LOCAL  = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
                            var timeRx  = /(\d{1,2}[:.:]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.:]?\d{0,2})/g;
                            var dayRx   = new RegExp('(' + DAY_NAMES_LIST.join('|') + ')', 'g');

                            function normalizeTime(t) {
                                t = t.replace('.',':');
                                if (!t.includes(':')) t = t.length <= 2 ? t + ':00' : t.slice(0,-2) + ':' + t.slice(-2);
                                var p = t.split(':');
                                return p[0].padStart(2,'0') + ':' + (p[1]||'00').padStart(2,'0');
                            }

                            // מצא כל הופעות יום+שעות ברצף
                            var rawQ   = userQuestion;
                            var slots  = [];  // [{day, from, to}]
                            var dMatch, tMatch;
                            var allDays = []; var dm2;
                            while ((dm2 = dayRx.exec(rawQ)) !== null) allDays.push({name: dm2[1], idx: dm2.index});

                            var allTimes = []; var tm2; timeRx.lastIndex = 0;
                            while ((tm2 = timeRx.exec(rawQ)) !== null) allTimes.push({from: normalizeTime(tm2[1]), to: normalizeTime(tm2[2]), idx: tm2.index});

                            if (allDays.length > 0 && allTimes.length > 0) {
                                // שייך כל זוג שעות ליום הכי קרוב לפניו
                                allDays.forEach(function(d, di) {
                                    var nextDayIdx = allDays[di+1] ? allDays[di+1].idx : rawQ.length;
                                    // מצא שעות בין היום הנוכחי לבא
                                    var timesForDay = allTimes.filter(function(t){ return t.idx > d.idx && t.idx < nextDayIdx; });
                                    if (timesForDay.length === 0) {
                                        // אין שעות ספציפיות — קח את הראשונות הכלליות
                                        timesForDay = allTimes.slice(0, 1);
                                    }
                                    timesForDay.forEach(function(t) {
                                        slots.push({ day: DAY_MAP_LOCAL[d.name], from: t.from, to: t.to });
                                    });
                                });
                            }

                            // fallback — שיטה ישנה אם לא הצלחנו לפרסר
                            if (slots.length === 0) {
                                var dayStr   = (actObj.day || '').replace(/[,+ו]/g, ' ');
                                var dayWords = dayStr.split(/\s+/).filter(Boolean);
                                dayWords.forEach(function(dw) {
                                    var dn = DAY_MAP_LOCAL[dw.trim()];
                                    if (dn !== undefined) slots.push({ day: dn, from: actObj.startTime, to: actObj.endTime });
                                });
                                if (slots.length === 0 && DAY_MAP_LOCAL[actObj.day] !== undefined)
                                    slots = [{ day: DAY_MAP_LOCAL[actObj.day], from: actObj.startTime, to: actObj.endTime }];
                            }

                            if (slots.length > 0) {
                                slots.forEach(function(sl) {
                                    ACTIVITIES.push({ id: Date.now() + sl.day + Math.random(), name: actObj.name, day: sl.day, from: sl.from, to: sl.to, intensity: _toEn2(actObj.intensity) });
                                });
                                _saveActs(); try { renderActivities(); } catch(e) {}
                                var summary = slots.map(function(sl){ return 'יום ' + DAY_NAMES_LIST[sl.day] + ' ' + sl.from + '–' + sl.to; }).join('<br>');
                                showPopup("✅ חוג נוסף!", "<b>" + actObj.name + "</b><br>" + summary);
                                return;
                            }

                        } else if (actObj.action === 'update_routine') {
                            var DAY_NAMES_UPD  = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
                            var DAY_MAP_UPD    = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};

                            // חלץ שעות מהטקסט אם Gemini לא החזיר
                            function normT(t) {
                                if (!t) return null;
                                t = String(t).replace('.', ':');
                                if (!t.includes(':')) t = t.length <= 2 ? t + ':00' : t.slice(0,-2) + ':' + t.slice(-2);
                                var p = t.split(':');
                                return p[0].padStart(2,'0') + ':' + (p[1]||'00').padStart(2,'0');
                            }
                            var timeRx2 = /(\d{1,2}[:.:]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.:]?\d{0,2})/;
                            var tMatch2 = userQuestion.match(timeRx2);
                            if (!actObj.startTime && tMatch2) actObj.startTime = normT(tMatch2[1]);
                            if (!actObj.endTime   && tMatch2) actObj.endTime   = normT(tMatch2[2]);

                            // זיהוי "יום X במקום יום Y" — fromDay=Y, toDay=X
                            var fromDay = null, toDay = null;
                            // זיהוי שינוי יום — כל הפורמטים
                            var DAYS_RX = '(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)';
                            var uq = userQuestion;

                            // "ביום X במקום ביום Y" / "יום X במקום יום Y"
                            var swapRx = new RegExp('ב?יום\\s+' + DAYS_RX + '[\\s\\S]*?במקום[\\s\\S]*?ב?יום\\s+' + DAYS_RX);
                            // "במקום ביום Y ... ביום X"
                            var swapRx2 = new RegExp('במקום[\\s\\S]*?ב?יום\\s+' + DAYS_RX + '[\\s\\S]*?ב?יום\\s+' + DAYS_RX);
                            // "מיום X ליום Y" / "מיום X לשישי"
                            var changeRx = new RegExp('מ(?:יום\\s+|ב)?' + DAYS_RX + '[\\s\\S]*?ל(?:יום\\s+|ב)?' + DAYS_RX);

                            var sm = uq.match(swapRx);
                            var sm2 = sm ? null : uq.match(swapRx2);
                            var cm = (!sm && !sm2) ? uq.match(changeRx) : null;

                            if (sm) {
                                // "ביום שישי במקום ביום שבת" → toDay=שישי, fromDay=שבת
                                toDay   = DAY_MAP_UPD[sm[1]];
                                fromDay = DAY_MAP_UPD[sm[2]];
                            } else if (sm2) {
                                toDay   = DAY_MAP_UPD[sm2[2]];
                                fromDay = DAY_MAP_UPD[sm2[1]];
                            } else if (cm) {
                                fromDay = DAY_MAP_UPD[cm[1]];
                                toDay   = DAY_MAP_UPD[cm[2]];
                            } else if (actObj.day !== undefined && actObj.day !== '') {
                                toDay = DAY_MAP_UPD[actObj.day];
                            }

                            // חלץ שם חוג אם Gemini לא החזיר
                            if (!actObj.name || actObj.name === '') {
                                ACTIVITIES.forEach(function(a) {
                                    if (userQuestion.toLowerCase().includes(a.name.toLowerCase())) actObj.name = a.name;
                                });
                            }

                            var updCnt = 0;
                            ACTIVITIES.forEach(function(a) {
                                var nm = a.name.toLowerCase().trim(), qn = (actObj.name||'').toLowerCase().trim();
                                var nameMatch = !qn || nm === qn || nm.includes(qn) || qn.includes(nm);
                                if (!nameMatch) return;

                                // אם יש fromDay — עדכן רק את הרשומה של אותו יום
                                var dayMatch = fromDay !== null ? a.day === fromDay : true;
                                if (!dayMatch) return;

                                if (actObj.intensity) a.intensity = _toEn2(actObj.intensity);
                                // עדכן יום — אם fromDay→toDay
                                if (toDay !== null) a.day = toDay;
                                if (actObj.startTime) a.from = actObj.startTime;
                                if (actObj.endTime)   a.to   = actObj.endTime;
                                updCnt++;
                            });

                            _saveActs(); try { renderActivities(); } catch(e) {}

                            var lbl = (INTENSITY_LABELS||{})[ _toEn2(actObj.intensity) ] || actObj.intensity || '';
                            var updDetails = [];
                            if (fromDay !== null && toDay !== null)
                                updDetails.push('📅 יום ' + DAY_NAMES_UPD[fromDay] + ' → יום ' + DAY_NAMES_UPD[toDay]);
                            else if (toDay !== null)
                                updDetails.push('📅 יום ' + DAY_NAMES_UPD[toDay]);
                            if (actObj.startTime && actObj.endTime) updDetails.push('🕐 ' + actObj.startTime + '–' + actObj.endTime);
                            if (lbl) updDetails.push('⚡ ' + lbl);

                            showPopup(updCnt > 0 ? "✅ עודכן!" : "❓",
                                updCnt > 0
                                    ? "<b>" + (actObj.name||'החוג') + "</b><br>" + updDetails.join('<br>')
                                    : "לא מצאתי חוג בשם '" + (actObj.name||'') + "' ביום הזה.<br><small style='color:#888'>נסה: 'עדכן חוג MMA מיום שני ליום שלישי'</small>");
                            return;

                        } else if (actObj.action === 'delete_routine') {
                            var beforeD = ACTIVITIES.length;
                            ACTIVITIES = ACTIVITIES.filter(function(a){ return !a.name.toLowerCase().includes((actObj.name||'').toLowerCase()); });
                            _saveActs(); try { renderActivities(); } catch(e) {}
                            showPopup(ACTIVITIES.length < beforeD ? "🗑️ נמחק" : "❓",
                                ACTIVITIES.length < beforeD ? "<b>" + actObj.name + "</b> — " + (beforeD-ACTIVITIES.length) + " רשומות הוסרו." :
                                "לא מצאתי חוג בשם '" + actObj.name + "'.");
                            return;
                        }
                    } catch(jsonErr) {}
                }
                showPopup("❓", actText || "לא הצלחתי לפרסר. נסה: 'הוסף חוג צופים יום שלישי 16:00-17:30'");
            }
            return;
        }

        // Streaming fetch — מיידי, ללא המתנה
        var streamHtml = "<div id='gemini-stream' style='font-size:14px;line-height:1.7;text-align:right;white-space:pre-line;direction:rtl'>מנתח נתוני אמת... ⏳</div>" +
                         "<small style='color:#555'>Gemini | " + ctx.time + " | " + ctx.sgv + "</small>";
        closePopup();
        showPopup("🧠 Loopie מנתח", streamHtml);

        // בנה parts — טקסט + תמונה אם יש
        var msgParts = [{text: prompt}];
        if (_pendingImageB64) {
            msgParts.unshift({ inlineData: { mimeType: _pendingImageType, data: _pendingImageB64 } });
            _clearImage(); // נקה אחרי שליחה
        }

        var streamUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=" + geminiKey();
        var streamResp = await fetch(streamUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{role:"user", parts: msgParts}],
                systemInstruction: {parts:[{text: sysPrompt}]},
                generationConfig: {maxOutputTokens: 4000, temperature: 0.0}
            })
        });

        if (!streamResp.ok) {
            var errD2 = await streamResp.json();
            throw new Error("Gemini " + (errD2.error&&errD2.error.message||streamResp.status));
        }

        var reader = streamResp.body.getReader();
        var decoder = new TextDecoder();
        var fullText = "";
        var streamEl = document.getElementById('gemini-stream');
        if (streamEl) streamEl.textContent = '';

        while (true) {
            var chunk = await reader.read();
            if (chunk.done) break;
            var raw = decoder.decode(chunk.value, {stream: true});
            var parts = raw.split('"text":');
            if (parts.length > 1) {
                for (var pi = 1; pi < parts.length; pi++) {
                    var cleanText = parts[pi].split('"')[1];
                    if (!cleanText) continue;
                    cleanText = cleanText.replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\"/g, '"');
                    fullText += cleanText;
                    if (streamEl) streamEl.textContent = fullText;
                }
            }
        }

        // הסר פתיחות
        fullText = fullText.replace(/^(שלום[^!\n]*[!\n]?\s*|היי[^!\n]*[!\n]?\s*)/i, '').trim();

        // ניקוי תגיות קוד שג'מיני מוסיף לפעמים
        var jsonTry = fullText.trim().replace(/```json/gi,'').replace(/```/g,'').trim();
        if (jsonTry.startsWith('{') && jsonTry.includes('"action"')) {
            try {
                var jsonCmd = JSON.parse(jsonTry);
                var dayMapJ = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6};
                var dayNamesJ = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
                var _saveJ = function(){ try { localStorage.setItem('loopie_activities', JSON.stringify(ACTIVITIES)); } catch(e2) {} };
                var _toEn = function(v){ if(!v)return'medium'; v=v.toLowerCase(); if(v==='גבוהה'||v==='high')return'high'; if(v==='נמוכה'||v==='low')return'low'; return'medium'; };

                if (jsonCmd.action === 'add_routine') {
                    var dayNumJ = dayMapJ[jsonCmd.day];
                    if (dayNumJ !== undefined) {
                        ACTIVITIES.push({ id: Date.now(), name: jsonCmd.name, day: dayNumJ, from: jsonCmd.startTime, to: jsonCmd.endTime, intensity: _toEn(jsonCmd.intensity) });
                        _saveJ(); try { renderActivities(); } catch(e) {}
                        showPopup("✅ חוג נוסף!", "<b>" + jsonCmd.name + "</b><br>יום " + dayNamesJ[dayNumJ] + " | " + jsonCmd.startTime + "–" + jsonCmd.endTime);
                        return;
                    }
                } else if (jsonCmd.action === 'update_routine') {
                    var updCountJ = 0;
                    ACTIVITIES.forEach(function(a) {
                        var nameMatch = a.name.toLowerCase().trim() === jsonCmd.name.toLowerCase().trim() ||
                                        a.name.toLowerCase().includes(jsonCmd.name.toLowerCase()) ||
                                        jsonCmd.name.toLowerCase().includes(a.name.toLowerCase());
                        var dayMatch  = !jsonCmd.day || (dayMapJ[jsonCmd.day] === undefined ? true : a.day === dayMapJ[jsonCmd.day]);
                        if (nameMatch && dayMatch) {
                            if (jsonCmd.intensity) a.intensity = _toEn(jsonCmd.intensity);
                            if (jsonCmd.day && dayMapJ[jsonCmd.day] !== undefined) a.day = dayMapJ[jsonCmd.day];
                            if (jsonCmd.startTime) a.from = jsonCmd.startTime;
                            if (jsonCmd.endTime)   a.to   = jsonCmd.endTime;
                            updCountJ++;
                        }
                    });
                    if (updCountJ > 0) {
                        _saveJ(); try { renderActivities(); } catch(e) {}
                        var intLabelJ = (INTENSITY_LABELS||{})[ _toEn(jsonCmd.intensity) ] || '';
                        showPopup("✅ עודכן!", "כל חוגי <b>" + jsonCmd.name + "</b> עודכנו (" + updCountJ + " רשומות)" + (intLabelJ ? "<br>" + intLabelJ : "") + " ✓");
                    } else {
                        showPopup("❓", "לא מצאתי חוג בשם '" + jsonCmd.name + "'.");
                    }
                    return;
                } else if (jsonCmd.action === 'delete_routine') {
                    var beforeJ = ACTIVITIES.length;
                    ACTIVITIES = ACTIVITIES.filter(function(a){ return !a.name.toLowerCase().includes(jsonCmd.name.toLowerCase()); });
                    if (ACTIVITIES.length < beforeJ) {
                        _saveJ(); try { renderActivities(); } catch(e) {}
                        showPopup("🗑️ נמחק", "<b>" + jsonCmd.name + "</b> — " + (beforeJ - ACTIVITIES.length) + " רשומות הוסרו.");
                    } else {
                        showPopup("❓", "לא מצאתי חוג בשם '" + jsonCmd.name + "'.");
                    }
                    return;
                }
            } catch(jsonErr) {
                // לא JSON תקין — המשך להציג כטקסט רגיל
            }
        }

        // טקסט רגיל — הצג
        if (streamEl) streamEl.textContent = fullText;

        // זהה חוב פחמימות ושמור
        var debtGMatch = fullText.match(/חוב של (\d+) גרם/);
        var mealNameMatch = fullText.match(/כתוב בלופ:\s*([^\d\n]+)/);
        if (debtGMatch) {
            try {
                localStorage.setItem('active_debt', JSON.stringify({
                    carbs: parseInt(debtGMatch[1]),
                    meal: mealNameMatch ? mealNameMatch[1].trim() : 'ארוחה',
                    status: 'open',
                    time: Date.now()
                }));
            } catch(e) {}
        }

        // התראת פיצול
        var debtMatch = fullText.match(/עוד\s*(\d+)\s*(?:דקות?|דק'?)\s*.*?(\d+\.?\d*)\s*[Uu]/);
        if (debtMatch) {
            var splitMin = parseInt(debtMatch[1]);
            var splitU   = parseFloat(debtMatch[2]);
            setTimeout(function(){
                sendNotification("⏰ זמן להזריק השלמה!", "הזרק " + splitU + "U — השלמת הארוחה", {tag:'loopie-split',requireInteraction:true});
            }, splitMin * 60000);
        }

    } catch(e) {
        closePopup();
        showPopup("⚠️", (e.message||'').includes('429')?"מכסה נגמרה, נסה שוב בעוד דקה.":"שגיאה: "+(e.message||e));
    }

}
function showStatus(msg, type) {
    var el = document.getElementById('login-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status ' + (type||'');
}

function rescueCarbs() {
    showPopup("🔵 תוכנית חילוץ", "<div style='font-size:13px'><b>סוכר נמוך — פעל עכשיו:</b><br><br>1. קח <b>15g גלוקוז מהיר</b><br>2. המתן 15 דקות<br>3. בדוק שוב<br><br><small style='color:#888'>Loop הפחית בזאלי אוטומטית</small></div>");
}

// ========= מצב ציוד — CAGE/SAGE מ-NS =========
async function showEquipmentStatus() {
    showPopup("📟 מצב ציוד", "<div style='text-align:center;padding:20px'><span class='spinner'></span></div>");
    try {
        var res  = await nsGet('/api/v2/properties/cage,sage');
        var data = res.ok ? await res.json() : {};

        function parseHours(prop) {
            if (!prop) return null;
            // מבנה ישיר: {age: 190}
            if (prop.age !== undefined && prop.age !== null) return parseFloat(prop.age);
            if (prop.value !== undefined && prop.value !== null) return parseFloat(prop.value);
            // מבנה מקונן: {"Sensor Start": {age: 190}, ...}
            var keys = Object.keys(prop);
            for (var ki=0; ki<keys.length; ki++) {
                var sub = prop[keys[ki]];
                if (sub && typeof sub === 'object' && sub.found && sub.age !== undefined) {
                    return parseFloat(sub.age);
                }
            }
            if (prop.display) {
                var m = prop.display.match(/(\d+)d\s*(\d+)h/);
                if (m) return parseInt(m[1])*24 + parseInt(m[2]);
                m = prop.display.match(/(\d+)h/);
                if (m) return parseInt(m[1]);
            }
            return null;
        }

        var cageH = parseHours(data.cage);
        var sageH = parseHours(data.sage);

        var ans = "<b>📟 מצב ציוד</b><br><br>";

        // חיישן
        ans += "<div style='background:#0a0a14;border-radius:10px;padding:12px;margin-bottom:10px'>";
        ans += "<div style='font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px'>📡 חיישן CGM</div>";
        if (sageH !== null) {
            var sLeft = Math.max(0, 240 - sageH);
            var sColor = sLeft < 24 ? '#ef4444' : sLeft < 48 ? '#f59e0b' : '#10b981';
            ans += "• גיל: <b>" + Math.floor(sageH/24) + "d " + Math.round(sageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + sColor + "'>" + Math.floor(sLeft/24) + "d " + Math.round(sLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + new Date(Date.now()+sLeft*3600000).toLocaleString('he-IL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) + "</b>";
            if (sLeft < 24) ans += "<br><span style='color:#ef4444'>⚠️ החלף בקרוב!</span>";
        } else {
            ans += "<span style='color:#f59e0b'>SAGE לא זמין</span>";
        }
        ans += "</div>";

        // פוד
        ans += "<div style='background:#0a0a14;border-radius:10px;padding:12px'>";
        ans += "<div style='font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px'>💊 פוד (Omnipod)</div>";
        if (cageH !== null) {
            var pLeft = Math.max(0, 72 - cageH);
            var pColor = pLeft < 12 ? '#ef4444' : pLeft < 24 ? '#f59e0b' : '#10b981';
            ans += "• גיל: <b>" + Math.floor(cageH/24) + "d " + Math.round(cageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + pColor + "'>" + Math.floor(pLeft/24) + "d " + Math.round(pLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + new Date(Date.now()+pLeft*3600000).toLocaleString('he-IL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) + "</b>";
            if (pLeft < 12) ans += "<br><span style='color:#ef4444'>⚠️ פוד כמעט נגמר!</span>";
        } else {
            ans += "<span style='color:#f59e0b'>CAGE לא זמין</span>";
        }
        ans += "</div>";

        showPopup("📟 מצב ציוד", ans);
    } catch(e) {
        showPopup("⚠️", "שגיאה: " + e.message);
    }
}


async function showEquipmentStatus() {
    showPopup('📟 מצב ציוד', "<div style='text-align:center;padding:20px'><span class='spinner'></span></div>");
    try {
        var cageH = null, sageH = null;

        // ── ניסיון 1: api/v2/properties (NS חדש) ──
        try {
            var r2 = await nsGet('/api/v2/properties/cage,sage');
            if (r2.ok) {
                var d2 = await r2.json();
                function parseHours(prop) {
                    if (!prop) return null;
                    if (prop.age   !== undefined && prop.age   !== null) return parseFloat(prop.age);
                    if (prop.value !== undefined && prop.value !== null) return parseFloat(prop.value);
                    var keys = Object.keys(prop);
                    for (var ki = 0; ki < keys.length; ki++) {
                        var sub = prop[keys[ki]];
                        if (sub && typeof sub === 'object' && sub.found && sub.age !== undefined)
                            return parseFloat(sub.age);
                    }
                    if (prop.display) {
                        var m = prop.display.match(/(\d+)d\s*(\d+)h/);
                        if (m) return parseInt(m[1]) * 24 + parseInt(m[2]);
                        m = prop.display.match(/(\d+)h/);
                        if (m) return parseInt(m[1]);
                    }
                    return null;
                }
                cageH = parseHours(d2.cage);
                sageH = parseHours(d2.sage);
            }
        } catch(e2) {}

        // ── Fallback: Site Change מ-treatments ──
        if (cageH === null && sageH === null) {
            var since14 = new Date(Date.now() - 14 * 86400000).toISOString();
            var tr = await nsGet('/api/v1/treatments.json?find[created_at][$gte]=' + since14 + '&count=50');
            if (tr.ok) {
                var treats = await tr.json();
                // פוד — Site Change / Pod Change
                var podChanges = treats.filter(function(t) {
                    var ev = (t.eventType || '').toLowerCase();
                    return ev.includes('site') || ev.includes('pod') || ev.includes('cannula');
                });
                if (podChanges.length) {
                    var lastPod = new Date(podChanges[0].created_at).getTime();
                    cageH = (Date.now() - lastPod) / 3600000;
                }
                // חיישן — Sensor Change / Sensor Start
                var sensorChanges = treats.filter(function(t) {
                    var ev = (t.eventType || '').toLowerCase();
                    return ev.includes('sensor') || ev.includes('cgm') || ev.includes('calibration start');
                });
                if (sensorChanges.length) {
                    var lastSensor = new Date(sensorChanges[0].created_at).getTime();
                    sageH = (Date.now() - lastSensor) / 3600000;
                }
            }
        }

        var ans = "<div style='font-size:13px;line-height:1.8;text-align:right'>";

        // ── חיישן ──
        ans += "<div style='background:#0a0a14;border-radius:10px;padding:12px;margin-bottom:10px'>";
        ans += "<div style='font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px'>📡 חיישן CGM</div>";
        if (sageH !== null) {
            var sLeft  = Math.max(0, 240 - sageH);
            var sColor = sLeft < 24 ? '#ef4444' : sLeft < 48 ? '#f59e0b' : '#10b981';
            var sDate  = new Date(Date.now() + sLeft * 3600000)
                .toLocaleString('he-IL', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false});
            ans += "• גיל: <b>" + Math.floor(sageH/24) + "d " + Math.round(sageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + sColor + "'>" + Math.floor(sLeft/24) + "d " + Math.round(sLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + sDate + "</b>";
            if (sLeft < 24) ans += "<br><span style='color:#ef4444'>⚠️ החלף בקרוב!</span>";
        } else {
            ans += "<span style='color:#f59e0b'>SAGE לא זמין</span>";
        }
        ans += "</div>";

        // ── פוד ──
        ans += "<div style='background:#0a0a14;border-radius:10px;padding:12px'>";
        ans += "<div style='font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px'>💊 פוד (Omnipod)</div>";
        if (cageH !== null) {
            var pLeft  = Math.max(0, 72 - cageH);
            var pColor = pLeft < 12 ? '#ef4444' : pLeft < 24 ? '#f59e0b' : '#10b981';
            var pDate  = new Date(Date.now() + pLeft * 3600000)
                .toLocaleString('he-IL', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false});
            ans += "• גיל: <b>" + Math.floor(cageH/24) + "d " + Math.round(cageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + pColor + "'>" + Math.floor(pLeft/24) + "d " + Math.round(pLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + pDate + "</b>";
            if (pLeft < 12) ans += "<br><span style='color:#ef4444'>⚠️ פוד כמעט נגמר!</span>";
        } else {
            ans += "<span style='color:#f59e0b'>CAGE לא זמין</span>";
        }
        ans += "</div></div>";

        showPopup('📟 מצב ציוד', ans);
    } catch(e) {
        showPopup('⚠️ ציוד', 'שגיאה: ' + e.message);
    }
}


async function drawMiniChart() {
    try {
        var canvas = document.getElementById('mini-chart');
        if (!canvas) return;
        var wrap = document.getElementById('mini-chart-wrap');

        var since3h = new Date(Date.now() - 3*3600000).toISOString();
        var res = await nsGet('/api/v1/entries.json?find[dateString][$gte]=' + since3h + '&count=50');
        if (!res.ok) return;
        var entries = await res.json();
        if (!entries.length) return;
        entries.reverse();

        // נתוני ניבוי
        var predicted = [];
        var dev3 = fullHistory.devStatus;
        if (dev3) {
            var predObj  = dig(dev3, 'loop.predicted');
            var predVals = predObj && predObj.values ? predObj.values : (Array.isArray(predObj) ? predObj : null);
            if (!predVals) predVals = dig(dev3, 'loop.predicted.values');
            if (predVals && Array.isArray(predVals)) predicted = predVals.slice(0, 12);
        }

        if (wrap) wrap.style.display = 'block';
        var ctx = canvas.getContext('2d');
        var W = canvas.offsetWidth || 300;
        var dpr = window.devicePixelRatio || 1;
        canvas.width  = W * dpr;
        canvas.height = 80 * dpr;
        ctx.scale(dpr, dpr);
        var H = 80;

        var allVals = entries.map(function(e){ return e.sgv; }).concat(predicted);
        var minV = Math.min(60,  Math.min.apply(null, allVals) - 20);
        var maxV = Math.max(290, Math.max.apply(null, allVals) + 20);

        var lblLow  = document.getElementById('chart-low-lbl');
        var lblHigh = document.getElementById('chart-high-lbl');
        var lblRange = document.getElementById('chart-range-lbl');
        if (lblLow)   lblLow.innerText  = '70';
        if (lblHigh)  lblHigh.innerText = '280';
        if (lblRange) lblRange.innerText = 'עכשיו';

        function yPos(v) { return H - ((v - minV) / (maxV - minV)) * H; }

        ctx.clearRect(0, 0, W, H);

        // אזור בטווח
        ctx.fillStyle = 'rgba(16,185,129,0.06)';
        ctx.fillRect(0, yPos(180), W, yPos(70) - yPos(180));

        // קווי גבול
        ctx.strokeStyle = '#1a2a1a'; ctx.lineWidth = 0.5; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(0,yPos(70));  ctx.lineTo(W,yPos(70));  ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,yPos(180)); ctx.lineTo(W,yPos(180)); ctx.stroke();
        ctx.setLineDash([]);

        // קו "עכשיו"
        var totalPts = entries.length + predicted.length;
        var nowX = (entries.length / totalPts) * W;
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(nowX, 0); ctx.lineTo(nowX, H); ctx.stroke();

        // נקודות היסטוריה
        entries.forEach(function(e, i) {
            var x = (i / totalPts) * W;
            var y = yPos(e.sgv);
            ctx.fillStyle = e.sgv > 180 ? '#f59e0b' : e.sgv < 70 ? '#3b82f6' : '#10b981';
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill();
        });

        // קו צפי
        if (predicted.length > 0) {
            ctx.strokeStyle = 'rgba(107,107,128,0.7)';
            ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
            ctx.beginPath();
            ctx.moveTo(((entries.length-1)/totalPts)*W, yPos(entries[entries.length-1].sgv));
            predicted.forEach(function(v, i) {
                ctx.lineTo(((entries.length+i)/totalPts)*W, yPos(v));
            });
            ctx.stroke(); ctx.setLineDash([]);
        }

    } catch(e) { console.error('chart:', e); }
}


// ─── TIR Bar helper ────────────────────────────────────────────
function bar(pct, color, label) {
    var w = Math.min(100, Math.max(2, parseFloat(pct)));
    return "<div style='font-size:11px;color:#888;margin-bottom:2px'>" + label + "</div>" +
           "<div style='background:#1a1a28;border-radius:4px;height:8px;margin-bottom:8px'>" +
           "<div style='background:" + color + ";width:" + w + "%;height:100%;border-radius:4px'></div></div>";
}


// ─── Generate Report ──────────────────────────────────────────
async function generateReport(days) {
    showPopup("📊 מייצר דוח ל-" + days + " ימים...", '<div style="text-align:center;padding:20px"><span class="spinner spinner-lg"></span></div>');
    if (!nsUrl() || !nsSecret()) { showPopup("שגיאה", "אנא התחבר תחילה."); return; }

    var from = new Date(Date.now() - days * 86400000).toISOString();
    try {
        var results = await Promise.all([
            nsGet('/api/v1/entries.json?find[dateString][$gte]=' + from + '&count=5000'),
            nsGet('/api/v1/treatments.json?find[created_at][$gte]=' + from + '&count=2000'),
            nsGet('/api/v1/profile.json')
        ]);
        var entries = results[0].ok ? await results[0].json() : [];
        var treats  = results[1].ok ? await results[1].json() : [];
        var profRaw = results[2].ok ? await results[2].json() : [];
        var profD   = Array.isArray(profRaw) ? profRaw[0] : profRaw;
        var store   = (profD && profD.store) ? profD.store[profD.defaultProfile || Object.keys(profD.store)[0]] : null;

        if (!entries.length) { showPopup("אין נתונים", "לא נמצאו קריאות סוכר לתקופה זו."); return; }

        var sgvs = entries.map(function(e){ return e.sgv; }).filter(Boolean);
        var avg  = sgvs.reduce(function(a,b){return a+b;},0) / sgvs.length;
        var gmi  = (3.31 + 0.02392 * avg).toFixed(1);
        var sd   = Math.sqrt(sgvs.reduce(function(a,b){return a+Math.pow(b-avg,2);},0)/sgvs.length).toFixed(0);
        var cv   = ((parseFloat(sd)/avg)*100).toFixed(0);
        var tir  = (sgvs.filter(function(v){return v>=70&&v<=180;}).length/sgvs.length*100).toFixed(1);
        var tirT = (sgvs.filter(function(v){return v>180&&v<=250;}).length/sgvs.length*100).toFixed(1);
        var tirH = (sgvs.filter(function(v){return v>250;}).length/sgvs.length*100).toFixed(1);
        var tirL = (sgvs.filter(function(v){return v>=54&&v<70;}).length/sgvs.length*100).toFixed(1);
        var tirVL= (sgvs.filter(function(v){return v<54;}).length/sgvs.length*100).toFixed(1);

        var hourBuckets = Array.from({length:24}, function(){ return []; });
        entries.forEach(function(e){
            if (e.sgv) hourBuckets[new Date(e.dateString||e.date).getHours()].push(e.sgv);
        });
        var hourStats = hourBuckets.map(function(arr, h){
            if (!arr.length) return null;
            var m = arr.reduce(function(a,b){return a+b;},0)/arr.length;
            return { h:h, avg:Math.round(m),
                     low:(arr.filter(function(v){return v<70;}).length/arr.length*100).toFixed(0),
                     high:(arr.filter(function(v){return v>180;}).length/arr.length*100).toFixed(0) };
        });
        var highHours = hourStats.filter(function(s){ return s && parseFloat(s.high) > 30; });
        var lowHours  = hourStats.filter(function(s){ return s && parseFloat(s.low)  > 10; });

        var meals = treats.filter(function(t){ return t.carbs > 0; });
        var postSpikes = [];
        meals.forEach(function(m){
            var mt = new Date(m.created_at).getTime();
            var post2h = entries.filter(function(e){
                var dt = new Date(e.dateString||e.date).getTime() - mt;
                return dt > 60*60000 && dt < 2.5*3600000;
            }).map(function(e){ return e.sgv; });
            if (post2h.length) postSpikes.push(Math.max.apply(null, post2h));
        });
        var avgSpike = postSpikes.length ? (postSpikes.reduce(function(a,b){return a+b;},0)/postSpikes.length).toFixed(0) : null;

        // בזאלי
        var basalRecs = [];
        if (store && store.basal) {
            store.basal.forEach(function(b, i){
                var nextB  = store.basal[i+1];
                var startH = parseInt((b.time||'0:0').split(':')[0]);
                var endH   = nextB ? parseInt(nextB.time.split(':')[0]) : 24;
                var bucket = [];
                for (var h = startH; h < endH; h++) if (hourStats[h]) bucket.push(hourStats[h]);
                if (!bucket.length) return;
                var avgBG = bucket.reduce(function(a,s){return a+s.avg;},0)/bucket.length;
                var rec = null;
                if      (avgBG > 180) rec = "⬆️ בזאלי " + b.time + ": " + b.value + " → <b>" + basalUp(b.value) + " U/hr</b>";
                else if (avgBG < 80)  rec = "⬇️ בזאלי " + b.time + ": " + b.value + " → <b>" + basalDown(b.value) + " U/hr</b>";
                if (rec && basalRecs.length < 3) basalRecs.push(rec);
            });
        }

        var crRecs = [], isfRecs = [];
        var profCR = store ? parseFloat(profileValueAt(store.carbratio||store.carbRatio||store.ic, 12)||15) : 15;
        if (avgSpike && parseFloat(avgSpike) > 200) crRecs.push("📈 שיא ממוצע " + avgSpike + " — שקול CR ⬇️ " + profCR + " → " + (profCR-1).toFixed(0) + " g/U");
        if (avgSpike && parseFloat(avgSpike) < 120) crRecs.push("📉 שיאים נמוכים " + avgSpike + " — שקול CR ⬆️ " + profCR + " → " + (profCR+1).toFixed(0) + " g/U");
        var profISF = store ? parseFloat(profileValueAt(store.sens||store.sensitivity, 12)||120) : 120;
        if (parseFloat(tirH) > 20)  isfRecs.push("🎯 " + tirH + "% מעל 180 — שקול ISF ⬇️ " + profISF + " → " + (Math.round(profISF*0.9/5)*5));
        if (parseFloat(tirL)+parseFloat(tirVL) > 5) isfRecs.push("⚠️ " + (parseFloat(tirL)+parseFloat(tirVL)).toFixed(1) + "% מתחת 70 — שקול ISF ⬆️ " + profISF + " → " + (Math.round(profISF*1.1/5)*5));

        var r = "<div style='background:#0a0a14;border-radius:10px;padding:14px;margin-bottom:14px'>" +
            "<b style='color:var(--blue)'>📊 סיכום " + days + " ימים</b><br><br>" +
            "• ממוצע: <b>" + avg.toFixed(0) + " mg/dL</b><br>" +
            "• GMI: <b>" + gmi + "%</b><br>" +
            "• SD: <b>" + sd + "</b> | CV: <b>" + cv + "%</b>" + (parseFloat(cv)<36?" ✅":" ⚠️") + "<br>" +
            "• קריאות: " + sgvs.length + "</div>";

        r += "<div style='background:#0a0a14;border-radius:10px;padding:14px;margin-bottom:14px'>" +
            "<b>🎯 TIR</b><br><br>" +
            bar(tir,  "#10b981","70–180 (מטרה >70%)") + tir + "%<br>" +
            bar(tirT, "#f59e0b","181–250") + tirT + "%<br>" +
            bar(tirH, "#ef4444",">250")    + tirH + "%<br>" +
            bar(tirL, "#f97316","54–69")   + tirL + "%<br>" +
            bar(tirVL,"#dc2626","<54")     + tirVL + "%</div>";

        if (highHours.length || lowHours.length) {
            r += "<div style='background:#0a0a14;border-radius:10px;padding:14px;margin-bottom:14px'><b>🕐 שעות בעייתיות</b><br><br>";
            if (highHours.length) r += "📈 " + highHours.map(function(s){return s.h+":00 ("+s.high+"% גבוה)";}).join(", ") + "<br>";
            if (lowHours.length)  r += "📉 " + lowHours.map(function(s){ return s.h+":00 ("+s.low+"% נמוך)"; }).join(", ");
            r += "</div>";
        }

        var allRecs = basalRecs.concat(crRecs).concat(isfRecs);
        if (allRecs.length) {
            r += "<div style='background:rgba(59,130,246,0.08);border:1px solid var(--blue-dim);border-radius:10px;padding:14px;margin-bottom:14px'>" +
                 "<b>💡 המלצות</b><br><br>" + allRecs.join("<br>") + "</div>";
        } else {
            r += "<div style='background:rgba(16,185,129,0.08);border:1px solid #10b981;border-radius:10px;padding:12px;margin-bottom:14px'>✅ <b>הגדרות נראות טובות</b> לתקופה זו.</div>";
        }

        r += "<small style='color:#555'>⚕️ ניתוח עזר בלבד — לא תחליף לשיקול רפואי.</small>";
        showPopup("📊 דוח " + days + " ימים", r);

    } catch(e) { showPopup("שגיאה", "לא ניתן להפיק דוח: " + e.message); }
}


// ─── Logs ─────────────────────────────────────────────────────
var _allLogs = [];

async function loadLogs(filter) {
    var listEl  = document.getElementById('logs-list');
    var statsEl = document.getElementById('logs-stats');
    if (!listEl) return;
    listEl.innerHTML = "<div class='loading-center'><span class='spinner'></span></div>";

    try {
        var mem  = await loadMemory();
        var logs = [];

        Object.keys(mem).forEach(function(k) {
            var v = mem[k].value;
            if (!v) return;
            if (k.startsWith('food_') && v.outcomes) {
                v.outcomes.forEach(function(o){
                    logs.push({ type:'food', name:k.replace('food_','').replace(/_/g,' '),
                        date:o.date, carbs:o.carbs, insulin:o.insulin,
                        sgv2h:o.sgv2h, outcome:o.outcome });
                });
            }
            if (k.startsWith('rescue_') && !k.includes('_result')) {
                var res2 = mem[k+'_result'] ? mem[k+'_result'].value : null;
                logs.push({ type:'rescue', name:'חילוץ', date:v.date,
                    carbs:v.carbs, sgvBefore:v.sgvAtRescue,
                    outcome: res2 ? res2.outcome : 'pending' });
            }
            if (k.startsWith('sport_') && v.sessions) {
                v.sessions.forEach(function(s){
                    logs.push({ type:'sport', name:k.replace('sport_','').replace(/_/g,' '),
                        date:s.date, intensity:s.intensity, outcome:s.outcome });
                });
            }
        });

        logs.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
        _allLogs = logs;

        var filtered = filter === 'all' ? logs : logs.filter(function(l){ return l.type === filter; });

        var foods   = logs.filter(function(l){return l.type==='food';});
        var good    = foods.filter(function(l){return l.outcome==='good';}).length;
        var highL   = foods.filter(function(l){return l.outcome==='high';}).length;
        var lowL    = foods.filter(function(l){return l.outcome==='low';}).length;
        var rescues = logs.filter(function(l){return l.type==='rescue';}).length;
        if (statsEl) statsEl.innerHTML = foods.length + " הזרקות | ✅ " + good + " | 🔴 " + highL + " | 🔵 " + lowL + " | חילוצים: " + rescues;

        renderLogs(filtered);
    } catch(e) {
        if (listEl) listEl.innerHTML = "<div style='color:#888;text-align:center;padding:16px'>שגיאה: " + e.message + "</div>";
    }
}

function renderLogs(logs) {
    var listEl = document.getElementById('logs-list');
    if (!listEl) return;
    if (!logs.length) { listEl.innerHTML = "<div class='text-center text-muted' style='padding:20px'>אין לוגים</div>"; return; }

    listEl.innerHTML = logs.map(function(l) {
        var date  = new Date(l.date).toLocaleString('he-IL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
        var color = '#888', icon = '📋', detail = '';
        if (l.type === 'food') {
            color  = l.outcome==='good'?'#10b981':l.outcome==='high'?'#ef4444':'#3b82f6';
            icon   = l.outcome==='good'?'✅':l.outcome==='high'?'🔴':'🔵';
            detail = (l.carbs||0)+'g | '+(parseFloat(l.insulin||0)).toFixed(1)+'U' + (l.sgv2h?' | 2ש\': '+l.sgv2h:'');
        } else if (l.type === 'rescue') {
            color = '#3b82f6'; icon = '🔵';
            detail = (l.carbs||0)+'g' + (l.outcome?' | '+l.outcome:'');
        } else if (l.type === 'sport') {
            color = '#f59e0b'; icon = '🏃';
            detail = (l.intensity||'') + ' | ' + (l.outcome||'');
        }
        return "<div style='background:#0a0a14;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid "+color+";display:flex;justify-content:space-between;align-items:center'>" +
            "<div><div style='font-size:13px'>"+icon+" <b>"+l.name+"</b></div>" +
            "<div style='font-size:11px;color:#888;margin-top:2px'>"+detail+"</div></div>" +
            "<div style='font-size:11px;color:#666'>"+date+"</div></div>";
    }).join('');
}

function filterLogs() {
    var q = (document.getElementById('logs-search')||{}).value || '';
    renderLogs(_allLogs.filter(function(l){
        return l.name.toLowerCase().includes(q.toLowerCase()) || (l.outcome||'').includes(q);
    }));
}

function exportLogs() {
    if (!_allLogs.length) { alert('אין לוגים לייצוא'); return; }
    var header = 'תאריך,סוג,שם,פחמימות,אינסולין,סוכר2ש,תוצאה\n';
    var rows   = _allLogs.map(function(l){
        return [new Date(l.date).toLocaleString('he-IL'),
                l.type, l.name, l.carbs||'',
                parseFloat(l.insulin||0).toFixed(2),
                l.sgv2h||'', l.outcome||''].join(',');
    }).join('\n');
    var blob = new Blob(['\uFEFF'+header+rows], {type:'text/csv;charset=utf-8'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url; a.download = 'loopie_logs_' + new Date().toISOString().substring(0,10) + '.csv';
    a.click(); URL.revokeObjectURL(url);
}


// ─── Memory History ───────────────────────────────────────────
async function showMemoryHistory() {
    showPopup("🧠 זיכרון", '<div class="loading-center"><span class="spinner spinner-md"></span></div>');
    try {
        var mem  = await loadMemory();
        var keys = Object.keys(mem).filter(function(k){ return k.startsWith('food_'); });
        if (!keys.length) {
            showPopup("🧠 זיכרון", "אין עדיין נתונים שמורים.<br><br>לאחר כל הזרקה, רשום תוצאה ו-Loopie ילמד.");
            return;
        }

        var html = "<div style='font-size:12px;color:#888;margin-bottom:12px'>זיכרון מקומי</div>";
        html += "<b style='color:var(--blue)'>🍽️ מאכלים (" + keys.length + ")</b><br>";

        keys.forEach(function(k) {
            var name     = k.replace('food_','').replace(/_/g,' ');
            var data     = mem[k].value || {};
            var outcomes = data.outcomes || [];
            if (!outcomes.length) return;
            var n    = outcomes.length;
            var good = outcomes.filter(function(o){ return o.outcome==='good'; }).length;
            var high = outcomes.filter(function(o){ return o.outcome==='high'; }).length;
            var low  = outcomes.filter(function(o){ return o.outcome==='low';  }).length;
            var avgI = (outcomes.reduce(function(a,o){return a+(parseFloat(o.insulin)||0);},0)/n).toFixed(1);
            var col  = good/n > 0.6 ? '#10b981' : high/n > 0.4 ? '#ef4444' : '#f59e0b';
            html += "<div style='background:#0a0a14;border-radius:10px;padding:10px;margin-bottom:8px;border-right:3px solid "+col+"'>" +
                "<b>" + name + "</b> <span style='font-size:11px;color:#888'>" + n + " הזרקות</span><br>" +
                "<small style='color:#aaa'>💉 ממוצע: "+avgI+"U | ✅ "+good+" 🔴 "+high+" 🔵 "+low+"</small></div>";
        });

        showPopup("🧠 זיכרון (" + keys.length + " מאכלים)", html);
    } catch(e) {
        showPopup("🧠 זיכרון", "שגיאה: " + e.message);
    }
}


// ─── Profile Render ───────────────────────────────────────────
function renderProfile() {
    var viewEl = document.getElementById('profile-view');
    if (!viewEl) return;
    var prof = fullHistory && fullHistory.profile;
    var dev  = fullHistory && fullHistory.devStatus;
    var nowH = new Date().getHours();

    if (!prof) { viewEl.innerHTML = "<div class='text-muted text-sm'>אין נתוני פרופיל. התחבר ל-NS תחילה.</div>"; return; }

    var cr  = profileValueAt(prof.carbratio || prof.carbRatio || prof.ic, nowH) || '?';
    var isf = profileValueAt(prof.sens || prof.sensitivity, nowH) || '?';
    var bas = profileValueAt(prof.basal, nowH) || '?';
    var tgt = prof.target_low && prof.target_high
        ? (profileValueAt(prof.target_low, nowH) + '–' + profileValueAt(prof.target_high, nowH))
        : '?';

    viewEl.innerHTML =
        "<div class='panel panel-dark'>" +
        "<div class='profile-row'><span>יחס פחמימות (CR)</span><span>1U / " + cr + "g</span></div>" +
        "<div class='profile-row'><span>רגישות (ISF)</span><span>" + isf + " mg/dL/U</span></div>" +
        "<div class='profile-row'><span>בזאלי כרגע</span><span>" + bas + " U/ש'</span></div>" +
        "<div class='profile-row'><span>יעד סוכר</span><span>" + tgt + " mg/dL</span></div>" +
        "<div class='profile-row'><span>אינסולין</span><span>" + getInsulinProfile().label + "</span></div>" +
        "</div>";
}


// ─── Startup: restore saved NS credentials ───────────────────
(function() {
    var savedUrl    = localStorage.getItem('loopie_ns_url');
    var savedSecret = localStorage.getItem('loopie_ns_secret');
    if (savedUrl)    { var nu = document.getElementById('nsUrl');    if(nu) nu.value = savedUrl; }
    if (savedSecret) { var as = document.getElementById('apiSecret'); if(as) as.value = savedSecret; }
    var savedEmail = localStorage.getItem('loopie_email');
    if (savedEmail) { var em = document.getElementById('user-email'); if(em) em.value = savedEmail; }
    var savedKw = localStorage.getItem('loopie_keywords');
    if (savedKw) { var kw = document.getElementById('activity-keywords'); if(kw) kw.value = savedKw; }
})();
