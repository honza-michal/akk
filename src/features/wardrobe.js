import { getWardrobeLayerIds } from '../io/config.js';

export function applyWardrobeLayers({ mirrorTop }) {
    const host = document.querySelector('#stage > svg');
    if (!host) return;

    const gBase = host.querySelector('#gBase');
    const gTop  = host.querySelector('#gTop');

    // UI-side (radios) choice, may later be overridden if switch disabled
    let uiSide = (document.querySelector('input[name="wardrobeSide"]:checked')?.value) || 'left';
    const mirrored = !!mirrorTop;
    let storedSide = (typeof window !== 'undefined' && window.__wardrobeUserSide) || null;
    if (storedSide !== 'left' && storedSide !== 'right') storedSide = null;

    // --- Read storageSideSwitch config from META for current bottom & top ---
    let switchEnabled = true;
    let switchMode = 'layers'; // "layers" | "bottom-replacement"
    let defaultTopSide = null;     // from top.storageSideSwitch.defaultTopSide
    let defaultBottomSide = null;  // from bottom.storageSideSwitch.defaultBottomSide

    try {
        const pickBottom = document.getElementById('pickBottom');
        const pickTop    = document.getElementById('pickTop');
        const bottomId = pickBottom?.value;
        const topId    = pickTop?.value;
        const meta = (typeof window !== 'undefined' && window.META) ? window.META : null;

        if (meta) {
            if (Array.isArray(meta.bottoms) && bottomId) {
                const bottomCfg = meta.bottoms.find(b => b.id === bottomId);
                if (bottomCfg && bottomCfg.storageSideSwitch) {
                    const cfg = bottomCfg.storageSideSwitch;
                    if (cfg && typeof cfg === 'object') {
                        if (Object.prototype.hasOwnProperty.call(cfg, 'enabled')) {
                            switchEnabled = cfg.enabled !== false;
                        }
                        if (typeof cfg.mode === 'string') {
                            switchMode = cfg.mode;
                        }
                        if (typeof cfg.defaultBottomSide === 'string') {
                            const db = cfg.defaultBottomSide;
                            if (db === 'left' || db === 'right') {
                                defaultBottomSide = db;
                            }
                        }
                    }
                }
            }
            if (Array.isArray(meta.tops) && topId) {
                const topCfg = meta.tops.find(t => t.id === topId);
                if (topCfg && topCfg.storageSideSwitch && typeof topCfg.storageSideSwitch.defaultTopSide === 'string') {
                    const dt = topCfg.storageSideSwitch.defaultTopSide;
                    if (dt === 'left' || dt === 'right') {
                        defaultTopSide = dt;
                    }
                }
            }
        }
    } catch (e) {
        try { DBG && DBG('[TEMPDBG][wardrobe] storageSideSwitch cfg error', e); } catch (_e) {}
    }

    // Decide effective bottom side & top base side
    let bottomSide;
    let topBaseSide;


    if (!switchEnabled) {
        // When switching is disabled, lock sides via defaults.
        // Bottom decides the storage alignment; top MUST follow bottom.
        bottomSide = (defaultBottomSide === 'left' || defaultBottomSide === 'right') ? defaultBottomSide : 'left';
        topBaseSide = bottomSide;

        const uiLockSide = bottomSide;

        // Reflect locked side in UI radios + styles
        try {
            const wrap = document.getElementById('wardrobeSwitch');
            if (wrap) wrap.classList.add('locked');
            const radios = document.querySelectorAll('input[name="wardrobeSide"]');
            radios.forEach(r => {
                r.checked = (r.value === uiLockSide);
                r.disabled = true;
            });
        } catch (_e) {}
    } else {
        // Switching enabled: use last user choice if available; otherwise current UI.
        if (storedSide === 'left' || storedSide === 'right') {
            uiSide = storedSide;
        }

        bottomSide = uiSide;
        topBaseSide = uiSide;

        // Ensure radios reflect the active side and are enabled
        try {
            const wrap = document.getElementById('wardrobeSwitch');
            if (wrap) wrap.classList.remove('locked');
            const radios = document.querySelectorAll('input[name="wardrobeSide"]');
            radios.forEach(r => {
                r.disabled = false;
                r.checked = (r.value === uiSide);
            });
        } catch (_e) {}

        // Remember preferred side for next switch-enabled combos
        try {
            if (typeof window !== 'undefined') {
                window.__wardrobeUserSide = uiSide;
            }
        } catch (_e) {}
    }


    // --- 1) Full-bottom replacement via bottomAll-L / bottomAll-R ---
    if (switchMode === 'bottom-replacement' && gBase) {
        const bottomAllL = gBase.querySelector('#bottomAll-L');
        const bottomAllR = gBase.querySelector('#bottomAll-R');
        const showLeft = (bottomSide === 'left');

        if (bottomAllL) bottomAllL.setAttribute('display', showLeft ? null : 'none');
        if (bottomAllR) bottomAllR.setAttribute('display', showLeft ? 'none' : null);
    }

    // --- 2) Wardrobe-only layers (L-L / L-R / T-L / T-R) ---
    const ids = getWardrobeLayerIds();

    if (gBase) {
        const baseLeft  = gBase.querySelector('#' + ids.bottomLeft);
        const baseRight = gBase.querySelector('#' + ids.bottomRight);
        if (baseLeft)  baseLeft.setAttribute('display', bottomSide === 'left' ? null : 'none');
        if (baseRight) baseRight.setAttribute('display', bottomSide === 'right' ? null : 'none');
    }

    // Top side including mirror logic
    const topSide = mirrored
        ? (topBaseSide === 'left' ? 'right' : 'left')
        : topBaseSide;

    if (gTop) {
        const topLeft  = gTop.querySelector('#' + ids.topLeft);
        const topRight = gTop.querySelector('#' + ids.topRight);
        if (topLeft)  topLeft.setAttribute('display', topSide === 'left' ? null : 'none');
        if (topRight) topRight.setAttribute('display', topSide === 'right' ? null : 'none');
    }


    // Final safety: ensure wardrobe switch UI enabled/disabled matches switchEnabled
    try {
        const wrap = document.getElementById('wardrobeSwitch');
        const radios = document.querySelectorAll('input[name="wardrobeSide"]');
        if (wrap && radios && radios.length) {
            if (!switchEnabled) {
                wrap.classList.add('locked');
                radios.forEach(r => { r.disabled = true; });
            } else {
                wrap.classList.remove('locked');
                radios.forEach(r => { r.disabled = false; });
            }
        }
    } catch (_e) {}
    try {
        DBG && DBG('[TEMPDBG][wardrobe] applied', {
            uiSide,
            switchEnabled,
            switchMode,
            defaultTopSide,
            defaultBottomSide,
            bottomSide,
            topBaseSide,
            topSide,
            mirrored
        });
    } catch (_e) {}
}
