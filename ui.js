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



    // ── ISF ──
    if (ql === 'isf' || ql === 'רגישות' || ql === 'מדד רגישות') {
        var prof3 = fullHistory && fullHistory.profile;
        var nowH3 = new Date().getHours();
        var isfNow = prof3 ? parseFloat(profileValueAt(prof3.sens||prof3.sensitivity, nowH3)||120) : 120;
        var isfArr = prof3 && Array.isArray(prof3.sens||prof3.sensitivity) ? (prof3.sens||prof3.sensitivity) : null;
        var isfRows = isfArr
            ? isfArr.map(function(b,i){
                var nx = isfArr[i+1] ? isfArr[i+1].time : '24:00';
                var isCurrent = parseInt((b.time||'0').split(':')[0]) <= nowH3 &&
                                (!isfArr[i+1] || parseInt(isfArr[i+1].time.split(':')[0]) > nowH3);
                return "<span style='" + (isCurrent?"color:#f59e0b;font-weight:700":"color:#aaa") + "'>" +
                       '• ' + b.time + '–' + nx + ': <b>' + b.value + " mg/dL/U</b></span>";
              }).join('<br>')
            : "• כל היום: <b>" + isfNow + " mg/dL/U</b>";
        showPopup('🎯 רגישות (ISF)',
            "<div style='font-size:14px;line-height:1.8;text-align:right'>" +
            "⚡ <b>כרגע:</b> <span style='font-size:22px;color:#f59e0b;font-weight:700'>" + isfNow + "</span> mg/dL/U<br><br>" +
            "<b>תוכנית יומית:</b><br>" + isfRows + "</div>");
        return;
    }

    // ── CR מלא ──
    if (ql === 'cr' || ql === 'icr' || ql === 'יחס פחמימות') {
        var prof4 = fullHistory && fullHistory.profile;
        var nowH4 = new Date().getHours();
        var crNow2 = prof4 ? parseFloat(profileValueAt(prof4.carbratio||prof4.carbRatio||prof4.ic, nowH4)||15) : 15;
        var crArr = prof4 && Array.isArray(prof4.carbratio||prof4.carbRatio||prof4.ic) ? (prof4.carbratio||prof4.carbRatio||prof4.ic) : null;
        var crRows = crArr
            ? crArr.map(function(b,i){
                var nx = crArr[i+1] ? crArr[i+1].time : '24:00';
                var isCurrent = parseInt((b.time||'0').split(':')[0]) <= nowH4 &&
                                (!crArr[i+1] || parseInt(crArr[i+1].time.split(':')[0]) > nowH4);
                return "<span style='" + (isCurrent?"color:#10b981;font-weight:700":"color:#aaa") + "'>" +
                       '• ' + b.time + '–' + nx + ': 1U / <b>' + b.value + "g</b></span>";
              }).join('<br>')
            : "• כל היום: 1U / <b>" + crNow2 + "g</b>";
        showPopup('📊 יחס פחמימות (CR)',
            "<div style='font-size:14px;line-height:1.8;text-align:right'>" +
            "🍞 <b>כרגע:</b> 1U / <span style='font-size:22px;color:#10b981;font-weight:700'>" + crNow2 + "g</span><br><br>" +
            "<b>תוכנית יומית:</b><br>" + crRows + "</div>");
        return;
    }

    // ── Override ──
    if (ql === 'override' || ql === 'אוברריד' || ql === 'החרגה' ||
        ql === 'תוכנית ספורט' || ql === 'מה ה-override' || ql === 'מה האוברריד') {
        var raw = nsData._overrideRaw;
        if (nsData.overrideActive && raw) {
            var pct     = raw.multiplier ? Math.round(raw.multiplier * 100) : null;
            var basalPct= raw.basalMultiplier ? Math.round(raw.basalMultiplier * 100) : null;
            var ispfPct = raw.insulinNeedsScaleFactor ? Math.round(raw.insulinNeedsScaleFactor * 100) : null;
            var tgtRng  = raw.currentCorrectionRange
                ? (raw.currentCorrectionRange.minValue + '–' + raw.currentCorrectionRange.maxValue + ' mg/dL')
                : null;
            var duration= raw.duration ? (raw.duration / 60).toFixed(0) + " דק'" : null;
            var symbol  = raw.symbol || '';
            var name    = raw.name || 'Override פעיל';

            var html = "<div style='font-size:14px;line-height:2;text-align:right'>" +
                "<div style='background:rgba(245,158,11,0.12);border:1px solid #f59e0b;border-radius:10px;padding:12px;margin-bottom:12px'>" +
                "🟢 <b style='color:#f59e0b;font-size:16px'>" + symbol + " " + name + "</b></div>";

            if (pct !== null)     html += "⚡ <b>עוצמה כללית:</b> <span style='color:" + (pct<100?'#3b82f6':'#ef4444') + ";font-size:18px;font-weight:700'>" + pct + "%</span><br>";
            if (basalPct !== null)html += "⏱ <b>בזאלי:</b> <span style='color:#f59e0b;font-size:16px;font-weight:700'>" + basalPct + "%</span>" +
                                          " <small style='color:#888'>(" + (100-basalPct) + "% הפחתה)</small><br>";
            if (ispfPct !== null) html += "💉 <b>צורך אינסולין:</b> <span style='font-size:16px;font-weight:700'>" + ispfPct + "%</span><br>";
            if (tgtRng)           html += "🎯 <b>יעד סוכר:</b> " + tgtRng + "<br>";
            if (duration)         html += "⏳ <b>משך:</b> " + duration + "<br>";

            html += "</div>";
            showPopup('🔄 Override פעיל', html);
        } else {
            showPopup('🔄 Override',
                "<div style='font-size:14px;text-align:right;padding:8px'>" +
                "⚪ <b>אין Override פעיל כרגע.</b><br><br>" +
                "<span style='color:#888;font-size:12px'>להפעלה — כנס ל-Loop באייפון ← Overrides</span></div>");
        }
        return;
    }

    // ── מה אכלתי / ארוחות אחרונות ──
    if (ql === 'מה אכלתי' || ql === 'ארוחות' || ql === 'ארוחות אחרונות' ||
        ql === 'היסטוריה' || ql.includes('אכלתי') || ql.includes('ארוחה אחרונה')) {
        showPopup('🍽️ ארוחות', "<div style='text-align:center;padding:16px;color:#888'><span class='spinner'></span> טוען...</div>");
        (async function() {
            try {
                var since6h = new Date(Date.now() - 6 * 3600000).toISOString();
                var res = await nsGet('/api/v1/treatments.json?find[created_at][$gte]=' + since6h + '&count=30');
                if (!res.ok) throw new Error('NS error');
                var treats = await res.json();

                // רק treatments עם פחמימות
                var meals = treats.filter(function(t) {
                    return t.carbs && parseFloat(t.carbs) > 0;
                }).slice(0, 3);

                if (!meals.length) {
                    showPopup('🍽️ ארוחות', "<div style='text-align:right;font-size:14px'>לא נמצאו ארוחות ב-6 שעות האחרונות.</div>");
                    return;
                }

                var html = "<div style='font-size:13px;text-align:right;line-height:1.8'>";
                meals.forEach(function(m) {
                    var mTime    = new Date(m.created_at);
                    var minsAgo  = Math.round((Date.now() - mTime.getTime()) / 60000);
                    var hoursAgo = (minsAgo / 60).toFixed(1);
                    var timeStr  = mTime.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit', hour12:false});
                    var carbs    = parseFloat(m.carbs || 0);
                    var insulin  = parseFloat(m.insulin || 0);
                    var name     = m.notes || m.foodType || 'ארוחה';

                    // חישוב ספיגה — DIA של 5 שעות, פיק ב-60 דק'
                    var diaMin   = 300; // 5 שעות
                    var absorbed = Math.min(100, Math.round((minsAgo / diaMin) * 100));
                    var remaining= Math.max(0, 100 - absorbed);
                    var iobEst   = insulin > 0 ? (insulin * remaining / 100).toFixed(2) : null;

                    var color    = minsAgo < 60 ? '#f59e0b' : minsAgo < 180 ? '#3b82f6' : '#10b981';
                    var absBar   = "<div style='background:#1a1a28;border-radius:4px;height:6px;margin:4px 0'>" +
                                   "<div style='background:" + color + ";width:" + absorbed + "%;height:100%;border-radius:4px'></div></div>";

                    html += "<div style='background:#0a0a14;border-radius:10px;padding:12px;margin-bottom:10px;border-right:3px solid " + color + "'>" +
                        "<div style='display:flex;justify-content:space-between;margin-bottom:4px'>" +
                        "<b style='color:" + color + "'>" + name + "</b>" +
                        "<span style='color:#888;font-size:11px'>" + timeStr + " (לפני " + (minsAgo < 60 ? minsAgo + " דק'" : hoursAgo + " ש'") + ")</span></div>" +
                        "🍞 <b>" + carbs + "g</b> פחמימות" +
                        (insulin > 0 ? " | 💉 <b>" + insulin.toFixed(1) + "U</b>" : "") + "<br>" +
                        "ספיגה: <b>" + absorbed + "%</b> נספג" +
                        absBar +
                        (iobEst && parseFloat(iobEst) > 0.05 ? "⏳ נותר IOB: <b style='color:#3b82f6'>" + iobEst + "U</b>" : "✅ אינסולין נספג לחלוטין") +
                        "</div>";
                });
                html += "</div>";
                showPopup('🍽️ ' + meals.length + ' ארוחות אחרונות', html);
            } catch(e) {
                showPopup('🍽️ שגיאה', e.message);
            }
        })();
        return;
    }

    // ── הוסף חוג / פעילות ──
    if (ql.includes('הוסף חוג') || ql.includes('הוסף פעילות') || ql.includes('הוסף אימון') ||
        ql.startsWith('חוג ') || ql.startsWith('פעילות ') || ql.startsWith('אימון ')) {

        // פרסור יום
        var DAYS_MAP = {
            'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6,
            'sunday':0,'monday':1,'tuesday':2,'wednesday':3,'thursday':4,'friday':5,'saturday':6
        };
        var foundDay = null;
        Object.keys(DAYS_MAP).forEach(function(d) {
            if (q.includes(d)) foundDay = DAYS_MAP[d];
        });

        // פרסור שעות — תבנית HH:MM או H:MM
        var timeMatches = q.match(/(\d{1,2}:\d{2})/g);
        var fromTime = timeMatches ? timeMatches[0] : null;
        var toTime   = timeMatches && timeMatches[1] ? timeMatches[1] : null;

        // פרסור עצימות
        var intensity = 'medium';
        if (q.includes('נמוכ') || q.includes('קל') || q.includes('יוגה') || q.includes('הליכה')) intensity = 'low';
        if (q.includes('גבוה') || q.includes('מאומץ') || q.includes('mma') || q.includes('ריצה') || q.includes('hiit')) intensity = 'high';

        // חילוץ שם — מחיקת מילות תשתית
        var actName = q
            .replace(/הוסף (חוג|פעילות|אימון)/g, '')
            .replace(/יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/g, '')
            .replace(/(\d{1,2}:\d{2})/g, '')
            .replace(/עד|מ-|מ|בשעה|עצימות (נמוכה|בינונית|גבוהה)/g, '')
            .replace(/\s+/g, ' ').trim();
        if (!actName) actName = 'חוג חדש';

        if (foundDay === null || !fromTime) {
            // לא הצלחנו לפרסר — פתח טופס ידני
            showPopup('➕ הוסף חוג', 
                "<div style='font-size:13px;text-align:right;line-height:1.8'>" +
                "לא הצלחתי לפרסר את הפרטים. נסה:<br>" +
                "<b>הוסף חוג [שם] יום [יום] [HH:MM] עד [HH:MM]</b><br><br>" +
                "לדוגמה:<br>• הוסף חוג MMA יום שלישי 17:00 עד 18:30<br>" +
                "• הוסף חוג שחייה יום חמישי 16:00 עד 17:00<br><br>" +
                "<button onclick=\"switchTab(\'tab-activity\',document.querySelectorAll(\'.nav-tab\')[1]);closePopup()\" " +
                "style=\"width:100%;padding:10px;background:#3b82f6;border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:13px\">" +
                "📋 פתח טאב פעילויות</button></div>");
            return;
        }

        // הוסף לרשימה
        var newAct = {
            id:        Date.now(),
            name:      actName,
            day:       foundDay,
            from:      fromTime,
            to:        toTime || (parseInt(fromTime.split(':')[0])+1 + ':' + fromTime.split(':')[1]),
            intensity: intensity
        };
        ACTIVITIES.push(newAct);
        saveActivities();
        renderActivities();
        checkActiveActivity();

        var DAYS_HE2 = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
        var INTENS_HE = {low:'נמוכה',medium:'בינונית',high:'גבוהה'};
        showPopup('✅ חוג נוסף!',
            "<div style='font-size:14px;text-align:right;line-height:1.9'>" +
            "🏃 <b>" + newAct.name + "</b><br>" +
            "📅 יום <b>" + DAYS_HE2[foundDay] + "</b><br>" +
            "🕐 <b>" + newAct.from + "–" + newAct.to + "</b><br>" +
            "⚡ עצימות: <b>" + INTENS_HE[intensity] + "</b></div>");
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
    showPopup('📟 מצב ציוד', "<div style='text-align:center;padding:20px'><span class='spinner'></span></div>");
    try {
        var res  = await nsGet('/api/v2/properties/cage,sage');
        var data = res.ok ? await res.json() : {};

        function parseHours(prop) {
            if (!prop) return null;
            if (prop.age  !== undefined && prop.age  !== null) return parseFloat(prop.age);
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

        var cageH = parseHours(data.cage);
        var sageH = parseHours(data.sage);

        var ans = "<div style='font-size:13px;line-height:1.8;text-align:right'>";

        // ── חיישן ──
        ans += "<div style='background:#0a0a14;border-radius:10px;padding:12px;margin-bottom:10px'>";
        ans += "<div style='font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px'>📡 חיישן CGM</div>";
        if (sageH !== null) {
            var sLeft  = Math.max(0, 240 - sageH);
            var sColor = sLeft < 24 ? '#ef4444' : sLeft < 48 ? '#f59e0b' : '#10b981';
            var sReplaceDate = new Date(Date.now() + sLeft * 3600000)
                .toLocaleString('he-IL', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false});
            ans += "• גיל: <b>" + Math.floor(sageH/24) + "d " + Math.round(sageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + sColor + "'>" + Math.floor(sLeft/24) + "d " + Math.round(sLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + sReplaceDate + "</b>";
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
            var pReplaceDate = new Date(Date.now() + pLeft * 3600000)
                .toLocaleString('he-IL', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false});
            ans += "• גיל: <b>" + Math.floor(cageH/24) + "d " + Math.round(cageH%24) + "h</b><br>";
            ans += "• נותרו: <b style='color:" + pColor + "'>" + Math.floor(pLeft/24) + "d " + Math.round(pLeft%24) + "h</b>";
            ans += " | החלפה: <b>" + pReplaceDate + "</b>";
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
