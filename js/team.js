    // 팀 관리
    function checkTeamUI() {
        if(myTeamId) { document.getElementById('no-team-section').style.display = 'none'; document.getElementById('has-team-section').style.display = 'block'; loadTeamMembers(); } 
        else { document.getElementById('no-team-section').style.display = 'block'; document.getElementById('has-team-section').style.display = 'none'; }
    }
    async function loadTeamMembers() {
        if(!myTeamId) return; const tDoc = await db.collection("teams").doc(myTeamId).get(); const tData = tDoc.data(); const members = tData.members || [];
        if(myRole === "owner" || myRole === "admin") document.getElementById('btnRegenCode').style.display = 'inline-block'; else document.getElementById('btnRegenCode').style.display = 'none';
        document.getElementById('displayTeamId').value = tData.inviteCode || '발급필요';
        document.getElementById('member-list').innerHTML = members.map(m => {
            let nick = globalEmailToNick[m] || m.split('@')[0]; let badge = "", actionBtn = "";
            let isOwner = (tData.owner === m || m === "idong2300@naver.com"); let isAdmin = (tData.admins && tData.admins.includes(m));
            if(isOwner) badge = `<span class="badge bg-warning text-dark">에디터</span>`;
            else if(isAdmin) {
                badge = `<span class="badge bg-primary">관리자</span>`;
                if(myRole === "owner") actionBtn = `<button class="btn btn-sm btn-outline-secondary py-0 me-2" onclick="toggleAdmin('${m}', false)">관리자 해제</button><button class="btn btn-sm btn-outline-danger py-0" onclick="kickMember('${m}')">삭제</button>`;
            } else {
                badge = `<span class="badge bg-secondary">팀원</span>`;
                if(myRole === "owner") actionBtn = `<button class="btn btn-sm btn-outline-info py-0 me-2" onclick="toggleAdmin('${m}', true)">관리자 임명</button><button class="btn btn-sm btn-outline-danger py-0" onclick="kickMember('${m}')">삭제</button>`;
                else if(myRole === "admin") actionBtn = `<button class="btn btn-sm btn-outline-danger py-0" onclick="kickMember('${m}')">삭제</button>`;
            }
            return `<div class="list-group-item bg-transparent text-white border-secondary border-opacity-25 py-3 d-flex flex-column gap-2 flex-md-row justify-content-md-between align-items-md-center"><div class="d-flex align-items-center flex-wrap gap-2">${badge} <span class="fw-bold">${nick}</span> <span class="small text-secondary">(${m})</span></div><div class="text-end">${actionBtn}</div></div>`;
        }).join('');
    }
    async function joinTeam() { const c = document.getElementById('joinTeamId').value.trim().toUpperCase(); if(!c) return; try { const q = await db.collection("teams").where("inviteCode", "==", c).get(); if(q.empty) return alert("유효하지 않은 코드입니다."); const tid = q.docs[0].id; let m = q.docs[0].data().members || []; if(!m.includes(myEmail)) { m.push(myEmail); await db.collection("teams").doc(tid).update({ members: m }); alert("팀 합류 성공!"); location.reload(); } else { alert("이미 소속된 팀입니다."); } } catch(e) { alert(e.message); } }
    async function createTeam() { if(confirm("개설하시겠습니까?")) { const c = Math.random().toString(36).substring(2, 8).toUpperCase(); await db.collection("teams").add({ createdAt: Date.now(), members: [myEmail], owner: myEmail, admins: [], inviteCode: c }); alert("팀이 성공적으로 개설되었습니다!"); location.reload(); } }
    async function regenerateInviteCode() { if(confirm("기존 코드는 즉시 무효화됩니다. 계속하시겠습니까?")) { const c = Math.random().toString(36).substring(2, 8).toUpperCase(); await db.collection("teams").doc(myTeamId).update({ inviteCode: c }); document.getElementById('displayTeamId').value = c; alert("발급되었습니다!"); } }
    async function kickMember(tEmail) { if(confirm("팀에서 내보내시겠습니까?")) { const tDoc = await db.collection("teams").doc(myTeamId).get(); let m = tDoc.data().members.filter(x => x !== tEmail); let a = (tDoc.data().admins || []).filter(x => x !== tEmail); await db.collection("teams").doc(myTeamId).update({ members: m, admins: a }); loadTeamMembers(); alert("팀원이 삭제되었습니다."); } }
    async function toggleAdmin(tEmail, isPro) { const tDoc = await db.collection("teams").doc(myTeamId).get(); let a = tDoc.data().admins || []; if(isPro) { if(!a.includes(tEmail)) a.push(tEmail); } else { a = a.filter(x => x !== tEmail); } await db.collection("teams").doc(myTeamId).update({ admins: a }); loadTeamMembers(); }

window.checkTeamUI = checkTeamUI;
window.loadTeamMembers = loadTeamMembers;
window.joinTeam = joinTeam;
window.createTeam = createTeam;
window.regenerateInviteCode = regenerateInviteCode;
window.kickMember = kickMember;
window.toggleAdmin = toggleAdmin;
