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
    var q     = (input ? input.value : '').trim();
    var ql    = q.toLowerCase().trim();
    if (!q) return;
    if (input) input.value = '';

    // ══════════════════════════════════════════════════════
    // 1. פקודות נתונים מקומיות — TIER 1 (תמיד ראשון)
    // ══════════════════════════════════════════════════════

    // ── ציוד / פוד / חיישן ──
    if (/^(ציוד|חיישן|פוד|pod|סנסור|גיל פוד|גיל חיישן|החלפ)/.test(ql)) {
        await showEquipmentStatus(); return;
    }

    // ── סטטוס כללי ──
    if (/^(מה המצב|סטטוס|status|מה קורה)$/.test(ql)) {
        var sgv=nsData.currentSgv||0;
        showPopup('🛡️ סטטוס נוכחי',
            "<div style='font-size:14px;line-height:1.9;text-align:right'>" +
            "🩸 סוכר: <b>"+sgv+"</b> "+(nsData.trend||'')+"<br>" +
            "💉 IOB: <b>"+(parseFloat(nsData.iob)||0).toFixed(2)+"U</b><br>" +
            "🍞 COB: <b>"+(parseFloat(nsData.cob)||0).toFixed(0)+"g</b><br>" +
            "⏱ בזאלי: <b>"+(nsData.basal||0)+" U/ש'</b>" +
            (nsData.overrideActive?"<br>🔄 Override: <b style='color:#f59e0b'>"+nsData.overrideName+"</b>":"") +
            "</div>"); return;
    }

    // ── IOB ──
    if (/^(iob|אינסולין פעיל|איוב)$/.test(ql)) {
        showPopup('💉 IOB',
            "<div style='text-align:center;font-size:32px;font-weight:700;color:#3b82f6;padding:16px'>" +
            (parseFloat(nsData.iob)||0).toFixed(2)+"U</div>"); return;
    }

    // ── COB ──
    if (/^(cob|פחמימות פעילות|כוב)$/.test(ql)) {
        showPopup('🍞 COB',
            "<div style='text-align:center;font-size:32px;font-weight:700;color:#f59e0b;padding:16px'>" +
            (parseFloat(nsData.cob)||0).toFixed(0)+"g</div>"); return;
    }

    // ── בזאלי ──
    if (/^(בזאלי|בזאל|תוכנית בזאלית)$/.test(ql)) {
        var prof=fullHistory&&fullHistory.profile, basalNow=nsData.basal||0;
        var basalArr=prof&&Array.isArray(prof.basal)?prof.basal:null;
        var toMin=function(t){var p=t.split(':');return parseInt(p[0])*60+parseInt(p[1]||0);};
        var rows=basalArr
            ?basalArr.map(function(b,i){var nx=basalArr[i+1]?basalArr[i+1].time:'24:00';return '• '+b.time+'–'+nx+': <b>'+b.value+" U/ש'</b>";}).join('<br>')
            :"• 00:00–24:00: <b>"+basalNow+" U/ש'</b>";
        var total=0;
        if(basalArr)basalArr.forEach(function(b,i){var nx=basalArr[i+1]||{time:'24:00'};total+=b.value*(toMin(nx.time)-toMin(b.time))/60;});
        else total=basalNow*24;
        showPopup('⏳ בזאלי',
            "<div style='font-size:14px;line-height:1.8;text-align:right'>" +
            "⏳ כרגע: <b>"+basalNow+" U/ש'</b><br>" +
            "📊 יומי: <b style='color:#3b82f6;font-size:18px'>"+total.toFixed(2)+"U</b><br><br>" +
            "<b>תוכנית:</b><br>"+rows+"</div>"); return;
    }

    // ── CR ──
    if (/^(cr|icr|יחס פחמימות)$/.test(ql)) {
        var p=fullHistory&&fullHistory.profile, h=new Date().getHours();
        var crV=p?parseFloat(profileValueAt(p.carbratio||p.carbRatio||p.ic,h)||15):15;
        var crArr=p&&Array.isArray(p.carbratio||p.carbRatio||p.ic)?(p.carbratio||p.carbRatio||p.ic):null;
        var crRows=crArr?crArr.map(function(b,i){var nx=crArr[i+1]?crArr[i+1].time:'24:00';var cur=parseInt((b.time||'0').split(':')[0])<=h&&(!crArr[i+1]||parseInt(crArr[i+1].time.split(':')[0])>h);return "<span style='"+(cur?'color:#10b981;font-weight:700':'color:#aaa')+"'>• "+b.time+'–'+nx+': 1U / <b>'+b.value+"g</b></span>";}).join('<br>'):"• כל היום: 1U / <b>"+crV+"g</b>";
        showPopup('📊 CR',"<div style='font-size:14px;line-height:1.8;text-align:right'>כרגע: 1U / <span style='font-size:22px;color:#10b981;font-weight:700'>"+crV+"g</span><br><br>"+crRows+"</div>"); return;
    }

    // ── ISF ──
    if (/^(isf|רגישות|מדד רגישות)$/.test(ql)) {
        var p2=fullHistory&&fullHistory.profile, h2=new Date().getHours();
        var isfV=p2?parseFloat(profileValueAt(p2.sens||p2.sensitivity,h2)||120):120;
        var isfArr=p2&&Array.isArray(p2.sens||p2.sensitivity)?(p2.sens||p2.sensitivity):null;
        var isfRows=isfArr?isfArr.map(function(b,i){var nx=isfArr[i+1]?isfArr[i+1].time:'24:00';var cur=parseInt((b.time||'0').split(':')[0])<=h2&&(!isfArr[i+1]||parseInt(isfArr[i+1].time.split(':')[0])>h2);return "<span style='"+(cur?'color:#f59e0b;font-weight:700':'color:#aaa')+"'>• "+b.time+'–'+nx+': <b>'+b.value+" mg/dL/U</b></span>";}).join('<br>'):"• כל היום: <b>"+isfV+" mg/dL/U</b>";
        showPopup('🎯 ISF',"<div style='font-size:14px;line-height:1.8;text-align:right'>כרגע: <span style='font-size:22px;color:#f59e0b;font-weight:700'>"+isfV+"</span> mg/dL/U<br><br>"+isfRows+"</div>"); return;
    }

    // ── SMB ──
    if (/^(smb|מיקרובולוס|סמב)$/.test(ql)) {
        showPopup('💉 SMB',"<div style='text-align:center;padding:16px'><span class='spinner'></span></div>");
        (async function(){
            try {
                var since2h=new Date(Date.now()-2*3600000).toISOString();
                var res=await nsGet('/api/v1/treatments.json?find[created_at][$gte]='+since2h+'&count=50');
                if(!res.ok)throw new Error('NS error');
                var treats=await res.json();
                var smbs=treats.filter(function(t){var ev=(t.eventType||'').toLowerCase();var ins=parseFloat(t.insulin||0);return ev.includes('smb')||ev.includes('microbolus')||(ins>0&&ins<0.5&&!t.carbs);});
                if(!smbs.length){showPopup('💉 SMB',"לא נמצאו SMB ב-2 שעות האחרונות.");return;}
                var total=smbs.reduce(function(s,t){return s+parseFloat(t.insulin||0);},0);
                var html="<div style='font-size:13px;text-align:right'><div style='margin-bottom:8px;color:#888'>סה\"כ "+smbs.length+" SMB — <b style='color:#3b82f6'>"+total.toFixed(2)+"U</b></div>";
                smbs.slice(0,8).forEach(function(t){var ma=Math.round((Date.now()-new Date(t.created_at).getTime())/60000);html+="<div style='background:#0a0a14;border-radius:8px;padding:7px 10px;margin-bottom:5px;display:flex;justify-content:space-between'><span>💉 <b>"+parseFloat(t.insulin||0).toFixed(2)+"U</b></span><span style='color:#888'>לפני "+ma+" דק'</span></div>";});
                showPopup('💉 SMB',html+"</div>");
            }catch(e){showPopup('💉 SMB','שגיאה: '+e.message);}
        })(); return;
    }

    // ── Override ──
    if (/^(override|אוברריד|החרגה|תוכנית ספורט|מה ה.?override|מה האוברריד)$/.test(ql)) {
        var raw=nsData._overrideRaw;
        if(nsData.overrideActive&&raw){
            var pct=raw.multiplier?Math.round(raw.multiplier*100):null;
            var tgt=raw.currentCorrectionRange?raw.currentCorrectionRange.minValue+'–'+raw.currentCorrectionRange.maxValue+' mg/dL':null;
            var dur=raw.duration?Math.round(raw.duration/60)+" דק'":null;

            var html2="<div style='font-size:14px;line-height:2;text-align:right'>" +
                "<div style='background:rgba(245,158,11,0.12);border:1px solid #f59e0b;border-radius:8px;padding:10px;margin-bottom:10px'>" +
                "🟢 <b style='color:#f59e0b;font-size:15px'>"+(raw.symbol||'')+" "+(raw.name||'Override פעיל')+"</b></div>" +
                (pct?"⚡ עוצמה: <span style='color:"+(pct<100?'#3b82f6':'#ef4444')+";font-size:18px;font-weight:700'>"+pct+"%</span><br>":"")+
                (tgt?"🎯 יעד: "+tgt+"<br>":"")+(dur?"⏳ משך: "+dur+"<br>":"")+"</div>";
            showPopup('🔄 Override פעיל',html2);
        } else {
            showPopup('🔄 Override',"<div style='text-align:right;font-size:14px'>⚪ אין Override פעיל.</div>");
        } return;
    }

    // ── מה אכלתי / ארוחות אחרונות ──
    if (/^(מה אכלתי|ארוחות|ארוחות אחרונות|ארוחה אחרונה|היסטוריה)$/.test(ql) || ql.includes('אכלתי')) {
        showPopup('🍽️ ארוחות',"<div style='text-align:center;padding:16px'><span class='spinner'></span></div>");
        (async function(){
            try{
                var since6h=new Date(Date.now()-6*3600000).toISOString();
                var res=await nsGet('/api/v1/treatments.json?find[created_at][$gte]='+since6h+'&count=30');
                if(!res.ok)throw new Error('NS error');
                var treats=await res.json();
                var meals=treats.filter(function(t){return t.carbs&&parseFloat(t.carbs)>0;}).slice(0,3);
                if(!meals.length){showPopup('🍽️ ארוחות',"לא נמצאו ארוחות ב-6 שעות האחרונות.");return;}
                var html3="<div style='font-size:13px;text-align:right'>";
                meals.forEach(function(m){
                    var ma=Math.round((Date.now()-new Date(m.created_at).getTime())/60000);
                    var ha=(ma/60).toFixed(1);
                    var ts=new Date(m.created_at).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false});
                    var c=parseFloat(m.carbs||0), ins=parseFloat(m.insulin||0);
                    var nm=m.notes||m.foodType||'ארוחה';
                    var dia=300, abs=Math.min(100,Math.round((ma/dia)*100)), rem=Math.max(0,100-abs);
                    var iobEst=ins>0?(ins*rem/100).toFixed(2):null;
                    var col=ma<60?'#f59e0b':ma<180?'#3b82f6':'#10b981';
                    var bar="<div style='background:#1a1a28;border-radius:4px;height:5px;margin:3px 0'><div style='background:"+col+";width:"+abs+"%;height:100%;border-radius:4px'></div></div>";
                    html3+="<div style='background:#0a0a14;border-radius:8px;padding:10px;margin-bottom:8px;border-right:3px solid "+col+"'>" +
                        "<div style='display:flex;justify-content:space-between'><b>"+nm+"</b><span style='color:#888;font-size:11px'>"+ts+" ("+(ma<60?ma+" דק'":ha+" ש'")+") </span></div>" +
                        "🍞 <b>"+c+"g</b>"+(ins>0?" | 💉 <b>"+ins.toFixed(1)+"U</b>":"")+bar+
                        "ספיגה: <b>"+abs+"%</b>"+(iobEst&&parseFloat(iobEst)>0.05?" | ⏳ IOB: <b style='color:#3b82f6'>"+iobEst+"U</b>":"")+"</div>";
                });
                showPopup('🍽️ '+meals.length+' ארוחות אחרונות',html3+"</div>");
            }catch(e){showPopup('🍽️ שגיאה',e.message);}
        })(); return;
    }

    // ══════════════════════════════════════════════════════
    // 2. ניהול חוגים — TIER 2
    // ══════════════════════════════════════════════════════
    var isActivityReq = /הוסף|הכנס|צור|שנה|עדכן|ערוך|מחק|הסר/i.test(q) &&
                        /חוג|אימון|שיעור|פעילות|mma|כדורגל|כדורסל|שחייה|ריצה|צופים|קראטה|כושר|אופניים|יוגה|פילאטיס|הליכה/i.test(q);
    if (isActivityReq) {
        var localAct = _parseActivityLocally(q);
        if (localAct) { _handleActivityObj(localAct, q); return; }
        // fallback → Gemini
        var actResp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiKey(), {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ contents:[{role:"user",parts:[{text:q}]}], systemInstruction:{parts:[{text:buildGeminiPrompt(buildNSContext(),'act').split('פורמט פלט')[0]+"פורמט: JSON בלבד: {action,name,day,startTime,endTime,intensity}. ימים: ראשון–שבת."}]}, generationConfig:{maxOutputTokens:150,temperature:0.0} })
        });
        if (actResp.ok) {
            var actData = await actResp.json();
            var actText = ((actData.candidates[0].content.parts[0].text)||'').trim().replace(/```json|```/g,'').trim();
            var jm = actText.match(/\{[\s\S]*?\}/);
            if (jm) { try { _processUpdateRoutine(JSON.parse(jm[0]), q); } catch(e){} }
            else showPopup('❓', actText||"לא הצלחתי לפרסר. נסה: 'הוסף חוג MMA יום שלישי 17:00-18:30'");
        }
        return;
    }

    // ══════════════════════════════════════════════════════
    // 3. זיהוי אוכל → triggerLoopieAI — TIER 3
    // ══════════════════════════════════════════════════════
    var FOOD_RX = /פיתה|לחם|אורז|פסטה|פיצה|המבורגר|שניצל|עוף|בשר|דג|סלט|ביצ|קינוח|עוגה|עוגיה|שוקולד|גלידה|פרי|בננה|תפוח|ענב|תמר|אבטיח|מלון|תפוז|חומוס|טחינה|פלאפל|שווארמה|בורגר|כריך|טוסט|קרואסון|בייגל|לחמנייה|פופקורן|אגוז|שקד|וופל|פנקייק|קציצ|ספגטי|לזניה|קוסקוס|בורקס|מאפה|שוקו|מיץ|קולה|גבינה|יוגורט|חלב|דגני|קוואקר|מוזלי|גרנולה|חביתה|שקשוקה|חלה|ריזוטו|עדשים|שעועית|תירס|קינואה|טופו|אוכל|ארוחה|מנה|נשנוש|חטיף/i;
    var QUESTION_RX = /^(כמה|מה|האם|למה|מתי|איך|כדאי|עדיף|תסביר|ספר|תן לי|הסבר)/i;
    var isFood     = FOOD_RX.test(q) && !QUESTION_RX.test(q);
    var detectFood = !isFood ? detectFoodName(q) : null;
    if (isFood || (detectFood && findFood(detectFood))) {
        triggerLoopieAI(q); return;
    }

    // ══════════════════════════════════════════════════════
    // 4. כל שאר → Gemini Advisor
    // ══════════════════════════════════════════════════════
    askGeminiAdvisor(q);
}


async function askGeminiAdvisor(userQuestion) {
    if (!userQuestion || !userQuestion.trim()) return;

    try {
        var ctx = buildNSContext();

        // העשר context עם היסטוריית מאכל ספציפי
        var detectedFood = (typeof detectFoodName === 'function') ? detectFoodName(userQuestion) : null;
        if (detectedFood) {
            ctx.foodHistory = fetchFoodHistory(detectedFood);
            ctx.foodName    = detectedFood;
        }

        // הוסף לוז חוגים לcontext
        if (typeof ACTIVITIES !== 'undefined' && ACTIVITIES.length) {
            var dayN2 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
            var nowDay = new Date().getDay(), nowH2 = new Date().getHours(), nowM2 = new Date().getMinutes();
            ctx._scheduleStr = ACTIVITIES.map(function(a) {
                var line = a.name + ' יום ' + dayN2[a.day] + ' ' + a.from + '-' + a.to;
                if (a.day === nowDay) {
                    var fp = a.from.split(':'), diff = (parseInt(fp[0])*60+parseInt(fp[1])) - (nowH2*60+nowM2);
                    if (diff > 0 && diff < 300)  line += ' (בעוד ' + diff + ' דק!)';
                    else if (diff <= 0 && diff > -120) line += ' (פעיל עכשיו!)';
                }
                return line;
            }).join(' | ');
        }

        // בנה prompt
        var prompt = buildGeminiPrompt(ctx, userQuestion);
        if (ctx._scheduleStr) prompt += "\nלו\"ז:" + ctx._scheduleStr;

        // ערכי פרופיל נוכחיים
        var nowHD = new Date().getHours(), profD = fullHistory && fullHistory.profile;
        var currentCR  = profD ? parseFloat(profileValueAt(profD.carbratio||profD.carbRatio||profD.ic, nowHD)||15) : (nsData.cr||15);
        var currentISF = profD ? parseFloat(profileValueAt(profD.sens||profD.sensitivity, nowHD)||120) : (nsData.isf||120);

        // System prompt — טיפולי + ייעוץ
        var sysPrompt = buildGeminiSystemPrompt(currentCR, currentISF, ctx);

        // אם תמונה מחכה — שלח ל-vision
        if (_pendingImageB64) {
            var imgMsg = {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: _pendingImageType, data: _pendingImageB64 } },
                    { text: userQuestion || 'כמה פחמימות? תחיל חוק ה-3.' }
                ]
            };
            closePopup();
            showPopup('📷 LOOPIE Vision', "<div style='text-align:center;padding:20px;color:#888'>מנתח תמונה... 🧠</div>");
            _clearImage();
            var vRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey(), {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ contents:[imgMsg], systemInstruction:{parts:[{text:sysPrompt}]}, generationConfig:{maxOutputTokens:1024,temperature:0.2} })
            });
            if (vRes.ok) {
                var vData = await vRes.json();
                var vText = ((vData.candidates||[])[0]||{}).content?.parts?.[0]?.text || 'לא הצלחתי לנתח.';
                showPopup('📷 LOOPIE Vision', "<div style='font-size:14px;line-height:1.75;text-align:right;direction:rtl'>" + vText.replace(/\n/g,'<br>') + "</div>");
            }
            return;
        }

        // Streaming
        closePopup();
        var streamHtml = "<div id='gemini-stream' style='font-size:14px;line-height:1.7;text-align:right;white-space:pre-line;direction:rtl'>מנתח... ⏳</div>" +
                         "<small style='color:#555'>Gemini 2.5 | " + new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false}) + "</small>";
        showPopup('🧠 Loopie', streamHtml);

        var streamRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=' + geminiKey(), {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                contents: [{role:'user', parts:[{text:prompt}]}],
                systemInstruction: {parts:[{text:sysPrompt}]},
                generationConfig: {maxOutputTokens:1024, temperature:0.2}
            })
        });

        if (!streamRes.ok || !streamRes.body) {
            // fallback non-streaming
            var fbRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey(), {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ contents:[{role:'user',parts:[{text:prompt}]}], systemInstruction:{parts:[{text:sysPrompt}]}, generationConfig:{maxOutputTokens:1024,temperature:0.2} })
            });
            if (fbRes.ok) {
                var fbData = await fbRes.json();
                var fbText = ((fbData.candidates||[])[0]||{}).content?.parts?.[0]?.text || 'שגיאה.';
                showPopup('🧠 Loopie', "<div style='font-size:14px;line-height:1.75;text-align:right;direction:rtl'>" + fbText.replace(/\n/g,'<br>') + "</div>");
            }
            return;
        }

        var reader  = streamRes.body.getReader();
        var decoder = new TextDecoder();
        var full    = '';

        while (true) {
            var chunk = await reader.read();
            if (chunk.done) break;
            var txt = decoder.decode(chunk.value, {stream:true});
            txt.split('\n').forEach(function(line) {
                if (!line.startsWith('data: ')) return;
                var jsonStr = line.replace('data: ','').trim();
                if (!jsonStr || jsonStr === '[DONE]') return;
                try {
                    var obj = JSON.parse(jsonStr);
                    var part = ((obj.candidates||[])[0]||{}).content?.parts?.[0]?.text || '';
                    full += part;
                    var el = document.getElementById('gemini-stream');
                    if (el) el.innerHTML = full.replace(/\n/g,'<br>');
                } catch(e){}
            });
        }
    } catch(e) {
        showPopup('⚠️ שגיאה', 'שגיאת Gemini: ' + e.message);
    }
}

function buildGeminiSystemPrompt(cr, isf, ctx) {
    var timeStr = new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false});
    var ins = (ctx && ctx.insulinName) || 'Lyumjev';
    var preMeal = (ctx && ctx.insulinPreMeal != null) ? ctx.insulinPreMeal : 0;
    var timing = preMeal <= 2
        ? "הזרק 0-2 דקות לפני האכילה (" + ins + " — אינסולין מהיר מאוד)"
        : "Pre-Bolus: " + preMeal + " דקות לפני האכילה (" + ins + ")";

    return "אתה מנוע חישוב טיפולי של LOOPIE לניהול סוכרת סוג 1.\n" +
        "תפקיד: קבל שם מאכל → חשב פחמימות → החל חוק ה-3 → תן המלצה מבצעית.\n" +
        "אסור לשאול שאלות. תמיד תחשב ותמליץ מיד.\n\n" +

        "── מסד מאכלים קשיח (השתמש תמיד בערכים אלו) ──\n" +
        "פיתה=50g/3ש' | לחם פרוס=15g/3ש' | כוס פסטה=40g/4ש' | כוס אורז=45g/3ש'\n" +
        "בננה=25g/1.5ש' | תפוח=15g/1.5ש' | פיצה פרוסה=30g/4ש' | המבורגר+לחמנייה=30g/4ש'\n" +
        "שניצל מטוגן=10g/4ש' | קרואסון=25g/3ש' | בייגלה=55g/3ש' | וופל=20g/2ש'\n" +
        "עוגיה=10g/2ש' | כוס מיץ=25g/1ש' | שוקו=30g/2ש' | פתיבר=7.5g/1ש'\n" +
        "ג'חנון 100g=50g/5ש' | מלאווח=40g/4ש' | בורקס=25g/3ש' | חביתה=2g/1ש'\n" +
        "מאכל לא ברשימה → הערך הגיוני + ספיגה=3ש' כברירת מחדל.\n\n" +

        "── ערכי פרופיל עכשיו (" + timeStr + ") ──\n" +
        "CR = 1U / " + cr.toFixed(1) + "g | ISF = " + isf + " mg/dL/U\n\n" +

        "── חוק ה-3 (חובה על כל מאכל) ──\n" +
        "70% מהפחמימות → הצהרה מיידית באייפון עכשיו.\n" +
        "30% מהפחמימות → חוב; תזכורת אם סוכר > 150 בעוד ~2ש'.\n" +
        "מאכל שומני (ספיגה>3.5ש'): 60% עכשיו + 40% בעוד 90 דק'.\n\n" +

        "── תזמון הזרקה ──\n" +
        timing + "\n\n" +

        "── גורמים מיוחדים ──\n" +
        "Override פעיל → הכפל במכפיל. ספורט פעיל → הפחת לפי עצימות.\n" +
        "אחרי ספורט → ×0.70-0.80. לילה (22-06) → ×0.85. dawn (05-08) → ×1.10.\n\n" +

        "── פורמט פלט חובה (5 שורות בדיוק, ללא שאלות, ללא משפטי פתיחה) ──\n" +
        "🍏 [מאכל]: [X]g | ⏱️ ספיגה: [N]ש'\n" +
        "🎯 LOOPIE: [N]U עכשיו[אם שומני: + [M]U בעוד 90 דק']\n" +
        "📊 חוק ה-3: הזן [Y]g (70%) באייפון עכשיו\n" +
        "⏳ " + timing + "\n" +
        "🛡️ חוב: [Z]g (30%) — תזכורת אם סוכר > 150";
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
    showPopup("🧠 היסטוריית הזרקות", '<div class="loading-center"><span class="spinner spinner-md"></span></div>');
    try {
        // שלוף treatments מ-NS — 7 ימים אחרונים
        var since7d = new Date(Date.now() - 7*86400000).toISOString();
        var [treatRes, entRes] = await Promise.all([
            nsGet('/api/v1/treatments.json?find[created_at][$gte]=' + since7d + '&count=100'),
            nsGet('/api/v1/entries.json?find[dateString][$gte]=' + since7d + '&count=1000')
        ]);

        if (!treatRes.ok) throw new Error('NS error');
        var treats  = await treatRes.json();
        var entries = entRes.ok ? await entRes.json() : [];

        // רק treatments עם פחמימות (ארוחות) + הזרקה
        var meals = treats.filter(function(t){
            return t.carbs && parseFloat(t.carbs) > 0;
        });

        if (!meals.length) {
            showPopup("🧠 היסטוריית הזרקות",
                "<div style='text-align:right;font-size:13px;line-height:1.8'>" +
                "לא נמצאו ארוחות עם פחמימות ב-7 ימים האחרונים ב-NS.<br><br>" +
                "<span style='color:#888;font-size:12px'>Loopie לומד אוטומטית מהזרקות ב-NS — אין צורך לרשום ידנית.</span></div>");
            return;
        }

        // לכל ארוחה — חשב סוכר לפני ו-2ש' אחרי מה-entries
        function sgvNear(timestamp, offsetMs, windowMs) {
            windowMs = windowMs || 15*60000;
            var target = timestamp + offsetMs;
            var best = null, bestDiff = Infinity;
            entries.forEach(function(e) {
                var t = new Date(e.dateString||e.date).getTime();
                var diff = Math.abs(t - target);
                if (diff < windowMs && diff < bestDiff) { best = e.sgv; bestDiff = diff; }
            });
            return best;
        }

        function outcomeLabel(sgv2h, sgvBefore) {
            if (!sgv2h) return { txt: '❓ אין נתון', col: '#888' };
            if (sgv2h < 70)  return { txt: '🔵 היפו', col: '#3b82f6' };
            if (sgv2h > 250) return { txt: '🔴 גבוה מאוד', col: '#ef4444' };
            if (sgv2h > 180) return { txt: '🟡 גבוה', col: '#f59e0b' };
            return { txt: '✅ בטווח', col: '#10b981' };
        }

        var html = "<div style='font-size:12px;color:#888;margin-bottom:10px'>" +
            meals.length + " ארוחות ב-7 ימים | תוצאות אוטומטיות מ-NS</div>";

        meals.forEach(function(t) {
            var mealTime = new Date(t.created_at).getTime();
            var minsAgo  = Math.round((Date.now() - mealTime) / 60000);
            var timeStr  = new Date(t.created_at).toLocaleString('he-IL',{
                day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
            });
            var carbs    = parseFloat(t.carbs || 0);
            var insulin  = parseFloat(t.insulin || 0);
            var notes    = t.notes || t.foodType || '';
            var sgvBefore = sgvNear(mealTime, 0);
            var sgv2h     = minsAgo >= 90 ? sgvNear(mealTime, 2*3600000) : null;
            var outcome   = outcomeLabel(sgv2h, sgvBefore);

            // ספיגת IOB משוערת
            var diaMin    = 300;
            var absorbed  = Math.min(100, Math.round((minsAgo / diaMin) * 100));
            var iobLeft   = insulin > 0 ? Math.max(0, insulin * (1 - absorbed/100)).toFixed(2) : null;

            html += "<div style='background:#0a0a14;border-radius:10px;padding:10px 12px;margin-bottom:8px;" +
                "border-right:3px solid " + outcome.col + "'>" +
                "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:4px'>" +
                    "<span style='font-size:13px;font-weight:700'>" + (notes || 'ארוחה') + "</span>" +
                    "<span style='font-size:11px;color:#888'>" + timeStr + "</span>" +
                "</div>" +
                "<div style='font-size:12px;color:#aaa'>" +
                    "🍞 <b>" + carbs + "g</b>" +
                    (insulin > 0 ? " | 💉 <b>" + insulin.toFixed(1) + "U</b>" : '') +
                    (sgvBefore ? " | לפני: <b>" + sgvBefore + "</b>" : '') +
                    (sgv2h     ? " | 2ש': <b>" + sgv2h + "</b>" : (minsAgo < 90 ? " | 2ש': ⏳ עוד " + (90-minsAgo) + " דק'" : '')) +
                "</div>" +
                "<div style='font-size:12px;margin-top:4px;color:" + outcome.col + "'>" + outcome.txt + "</div>" +
                (iobLeft && parseFloat(iobLeft) > 0.05 ?
                    "<div style='font-size:11px;color:#3b82f6;margin-top:2px'>⏳ IOB נותר: ~" + iobLeft + "U</div>" : '') +
                "</div>";
        });

        showPopup("🧠 היסטוריית הזרקות", html);
    } catch(e) {
        showPopup("🧠 שגיאה", e.message);
    }
}


// ─── Profile Render ───────────────────────────────────────────
// ─── Profile Tab — Personal + Medical Checks + Doctor Appointments ──────────

var _PROF_CHECKS_DEFAULT = [
    {id:'hba1c',   name:'HbA1c',             freq:90,  note:'כל 3 חודשים', gp:false, results:[]},
    {id:'kidney',  name:'בדיקת כליות',        freq:365, note:'פעם בשנה',    gp:true,  results:[]},
    {id:'thyroid', name:'בלוטת התריס',        freq:365, note:'פעם בשנה',    gp:true,  results:[]},
    {id:'celiac',  name:'צליאק (anti-tTG)',    freq:365, note:'פעם בשנה',    gp:true,  results:[]},
    {id:'eyes',    name:'בדיקת עיניים',       freq:365, note:'פעם בשנה',    gp:false, results:[]},
    {id:'bp',      name:'לחץ דם',            freq:90,  note:'כל 3 חודשים', gp:true,  results:[]},
    {id:'chol',    name:'פרופיל שומנים',      freq:365, note:'פעם בשנה',    gp:true,  results:[]},
    {id:'urine',   name:'בדיקת שתן',         freq:180, note:'כל חצי שנה',  gp:true,  results:[]},
    {id:'feet',    name:'בדיקת כפות רגליים', freq:365, note:'פעם בשנה',    gp:false, results:[]},
];

var _profChecks = [];
var _profAppt   = {};
var _profData   = {};

function _profLoadData() {
    try { _profData   = JSON.parse(localStorage.getItem('loopie_profile_v2') || '{}'); }   catch(e){}
    try { _profAppt   = JSON.parse(localStorage.getItem('loopie_appt_v1')    || '{}'); }   catch(e){}
    try { _profChecks = JSON.parse(localStorage.getItem('loopie_checks_v4')  || 'null'); } catch(e){}
    if (!_profChecks || !_profChecks.length) {
        _profChecks = _PROF_CHECKS_DEFAULT.map(function(c){ return Object.assign({done:false, doneDate:null}, c); });
    } else {
        ['celiac'].forEach(function(cid) {
            if (!_profChecks.some(function(c){ return c.id === cid; })) {
                var def = _PROF_CHECKS_DEFAULT.find(function(c){ return c.id === cid; });
                if (def) _profChecks.push(Object.assign({done:false, doneDate:null}, def));
                _profSaveData();
            }
        });
    }
}

function _profSaveData() {
    try {
        localStorage.setItem('loopie_profile_v2', JSON.stringify(_profData));
        localStorage.setItem('loopie_checks_v4',  JSON.stringify(_profChecks));
        localStorage.setItem('loopie_appt_v1',    JSON.stringify(_profAppt));
    } catch(e) {}
}

function _profDaysAgo(d)   { return d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null; }
function _profDaysUntil(d) { return d ? Math.ceil((new Date(d) - Date.now()) / 86400000)  : null; }

function _profCalcAge() {
    var dob = document.getElementById('prof-dob');
    var el  = document.getElementById('prof-age');
    if (!dob || !el || !dob.value) { if(el) el.textContent=''; return; }
    el.textContent = 'גיל: ' + Math.floor((Date.now() - new Date(dob.value)) / (365.25 * 86400000));
}

function _profSavePersonal() {
    _profData.name   = (document.getElementById('prof-name')   || {}).value || '';
    _profData.gender = (document.getElementById('prof-gender') || {}).value || '';
    _profData.dob    = (document.getElementById('prof-dob')    || {}).value || '';
    _profData.height = (document.getElementById('prof-height') || {}).value || '';
    _profData.weight = (document.getElementById('prof-weight') || {}).value || '';
    _profSaveData(); _profCalcAge();
    var btn = document.getElementById('prof-save-btn');
    if (btn) { btn.textContent = '✓ נשמר'; setTimeout(function(){ btn.textContent = '💾 שמור פרטים'; }, 1500); }
}

function _profSaveAppt() {
    _profAppt.last         = (document.getElementById('appt-last')          || {}).value || '';
    _profAppt.next         = (document.getElementById('appt-next')          || {}).value || '';
    _profAppt.time         = (document.getElementById('appt-time')          || {}).value || '';
    _profAppt.doctor       = (document.getElementById('appt-doctor')        || {}).value || '';
    _profAppt.remindBefore = parseInt((document.getElementById('appt-remind') || {}).value) || 3;
    _profSaveData();
    _profRenderApptBanners();
    _profRenderChecksBanners();
    var btn = document.getElementById('appt-save-btn');
    if (btn) { btn.textContent = '✓ נשמר'; setTimeout(function(){ btn.textContent = '💾 שמור ביקורים'; }, 1500); }
}

function _profStatusFor(c) {
    if (!c.done || !c.doneDate) return { label: 'לא בוצע', cls: 'status-overdue' };
    var left = c.freq - _profDaysAgo(c.doneDate);
    if (left >  7) return { label: 'הבא בעוד ' + left + ' ימים', cls: 'status-ok' };
    if (left >  0) return { label: '⚠️ פג בעוד ' + left + ' ימים', cls: 'status-due' };
    return { label: 'פג לפני ' + Math.abs(left) + ' ימים', cls: 'status-overdue' };
}

function _profA1cLabel(v) {
    v = parseFloat(v);
    if (isNaN(v)) return null;
    if (v < 7) return { txt: 'מצוין', cls: 'a1c-good' };
    if (v < 8) return { txt: 'סביר',  cls: 'a1c-warn' };
    return           { txt: 'גבוה',  cls: 'a1c-bad'  };
}

function _profRenderApptBanners() {
    var el = document.getElementById('prof-appt-banners');
    if (!el) return;
    var html = '';
    if (_profAppt.next) {
        var until   = _profDaysUntil(_profAppt.next);
        var remB    = _profAppt.remindBefore || 3;
        var timeStr = _profAppt.time   ? ' בשעה ' + _profAppt.time   : '';
        var drStr   = _profAppt.doctor ? ' — '    + _profAppt.doctor : '';
        var dateStr = new Date(_profAppt.next).toLocaleDateString('he-IL', {day:'2-digit',month:'2-digit',year:'numeric'});
        var bannerCls = until <= 0 ? 'banner-warn' : until <= remB ? 'banner-warn' : until === 0 ? 'banner-info' : 'banner-ok';
        var icon = until <= 0 ? '📅' : until <= remB ? '🔔' : '✅';
        var msg  = until < 0  ? 'ביקור שהיה ב-' + dateStr + drStr + ' — עדכן תאריך הבא' :
                   until === 0 ? '<b>היום</b> — ביקור רופא סוכרת' + timeStr + drStr :
                   until <= remB ? 'בעוד <b>' + until + ' ימים</b> — ביקור' + drStr + ' (' + dateStr + timeStr + ')' :
                   'ביקור הבא: ' + dateStr + timeStr + drStr + ' (בעוד ' + until + ' ימים)';
        html += '<div class="prof-banner ' + bannerCls + '">' + icon + ' ' + msg + '</div>';
    }
    if (_profAppt.last) {
        var ago = _profDaysAgo(_profAppt.last);
        html += '<div class="prof-appt-box"><span>📋 ביקור אחרון</span><span>' +
            new Date(_profAppt.last).toLocaleDateString('he-IL') + (ago !== null ? ' (לפני ' + ago + ' ימים)' : '') + '</span></div>';
    }
    el.innerHTML = html;
}

function _profRenderChecksBanners() {
    var el = document.getElementById('prof-checks-banners');
    if (!el) return;
    var WARN = 7, html = '';
    var expiringSoon = [], expired = [], gpExpired = [], specExpired = [];

    _profChecks.forEach(function(c) {
        if (!c.done || !c.doneDate) { expired.push(c); (c.gp ? gpExpired : specExpired).push(c); return; }
        var left = c.freq - _profDaysAgo(c.doneDate);
        if (left <= 0)    { expired.push(c); (c.gp ? gpExpired : specExpired).push(c); }
        else if (left <= WARN) expiringSoon.push(c);
    });

    if (expiringSoon.length) {
        html += '<div class="prof-banner banner-warn">⏰ <b>' + expiringSoon.length + ' בדיקות מסתיימות בשבוע הקרוב</b> — הזמן תור:<br>' +
            expiringSoon.map(function(c) {
                var left = c.freq - _profDaysAgo(c.doneDate);
                return '• ' + c.name + ' — עוד ' + left + ' ימים' + (c.gp ? ' <small>(גם רופא משפחה)</small>' : '');
            }).join('<br>') + '</div>';
    }
    if (gpExpired.length) {
        html += '<div class="prof-banner banner-danger">🏥 <b>בדיקות שפגו — ניתן לבקש מרופא משפחה:</b><br>' +
            gpExpired.map(function(c){ return '• ' + c.name; }).join('<br>') + '</div>';
    }
    if (specExpired.length) {
        html += '<div class="prof-banner banner-danger">👨‍⚕️ <b>בדיקות שפגו — דרוש רופא סוכרת:</b><br>' +
            specExpired.map(function(c){ return '• ' + c.name; }).join('<br>') + '</div>';
    }
    if (_profAppt.next && expired.length) {
        var until2 = _profDaysUntil(_profAppt.next);
        if (until2 !== null && until2 >= 0 && until2 <= 14) {
            html += '<div class="prof-banner banner-info">📋 <b>ביקור בעוד ' + until2 + ' ימים</b> — הכן רשימה לרופא:<br>' +
                expired.map(function(c){ return '• ' + c.name; }).join('<br>') + '</div>';
        }
    }
    el.innerHTML = html;
}

function _profRenderChecks() {
    var list = document.getElementById('prof-checks-list');
    if (!list) return;

    list.innerHTML = _profChecks.map(function(c, i) {
        var st  = _profStatusFor(c);
        var ago = c.doneDate ? _profDaysAgo(c.doneDate) : null;
        var left = c.doneDate ? (c.freq - ago) : null;
        var doneLabel = c.doneDate
            ? 'בוצע: ' + new Date(c.doneDate).toLocaleDateString('he-IL') + (ago !== null ? ' (לפני ' + ago + ' ימים)' : '')
            : '';
        var rowBg = left !== null ? (left <= 0 ? 'background:rgba(244,63,94,0.06);border-right:3px solid #f43f5e' :
                                     left <= 7 ? 'background:rgba(245,158,11,0.06);border-right:3px solid #f59e0b' : '') : 'border-right:3px solid #ef4444';
        var gpTag = c.gp ? '<small style="color:var(--muted);margin-right:4px;font-size:10px">גם רופא משפחה</small>' : '';

        var a1cHtml = '';
        if (c.id === 'hba1c' && c.results && c.results.length) {
            var last = c.results[c.results.length - 1];
            var lbl  = _profA1cLabel(last.val);
            a1cHtml  = '<span style="display:inline-flex;align-items:center;gap:5px;margin-top:3px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:2px 8px">' +
                '<span style="font-size:13px;font-weight:700">' + last.val + '%</span>' +
                (lbl ? '<span style="font-size:11px;padding:1px 6px;border-radius:10px;' +
                    (lbl.cls==='a1c-good'?'background:rgba(16,185,129,0.2);color:#10b981':
                     lbl.cls==='a1c-warn'?'background:rgba(245,158,11,0.2);color:#f59e0b':
                     'background:rgba(239,68,68,0.2);color:#ef4444') + '">' + lbl.txt + '</span>' : '') +
                '</span>';
            if (c.results.length > 1) {
                var prev = c.results.slice(-4).reverse().slice(1);
                a1cHtml += '<div style="font-size:11px;color:var(--muted);margin-top:2px">קודם: ' +
                    prev.map(function(r){ return new Date(r.date).toLocaleDateString('he-IL',{month:'2-digit',year:'2-digit'}) + ' — ' + r.val + '%'; }).join(' | ') + '</div>';
            }
        }

        var doneBtn = !c.done
            ? (c.id === 'hba1c'
                ? '<button onclick="_profMarkDoneA1c(' + i + ')" style="font-size:11px;padding:4px 9px;border-radius:16px;border:1px solid #10b981;background:rgba(16,185,129,0.1);color:#10b981;cursor:pointer">✅ בוצע + תוצאה</button>'
                : '<button onclick="_profMarkDone(' + i + ')" style="font-size:11px;padding:4px 9px;border-radius:16px;border:1px solid #10b981;background:rgba(16,185,129,0.1);color:#10b981;cursor:pointer">✅ בוצע</button>')
            : '<button onclick="_profUndoDone(' + i + ')" style="font-size:11px;padding:4px 9px;border-radius:16px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer">בטל</button>';

        return '<div id="profchk-' + i + '" style="display:flex;align-items:flex-start;gap:10px;padding:10px 10px;margin-bottom:4px;border-radius:8px;' + rowBg + '">' +
            '<div style="flex:1;min-width:0">' +
                '<div style="font-size:13px;font-weight:700">' + c.name + gpTag + '</div>' +
                '<div style="font-size:11px;color:var(--muted)">' + c.note + '</div>' +
                a1cHtml +
                (c.done && doneLabel
                    ? '<div style="font-size:11px;margin-top:2px;color:' + (st.cls==='status-ok'?'#10b981':st.cls==='status-due'?'#f59e0b':'#ef4444') + '">' + doneLabel + ' | ' + st.label + '</div>'
                    : '<div style="font-size:11px;margin-top:2px;color:#ef4444">' + st.label + '</div>') +
            '</div>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
                doneBtn +
                '<button onclick="_profEditCheck(' + i + ')" style="font-size:11px;padding:4px 8px;border-radius:16px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer">✏️</button>' +
            '</div>' +
        '</div>';
    }).join('');

    _profRenderChecksBanners();
}

function _profMarkDone(i) {
    _profChecks[i].done = true;
    _profChecks[i].doneDate = new Date().toISOString().split('T')[0];
    _profSaveData(); _profRenderChecks();
}
function _profUndoDone(i) {
    _profChecks[i].done = false;
    _profChecks[i].doneDate = null;
    _profSaveData(); _profRenderChecks();
}
function _profMarkDoneA1c(i) {
    var val = prompt('תוצאת HbA1c (%):', '');
    if (val === null) return;
    var num = parseFloat(val);
    _profChecks[i].done = true;
    _profChecks[i].doneDate = new Date().toISOString().split('T')[0];
    if (!isNaN(num) && num > 3 && num < 20) {
        if (!_profChecks[i].results) _profChecks[i].results = [];
        _profChecks[i].results.push({ date: _profChecks[i].doneDate, val: num.toFixed(1) });
    }
    _profSaveData(); _profRenderChecks();
}
function _profEditCheck(i) {
    var c = _profChecks[i];
    var lastVal = (c.results && c.results.length) ? c.results[c.results.length-1].val : '';
    var row = document.getElementById('profchk-' + i);
    var inp = function(id, type, val, extra) {
        return '<input id="'+id+'" type="'+type+'" value="'+val+'" '+(extra||'')+
               ' style="font-size:12px;padding:3px 7px;border-radius:6px;border:1px solid var(--border);background:#111;color:#fff;width:auto">';
    };
    row.innerHTML =
        '<div style="flex:1;display:flex;flex-direction:column;gap:6px">' +
            inp('pe-name-'+i, 'text', c.name, 'style="width:100%;font-size:13px;padding:5px 8px;border-radius:6px;border:1px solid var(--border);background:#111;color:#fff"') +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
                '<label style="font-size:11px;color:var(--muted)">כל</label>' +
                inp('pe-freq-'+i, 'number', c.freq, 'style="width:56px;font-size:12px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:#111;color:#fff"') +
                '<label style="font-size:11px;color:var(--muted)">ימים | תאריך:</label>' +
                inp('pe-date-'+i, 'date', c.doneDate||'', 'style="font-size:12px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:#111;color:#fff"') +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center">' +
                '<input type="checkbox" id="pe-gp-'+i+'"' + (c.gp?' checked':'') + ' style="width:14px;height:14px">' +
                '<label for="pe-gp-'+i+'" style="font-size:12px;color:var(--muted)">ניתן לבקש מרופא משפחה</label>' +
            '</div>' +
            (c.id==='hba1c'
                ? '<div style="display:flex;gap:6px;align-items:center">' +
                    '<label style="font-size:11px;color:var(--muted)">HbA1c (%):</label>' +
                    '<input id="pe-a1c-'+i+'" type="number" step="0.1" min="4" max="15" value="'+lastVal+'" style="width:68px;font-size:12px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:#111;color:#fff">' +
                  '</div>'
                : '') +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px">' +
            '<button onclick="_profSaveEdit('+i+')" style="font-size:11px;padding:4px 9px;border-radius:16px;border:1px solid #10b981;background:rgba(16,185,129,0.1);color:#10b981;cursor:pointer">שמור</button>' +
            '<button onclick="_profRenderChecks()" style="font-size:11px;padding:4px 9px;border-radius:16px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer">בטל</button>' +
        '</div>';
}
function _profSaveEdit(i) {
    var nm   = (document.getElementById('pe-name-'+i)||{}).value || '';
    var fr   = parseInt((document.getElementById('pe-freq-'+i)||{}).value) || 90;
    var dt   = (document.getElementById('pe-date-'+i)||{}).value || '';
    var gp   = (document.getElementById('pe-gp-'+i)||{}).checked;
    var a1cEl = document.getElementById('pe-a1c-'+i);
    if (nm) _profChecks[i].name = nm;
    _profChecks[i].freq = fr;
    _profChecks[i].note = 'כל ' + fr + ' ימים';
    _profChecks[i].gp   = gp;
    if (dt) { _profChecks[i].doneDate = dt; _profChecks[i].done = true; }
    else    { _profChecks[i].doneDate = null; _profChecks[i].done = false; }
    if (a1cEl) {
        var v = parseFloat(a1cEl.value);
        if (!isNaN(v) && v > 3 && v < 20) {
            if (!_profChecks[i].results) _profChecks[i].results = [];
            var ex = _profChecks[i].results.find(function(r){ return r.date === dt; });
            if (ex) ex.val = v.toFixed(1);
            else if (dt) _profChecks[i].results.push({ date: dt, val: v.toFixed(1) });
        }
    }
    _profSaveData(); _profRenderChecks();
}
function _profAddCheck() {
    var name = prompt('שם הבדיקה:');
    if (!name) return;
    var freq = parseInt(prompt('כל כמה ימים?', '365')) || 365;
    var gp   = confirm('ניתן לבקש מרופא משפחה?');
    _profChecks.push({ id:'custom_'+Date.now(), name:name, freq:freq, note:'כל '+freq+' ימים', gp:gp, done:false, doneDate:null, results:[] });
    _profSaveData(); _profRenderChecks();
}

function renderProfile() {
    var viewEl = document.getElementById('profile-view');
    if (!viewEl) return;

    _profLoadData();

    // NS data row
    var prof  = fullHistory && fullHistory.profile;
    var nowH  = new Date().getHours();
    var nsRow = '';
    if (prof) {
        var cr  = profileValueAt(prof.carbratio || prof.carbRatio || prof.ic, nowH) || '?';
        var isf = profileValueAt(prof.sens || prof.sensitivity, nowH) || '?';
        var bas = profileValueAt(prof.basal, nowH) || '?';
        nsRow = '<div style="background:rgba(59,130,246,0.08);border:1px solid var(--blue-dim);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px">' +
            '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">ערכי NS כרגע</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">' +
            '<div><div style="color:var(--muted);font-size:10px">CR</div><div style="font-weight:700">1U/'+cr+'g</div></div>' +
            '<div><div style="color:var(--muted);font-size:10px">ISF</div><div style="font-weight:700">'+isf+'</div></div>' +
            '<div><div style="color:var(--muted);font-size:10px">בזאלי</div><div style="font-weight:700">'+bas+'</div></div>' +
            '</div></div>';
    }

    var css = '<style>' +
        '.prof-banner{border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:8px;line-height:1.6}' +
        '.banner-warn{background:rgba(245,158,11,0.1);border:1px solid #f59e0b;color:#f59e0b}' +
        '.banner-info{background:rgba(59,130,246,0.1);border:1px solid #3b82f6;color:#3b82f6}' +
        '.banner-ok{background:rgba(16,185,129,0.1);border:1px solid #10b981;color:#10b981}' +
        '.banner-danger{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#ef4444}' +
        '.prof-appt-box{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between}' +
        '.prof-field{display:flex;flex-direction:column;gap:3px;margin-bottom:8px}' +
        '.prof-field label{font-size:11px;color:var(--muted)}' +
        '.prof-field input,.prof-field select{font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:#0a0a14;color:#fff;width:100%}' +
        '.prof-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
        '.prof-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}' +
        '.prof-section{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px}' +
        '.prof-save{width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:#fff;font-size:13px;cursor:pointer;margin-top:4px}' +
        '</style>';

    viewEl.innerHTML = css +
        // NS values
        nsRow +

        // Personal
        '<div class="prof-section">👤 פרטים אישיים</div>' +
        '<div class="prof-grid-2">' +
            '<div class="prof-field"><label>שם</label><input id="prof-name" value="' + (_profData.name||'') + '"></div>' +
            '<div class="prof-field"><label>מין</label><select id="prof-gender">' +
                '<option value="male"'  + (_profData.gender==='male'  ?' selected':'') + '>זכר</option>' +
                '<option value="female"'+ (_profData.gender==='female'?' selected':'') + '>נקבה</option>' +
                '<option value="other"' + (_profData.gender==='other' ?' selected':'') + '>אחר</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="prof-grid-3">' +
            '<div class="prof-field"><label>תאריך לידה</label><input id="prof-dob" type="date" value="' + (_profData.dob||'') + '" oninput="_profCalcAge()"><span id="prof-age" style="font-size:11px;color:#3b82f6;margin-top:2px"></span></div>' +
            '<div class="prof-field"><label>גובה (ס"מ)</label><input id="prof-height" type="number" value="' + (_profData.height||'') + '"></div>' +
            '<div class="prof-field"><label>משקל (ק"ג)</label><input id="prof-weight" type="number" value="' + (_profData.weight||'') + '"></div>' +
        '</div>' +
        '<button id="prof-save-btn" class="prof-save" onclick="_profSavePersonal()">💾 שמור פרטים</button>' +

        // Appointments
        '<div class="prof-section">📅 ביקורי רופא סוכרת</div>' +
        '<div id="prof-appt-banners"></div>' +
        '<div class="prof-grid-2">' +
            '<div class="prof-field"><label>ביקור אחרון</label><input id="appt-last" type="date" value="' + (_profAppt.last||'') + '"></div>' +
            '<div class="prof-field"><label>ביקור הבא</label><input id="appt-next" type="date" value="' + (_profAppt.next||'') + '"></div>' +
        '</div>' +
        '<div class="prof-grid-2">' +
            '<div class="prof-field"><label>שעת הביקור</label><input id="appt-time" type="time" value="' + (_profAppt.time||'') + '"></div>' +
            '<div class="prof-field"><label>רופא / מרפאה</label><input id="appt-doctor" value="' + (_profAppt.doctor||'') + '" placeholder=\'ד"ר כהן\'></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-bottom:6px">' +
            '🔔 תזכורת <input id="appt-remind" type="number" min="1" max="30" value="' + (_profAppt.remindBefore||3) + '" style="width:44px;font-size:12px;padding:3px 5px;border-radius:6px;border:1px solid var(--border);background:#0a0a14;color:#fff"> ימים לפני הביקור' +
        '</div>' +
        '<button id="appt-save-btn" class="prof-save" onclick="_profSaveAppt()">💾 שמור ביקורים</button>' +

        // Checks
        '<div class="prof-section">🩺 בדיקות רפואיות</div>' +
        '<div id="prof-checks-banners"></div>' +
        '<div id="prof-checks-list"></div>' +
        '<button class="prof-save" style="margin-top:8px" onclick="_profAddCheck()">➕ הוסף בדיקה</button>';

    _profCalcAge();
    _profRenderApptBanners();
    _profRenderChecks();
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
