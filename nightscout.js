// ============================================================
//  nightscout.js  —  LOOPIE Data & Automation Core  (v1.0 Modular)
//
//  אחראי על:
//  1. State גלובלי (nsData) וכל ה-fetch מ-Nightscout
//  2. IOB / COB / בזאלי / recommendedBolus — רענון כל 60 שניות
//  3. לוגיקת פעילויות (ACTIVITIES), ספורט, לוח זמנים שבועי
//  4. ייבוא חוגים מ-Gmail + סנכרון Google Calendar
//  5. מנוע ניטור והתראות פוש (checkProactiveAlerts, alertLow וכו')
//  6. NSMonitor — זיהוי treatments חדשים כל 90 שניות
//
//  מה שאסור כאן: SYSTEM_PROMPT, triggerLoopieAI, כל לוגיקת Gemini
//  לאוכל. אלו חיים ב-loopie-ai.js בלבד.
//
//  תלויות: showPopup, closePopup, drawMiniChart, askOmnibox, askGeminiAdvisor
//  (הוגדרו ב-index.html), וכן Firebase/Firestore keys מ-FIREBASE_CONFIG.
// ============================================================


// ─── STATE גלובלי ────────────────────────────────────────────
let nsData = {
    iob:              '0.00',
    cob:              0,
    basal:            '0.0',
    currentSgv:       0,
    delta:            0,
    trend:            'Flat',
    overrideActive:   false,
    overrideName:     null,
    overrideMultiplier: null,
    _overrideRaw:     null,
    loopRec:          null,   // loop.recommendedBolus החי
    recommendedBolus: 0,      // הערך שנחשב/נשלף — גם loopie-ai.js קורא אותו
    pumpBattery:      undefined,
    phoneBattery:     undefined,
};

let fullHistory  = { entries: [], treatments: [], devStatus: {}, profile: null };
let refreshTimer = null;
let PENDING_DOSE = null;


// ─── פרופיל אינסולין ─────────────────────────────────────────
var INSULIN_CONFIG = {
    type:           'lyumjev',
    splitNow:       70,
    splitLater:     30,
    splitDelay:     60,
    alertThreshold: 200,
    alertDelta:     3,
    primingActive:  false,
    primingTime:    null,
    primingDose1:   0.3,
    primingDose2:   0.2,
};

var INSULIN_PROFILES = {
    lyumjev:  { preMeal: 0,  peakMin: 30,  diaH: 4,  label: 'Lyumjev' },
    fiasp:    { preMeal: 0,  peakMin: 30,  diaH: 4,  label: 'Fiasp'   },
    novorapid:{ preMeal: 15, peakMin: 60,  diaH: 5,  label: 'Novorapid' },
    humalog:  { preMeal: 15, peakMin: 60,  diaH: 5,  label: 'Humalog'  },
    apidra:   { preMeal: 10, peakMin: 45,  diaH: 4,  label: 'Apidra'  },
};

function getInsulinProfile() {
    return INSULIN_PROFILES[INSULIN_CONFIG.type] || INSULIN_PROFILES.novorapid;
}


// ─── פרופילי לילה / ביה"ס ────────────────────────────────────
var NIGHT_PROFILE = {
    fromHour: 22, toHour: 6,
    targetBG: 115, targetBGRange: '110-130',
    crAdjust: 0.85, isfAdjust: 1.2, correctionFactor: 0.5,
    diaFactor: 1.2, splitPct: 55,
    note: 'לילה — ספיגה איטית, סיכון היפו מוגבר'
};

var SCHOOL_PROFILE = {
    enabled: true,
    targetBG: 120, targetBGRange: '110-130',
    targetBGHigh: 130, targetBGLow: 110,
    crAdjust: 1.1, isfAdjust: 1.1,
    fromHour: 8, toHour: 14,
    schoolDays: [0,1,2,3,4]
};

var SCHOOL_SCHEDULE = {
    schoolDays:    [0,1,2,3,4],
    breakfast:     { from: '07:00', to: '07:30' },
    arrivalTime:   '08:00',
    tenOclock:     { from: '09:40', to: '10:15' },
    endTime:       '13:30',
    walkToSchool:  1.0,
    walkHome:      1.0,
    walkEffect:    15,
    tenOclockFood: 'פיתה',
    tenOclockCarbs: 35,
};

function isNightProfile() {
    var h = new Date().getHours();
    return h >= NIGHT_PROFILE.fromHour || h < NIGHT_PROFILE.toHour;
}

function isSchoolProfile() {
    var d = new Date(), h = d.getHours();
    return SCHOOL_PROFILE.enabled &&
           SCHOOL_PROFILE.schoolDays.indexOf(d.getDay()) >= 0 &&
           h >= SCHOOL_PROFILE.fromHour && h < SCHOOL_PROFILE.toHour;
}

function isSchoolDay() {
    return SCHOOL_SCHEDULE.schoolDays.indexOf(new Date().getDay()) >= 0;
}

function getSchoolContext() {
    if (!isSchoolDay()) return null;
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var mins = h * 60 + m;

    if (h >= 6 && h < 8)
        return { phase:'morning_home', label:'🏠 בוקר בבית', note:'Dawn Phenomenon — 100% עכשיו, ללא פיצול', splitPct:100, walkWarning:null };
    if ((h===7&&m>=30)||(h===8&&m===0))
        return { phase:'commute', label:'🚶 הליכה/נסיעה לביה"ס', note:'אם הולך ברגל — שקול 10g לפני', splitPct:100, walkWarning:'🚶 הליכה לביה"ס — שקול 10g לפני או הפחת 10%' };
    if (h===9&&m>=20&&m<40)
        return { phase:'pre_ten', label:'🍞 לפני א. עשר', note:'א. עשר בעוד 20 דק — פיצול 70/30', splitPct:70, walkWarning:null, upcomingRecess:true, recessAt:'10:15' };
    if ((h===9&&m>=40)||(h===10&&m<15))
        return { phase:'ten_oclock', label:'🍞 א. עשר + הפסקה', note:'הפסקה עד 10:15 — פיצול 70/30', splitPct:70, walkWarning:null, upcomingRecess:true, recessAt:'10:15' };
    if (h===13&&m>=0)
        return { phase:'pre_home', label:'🏠 לפני חזרה הביתה', note:'אם הולך ברגל — אכול 10-15g לפני', splitPct:70, walkWarning:'🚶 הליכה הביתה — אכול 10-15g לפני (פתיבר/פרי)' };
    return { phase:'school', label:'🏫 ביה"ס', note:'', splitPct:70, walkWarning:null };
}


// ─── תוכניות ספורט ───────────────────────────────────────────
var ACTIVITIES      = JSON.parse(localStorage.getItem('loopie_activities') || '[]');
var DAYS_HE         = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
var INTENSITY_LABELS = { low:'עצימות נמוכה', medium:'עצימות בינונית', high:'עצימות גבוהה' };

var SPORT_PLANS = {
    low: {
        label:'עצימות נמוכה', basalReduction:0, basalPre:0,
        targetBGDuring:140, targetBGRange:'120–160', sportModeMins:60,
        noBolusRule:false, postReduction:10, postDurationH:2,
        preCarbsG:0, description:'הליכה, יוגה, פילאטיס'
    },
    medium: {
        label:'עצימות בינונית', basalReduction:50, basalPre:90,
        targetBGDuring:150, targetBGRange:'130–180', sportModeMins:90,
        noBolusRule:true, postReduction:20, postDurationH:3,
        preCarbsG:15, description:'שחייה, אופניים, כדורסל'
    },
    high: {
        label:'עצימות גבוהה', basalReduction:80, basalPre:120,
        targetBGDuring:160, targetBGRange:'140–200', sportModeMins:120,
        noBolusRule:true, postReduction:30, postDurationH:4,
        preCarbsG:20, description:'MMA, ריצה, HIIT, אגרוף'
    }
};

var INTENSITY_REDUCTION      = { low:0, medium:25, high:40 };
var POST_ACTIVITY_REDUCTION  = { low:10, medium:20, high:30 };


// ─── Firebase / זיכרון ───────────────────────────────────────
//
//  חוק בטיחות: שגיאת Firebase (403/401/network) לעולם לא עוצרת
//  את ה-UI. כל פונקציה עם timeout + fallback אוטומטי ל-localStorage.
//  _fbBlocked נועל Firebase לאחר כשל ראשון — חוסך bounding ל-API.
//
var FIREBASE_CONFIG = {
    projectId:  'loopie-daniel',
    apiKey:     'AIzaSyAzaGEs6r_fs8hKfrnfxxr78zpzmNEfdes',
    collection: 'memory',
};

// דגל: האם Firebase חסום (403/401 שהתקבל לפחות פעם אחת)?
var _fbBlocked = false;

// Fetch עם timeout — מונע תקיעה ב-network
function _fbFetch(url, options, timeoutMs) {
    timeoutMs = timeoutMs || 5000;
    return Promise.race([
        fetch(url, options || {}),
        new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error('Firebase timeout')); }, timeoutMs);
        })
    ]);
}

// ── Firestore converters ─────────────────────────────────────
function objToFirestore(obj) {
    var fields = {};
    try {
        Object.keys(obj).forEach(function(k) {
            var v = obj[k];
            if (typeof v === 'string')       fields[k] = { stringValue: v };
            else if (typeof v === 'number')  fields[k] = { doubleValue: v };
            else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
            else if (v === null)             fields[k] = { nullValue: null };
            else                             fields[k] = { stringValue: JSON.stringify(v) };
        });
    } catch(e) {}
    return fields;
}

function firestoreToObj(fields) {
    var obj = {};
    try {
        Object.keys(fields).forEach(function(k) {
            var f = fields[k];
            if      ('stringValue'  in f) obj[k] = f.stringValue;
            else if ('doubleValue'  in f) obj[k] = f.doubleValue;
            else if ('integerValue' in f) obj[k] = parseInt(f.integerValue);
            else if ('booleanValue' in f) obj[k] = f.booleanValue;
            else if ('nullValue'    in f) obj[k] = null;
            else obj[k] = null;
        });
    } catch(e) {}
    return obj;
}

// ── fsGet (פנימי) ─────────────────────────────────────────────
async function fsGet(collection, docId) {
    if (_fbBlocked) return null;
    try {
        var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
                  '/databases/(default)/documents/' + collection + '/' + docId +
                  '?key=' + FIREBASE_CONFIG.apiKey;
        var res = await _fbFetch(url);
        if (res.status === 403 || res.status === 401) { _fbBlocked = true; return null; }
        if (!res.ok) return null;
        var data = await res.json();
        return data.fields ? firestoreToObj(data.fields) : null;
    } catch(e) { return null; }
}

// ── fsSet (פנימי) ─────────────────────────────────────────────
async function fsSet(collection, docId, obj) {
    if (_fbBlocked) return;
    try {
        var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
                  '/databases/(default)/documents/' + collection + '/' + docId +
                  '?key=' + FIREBASE_CONFIG.apiKey;
        var res = await _fbFetch(url, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ fields: objToFirestore(obj) })
        });
        if (res.status === 403 || res.status === 401) { _fbBlocked = true; }
    } catch(e) {}
}

// ── loadMemory — FALLBACK SAFE ────────────────────────────────
async function loadMemory() {
    var mem = {};

    // ── ניסיון Firebase (רק אם לא חסום) ──
    if (!_fbBlocked) {
        try {
            var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
                      '/databases/(default)/documents/' + FIREBASE_CONFIG.collection +
                      '?key=' + FIREBASE_CONFIG.apiKey + '&pageSize=50';
            var res = await _fbFetch(url, {}, 5000);

            // 403/401 → נעל Firebase, עבור ישר ל-localStorage
            if (res.status === 403 || res.status === 401) {
                _fbBlocked = true;
                console.warn('[Loopie] Firebase 403 — עובר ל-localStorage fallback.');
            } else if (res.ok) {
                var data = await res.json();
                (data.documents || []).forEach(function(doc) {
                    try {
                        var key = doc.name.split('/').pop();
                        mem[key] = { value: firestoreToObj(doc.fields || {}) };
                    } catch(e) {}
                });
                return mem; // ← הצלחה מ-Firebase
            }
        } catch(e) {
            // network error / timeout — לא נועל, רק fallback
            console.warn('[Loopie] Firebase error:', e.message, '— fallback ל-localStorage');
        }
    }

    // ── Fallback: localStorage ────────────────────────────────
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.startsWith('loopie_memory_')) {
                var key2 = k.replace('loopie_memory_', '');
                try { mem[key2] = { value: JSON.parse(localStorage.getItem(k)) }; } catch(e) {}
            }
        }
    } catch(e) {}

    return mem; // תמיד מחזיר אובייקט (גם אם ריק) — לעולם לא זורק
}

// ── saveMemory — FALLBACK SAFE ────────────────────────────────
async function saveMemory(key, value) {
    // שמירה מקומית תמיד קודם (מהירה, מבטיחה)
    try { localStorage.setItem('loopie_memory_' + key, JSON.stringify(value)); } catch(e) {}

    // ניסיון Firebase ברקע — שגיאה לא משפיעה על ה-UI
    if (!_fbBlocked) {
        try {
            var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
                      '/databases/(default)/documents/' + FIREBASE_CONFIG.collection + '/' + key +
                      '?key=' + FIREBASE_CONFIG.apiKey;
            var res = await _fbFetch(url, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ fields: { value: { stringValue: JSON.stringify(value) } } })
            }, 5000);
            if (res.status === 403 || res.status === 401) {
                _fbBlocked = true;
                console.warn('[Loopie] Firebase 403 on saveMemory — נועל Firebase.');
            }
        } catch(e) {
            // שגיאת network בלבד — לא קריטי, localStorage כבר שמר
        }
    }
}


// ─── Emoji Map ────────────────────────────────────────────────
var EMOJI_MAP = {};
var LAST_FOOD_QUERY = null;

async function loadEmojiMap() {
    try {
        var mem = await loadMemory();
        if (mem['emoji_map'] && mem['emoji_map'].value) {
            var raw = mem['emoji_map'].value;
            EMOJI_MAP = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
    } catch(e) {}
}

async function learnEmoji(emoji, foodName) {
    EMOJI_MAP[emoji] = foodName;
    await saveMemory('emoji_map', EMOJI_MAP);
}

function extractEmojis(text) {
    var result = [];
    for (var i = 0; i < text.length; i++) {
        var code = text.codePointAt(i);
        if (code > 0x1F000) { result.push(String.fromCodePoint(code)); if (code > 0xFFFF) i++; }
    }
    return result;
}


// ─── NS Helpers ──────────────────────────────────────────────
function nsUrl()    { return (document.getElementById('nsUrl')||{value:''}).value.trim().replace(/\/$/, ''); }
function nsSecret() { return (document.getElementById('apiSecret')||{value:''}).value.trim(); }

function geminiKey() {
    var e='LSYVETocdlZBBjEkWzsTCh8/OwEiXV5GcXgtACAFLxYCWi4ZMQRr';
    var p='loopie2024daniel';
    var d=atob(e), o='';
    for(var i=0;i<d.length;i++) o+=String.fromCharCode(d.charCodeAt(i)^p.charCodeAt(i%p.length));
    return o;
}

function nsGet(path) {
    var sep = path.includes('?') ? '&' : '?';
    return fetch(nsUrl() + path + sep + 'api_secret=' + nsSecret(), { mode: 'cors' });
}

function dig(obj, path, fallback) {
    if (fallback === undefined) fallback = null;
    var v = path.split('.').reduce(function(a,k){ return a != null ? a[k] : null; }, obj);
    return (v !== null && v !== undefined) ? v : fallback;
}

function profileValueAt(arr, hour) {
    if (!arr || !arr.length) return null;
    var sorted = arr.slice().sort(function(a,b){ return a.time > b.time ? 1:-1; });
    var val = sorted[0].value;
    for (var i = 0; i < sorted.length; i++) {
        if (parseInt((sorted[i].time||'0').split(':')[0]) <= hour) val = sorted[i].value;
    }
    return val;
}

function buildSchedule(arr, unit) {
    if (!arr || !arr.length) return 'אין נתונים.';
    return arr.slice().sort(function(a,b){ return a.time>b.time?1:-1; })
        .map(function(e){ return '• '+(e.time||'00:00')+' — <b>'+e.value+'</b> '+unit; })
        .join('<br>');
}

function predictBG(h) {
    var sgv = nsData.currentSgv;
    if (!sgv) return null;
    var iob = parseFloat(nsData.iob) || 0;
    return Math.max(40, Math.min(400, Math.round(sgv + (nsData.delta * 12 * h) - (iob * 40 * h))));
}

function bgStatus(sgv) {
    if (sgv < 70)  return ' ⚠️ נמוך!';
    if (sgv > 250) return ' ⚠️ גבוה מאוד!';
    if (sgv > 180) return ' ↑ גבוה';
    return ' ✅ בטווח';
}

function timeAgo(d) {
    var h = (Date.now() - new Date(d)) / 3600000;
    return h < 24 ? h.toFixed(1)+' שעות' : (h/24).toFixed(1)+' ימים';
}

function roundBasal(val) {
    var r = Math.round(parseFloat(val) / 0.05) * 0.05;
    return Math.round(r * 1000) / 1000;
}
function basalUp(val)   { return roundBasal(parseFloat(val) + 0.05); }
function basalDown(val) { return roundBasal(Math.max(0, parseFloat(val) - 0.05)); }


// ─── CONNECT + fetchData ──────────────────────────────────────
async function connect() {
    var btn    = document.getElementById('loginBtn');
    var remEl  = document.getElementById('remember-me');
    var remember = !remEl || remEl.checked;
    if (!nsUrl() || !nsSecret()) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> מתחבר...';
    try {
        var res = await nsGet('/api/v1/status.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        if (remember) {
            var nu = document.getElementById('nsUrl');
            var as = document.getElementById('apiSecret');
            if (nu) localStorage.setItem('loopie_ns_url', nu.value.trim());
            if (as) localStorage.setItem('loopie_ns_secret', as.value.trim());
        }
        fetchData();
        refreshTimer = setInterval(fetchData, 60000);
        startNSMonitor();
        loadEmojiMap();
        setTimeout(drawMiniChart, 2000);
        setInterval(drawMiniChart, 60000);

        // טעינת פעילויות מ-Firebase
        loadMemory().then(function(mem) {
            if (mem['activities'] && mem['activities'].value && Array.isArray(mem['activities'].value)) {
                if (mem['activities'].value.length > ACTIVITIES.length) {
                    ACTIVITIES = mem['activities'].value;
                    localStorage.setItem('loopie_activities', JSON.stringify(ACTIVITIES));
                    renderActivities();
                }
            }
        }).catch(function(){});

        var savedEmail = localStorage.getItem('loopie_email');
        if (savedEmail) { var el=document.getElementById('user-email'); if(el) el.value=savedEmail; }
        var savedKw = localStorage.getItem('loopie_keywords');
        if (savedKw) { var kl=document.getElementById('activity-keywords'); if(kl) kl.value=savedKw; }
    } catch(e) {
        btn.disabled = false;
        btn.innerText = 'שגיאת חיבור (' + e.message + ')';
    }
}

async function fetchData() {
    try {
        var [entRes, devRes, profRes] = await Promise.all([
            nsGet('/api/v1/entries.json?count=2'),
            nsGet('/api/v1/devicestatus.json?count=1'),
            nsGet('/api/v1/profile.json')
        ]);

        // ── סוכר + דלתא ──
        if (entRes.ok) {
            var ed      = await entRes.json();
            var entries = Array.isArray(ed) ? ed : [ed];
            var e0 = entries[0], e1 = entries[1];
            if (e0 && e0.sgv) {
                nsData.currentSgv = e0.sgv;
                nsData.delta      = e1 ? (e0.sgv - e1.sgv) : 0;
                var bgEl = document.getElementById('current-bg');
                if (bgEl) {
                    bgEl.innerText   = e0.sgv;
                    bgEl.className   = 'bg-value' + (e0.sgv<70?' low':e0.sgv>180?' high':'');
                }
                var trendMap = {
                    'DoubleUp':'⬆⬆','SingleUp':'⬆','FortyFiveUp':'↗','Flat':'→',
                    'FortyFiveDown':'↘','SingleDown':'⬇','DoubleDown':'⬇⬇',
                    'NONE':'→','NOT COMPUTABLE':'?'
                };
                var trendVal   = e0.direction || e0.trend || 'Flat';
                var trendArrow = trendMap[trendVal] || trendVal;
                nsData.trend   = trendVal;
                var deltaSign  = nsData.delta >= 0 ? '+' : '';
                var trendEl    = document.getElementById('trend-label');
                if (trendEl) trendEl.innerText = trendArrow + ' ' + deltaSign + (nsData.delta||0);

                var isRising = (e0.sgv > INSULIN_CONFIG.alertThreshold && nsData.delta >= INSULIN_CONFIG.alertDelta);
                var isLow    = (e0.sgv < 80 || (e0.sgv < 100 && nsData.delta <= -3));
                var existing = document.getElementById('rising-alert');

                if (isLow && !existing) {
                    var alertDiv = document.createElement('div');
                    alertDiv.id = 'rising-alert';
                    alertDiv.style.cssText = 'background:rgba(59,130,246,0.15);border:1px solid #3b82f6;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;cursor:pointer';
                    alertDiv.innerHTML = '🔵 סוכר <b>'+e0.sgv+'</b>'+(nsData.delta<0?' ויורד '+nsData.delta+'/5דק':'')+' — <b style="color:#3b82f6">לחץ לתוכנית חילוץ</b>';
                    alertDiv.onclick = function(){ document.getElementById('omnibox').value='חילוץ'; askOmnibox(); };
                    var grid = document.querySelector('.stats-grid');
                    if (grid) grid.parentNode.insertBefore(alertDiv, grid.nextSibling);
                } else if (isRising && !existing) {
                    alertHigh(e0.sgv, nsData.delta);
                    var alertDiv2 = document.createElement('div');
                    alertDiv2.id  = 'rising-alert';
                    alertDiv2.style.cssText = 'background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;cursor:pointer';
                    alertDiv2.innerHTML = '📈 סוכר <b>'+e0.sgv+'</b> ועולה +'+nsData.delta+'/5דק — <b style="color:#f59e0b">לחץ לבדיקת תיקון</b>';
                    alertDiv2.onclick = function(){ if(typeof askGeminiAdvisor==='function') askGeminiAdvisor('כמה להזריק לתיקון?'); };
                    var grid2 = document.querySelector('.stats-grid');
                    if (grid2) grid2.parentNode.insertBefore(alertDiv2, grid2.nextSibling);
                } else if (!isRising && !isLow && existing) {
                    existing.remove();
                }
            }
        }

        // ── DeviceStatus: IOB + COB + בזאלי + recommendedBolus ──
        if (devRes.ok) {
            var dd  = await devRes.json();
            var dev = Array.isArray(dd) ? dd[0] : dd;
            if (dev) {
                fullHistory.devStatus = dev;

                // Override
                var ovData = dig(dev,'loop.override') || dig(dev,'override');
                if (ovData && ovData.active) {
                    nsData.overrideActive     = true;
                    nsData.overrideName       = ovData.name || ovData.currentCorrectionRange || 'תוכנית פעילה';
                    nsData.overrideMultiplier = ovData.multiplier || null;
                    nsData._overrideRaw       = ovData;
                } else {
                    nsData.overrideActive = false; nsData.overrideName = null;
                    nsData.overrideMultiplier = null; nsData._overrideRaw = ovData || null;
                }
                var ovEl    = document.getElementById('override-status');
                var ovValEl = document.getElementById('override-status-val');
                if (ovEl && ovValEl) {
                    if (nsData.overrideActive) {
                        var pct = nsData.overrideMultiplier ? Math.round(nsData.overrideMultiplier*100)+'%' : '';
                        ovValEl.textContent = nsData.overrideName + (pct?' — '+pct:'');
                        ovValEl.style.color = '#f59e0b'; ovValEl.style.fontWeight = '700';
                        ovEl.style.background = 'rgba(245,158,11,0.1)'; ovEl.style.border = '1px solid #f59e0b';
                    } else {
                        ovValEl.textContent = 'אין'; ovValEl.style.color='var(--muted)'; ovValEl.style.fontWeight='normal';
                        ovEl.style.background='rgba(107,107,128,0.08)'; ovEl.style.border='none';
                    }
                }

                // IOB
                var iobPaths = ['openaps.iob.iob','openaps.suggested.IOB','openaps.enacted.IOB',
                                'loop.iob.iob','loop.iob.value','pump.iob.bolusiob','pump.iob'];
                var iobRaw = null;
                for (var i=0; i<iobPaths.length; i++) {
                    iobRaw = dig(dev, iobPaths[i]);
                    if (iobRaw !== null) break;
                }
                nsData.iob = iobRaw !== null ? parseFloat(iobRaw).toFixed(2) : '0.00';
                var iobEl = document.getElementById('stat-iob');
                if (iobEl) iobEl.innerText = nsData.iob;

                // COB
                var cobPaths = ['openaps.iob.activity','openaps.meal.carbs',
                                'openaps.suggested.COB','openaps.enacted.COB',
                                'loop.cob.cob','loop.cob','cob','COB'];
                var cobRaw = null;
                for (var j=0; j<cobPaths.length; j++) {
                    var cv = dig(dev, cobPaths[j]);
                    if (cv===null||cv===undefined) continue;
                    if (typeof cv==='object'&&cv.cob!==undefined) cv=cv.cob;
                    if (typeof cv==='number'||(typeof cv==='string'&&!isNaN(cv))) { cobRaw=parseFloat(cv); break; }
                }
                nsData.cob = cobRaw !== null ? parseFloat(parseFloat(cobRaw).toFixed(1)) : 0;

                // בזאלי — enacted תחילה, אחר-כך fallback
                var enacted = dig(dev,'loop.enacted');
                if (enacted && enacted.rate !== undefined && enacted.rate !== null) {
                    nsData.basal = parseFloat(enacted.rate).toFixed(3);
                }
                var basalPaths = ['openaps.enacted.rate','openaps.suggested.rate',
                                  'loop.recommendedTempBasal.rate','loop.enacted.rate',
                                  'pump.extended.TBRRate','pump.basal.rate'];
                if (!parseFloat(nsData.basal)) {
                    for (var k=0; k<basalPaths.length; k++) {
                        var br = dig(dev, basalPaths[k]);
                        if (br !== null) { nsData.basal = br; break; }
                    }
                }
                var basalEl = document.getElementById('stat-basal');
                if (basalEl) basalEl.innerText = nsData.basal;

                // recommendedBolus החי
                var lb = dig(dev,'loop.recommendedBolus') ||
                         dig(dev,'loop.recommendation.bolus') ||
                         dig(dev,'openaps.suggested.bolus');
                nsData.loopRec          = lb !== null ? parseFloat(lb) : null;
                nsData.recommendedBolus = nsData.loopRec !== null ? nsData.loopRec : 0;

                // Override banner
                var ovBannerEl = document.getElementById('override-banner');
                if (ovBannerEl) {
                    if (nsData.overrideActive) {
                        ovBannerEl.style.display = 'block';
                        ovBannerEl.innerText = '🔄 ' + (nsData.overrideName||'Override פעיל');
                    } else { ovBannerEl.style.display = 'none'; }
                }

                // School badge
                var schoolBadge = document.getElementById('school-badge');
                if (schoolBadge) schoolBadge.style.display = isSchoolProfile() ? 'inline' : 'none';

                // Battery
                var batWarnEl = document.getElementById('battery-warn');
                if (batWarnEl) {
                    var batWarns = [];
                    if (nsData.pumpBattery!==undefined && nsData.pumpBattery<25)
                        batWarns.push('🔋 משאבה: '+nsData.pumpBattery+'%');
                    if (nsData.phoneBattery!==undefined && nsData.phoneBattery<20)
                        batWarns.push('📱 טלפון: '+nsData.phoneBattery+'%');
                    if (batWarns.length) {
                        batWarnEl.style.display='block'; batWarnEl.innerText=batWarns.join(' | ');
                        if (nsData.pumpBattery<15)
                            sendNotification('🔋 סוללת משאבה נמוכה!', nsData.pumpBattery+'% — טען עכשיו',{tag:'loopie-battery',requireInteraction:true});
                    } else { batWarnEl.style.display='none'; }
                }
            }
        }

        // ── פרופיל ──
        if (profRes.ok) {
            var pd   = await profRes.json();
            var prof = Array.isArray(pd) ? pd[0] : pd;
            if (prof && prof.store) {
                var sName = prof.defaultProfile || Object.keys(prof.store)[0];
                fullHistory.profile = prof.store[sName];
                if (!parseFloat(nsData.basal)) {
                    var bNow = profileValueAt(fullHistory.profile.basal, new Date().getHours());
                    if (bNow) { nsData.basal = bNow; var be2=document.getElementById('stat-basal'); if(be2) be2.innerText=bNow; }
                }
            } else if (prof) { fullHistory.profile = prof; }
        }

        loadHistory();
        checkActiveActivity();
        checkPendingDose();
        checkPodFailure();
        try { checkSensorHealth(); } catch(e) {}
        try { autoDetectNewDevices(); } catch(e) {}
        try { _swNotify(nsData.currentSgv||0, nsData.trend||''); } catch(e) {}
        try { checkProactiveAlerts(); } catch(e) {}

        // בדיקת חוב פחמימות (חוק ה-3)
        try {
            var debtRaw = localStorage.getItem('active_debt');
            if (debtRaw) {
                var debt = JSON.parse(debtRaw);
                if (debt.status === 'open') {
                    var sgvNow  = nsData.currentSgv || 0;
                    var trendNow = nsData.trend || '';
                    var rising  = ['SingleUp','DoubleUp','FortyFiveUp'].indexOf(trendNow) >= 0;
                    if (sgvNow > 150 && rising) {
                        var cr    = nsData.cr || 15;
                        var debtU = Math.round(debt.carbs / cr * 10) / 10;
                        sendLocalPush('⏰ חוק ה-3 — זמן להשלמה!',
                            'זיהיתי עלייה מ'+debt.meal+'! הזרק עוד '+debt.carbs+'g = '+debtU+'U');
                        showPopup('⏰ זמן להשלמה!',
                            "<div style='font-size:14px;text-align:right'>זיהיתי עלייה מה<b>"+debt.meal+"</b>!<br><br>"+
                            "הזרק השלמה:<br><b>"+debt.carbs+"g = "+debtU+"U</b><br><br>"+
                            "<button onclick='_closeDebt()' style='width:100%;padding:10px;background:#10b981;border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer'>✅ הזרקתי — סגור חוב</button></div>");
                    }
                    var prevIob = parseFloat(localStorage.getItem('_lastIob')||'0');
                    var currIob = parseFloat(nsData.iob||'0');
                    if (currIob > prevIob + 0.3) { debt.status='closed'; localStorage.setItem('active_debt',JSON.stringify(debt)); }
                    localStorage.setItem('_lastIob', String(currIob));
                }
            }
        } catch(e) {}

        // בדיקת כשל פוד מהיר
        try {
            var sgvCheck  = nsData.currentSgv || 0;
            var iobCheck  = parseFloat(nsData.iob||'0');
            var prevIobPod = parseFloat(localStorage.getItem('_prevIobPod')||'0');
            var podAge    = _lastKnownCage || 0;
            if (sgvCheck>250 && iobCheck>1.0 && Math.abs(iobCheck-prevIobPod)<0.1 && podAge>48)
                sendLocalPush('🚨 חשד לכשל פוד!','סוכר '+sgvCheck+' לא יורד למרות '+iobCheck+'U. החלף פוד!');
            localStorage.setItem('_prevIobPod', String(iobCheck));
        } catch(e) {}

    } catch(e) { console.error('fetchData error:', e); }
}

function _closeDebt() {
    try { var d=JSON.parse(localStorage.getItem('active_debt')||'{}'); d.status='closed'; localStorage.setItem('active_debt',JSON.stringify(d)); } catch(e) {}
    closePopup();
}

async function loadHistory() {
    try {
        var dayAgo = new Date(Date.now()-86400000).toISOString();
        var mo3Ago = new Date(Date.now()-90*86400000).toISOString();
        var [ent, treat] = await Promise.all([
            nsGet('/api/v1/entries.json?find[dateString][$gte]='+dayAgo+'&count=500').then(function(r){return r.json();}).catch(function(){return [];}),
            nsGet('/api/v1/treatments.json?find[created_at][$gte]='+dayAgo+'&count=200').then(function(r){return r.json();}).catch(function(){return [];})
        ]);
        fullHistory.entries    = ent;
        fullHistory.treatments = treat;
    } catch(e) {}
}

async function doRefresh() {
    var btn = document.getElementById('refreshBtn');
    if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span>'; }
    try { await fetchData(); setTimeout(function(){ if(btn){btn.innerHTML='🔄 רענן נתונים';btn.disabled=false;} },1500); }
    catch(e) { setTimeout(function(){ if(btn){btn.innerHTML='🔄 רענן נתונים';btn.disabled=false;} },2000); }
}


// ─── NS Monitor ───────────────────────────────────────────────
var _lastMonitorCheck    = Date.now();
var _monitorTimer        = null;
var _lastKnownTreatments = [];

async function startNSMonitor() {
    if (_monitorTimer) clearInterval(_monitorTimer);
    var initRes = await nsGet('/api/v1/treatments.json?count=5');
    if (initRes.ok) { _lastKnownTreatments = await initRes.json(); _lastMonitorCheck = Date.now(); }
    _monitorTimer = setInterval(checkNSActions, 90000);
}

async function checkNSActions() {
    try {
        var since = new Date(_lastMonitorCheck - 5000).toISOString();
        var res   = await nsGet('/api/v1/treatments.json?find[created_at][$gte]='+since+'&count=20');
        if (!res.ok) return;
        var newTreats = await res.json();
        _lastMonitorCheck = Date.now();
        var knownIds = _lastKnownTreatments.map(function(t){ return t._id; });

        newTreats.forEach(function(t) {
            if (knownIds.includes(t._id)) return;
            var ev = (t.eventType||'').toLowerCase();
            if (ev.includes('site')||ev.includes('pod')||ev.includes('cannula')) {
                INSULIN_CONFIG.primingActive = true;
                INSULIN_CONFIG.primingTime   = new Date(t.created_at).getTime();
                setTimeout(function(){ INSULIN_CONFIG.primingActive=false; }, 30*60000);
            }
        });

        var fresh = newTreats.filter(function(t) {
            if (knownIds.includes(t._id)) return false;
            if (!t.insulin || t.insulin<=0) return false;
            var ev2 = (t.eventType||'').toLowerCase();
            if (ev2.includes('smb')||ev2.includes('microbolus')) return false;
            if (parseFloat(t.insulin||0)<0.5 && !t.carbs) return false;
            return true;
        });
        if (!fresh.length) return;
        _lastKnownTreatments = newTreats;
        fresh.forEach(function(t){ analyzeNewTreatment(t); });
    } catch(e) { console.error('NSMonitor error:', e); }
}

async function analyzeNewTreatment(t) {
    var ins   = parseFloat(t.insulin) || 0;
    var carbs = t.carbs || 0;
    var notes = t.notes || '';
    if (notes && LAST_FOOD_QUERY) {
        var noteEmojis = extractEmojis(notes);
        noteEmojis.forEach(function(em){ learnEmoji(em, LAST_FOOD_QUERY); });
    }
}


// ─── פעילויות / ספורט ────────────────────────────────────────
function saveActivities() {
    try {
        localStorage.setItem('loopie_activities', JSON.stringify(ACTIVITIES));
        saveMemory('activities', ACTIVITIES).catch(function(){});
    } catch(e) {}
}

function addActivity() {
    var name  = (document.getElementById('act-name')||{value:''}).value.trim();
    var day   = parseInt((document.getElementById('act-day')||{value:0}).value||0);
    var from  = (document.getElementById('act-from')||{value:''}).value.trim();
    var to    = (document.getElementById('act-to')||{value:''}).value.trim();
    var intens= (document.getElementById('act-intensity')||{value:'medium'}).value||'medium';
    if (!name) { showPopup('⚠️ שגיאה','נא למלא שם פעילות'); return; }
    if (from && !from.includes(':')) from=from+':00';
    if (to   && !to.includes(':'))   to=to+':00';
    if (!from) from='16:00';
    if (!to)   to='17:00';
    var act = { id:Date.now(), name:name, day:day, from:from, to:to, intensity:intens };
    ACTIVITIES.push(act);
    saveActivities();
    renderActivities();
    document.getElementById('act-name').value='';
    document.getElementById('act-from').value='';
    document.getElementById('act-to').value='';
    showPopup('✅ נשמר!','פעילות <b>'+name+'</b> נוספה:<br>יום '+DAYS_HE[day]+' '+from+'–'+to+'<br><b>'+INTENSITY_LABELS[intens]+'</b>');
}

function deleteActivity(id) {
    ACTIVITIES = ACTIVITIES.filter(function(a){ return a.id!==id; });
    saveActivities(); renderActivities(); checkActiveActivity();
}

function renderActivities() {
    var list = document.getElementById('activity-list');
    if (!list) return;
    if (!ACTIVITIES.length) { list.innerHTML='<div style="color:var(--muted);font-size:13px">אין פעילויות שמורות</div>'; return; }
    function _intLabel(v) {
        if (!v) return INTENSITY_LABELS['medium']||'בינונית';
        var e=v.toLowerCase();
        if (e==='גבוהה'||e==='high')   return INTENSITY_LABELS['high'];
        if (e==='נמוכה'||e==='low')    return INTENSITY_LABELS['low'];
        return INTENSITY_LABELS['medium'];
    }
    list.innerHTML = ACTIVITIES.map(function(a){
        return "<div class='activity-item'><div class='act-info'><div class='act-name'>"+a.name+
               " <small style='color:var(--muted)'>("+_intLabel(a.intensity)+")</small></div>"+
               "<div class='act-time'>יום "+DAYS_HE[a.day]+" | "+a.from+"–"+a.to+"</div></div>"+
               "<div style='display:flex;gap:4px'>"+
               "<button class='act-del' onclick='editActivity("+a.id+")' style='background:rgba(59,130,246,0.15);border:1px solid var(--blue-dim);color:var(--blue)'>📝</button>"+
               "<button class='act-del' onclick='deleteActivity("+a.id+")'>🗑</button></div></div>";
    }).join('');
}

function editActivity(id) {
    var a = ACTIVITIES.find(function(x){ return x.id===id; });
    if (!a) return;
    var html = "<div style='font-size:14px;text-align:right'><b>"+a.name+"</b> — יום "+DAYS_HE[a.day]+"<br><br>עצימות:<br><div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 0'>";
    ['low','medium','high'].forEach(function(k){
        var lbl=INTENSITY_LABELS[k]; var cur=(a.intensity===k||a.intensity===lbl);
        html+="<button onclick='_setIntensity("+id+",\""+k+"\")' style='padding:8px;border-radius:8px;border:2px solid "+(cur?'#10b981':'var(--border)')+";background:"+(cur?'rgba(16,185,129,0.15)':'transparent')+";color:"+(cur?'#10b981':'var(--muted)')+";cursor:pointer'>"+lbl+"</button>";
    });
    html+="</div>שעות: <input id='_editFrom' value='"+a.from+"' style='width:70px;background:#111;border:1px solid var(--border);color:#fff;border-radius:6px;padding:4px;direction:ltr'>";
    html+=" – <input id='_editTo' value='"+a.to+"' style='width:70px;background:#111;border:1px solid var(--border);color:#fff;border-radius:6px;padding:4px;direction:ltr'><br><br>";
    html+="<button onclick='_saveEditActivity("+id+")' style='width:100%;padding:10px;background:#10b981;border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer'>✅ שמור</button></div>";
    showPopup('📝 עריכת חוג', html);
}

function _setIntensity(id, val) {
    var a=ACTIVITIES.find(function(x){return x.id===id;});
    if(a){a.intensity=val;try{localStorage.setItem('loopie_activities',JSON.stringify(ACTIVITIES));}catch(e){}renderActivities();editActivity(id);}
}

function _saveEditActivity(id) {
    var a=ACTIVITIES.find(function(x){return x.id===id;});
    var f=document.getElementById('_editFrom'), t=document.getElementById('_editTo');
    if(a&&f&&t){a.from=f.value.trim();a.to=t.value.trim();try{localStorage.setItem('loopie_activities',JSON.stringify(ACTIVITIES));}catch(e){}renderActivities();closePopup();}
}

function checkActiveActivity() {
    var now=new Date(), dayN=now.getDay(), nowMin=now.getHours()*60+now.getMinutes();
    var banner=document.getElementById('activity-banner');
    if(!banner) return null;
    var active=null, upcoming=null;
    ACTIVITIES.forEach(function(a){
        if(a.day!==dayN) return;
        var sp=SPORT_PLANS[a.intensity]||SPORT_PLANS.medium;
        var fromMin=parseInt(a.from.split(':')[0])*60+parseInt(a.from.split(':')[1]);
        var toMin  =parseInt(a.to.split(':')[0])*60+parseInt(a.to.split(':')[1]);
        if(nowMin>=fromMin&&nowMin<=toMin)       active   ={act:a,sp:sp,type:'during',fromMin:fromMin,toMin:toMin};
        else if(nowMin<fromMin&&(fromMin-nowMin)<=Math.max(sp.basalPre,60)) upcoming={act:a,sp:sp,type:'before',minsLeft:fromMin-nowMin};
        else if(nowMin>toMin&&(nowMin-toMin)<=sp.postDurationH*60)          active   ={act:a,sp:sp,type:'after',minsAgo:nowMin-toMin};
    });
    var result=active||upcoming;
    if(result){
        var a=result.act, sp=result.sp, msg='', color='#f59e0b';
        if(result.type==='before'){
            msg="<b>⏰ "+a.name+"</b> בעוד "+result.minsLeft+" דק'<br>";
            if(sp.basalReduction>0&&result.minsLeft<=sp.basalPre){var curBB=parseFloat(nsData.basal)||0;var redBB=curBB>0?roundBasal(curBB*(1-sp.basalReduction/100)):null;msg+="• הפחת בזאלי: "+(curBB>0?"⬇️ "+curBB+" → <b>"+redBB+" U/hr</b>":"⬇️ <b>"+sp.basalReduction+"%</b>")+"<br>";}
            msg+="• יעד סוכר לאימון: <b>"+sp.targetBGRange+"</b><br>";
            if(sp.preCarbsG>0&&nsData.currentSgv&&nsData.currentSgv<140) msg+="• 🍬 אכול <b>"+sp.preCarbsG+"g</b> פחמימות מהירות לפני<br>";
        } else if(result.type==='during'){
            color='#10b981';
            msg="<b>🏃 "+a.name+" פעיל עכשיו</b> (נגמר בעוד "+(result.toMin-nowMin)+" דק')<br>";
            msg+="• יעד: <b>"+sp.targetBGRange+"</b>"+(sp.noBolusRule?" | <b style='color:#ef4444'>אל תזריק אינסולין!</b>":"")+"<br>";
        } else {
            color='#3b82f6';
            msg="<b>✅ "+a.name+"</b> הסתיים לפני "+result.minsAgo+" דק'<br>";
            var curBPost=parseFloat(nsData.basal)||0, redBPost=curBPost>0?roundBasal(curBPost*(1-sp.postReduction/100)):null;
            var hoursLeft=((sp.postDurationH*60-result.minsAgo)/60).toFixed(1);
            msg+="• ⚠️ <b>סכנת היפו!</b> הפחת בזאלי: "+(curBPost>0?"⬇️ "+curBPost+" → <b>"+redBPost+" U/hr</b> (-"+sp.postReduction+"%) ":"⬇️ <b>-"+sp.postReduction+"%</b> ")+"עוד "+hoursLeft+" שעות<br>";
            msg+="• אל תזריק בולוס מלא — בדוק סוכר תחילה";
        }
        banner.innerHTML="<div class='act-active-banner' style='border-color:"+color+";background:rgba(0,0,0,0.2)'>"+msg+"</div>";
    } else { banner.innerHTML=''; }
    return result;
}

function getActivityReduction() {
    var now=new Date(), dayN=now.getDay(), nowMin=now.getHours()*60+now.getMinutes();
    var factor=1.0, note='';
    ACTIVITIES.forEach(function(a){
        if(a.day!==dayN) return;
        var sp=SPORT_PLANS[a.intensity]||SPORT_PLANS.medium;
        var fromMin=parseInt(a.from.split(':')[0])*60+parseInt(a.from.split(':')[1]);
        var toMin  =parseInt(a.to.split(':')[0])*60+parseInt(a.to.split(':')[1]);
        if(nowMin>=fromMin&&nowMin<=toMin){ factor=1-INTENSITY_REDUCTION[a.intensity]/100; note="אימון "+a.name+" פעיל"; }
        else if(nowMin>toMin&&(nowMin-toMin)<=sp.postDurationH*60){ factor=1-POST_ACTIVITY_REDUCTION[a.intensity]/100; note="לאחר אימון "+a.name; }
    });
    return { factor:factor, note:note };
}

// Pod management
function podChanged() {
    INSULIN_CONFIG.primingActive=true; INSULIN_CONFIG.primingTime=Date.now();
    var p1=INSULIN_CONFIG.primingDose1, p2=INSULIN_CONFIG.primingDose2;
    var html="<div style='background:rgba(59,130,246,0.1);border:1px solid var(--blue);border-radius:10px;padding:14px;margin-bottom:12px'>";
    html+="<b style='color:var(--blue)'>🔄 מצב אתחול פוד פעיל</b><br><br>• הזרקה ראשונה: <b>"+p1+"U</b><br>• הזרקה שנייה: <b>"+p2+"U</b><br>• סה'כ: <b>"+(p1+p2).toFixed(2)+"U</b></div>";
    html+="<div style='font-size:13px;color:#aaa'>⚠️ הpriming לא נספר ב-IOB.<br>📌 ההזרקה הבאה תכלול תוספת "+p2+"U.</div>";
    html+="<br><button onclick='INSULIN_CONFIG.primingActive=false;closePopup()' style='width:100%;padding:10px;background:rgba(16,185,129,0.15);border:1px solid #10b981;border-radius:8px;cursor:pointer;color:#10b981;font-size:13px;font-weight:600'>✅ הפוד מוכן — המשך</button>";
    showPopup('🔄 פוד חדש הותקן', html);
    setTimeout(function(){ INSULIN_CONFIG.primingActive=false; }, 30*60000);
}

function getPrimingAddon() {
    if (!INSULIN_CONFIG.primingActive) return 0;
    var minsElapsed = (Date.now() - (INSULIN_CONFIG.primingTime||0)) / 60000;
    return minsElapsed < 30 ? INSULIN_CONFIG.primingDose2 : 0;
}

var _lastKnownCage = null, _lastKnownSage = null;
var POD_ALERT_SENT = false;

async function autoDetectNewDevices() {
    try {
        var dsRes = await nsGet('/api/v1/devicestatus.json?count=1');
        if (!dsRes.ok) return;
        var dsArr = await dsRes.json();
        var ds    = Array.isArray(dsArr) ? dsArr[0] : dsArr;
        if (!ds) return;
        var dsStr  = JSON.stringify(ds);
        var cMatch = dsStr.match(/"cage"\s*:\s*([\d.]+)/i);
        var sMatch = dsStr.match(/"sage"\s*:\s*([\d.]+)/i);
        var cageVal = cMatch ? parseFloat(cMatch[1]) : null;
        var sageVal = sMatch ? parseFloat(sMatch[1]) : null;

        if (cageVal!==null && _lastKnownCage!==null && _lastKnownCage>2 && cageVal<2) {
            INSULIN_CONFIG.primingActive=true; INSULIN_CONFIG.primingTime=Date.now()-cageVal*3600000;
            setTimeout(function(){ INSULIN_CONFIG.primingActive=false; }, 30*60000);
            sendNotification('🔄 פוד חדש זוהה!','CAGE = '+cageVal.toFixed(1)+'h — priming פעיל',{tag:'loopie-pod-new'});
        }
        if (sageVal!==null && _lastKnownSage!==null && _lastKnownSage>24 && sageVal<3)
            sendNotification('📡 חיישן חדש זוהה!','SAGE = '+sageVal.toFixed(1)+'h — 24ש\' ראשונות פחות מדויק',{tag:'loopie-sensor-new'});
        _lastKnownCage=cageVal; _lastKnownSage=sageVal;
    } catch(e) {}
}

async function checkPodFailure() {
    if (POD_ALERT_SENT) return;
    var sgv=nsData.currentSgv, iob=parseFloat(nsData.iob)||0, dlt=nsData.delta||0;
    if (!sgv) return;
    try {
        var since90 = new Date(Date.now()-90*60000).toISOString();
        var res = await nsGet('/api/v1/treatments.json?find[created_at][$gte]='+since90+'&count=10');
        if (!res.ok) return;
        var treats = await res.json();
        var recentBolus = treats.filter(function(t){ return t.insulin>0; });
        if (!recentBolus.length) return;
        var lastBolus = recentBolus[0];
        var bolusIns  = parseFloat(lastBolus.insulin)||0;
        var bolusAgo  = (Date.now()-new Date(lastBolus.created_at).getTime())/60000;
        var eRes = await nsGet('/api/v1/entries.json?find[dateString][$gte]='+new Date(lastBolus.created_at).toISOString()+'&count=3');
        var entries = eRes.ok ? await eRes.json() : [];
        var sgvAtBolus = entries.length ? entries[entries.length-1].sgv : sgv;
        var failureScore=0, failureReasons=[];
        if (bolusAgo>45&&iob>bolusIns*0.5) {
            var actualChange=sgv-sgvAtBolus;
            if (sgv>250&&actualChange>30) { failureScore+=3; failureReasons.push('הוזרק '+bolusIns+'U לפני '+Math.round(bolusAgo)+' דק\' — סוכר '+sgv+' עלה +'+actualChange); }
            else if (sgv>200&&actualChange>50&&bolusIns>2) { failureScore+=2; failureReasons.push('הוזרק '+bolusIns+'U — עלייה חדה של '+actualChange+' mg/dL'); }
        }
        if (iob>3&&sgv>250&&dlt>=3) { failureScore+=2; failureReasons.push('IOB='+iob+'U אבל סוכר '+sgv+' ועולה +'+dlt+'/5דק\''); }
        if (sgv>320&&iob>2&&bolusAgo>30) { failureScore+=3; failureReasons.push('סוכר '+sgv+' עם IOB '+iob+'U — אין ספיגה!'); }
        if (dlt>=5&&iob>3&&bolusAgo>30&&sgv>200) { failureScore+=2; failureReasons.push('עלייה חדה מאוד +'+dlt+'/5דק\' למרות IOB '+iob+'U'); }
        if (failureScore>=3) { POD_ALERT_SENT=true; showPodFailureAlert(failureReasons,bolusIns,bolusAgo,sgvAtBolus,sgv); }
        if (POD_ALERT_SENT&&sgv<180&&sgv>70) POD_ALERT_SENT=false;
    } catch(e) {}
}

function showPodFailureAlert(reasons, bolusIns, bolusAgo, sgvBefore, sgvNow) {
    var html = "<div style='font-size:13px;text-align:right'>"+
        "🚨 <b>חשד לכשל פוד!</b><br><br>"+
        reasons.map(function(r){ return "• "+r; }).join('<br>')+"<br><br>"+
        "• החלף פוד עכשיו<br>• אם IOB גבוה — השגח על סוכר נמוך אחרי החלפה<br>• צור קשר עם הרופא אם לא בטוח"+
        "</div>";
    showPopup('🚨 כשל פוד אפשרי', html);
    alertPodFailure();
}

async function checkSensorHealth() {
    // מבוסס על גיל חיישן מ-CAGE/SAGE
    if (_lastKnownSage && _lastKnownSage > 13*24) {
        sendNotification('📡 זמן להחלפת חיישן', 'חיישן פעיל '+Math.round(_lastKnownSage/24)+' ימים — שקול החלפה', {tag:'loopie-sensor-age'});
    }
}


// ─── Gmail Import ─────────────────────────────────────────────
var GMAIL_TOKEN = null;

async function importFromGmail(token) {
    if (!token) return;
    GMAIL_TOKEN = token;
    localStorage.setItem('loopie_gmail_token', token);
    var keywords = (localStorage.getItem('loopie_keywords')||'חוג,mma,כדורגל').split(',').map(function(k){return k.trim();});
    var query    = encodeURIComponent(keywords.join(' OR '));
    showPopup('📧 מחפש חוגים...','<div style="text-align:center;padding:20px"><span class="spinner" style="width:20px;height:20px;border-width:3px"></span></div>');
    try {
        var listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q='+query+'&maxResults=20',
            { headers:{ Authorization:'Bearer '+token } });
        if (!listRes.ok) throw new Error('Gmail API error: '+listRes.status);
        var listData = await listRes.json();
        var messages = listData.messages || [];
        if (!messages.length) { showPopup('📧 Gmail','לא נמצאו מיילים עם מילות המפתח.'); return; }
        var found = [];
        for (var i=0; i<Math.min(messages.length,10); i++) {
            try {
                var msgRes  = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+messages[i].id+'?format=metadata&metadataHeaders=Subject,From,Date',
                    { headers:{ Authorization:'Bearer '+token } });
                var msgData = await msgRes.json();
                var subject='', date='';
                (msgData.payload.headers||[]).forEach(function(h){ if(h.name==='Subject') subject=h.value; if(h.name==='Date') date=h.value; });
                found.push({ subject:subject, date:new Date(date).toLocaleDateString('he-IL') });
            } catch(e2) {}
        }
        var prompt = 'אתה עוזר לניהול לוח זמנים. קיבלת רשימת כותרות מיילים.\n'+
            'חלץ מהם חוגים/אימונים עם יום, שעה ושם.\n'+
            'החזר JSON בלבד: [{"name":"שם","day":0-6,"from":"HH:MM","to":"HH:MM","intensity":"low/medium/high"}]\n'+
            'יום 0=ראשון, 1=שני...\nאם אין מידע על שעה — דלג על הפריט.\n\nמיילים:\n'+
            found.map(function(f,i){ return (i+1)+'. '+f.subject; }).join('\n');
        var aiRes  = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+geminiKey(),
            { method:'POST', headers:{'Content-Type':'application/json'},
              body:JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:500,temperature:0.0} }) });
        var aiData = await aiRes.json();
        var rawText='';
        try { rawText=aiData.candidates[0].content.parts[0].text.trim(); } catch(e2) {}
        var jsonMatch=rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON from AI');
        var activities=JSON.parse(jsonMatch[0]);
        if (!activities.length) { showPopup('📧 Gmail','נמצאו '+found.length+' מיילים אבל לא זוהו חוגים עם שעות.'); return; }
        var added=0;
        activities.forEach(function(a){
            if(!a.name||a.day===undefined||!a.from||!a.to) return;
            var exists=ACTIVITIES.find(function(ex){ return ex.name===a.name&&ex.day===a.day; });
            if(!exists){ ACTIVITIES.push({id:Date.now()+added,name:a.name,day:a.day,from:a.from,to:a.to,intensity:a.intensity||'medium'}); added++; }
        });
        saveActivities(); renderActivities(); checkActiveActivity();
        showPopup('✅ יובאו חוגים','נמצאו '+found.length+' מיילים.<br>יובאו <b>'+added+' חוגים חדשים</b>:<br><br>'+
            activities.map(function(a){ return '• <b>'+a.name+'</b> | '+DAYS_HE[a.day]+' '+(a.from||'')+'–'+(a.to||''); }).join('<br>'));
    } catch(e) { showPopup('שגיאה','שגיאה בייבוא: '+e.message); }
}

// קליטת token מ-URL hash (OAuth2 redirect)
(function() {
    var hash = location.hash;
    if (hash.includes('access_token')) {
        var tokenMatch = hash.match(/access_token=([^&]+)/);
        if (tokenMatch) {
            var tk = tokenMatch[1];
            setTimeout(function(){ importFromGmail(tk); }, 1000);
            history.replaceState(null, '', location.pathname);
        }
    }
})();

function showGmailSetup() {
    var savedEmail = localStorage.getItem('loopie_email') || '';
    var html = "<div style='font-size:14px;text-align:right'>"+
        "כדי לייבא חוגים מ-Gmail:<br><br>"+
        "1. הזן כתובת מייל<br>"+
        "2. לחץ חבר Gmail<br>"+
        "3. אשר גישה לחשבון גוגל<br><br>"+
        "<small style='color:#888'>מילות חיפוש אפשר לשנות בהגדרות</small></div>";
    showPopup('📧 חיבור Gmail', html);
}

function connectGmail() { showGmailSetup(); }

// ─── Google Calendar ──────────────────────────────────────────
async function connectGoogleCalendar() {
    var CLIENT_ID = '';
    if (!CLIENT_ID) {
        showPopup('גוגל קלנדר',
            'כדי לחבר גוגל קלנדר:<br><br>'+
            '1. גש ל-<b>console.cloud.google.com</b><br>'+
            '2. צור פרויקט חדש<br>'+
            '3. הפעל Google Calendar API<br>'+
            '4. צור OAuth 2.0 Client ID (Web App)<br>'+
            '5. הכנס את ה-Client ID בקוד<br><br>'+
            '<small style="color:#888">לחלופין, הוסף פעילויות ידנית</small>');
        return;
    }
    var scope    = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
    var redirect = encodeURIComponent(location.origin + location.pathname);
    location.href = 'https://accounts.google.com/o/oauth2/auth?client_id='+CLIENT_ID+'&redirect_uri='+redirect+'&response_type=token&scope='+scope;
}

async function fetchGoogleCalendarEvents(token) {
    if (!token) return;
    try {
        var now   = new Date().toISOString();
        var week  = new Date(Date.now()+7*86400000).toISOString();
        var res   = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+now+'&timeMax='+week+'&singleEvents=true&orderBy=startTime',
            { headers:{ Authorization:'Bearer '+token } });
        if (!res.ok) return;
        var data   = await res.json();
        var events = data.items || [];
        if (!events.length) { showPopup('📅 גוגל קלנדר','לא נמצאו אירועים בשבוע הקרוב.'); return; }
        var html = "<div style='font-size:13px;text-align:right'>";
        events.slice(0,10).forEach(function(ev){
            var start = ev.start.dateTime || ev.start.date;
            var d = new Date(start);
            html += '• <b>'+ev.summary+'</b> — '+d.toLocaleDateString('he-IL')+' '+d.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false})+'<br>';
        });
        html += '</div>';
        showPopup('📅 אירועים קרובים', html);
    } catch(e) { console.error('Calendar fetch:', e); }
}


// ─── Notifications ────────────────────────────────────────────
var _notifPermission = 'default';
var _swReg = null;

// ── Service Worker Registration ──────────────────────────────
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(function(reg) {
            console.log('✅ Service Worker רשום:', reg.scope);
            _swReg = reg;
        })
        .catch(function(err) {
            console.warn('⚠️ Service Worker נכשל (ממשיך בלעדיו):', err.message);
        });
}

// ── בקשת הרשאת התראות ────────────────────────────────────────
if ('Notification' in window) {
    if (Notification.permission === 'granted') {
        _notifPermission = 'granted';
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(p) {
            _notifPermission = p;
            console.log('[Loopie] הרשאת התראות:', p);
        });
    }
}

function _swNotify(sgv, trend) {
    if (_notifPermission!=='granted') return;
    var debtRaw=null;
    try { debtRaw=JSON.parse(localStorage.getItem('active_debt')||'null'); } catch(e){}
    if (sgv<70) new Notification('🚨 התרעת היפו!',{body:'סוכר נוכחי: '+sgv+' — קח גלוקוז מיד!',tag:'loopie-hypo',requireInteraction:true});
    if (sgv>150&&debtRaw&&debtRaw.status==='open') {
        var rising=['SingleUp','DoubleUp','FortyFiveUp'].indexOf(trend)>=0;
        if(rising) new Notification('📋 תזכורת חוק ה-3',{body:'זמן להזריק את חוב הפחמימות שנותר מ'+debtRaw.meal+'!',tag:'loopie-debt',requireInteraction:true});
    }
}

function sendNotification(title, body, options) {
    if (_notifPermission !== 'granted') {
        // נסה לבקש הרשאה אם עדיין לא ניסינו
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(function(p) {
                _notifPermission = p;
                if (p === 'granted') sendNotification(title, body, options);
            });
        }
        return;
    }
    var opts = Object.assign({
        icon:    'https://raw.githubusercontent.com/barakkam/loopie/main/favicon.ico',
        badge:   'https://raw.githubusercontent.com/barakkam/loopie/main/favicon.ico',
        vibrate: [200, 100, 200],
        tag:     'loopie-alert',
        renotify: true,
        requireInteraction: false
    }, options || {});

    try {
        // שלח דרך Service Worker (תומך ב-background + iOS 16.4+ PWA)
        if (_swReg && _swReg.active) {
            // שלח message ל-SW שישלח notification
            _swReg.active.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: title,
                body: body,
                tag: opts.tag || 'loopie-alert',
                requireInteraction: opts.requireInteraction || false,
                urgent: (opts.vibrate && opts.vibrate.length > 3)
            });
        } else if (_swReg && _swReg.showNotification) {
            _swReg.showNotification(title, Object.assign({ body: body }, opts));
        } else {
            var n = new Notification(title, Object.assign({ body: body }, opts));
            n.onclick = function() { window.focus(); n.close(); };
        }
        // גם popup בתוך האפליקציה
        if (typeof showPopup === 'function') {
            setTimeout(function() { showPopup(title, body); }, 100);
        }
    } catch(e) {
        if (typeof showPopup === 'function') showPopup(title, body);
    }
}

function sendLocalPush(title, body) { sendNotification(title, body, {tag:'loopie-local', requireInteraction:true}); }

function alertLow(sgv, delta) {
    var urgent=sgv<70;
    sendNotification(urgent?'🚨 סוכר נמוך מאוד!':'⚠️ סוכר נמוך!',
        'סוכר '+sgv+' mg/dL'+(delta<0?' ויורד '+delta+'/5דק\'':'')+(urgent?' - קח גלוקוז!':''),
        {tag:'loopie-low',requireInteraction:true,vibrate:urgent?[500,100,500,100,500,100,500]:[300,100,300]});
}
function alertHigh(sgv, delta) {
    sendNotification('📈 סוכר גבוה','סוכר '+sgv+' mg/dL'+(delta>0?' ועולה':''),{tag:'loopie-high'});
}
function alertPending(foodName, dose) {
    sendNotification('⏳ הזרק השלמה!',foodName+' — הזרק '+dose+'U',{tag:'loopie-pending',requireInteraction:true});
}
function alertPodFailure() {
    sendNotification('🚨 חשד לכשל פוד!','סוכר לא יורד למרות אינסולין',{tag:'loopie-pod',requireInteraction:true,vibrate:[500,200,500]});
}


// ─── Proactive Alerts ─────────────────────────────────────────
function checkProactiveAlerts() {
    var sgv         = nsData.currentSgv  || 0;
    var iob         = parseFloat(nsData.iob||0);
    var recommended = parseFloat(nsData.loopRec||0);

    // זנב ארוחה שומנית
    if (sgv>165 && iob<1.5 && recommended>0.05) {
        var now2     = Date.now();
        var lastAlert = parseInt(localStorage.getItem('loopie_last_debt_alert')||'0');
        if (now2-lastAlert < 30*60000) return;
        localStorage.setItem('loopie_last_debt_alert', String(now2));
        sendSystemPushNotification('⚠️ התראת חוב ארוחה — Loopie',
            'סוכר '+sgv+' עקשן. המשאבה ממליצה '+recommended+'U. כנס לאייפון לאשר!');
        showPopup('⚠️ זנב ארוחה שומנית',
            "<div style='font-size:14px;text-align:right'>סוכר <b>"+sgv+"</b> עקשן — IOB "+iob.toFixed(2)+"U.<br><br>"+
            "המשאבה ממליצה: <b>"+recommended+"U</b><br>כנס לאייפון ואשר את ההזרקה!</div>");
    }

    // היפו לילי 02:00-05:00
    var hr = new Date().getHours();
    if (sgv<80 && hr>=2 && hr<=5) {
        var lastH = parseInt(localStorage.getItem('loopie_last_hypo_alert')||'0');
        if (Date.now()-lastH > 20*60000) {
            localStorage.setItem('loopie_last_hypo_alert', String(Date.now()));
            sendSystemPushNotification('🚨 היפו לילי — Loopie','סוכר '+sgv+' בשעה '+hr+':00. טפל מיד!');
        }
    }
}

function sendSystemPushNotification(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission==='granted') {
        try { new Notification(title,{body:body,tag:'loopie-proactive',requireInteraction:true}); } catch(e){}
    } else if (Notification.permission!=='denied') {
        Notification.requestPermission().then(function(p){ if(p==='granted') sendSystemPushNotification(title,body); });
    }
}


// ─── Pending Dose ─────────────────────────────────────────────
function checkPendingDose() {
    if (!PENDING_DOSE) return;
    var now   = Date.now();
    var delay = (now - PENDING_DOSE.time) / 60000;
    if (delay >= PENDING_DOSE.delayMin) {
        alertPending(PENDING_DOSE.foodName, PENDING_DOSE.dose);
        PENDING_DOSE = null;
    }
}


// ─── Misc ─────────────────────────────────────────────────────
function clearSaved() {
    localStorage.removeItem('loopie_ns_url');
    localStorage.removeItem('loopie_ns_secret');
    location.reload();
}

function showStatus(msg, type) {
    var el = document.getElementById('status-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = type==='error'?'#ef4444':type==='success'?'#10b981':'#94a3b8';
    el.style.display = 'block';
    setTimeout(function(){ el.style.display='none'; }, 3000);
}
