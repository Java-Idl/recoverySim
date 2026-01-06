import { Logic } from './logic.js';

export const ui = {
    sheet: (id, editId = null) => {
        document.querySelectorAll('.sheet-overlay').forEach(el => el.classList.remove('active'));
        const el = document.getElementById('sh-' + id);
        if (el) el.classList.add('active');
        // 'add' sheet logic is coupled with app.prepareEdit. 
        // We will call app.prepareEdit from app.js or handle it via a custom event if we want strict decoupling.
        // For now, index.html calls ui.sheet('add'), so we need to bridge this.
        if (id === 'add' && window.app) window.app.prepareEdit(editId);
    },
    close: () => {
        document.querySelectorAll('.sheet-overlay').forEach(el => el.classList.remove('active'));
    },
    render: (data, settings, config) => {
        const cont = document.getElementById('list-container');
        // Helper for XSS prevention
        const escapeHtml = (text) => {
            if (text == null) return '';
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        const empty = document.getElementById('empty-state');

        if (!data || !data.length) {
            cont.innerHTML = '';
            if (empty) cont.appendChild(empty); // empty might be null if we cleared innerHTML previously and didn't save it. 
            // Better to re-create empty state or toggle visibility.
            // Existing code appended 'empty' div. Let's assume 'empty-state' is in DOM initially.
            // Actually existing code does: cont.innerHTML = ''; cont.appendChild(empty); 
            // But if empty was inside cont, it's laid to waste.
            // Fix: Check if empty exists, if not create it or just use string.
            if (!empty) {
                cont.innerHTML = `
                <div id="empty-state" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                    <div style="margin-bottom:16px; opacity:0.3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    </div>
                    <p>It's quiet here. Too quiet. Add a subject?</p>
                </div>`;
            } else {
                // It exists in DOM? 
                // If render is called repeatedly, empty might be overwritten.
                // We will re-render empty state string to be safe.
                cont.innerHTML = `
                 <div id="empty-state" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                    <div style="margin-bottom:16px; opacity:0.3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    </div>
                    <p>It's quiet here. Too quiet. Add a subject?</p>
                </div>`;
            }

            document.getElementById('st-overall').innerText = '--';
            return;
        }

        // Sorting Logic
        const sort = settings.sort || 'risk';
        const sorted = [...data].sort((a, b) => {
            const pA = a.present / a.total, pB = b.present / b.total;
            const futA = Logic.getFutureClasses(a.code, config).length;
            const futB = Logic.getFutureClasses(b.code, config).length;
            const statA = Logic.calc(a.present, a.total, futA, settings.target);
            const statB = Logic.calc(b.present, b.total, futB, settings.target);

            if (sort === 'risk') {
                if (statA.isImpossible && !statB.isImpossible) return -1;
                if (!statA.isImpossible && statB.isImpossible) return 1;
                if (statA.isDanger && !statB.isDanger) return -1;
                if (!statA.isDanger && statB.isDanger) return 1;
                return pA - pB;
            }
            if (sort === 'recover') return statB.needed - statA.needed;
            if (sort === 'high') return pB - pA;
            if (sort === 'alpha') return a.name.localeCompare(b.name);
            return 0;
        });

        let totalP = 0, totalT = 0;
        const frag = document.createDocumentFragment();

        sorted.forEach(sub => {
            totalP += sub.present; totalT += sub.total;
            const fut = Logic.getFutureClasses(sub.code, config).length;
            const stats = Logic.calc(sub.present, sub.total, fut, settings.target);

            const card = document.createElement('div');
            card.className = 'card';
            // Use window.app.openViz
            card.onclick = () => window.app && window.app.openViz(sub.id);

            let status = '';
            let barGradient = 'var(--accent-gradient)';

            if (stats.isImpossible) {
                status = `<div class="status-badge st-danger">Optimistic Max: ${stats.max.toFixed(1)}%</div>`;
                barGradient = 'var(--brand)'; // Magenta
            } else if (stats.isDanger) {
                status = `<div class="status-badge st-danger">Requirement: ${stats.needed} (No Skips)</div>
                          ${stats.safeSkips > 0 ? `<div class="status-badge st-success" style="margin-left:4px">Potential: ${stats.safeSkips}</div>` : ''}`;
                barGradient = 'var(--brand)'; // Magenta
            } else {
                status = `<div class="status-badge st-success" title="Consecutive safe skips">Bunk Budget: ${stats.buffer}</div>
                          <div class="status-badge st-success" style="margin-left:4px; opacity:0.8" title="Total skips possible by semester end">Total Safe: ${stats.safeSkips}</div>`;
                barGradient = 'var(--accent)'; // Teal
            }

            card.innerHTML = `
                <div class="card-row">
                    <div>
                        <h3 class="sub-title">${escapeHtml(sub.name)}</h3>
                        <span class="sub-code">${escapeHtml(sub.code)}</span>
                    </div>
                    <div class="pct-val" style="color:${stats.curr < settings.target ? 'var(--brand)' : 'var(--accent)'}; text-align:right;">
                        ${stats.curr.toFixed(0)}<span class="pct-symbol">%</span>
                        <span class="sub-ratio">${sub.present} / ${sub.total}</span>
                    </div>
                </div>
                
                <div class="progress-track">
                    <div class="progress-fill" style="width:${Math.min(stats.curr, 100)}%; background:${barGradient}"></div>
                </div>
                
                <div class="badge-container" style="width:100%; display:flex; justify-content:flex-start;">
                    ${status}
                </div>
            `;
            frag.appendChild(card);
        });

        cont.innerHTML = '';
        cont.appendChild(frag);

        const ovr = totalT > 0 ? (totalP / totalT) * 100 : 0;
        const ovrEl = document.getElementById('st-overall');
        if (ovrEl) {
            ovrEl.innerText = ovr.toFixed(1) + '%';
            ovrEl.style.color = ovr < settings.target ? 'var(--brand)' : 'var(--accent)';
        }
    }
};
