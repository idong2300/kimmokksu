    function calculateT5Only() {
        const site = document.getElementById('t5-site-title').value.trim() || "현장"; let specs = []; document.querySelectorAll('.spec-actual').forEach(el => specs.push({ n: el.getAttribute('data-nominal'), a: parseInt(el.value) })); specs.sort((a,b) => b.a - a.a);
        let sectionRes = [], tc = {}, rowsData = [];
        document.querySelectorAll('.t5-row-item').forEach(row => { const name = row.querySelector('.t5-section-name').value, len = parseInt(row.querySelector('.t5-length-val').value); if(!len) return; rowsData.push({ section: name, length: len }); let remain = len - 50, lineArr = [], sumA = 0; specs.forEach(s => { let q = Math.floor(remain / s.a); if(q>0) { lineArr.push(`${s.n}-${q}개`); tc[s.n] = (tc[s.n]||0)+q; remain -= (q*s.a); sumA += (q*s.a); } }); sectionRes.push({ name, result: lineArr.join(', '), gap: len - sumA }); });
        if(sectionRes.length === 0) return alert("길이 입력 필요");
        let ts = []; Object.keys(tc).sort((a,b)=>b-a).forEach(k => ts.push(`${k}-${tc[k]}개`)); calculatedData = { siteName: site, rows: rowsData, resultText: ts.join(' / ') };
        document.getElementById('res-list-container').innerHTML = sectionRes.map(r => `<div class="small text-secondary border-bottom border-secondary border-opacity-25 pb-1">• ${r.name}: ${r.result} <span class="res-gap ms-2">여유: ${r.gap}mm</span></div>`).join(''); document.getElementById('res-total-summary').innerText = calculatedData.resultText; document.getElementById('t5-temp-result').style.display = 'block'; document.getElementById('t5-save-btn').style.display = 'block';
    }
    async function saveT5ToHistory() { if(!calculatedData) return; const data = { teamId: myTeamId, ...calculatedData, writer: userNickname, updatedAt: Date.now() }; if (t5EditingId) await db.collection("t5_logs").doc(t5EditingId).update(data); else await db.collection("t5_logs").add({...data, createdAt: Date.now()}); location.reload(); }
    function loadT5History() { db.collection("t5_logs").where("teamId","==",myTeamId).orderBy("updatedAt","desc").limit(20).onSnapshot(ss => { document.getElementById('t5-history-list').innerHTML = ss.docs.map(d => { const doc = d.data(); let modifyBtns = `<button class="t5-btn-small bg-secondary text-white" style="flex:1;" onclick="editT5Log('${d.id}')">수정</button><button class="t5-btn-small bg-primary text-white" style="flex:1;" onclick="copyAndNewT5Log('${d.id}')">복사</button><button class="t5-btn-small bg-success text-white" style="flex:1;" onclick="copyT5Order('${doc.siteName}', '${doc.resultText}')">발주용</button><button class="t5-btn-small bg-danger text-white" style="flex:1;" onclick="deleteT5Log('${d.id}')">삭제</button>`; return `<div class="history-card"><h6 class="fw-bold">${doc.siteName} <span class="small text-secondary ms-2">${doc.writer}</span></h6><p class="small text-secondary mb-3">${doc.resultText}</p><div class="d-flex gap-2 flex-wrap">${modifyBtns}</div></div>`; }).join(''); }); }
    async function editT5Log(id) { const d = (await db.collection("t5_logs").doc(id).get()).data(); t5EditingId = id; document.getElementById('t5-site-title').value = d.siteName; const container = document.getElementById('t5-input-container'); container.innerHTML = ''; d.rows.forEach(r => { let div = document.createElement('div'); div.className = "row g-2 mb-2 t5-row-item"; div.innerHTML = `<div class="col-6"><input type="text" class="form-control input-dark t5-section-name" value="${r.section}"></div><div class="col-6"><input type="number" class="form-control input-dark t5-length-val" value="${r.length}"></div>`; container.appendChild(div); }); showPage('t5', null, true, { preserveState: true }); window.scrollTo(0,0); }
    async function copyAndNewT5Log(id) { const d = (await db.collection("t5_logs").doc(id).get()).data(); t5EditingId = null; document.getElementById('t5-site-title').value = d.siteName + " (복사)"; const container = document.getElementById('t5-input-container'); container.innerHTML = ''; d.rows.forEach(r => { let div = document.createElement('div'); div.className = "row g-2 mb-2 t5-row-item"; div.innerHTML = `<div class="col-6"><input type="text" class="form-control input-dark t5-section-name" value="${r.section}"></div><div class="col-6"><input type="number" class="form-control input-dark t5-length-val" value="${r.length}"></div>`; container.appendChild(div); }); showPage('t5', null, true, { preserveState: true }); alert("복사되었습니다."); window.scrollTo(0,0); }
    // 💡 V31 FIX: T5 발주용 복사도 최신 Clipboard API 사용 💡
    function copyT5Order(site, text) { 
        const fmt = site + '\n' + text.split(' / ').join('\n'); 
        if(navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(fmt).then(() => alert("복사 완료!\n\n" + fmt)).catch(() => { fallbackCopy(fmt); });
        } else {
            fallbackCopy(fmt);
            alert("복사 완료!\n\n" + fmt);
        }
    }
window.calculateT5Only = calculateT5Only;
window.saveT5ToHistory = saveT5ToHistory;
window.loadT5History = loadT5History;
window.editT5Log = editT5Log;
window.deleteT5Log = deleteT5Log;
window.copyT5Order = copyT5Order;
