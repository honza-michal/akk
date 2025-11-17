
// On-screen debug overlay so logs are visible even if browser console is filtered or devtools closed.
(function(){
    if (window.__DEBUG_OVERLAY__) return;
    const wrap = document.createElement('div');
    wrap.id = '__debug_overlay__';
    Object.assign(wrap.style, {
        position:'fixed', bottom:'8px', right:'8px', width:'36vw', maxWidth:'640px', height:'32vh',
        background:'rgba(10,12,18,.9)', color:'#eaf1ff', font:'12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        border:'1px solid rgba(120,140,180,.35)', borderRadius:'10px', overflow:'auto', zIndex:999999,
        padding:'8px', boxShadow:'0 6px 18px rgba(0,0,0,.4)'
    });
    if (!window.DEBUG) {
        wrap.style.display = 'none';
    }

    const head=document.createElement('div');
    head.textContent='[TEMPDBG] Overlay — click to hide/show — (drag to move)';
    head.style.cssText='font-weight:600;opacity:.8;margin-bottom:6px;cursor:move;';
    const body=document.createElement('div'); body.id='__debug_overlay_body__';
    wrap.appendChild(head); wrap.appendChild(body);
    document.addEventListener('keydown', (e)=>{
        if (e.key.toLowerCase()==='d' && (e.ctrlKey||e.metaKey) && e.shiftKey) {
            wrap.style.display = wrap.style.display==='none' ? '' : 'none';
        }
    });
    // drag
    let dragging=false, sx=0, sy=0, bx=0, by=0;
    head.addEventListener('mousedown', (e)=>{ dragging=true; sx=e.clientX; sy=e.clientY; const r=wrap.getBoundingClientRect(); bx=r.left; by=r.top; e.preventDefault(); });
    document.addEventListener('mousemove', (e)=>{ if(!dragging) return; const dx=e.clientX-sx, dy=e.clientY-sy; wrap.style.left=(bx+dx)+'px'; wrap.style.top=(by+dy)+'px'; wrap.style.right='auto'; wrap.style.bottom='auto'; });
    document.addEventListener('mouseup', ()=>dragging=false);

    const add = (lvl, args)=>{
        if (!window.DEBUG) return;
        const line=document.createElement('div');
        line.style.margin='2px 0'; line.style.whiteSpace='pre-wrap';
        const ts=new Date().toISOString().split('T')[1].replace('Z','');
        line.innerText = `[${ts}] ${lvl} ` + args.map(a=>{
            try { return (typeof a==='string') ? a : JSON.stringify(a); }
            catch { return String(a); }
        }).join(' ');
        if (lvl==='WARN') line.style.color='#ffde7a';
        if (lvl==='ERROR') line.style.color='#ff8b8b';
        body.appendChild(line);
        body.scrollTop = body.scrollHeight;
    };

    const _d=console.debug.bind(console);
    const _w=console.warn.bind(console);
    const _e=console.error.bind(console);
    console.debug = (...args)=>{ add('DEBUG', args); _d(...args); };
    console.warn  = (...args)=>{ add('WARN',  args); _w(...args); };
    console.error = (...args)=>{ add('ERROR', args); _e(...args); };
    document.body.appendChild(wrap);
    window.__DEBUG_OVERLAY__ = wrap;
    DBG('[TEMPDBG][overlay] ready — toggle with Ctrl/Cmd+Shift+D');
})();
