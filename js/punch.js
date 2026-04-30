    let currentSite = ""; let punchListListener = null; let punchDetailListener = null; let globalPunchSites = []; let activePunchCardFilter = "전체"; let globalPunchItems = []; let activePunchFilter = "전체";
    function loadPunchSummaryCards() { if(!myTeamId) return; if(punchListListener) punchListListener(); punchListListener = db.collection("punch_lists").where("teamId", "==", myTeamId).onSnapshot(ss => { let sitesData = {}; ss.docs.forEach(doc => { const d = doc.data(); if(!sitesData[d.siteName]) sitesData[d.siteName] = { total: 0, done: 0, lastAt: 0, writer: d.writer }; sitesData[d.siteName].total++; if(d.done) sitesData[d.siteName].done++; if(d.createdAt > sitesData[d.siteName].lastAt) { sitesData[d.siteName].lastAt = d.createdAt; sitesData[d.siteName].writer = d.writer; } }); globalPunchSites = Object.keys(sitesData).map(key => ({ name: key, ...sitesData[key] })).sort((a, b) => b.lastAt - a.lastAt); renderPunchCardFilterAndList(); }); }
    function renderPunchCardFilterAndList() { document.getElementById('punch-card-filter').innerHTML = ["전체", ...new Set(globalPunchSites.map(s => s.writer).filter(Boolean))].map(w => `<button class="btn btn-sm ${w === activePunchCardFilter ? 'btn-primary' : 'btn-outline-secondary text-secondary'} rounded-pill px-3" onclick="activePunchCardFilter='${w}'; renderPunchCardFilterAndList();">${w}</button>`).join(''); const filteredSites = activePunchCardFilter === "전체" ? globalPunchSites : globalPunchSites.filter(s => s.writer === activePunchCardFilter); 
        document.getElementById('punch-history-list').innerHTML = filteredSites.map(s => { const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100); return `<div class="col-md-6 col-lg-4"><div class="summary-card" onclick="openDetailView('${s.name}')"><div class="d-flex justify-content-between align-items-start mb-2"><div class="overflow-hidden pe-2"><h6 class="fw-bold text-white mb-1 text-truncate">${s.name}</h6><p class="small text-secondary mb-0"><i class="bi bi-person-fill"></i> ${s.writer}</p></div><button class="summary-del-btn" onclick="event.stopPropagation(); deleteEntirePunchSite('${s.name}')"><i class="bi bi-trash3-fill"></i> 삭제</button></div><div class="d-flex justify-content-between align-items-end mb-1 mt-3"><span class="small" style="color:#adb5bd; font-size:0.75rem;">진행률 ${pct}%</span><span class="small text-secondary" style="font-size:0.7rem;">${s.done} / ${s.total}</span></div><div class="progress-container"><div class="progress-fill" style="width: ${pct}%;"></div></div></div></div>`; }).join(''); 
    }
    async function deleteEntirePunchSite(siteName) { if(confirm(`정말 '${siteName}' 현장을 삭제하시겠습니까?`)) { const qs = await db.collection("punch_lists").where("teamId", "==", myTeamId).where("siteName", "==", siteName).get(); const batch = db.batch(); qs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); } }
    function createOrLoadSite() { const val = document.getElementById('searchSiteInput').value.trim(); if(val) openDetailView(val); }
    function openDetailView(siteName) { currentSite = siteName; document.getElementById('view-list').style.display = 'none'; document.getElementById('view-detail').style.display = 'block'; document.getElementById('detailSiteName').innerText = siteName; activePunchFilter = "전체"; loadDetailChecklist(siteName); }
    function goBackToPunchList() { if(punchDetailListener) punchDetailListener(); currentSite = ""; document.getElementById('view-detail').style.display = 'none'; document.getElementById('view-list').style.display = 'block'; }
    async function editPunchlistTitle() { const newTitle = prompt("새로운 현장명을 입력하세요", currentSite); if(!newTitle || newTitle === currentSite) return; const qs = await db.collection("punch_lists").where("teamId", "==", myTeamId).where("siteName", "==", currentSite).get(); const batch = db.batch(); qs.forEach(doc => batch.update(doc.ref, {siteName: newTitle})); await batch.commit(); alert("수정되었습니다."); document.getElementById('detailSiteName').innerText = newTitle; currentSite = newTitle; loadDetailChecklist(newTitle); }
    function loadDetailChecklist(siteName) { if(punchDetailListener) punchDetailListener(); punchDetailListener = db.collection("punch_lists").where("teamId", "==", myTeamId).where("siteName", "==", siteName).onSnapshot(ss => { globalPunchItems = ss.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b)=>a.done?1:-1); renderPunchFilterAndList(); }); }
    
    function renderPunchFilterAndList() { 
        document.getElementById('punch-filter-container').innerHTML = ["전체", ...new Set(globalPunchItems.map(i => i.writer))].map(w => `<button class="btn btn-sm ${w === activePunchFilter ? 'btn-primary' : 'btn-outline-secondary text-secondary'} rounded-pill px-3" onclick="activePunchFilter='${w}'; renderPunchFilterAndList();">${w}</button>`).join(''); 
        const filteredItems = activePunchFilter === "전체" ? globalPunchItems : globalPunchItems.filter(i => i.writer === activePunchFilter); 
        const pct = globalPunchItems.length===0?0:Math.round((globalPunchItems.filter(i=>i.done).length/globalPunchItems.length)*100); 
        document.getElementById('detailProgressText').innerText = `${pct}%`; 
        document.getElementById('detailProgressBar').style.width = pct + '%'; 
        
        document.getElementById('checklist-container').innerHTML = filteredItems.map(item => `
            <div class="check-item ${item.done ? 'completed' : ''}">
                <input type="checkbox" class="custom-check" ${item.done ? 'checked' : ''} onclick="db.collection('punch_lists').doc('${item.id}').update({done:${!item.done}})">
                <textarea class="item-text-area" rows="1" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px';" onchange="db.collection('punch_lists').doc('${item.id}').update({text:this.value})">${item.text}</textarea>
                <i class="bi bi-x-lg btn-del" onclick="if(confirm('삭제하시겠습니까?')) db.collection('punch_lists').doc('${item.id}').delete()"></i>
            </div>`).join(''); 
            
        setTimeout(() => { document.querySelectorAll('.item-text-area').forEach(el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }); }, 50);
    }
    
    function openPunchAddModal() { document.getElementById('addTaskModal').style.display = 'flex'; document.getElementById('newTaskInput').value = ''; }
    function closePunchAddModal() { document.getElementById('addTaskModal').style.display = 'none'; }
    async function saveNewPunchTask() { const t = document.getElementById('newTaskInput').value.trim(); if(!t) return; await db.collection("punch_lists").add({ teamId: myTeamId, siteName: currentSite, text: t, done: false, writer: userNickname, createdAt: Date.now() }); closePunchAddModal(); }

window.loadPunchSummaryCards = loadPunchSummaryCards;
window.renderPunchCardFilterAndList = renderPunchCardFilterAndList;
window.deleteEntirePunchSite = deleteEntirePunchSite;
window.createOrLoadSite = createOrLoadSite;
window.openDetailView = openDetailView;
window.goBackToPunchList = goBackToPunchList;
window.editPunchlistTitle = editPunchlistTitle;
window.loadDetailChecklist = loadDetailChecklist;
window.renderPunchFilterAndList = renderPunchFilterAndList;
window.openPunchAddModal = openPunchAddModal;
window.closePunchAddModal = closePunchAddModal;
window.saveNewPunchTask = saveNewPunchTask;
