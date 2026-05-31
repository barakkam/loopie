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
    var q     = input ? input.value.trim() : '';
    var ql    = q.toLowerCase().trim();
    if (!q) return;
    if (input) input.value = '';

    // ── ציוד / פוד / חיישן ──
    if (ql === 'ציוד' || ql === 'פוד' || ql === 'pod' || ql === 'חיישן' ||
        ql.includes('גיל פוד') || ql.includes('גיל חיישן') || ql.includes('החלפ')) {
        await showEquipmentStatus();
        return;
    }

    // ── סטטוס מהיר ──
    if (ql === 'מה המצב' || ql === 'סטטוס' || ql === 'status' || ql === 'מה קורה') {
        var sgv = nsData.currentSgv || 0;
        showPopup('🛡️ סטטוס נוכחי',
            "<div style='font-size:14px;line-height:1.9;text-align:right'>" +
            "🩸 סוכר: <b>" + sgv + "</b> " + (nsData.trend||'') + "<br>" +
            "💉 IOB: <b>" + (parseFloat(nsData.iob)||0).toFixed(2) + "U</b><br>" +
            "🍞 COB: <b>" + (parseFloat(nsData.cob)||0).toFixed(0) + "g</b><br>" +
            "\u23f1 בזאלי: <b>" + (nsData.basal||0) + " U/\u05e9'</b>" +
            (nsData.overrideActive ? "<br>\ud83d\udd04 Override: <b style='color:#f59e0b'>" + nsData.overrideName + "</b>" : "") +
            "</div>");
        return;
    }

    // ── IOB ──
    if (ql === 'iob' || ql === '\u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df \u05e4\u05e2\u05d9\u05dc' || ql === '\u05d0\u05d9\u05d9\u05d5\u05d1') {
        showPopup('\ud83d\udc89 \u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df \u05e4\u05e2\u05d9\u05dc (IOB)',
            "<div style='font-size:16px;text-align:right'>" +
            "<span style='font-size:32px;color:#3b82f6;font-weight:700'>" + (parseFloat(nsData.iob)||0).toFixed(2) + "U</span></div>");
        return;
    }

    // ── COB ──
    if (ql === 'cob' || ql === '\u05e4\u05d7\u05de\u05d9\u05de\u05d5\u05ea \u05e4\u05e2\u05d9\u05dc\u05d5\u05ea' || ql === '\u05db\u05d5\u05d1') {
        showPopup('\ud83c\udf4f COB',
            "<div style='font-size:16px;text-align:right'>" +
            "<span style='font-size:32px;color:#f59e0b;font-weight:700'>" + (parseFloat(nsData.cob)||0).toFixed(0) + "g</span></div>");
        return;
    }

    // ── בזאלי ──
    if (ql === '\u05d1\u05d6\u05d0\u05dc\u05d9' || ql === '\u05d1\u05d6\u05d0\u05dc' || ql === '\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05d1\u05d6\u05d0\u05dc\u05d9\u05ea') {
        var prof    = fullHistory && fullHistory.profile;
        var basalNow = nsData.basal || 0;
        var basalArr = prof && Array.isArray(prof.basal) ? prof.basal : null;
        var toMin = function(t){ var p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]||0); };
        var rows = basalArr
            ? basalArr.map(function(b,i){
                var nx = basalArr[i+1] ? basalArr[i+1].time : '24:00';
                return '\u2022 ' + b.time + '\u2013' + nx + ': <b>' + b.value + " U/\u05e9'</b>";
              }).join('<br>')
            : "\u2022 00:00\u201324:00: <b>" + basalNow + " U/\u05e9'</b>";
        var totalDaily = 0;
        if (basalArr) {
            basalArr.forEach(function(b,i){
                var nx = basalArr[i+1] || {time:'24:00'};
                totalDaily += b.value * (toMin(nx.time)-toMin(b.time)) / 60;
            });
        } else { totalDaily = basalNow * 24; }
        showPopup('\u23f3 \u05e7\u05e6\u05d1 \u05d1\u05d6\u05d0\u05dc\u05d9',
            "<div style='font-size:14px;line-height:1.8;text-align:right'>" +
            "\u23f3 <b>\u05db\u05e8\u05d2\u05e2:</b> " + basalNow + " U/\u05e9'<br>" +
            "\ud83d\udcca <b>\u05e1\u05da \u05d9\u05d5\u05de\u05d9:</b> <span style='font-size:18px;color:#3b82f6;font-weight:700'>" + totalDaily.toFixed(2) + "U</span><br><br>" +
            "<b>\u05ea\u05d5\u05db\u05e0\u05d9\u05ea:</b><br>" + rows + "</div>");
        return;
    }

    // ── CR ──
    if (ql === 'cr' || ql === 'icr' || ql === '\u05d9\u05d7\u05e1 \u05e4\u05d7\u05de\u05d9\u05de\u05d5\u05ea') {
        var prof2 = fullHistory && fullHistory.profile;
        var crNow = prof2 ? parseFloat(profileValueAt(prof2.carbratio||prof2.carbRatio||prof2.ic, new Date().getHours())||15) : 15;
        showPopup('\ud83d\udcca CR',
            "<div style='font-size:16px;text-align:right'>1U / <span style='font-size:28px;color:#10b981;font-weight:700'>" + crNow + "g</span></div>");
        return;
    }

    // ── ISF ──
    if (ql === 'isf' || ql === '\u05e8\u05d2\u05d9\u05e9\u05d5\u05ea') {
        var prof3 = fullHistory && fullHistory.profile;
        var isfNow = prof3 ? parseFloat(profileValueAt(prof3.sens||prof3.sensitivity, new Date().getHours())||120) : 120;
        showPopup('\ud83c\udfaf ISF',
            "<div style='font-size:16px;text-align:right'><span style='font-size:28px;color:#f59e0b;font-weight:700'>" + isfNow + "</span> mg/dL/U</div>");
        return;
    }

    // ── כל שאר → Gemini AI ──
    triggerLoopieAI(q);
}


// ─── Gemini Advisor ───────────────────────────────────────────
function buildNSContext() {
    var nowH = new Date().getHours();
    var prof  = fullHistory && fullHistory.profile;
    var cr    = prof ? parseFloat(profileValueAt(prof.carbratio || prof.carbRatio || prof.ic, nowH) || 15) : 15;
    var isf   = prof ? parseFloat(profileValueAt(prof.sens || prof.sensitivity, nowH) || 120) : 120;

    return {
        sgv:           nsData.currentSgv    || 0,
        delta:         nsData.delta         || 0,
        trend:         nsData.trend         || 'Flat',
        iob:           parseFloat(nsData.iob||0),
        cob:           parseFloat(nsData.cob||0),
        basal:         nsData.basal         || 0,
        cr:            cr,
        isf:           isf,
        overrideActive:nsData.overrideActive || false,
        overrideName:  nsData.overrideName   || null,
        pumpBolus:     nsData.recommendedBolus || 0,
        insulinType:   INSULIN_CONFIG.type   || 'novorapid',
        insulinName:   getInsulinProfile().label || 'Novorapid',
        insulinPreMeal:getInsulinProfile().preMeal || 15,
        insulinPeak:   getInsulinProfile().peakMin || 60,
        time:          new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false}),
        hour:          nowH,
    };
}

async function askGeminiAdvisor(userQuestion) {
    if (!userQuestion || !userQuestion.trim()) return;
    showPopup('Loopie 🧠', "<div style='text-align:center;padding:20px;color:#888'>שואל Gemini... 🧠</div>");

    try {
        var ctx = buildNSContext();

        // אם יש תמונה ממצלמה — שלח ל-triggerLoopieAI שמטפל בזה
        if (_pendingImageB64) {
            closePopup();
            await triggerLoopieAI(userQuestion);
            _clearImage();
            return;
        }

        // אחרת — שלח כטקסט
        closePopup();
        await triggerLoopieAI(userQuestion);

    } catch(e) {
        showPopup('שגיאה', 'שגיאת AI: ' + e.message);
        console.error('askGeminiAdvisor:', e);
    }
}


// ─── Equipment Status ─────────────────────────────────────────
async function showEquipmentStatus() {
    showPopup('⚙️ ציוד', "<div style='text-align:center;padding:16px;color:#888'><span class='spinner'></span> טוען...</div>");
    try {
        var dsRes = await nsGet('/api/v1/devicestatus.json?count=1');
        if (!dsRes.ok) throw new Error('NS error');
        var dsArr = await dsRes.json();
        var ds    = Array.isArray(dsArr) ? dsArr[0] : dsArr;
        if (!ds)  { showPopup('⚙️ ציוד', 'לא נמצאו נתוני ציוד.'); return; }

        var dsStr  = JSON.stringify(ds);
        var cMatch = dsStr.match(/"cage"\s*:\s*([\d.]+)/i);
        var sMatch = dsStr.match(/"sage"\s*:\s*([\d.]+)/i);
        var cage   = cMatch ? parseFloat(cMatch[1]) : null;
        var sage   = sMatch ? parseFloat(sMatch[1]) : null;

        var html = "<div style='font-size:14px;line-height:1.9;text-align:right'>";
        if (cage !== null) {
            var cDays = Math.floor(cage / 24);
            var cHrs  = Math.round(cage % 24);
            var cColor = cage > 60 ? '#ef4444' : cage > 48 ? '#f59e0b' : '#10b981';
            html += "💉 <b>פוד:</b> <span style='color:" + cColor + "'>" + cDays + " ימים " + cHrs + " שעות</span>";
            if (cage > 60) html += " ⚠️ <b>זמן להחלפה!</b>";
            html += "<br>";
        }
        if (sage !== null) {
            var sDays = Math.floor(sage / 24);
            var sHrs  = Math.round(sage % 24);
            var sColor = sage > 240 ? '#ef4444' : sage > 192 ? '#f59e0b' : '#10b981';
            html += "📡 <b>חיישן:</b> <span style='color:" + sColor + "'>" + sDays + " ימים " + sHrs + " שעות</span>";
            if (sage > 240) html += " ⚠️ <b>שקול החלפה!</b>";
            html += "<br>";
        }
        if (cage === null && sage === null) html += "לא נמצאו נתוני CAGE/SAGE ב-NS.";
        html += "</div>";
        showPopup('⚙️ מצב ציוד', html);
    } catch(e) {
        showPopup('⚙️ ציוד', 'שגיאה: ' + e.message);
    }
}


// ─── Mini Chart ───────────────────────────────────────────────
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
