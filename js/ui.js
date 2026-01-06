import { Logic } from './logic.js';
import { Tone } from './tone.js';

export const ui = {
    sheet: (id, editId = null) => {
        document.querySelectorAll('.sheet-overlay').forEach(el => el.classList.remove('active'));
        const el = document.getElementById('sh-' + id);
        if (el) el.classList.add('active');
        if (id === 'add' && window.app) window.app.prepareEdit(editId);
    },
    close: () => {
        document.querySelectorAll('.sheet-overlay').forEach(el => el.classList.remove('active'));
    },
    render: (data, settings, config) => {
        const cont = document.getElementById('list-container');
        const t = settings.tone || 'professional';

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
            const msg = Tone.get('emptyState', t);

            cont.innerHTML = `
            <div id="empty-state" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                <div style="margin-bottom:16px; opacity:0.3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <p>${escapeHtml(msg)}</p>
            </div>`;

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
            card.onclick = () => window.app && window.app.openViz(sub.id);

            let status = '';
            let barGradient = 'var(--accent-gradient)';

            if (stats.isImpossible) {
                const txt = Tone.get('statusImpossible', t, { n: stats.max.toFixed(1) });
                status = `<div class="status-badge st-danger">${escapeHtml(txt)}</div>`;
                barGradient = 'var(--brand)';
            } else if (stats.isDanger) {
                const txt1 = Tone.get('statusDanger', t, { n: stats.needed });
                const txt2 = stats.safeSkips > 0 ? Tone.get('statusSafe', t, { n: stats.safeSkips }) : '';

                status = `<div class="status-badge st-danger">${escapeHtml(txt1)}</div>
                          ${txt2 ? `<div class="status-badge st-success" style="margin-left:4px">${escapeHtml(txt2)}</div>` : ''}`;
                barGradient = 'var(--brand)';
            } else {
                const txt1 = Tone.get('statusBuffer', t, { n: stats.buffer });
                const txt2 = Tone.get('statusSafe', t, { n: stats.safeSkips });

                status = `<div class="status-badge st-success">${escapeHtml(txt1)}</div>
                          <div class="status-badge st-success" style="margin-left:4px; opacity:0.8">${escapeHtml(txt2)}</div>`;
                barGradient = 'var(--accent)';
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
