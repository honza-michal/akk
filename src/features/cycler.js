export function cycle(d=+1){
    const b=document.getElementById('pickBottom'), t=document.getElementById('pickTop');
    if(!b||!t){ DBG('[TEMPDBG][cycle] missing selects'); return; }

    const bottomOpts=[...b.options].filter(o=>o.value);
    const topOpts=[...t.options].filter(o=>o.value);
    if(!bottomOpts.length||!topOpts.length){ DBG('[TEMPDBG][cycle] no options'); return; }

    // Build list of valid pairs based on current UI + per-bottom allowed tops (data-tops)
    const pairs=[];
    const curB=b.value, curT=t.value;
    bottomOpts.forEach(bo=>{
        const allowed=(bo.dataset.tops||'').split(',').map(s=>s.trim()).filter(Boolean);
        topOpts.forEach(to=>{
            if(!allowed.length || allowed.includes(to.value)){
                pairs.push({b:bo.value,t:to.value});
            }
        });
    });

    if(!pairs.length){ DBG('[TEMPDBG][cycle] no valid pairs'); return; }

    let idx=pairs.findIndex(p=>p.b===curB && p.t===curT);
    if(idx<0) idx=0;
    const tot=pairs.length;
    idx=(idx+d+tot)%tot;
    const next=pairs[idx];

    DBG('[TEMPDBG][cycle] next', {d,next,tot});

    // 1) change bottom (this will repopulate top list via change handler)
    b.value=next.b;
    b.dispatchEvent(new Event('change',{bubbles:true}));

    // 2) after UI updates, enforce desired top if still available; otherwise fallback to first available
    requestAnimationFrame(()=>{
        const availOpts=[...t.options].filter(o=>o.value);
        const avail=availOpts.map(o=>o.value);
        let enforced = avail.includes(next.t) ? next.t : (avail[0] || null);
        DBG('[TEMPDBG][cycle] enforce top', {enforced,avail});
        if(enforced){
            t.value=enforced;
            t.dispatchEvent(new Event('change',{bubbles:true}));
        }
    });
}
