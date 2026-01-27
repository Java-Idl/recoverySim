import { Logic } from './logic.js';
import { ui } from './ui.js';
import { Tone } from './tone.js';

/* --- APPLICATION STATE --- */
const app = {
    data: [],
    settings: { target: 75, theme: 'light', sort: 'risk', tone: 'sarcastic', healthCert: false },
    vizState: [],
    currId: null,
    currentDepartment: 'cys', // Default department
    config: null, // Will be loaded from JSON

    init: async () => {
        try {
            const res = await fetch('config.json');
            if (!res.ok) throw new Error("Failed to load config");
            app.config = await res.json();
        } catch (e) {
            console.error(e);
            alert("Error loading configuration. Please ensure config.json exists.");
            return;
        }

        const d = localStorage.getItem('arp_data_v3');
        const s = localStorage.getItem('arp_settings_v3');
        const dept = localStorage.getItem('arp_department_v3');
        if (d) app.data = JSON.parse(d);
        if (s) {
            app.settings = JSON.parse(s);
            // Default tone if missing
            if (!app.settings.tone) app.settings.tone = 'professional';
        } else {
            // Default to Light Mode (User Request)
            app.settings.theme = 'light';
            app.settings.tone = 'professional';
        }
        if (dept) app.currentDepartment = dept;

        // Sync UI
        const tEl = document.getElementById('in-target');
        if (tEl) tEl.value = app.settings.target;

        const lblT = document.getElementById('lbl-target');
        if (lblT) lblT.innerText = app.settings.target + '%';

        const stT = document.getElementById('st-target');
        if (stT) stT.innerText = app.settings.target + '%';

        const sEl = document.getElementById('in-sort');
        if (sEl) sEl.value = app.settings.sort || 'risk';

        const tnEl = document.getElementById('in-tone');
        if (tnEl) tnEl.value = app.settings.tone || 'professional';

        const hcEl = document.getElementById('in-health-cert');
        if (hcEl) hcEl.checked = app.settings.healthCert || false;

        const deptEl = document.getElementById('in-department');
        if (deptEl) deptEl.value = app.currentDepartment;

        const diff = new Date(app.config.semEndDate) - new Date();
        const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        const stD = document.getElementById('st-days');
        if (stD) stD.innerText = daysLeft;

        app.applyTheme();
        app.applyTone();
        app.setView(app.settings.view || 'card');
        ui.render(app.data, app.settings, app.config);
    },

    save: () => {
        localStorage.setItem('arp_data_v3', JSON.stringify(app.data));
        localStorage.setItem('arp_settings_v3', JSON.stringify(app.settings));
        // Tone is static, so we might not need to re-render entire list every save 
        // unless tone changed. But ui.render handles content updates.
    },

    toggleTheme: () => {
        app.settings.theme = app.settings.theme === 'light' ? 'dark' : 'light';
        app.applyTheme();
        app.save();
    },

    applyTheme: () => {
        document.documentElement.setAttribute('data-theme', app.settings.theme);
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.innerHTML = app.settings.theme === 'dark'
                ? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>'
                : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    },

    setTone: (level) => {
        app.settings.tone = level;
        app.applyTone();
        app.save();
        ui.render(app.data, app.settings, app.config);
    },

    applyTone: () => {
        const t = app.settings.tone || 'professional';

        // Static UI Updates
        const map = {
            'title-import': 'modalImport',
            'btn-import': 'btnImport',
            'title-settings': 'modalSettings',
            'btn-save': 'btnSave',
            'btn-del': 'btnDelete',
            'btn-reset': 'resetConfirm' // Actually this is usually just "Reset All Data" on button
        };

        // Update elements if they exist
        if (document.getElementById('title-import')) document.getElementById('title-import').innerText = Tone.get('modalImport', t);
        if (document.getElementById('btn-import')) document.getElementById('btn-import').innerText = Tone.get('btnImport', t);
        if (document.getElementById('title-settings')) document.getElementById('title-settings').innerText = Tone.get('modalSettings', t);
        if (document.getElementById('btn-save')) document.getElementById('btn-save').innerText = Tone.get('btnSave', t);
        if (document.getElementById('btn-del')) document.getElementById('btn-del').innerText = Tone.get('btnDelete', t);

        // Placeholder updates
        if (document.getElementById('in-import')) document.getElementById('in-import').placeholder = Tone.get('importPlaceholder', t);

        // Reset button text specifically
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) btnReset.innerText = t === 'professional' ? "Reset All Data" : (t === 'unhinged' ? "Nuke Everything" : "Reset Data");
    },

    setTarget: (v) => {
        app.settings.target = parseInt(v);
        const l = document.getElementById('lbl-target');
        if (l) l.innerText = v + '%';
        const s = document.getElementById('st-target');
        if (s) s.innerText = app.getEffectiveTarget() + '%';
        app.save();
        ui.render(app.data, app.settings, app.config);
    },

    updateTarget: (v) => {
        const val = parseInt(v);
        if (val >= 1 && val <= 100) {
            app.settings.target = val;
            const s = document.getElementById('st-target');
            if (s) s.innerText = app.getEffectiveTarget() + '%';
            app.save();
            ui.render(app.data, app.settings, app.config);
        }
    },

    toggleHealthCert: (checked) => {
        app.settings.healthCert = checked;
        const s = document.getElementById('st-target');
        if (s) s.innerText = app.getEffectiveTarget() + '%';
        app.save();
        ui.render(app.data, app.settings, app.config);
    },

    getEffectiveTarget: () => {
        return app.settings.healthCert ? 65 : app.settings.target;
    },

    setSort: (v) => {
        app.settings.sort = v;
        app.save();
        ui.render(app.data, app.settings, app.config);
    },

    setCurrentDepartment: (dept) => {
        app.currentDepartment = dept;
        localStorage.setItem('arp_department_v3', dept);
    },

    setView: (mode) => {
        app.settings.view = mode;
        const cont = document.getElementById('list-container');
        cont.className = ''; // reset
        if (mode !== 'card') cont.classList.add('list-view-' + mode);

        // Show/Hide Table Header
        const thead = document.getElementById('table-header');
        if (thead) thead.style.display = mode === 'table' ? 'grid' : 'none';

        // Update Buttons
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('btn-view-' + mode);
        if (btn) btn.classList.add('active');

        app.save();
    },

    // CRUD

    // CRUD

    prepareEdit: (id) => {
        const isEdit = id !== null;
        document.getElementById('in-id').value = id || '';
        document.getElementById('btn-del').style.display = isEdit ? 'block' : 'none';

        const t = app.settings.tone || 'professional';

        if (isEdit) {
            const sub = app.data.find(s => s.id == id);
            document.getElementById('add-title').innerText = Tone.get('modalEdit', t);
            document.getElementById('in-name').value = sub.name;
            document.getElementById('in-code').value = sub.code;
            document.getElementById('in-total').value = sub.total;
            document.getElementById('in-present').value = sub.present;
        } else {
            document.getElementById('add-title').innerText = Tone.get('modalAdd', t);
            document.getElementById('in-name').value = '';
            document.getElementById('in-code').value = '';
            document.getElementById('in-total').value = '';
            document.getElementById('in-present').value = '';
        }
    },

    saveSubject: () => {
        const id = document.getElementById('in-id').value;
        const sub = {
            id: id ? parseFloat(id) : Date.now(),
            name: document.getElementById('in-name').value || 'Subject',
            code: document.getElementById('in-code').value || 'SUB',
            total: parseInt(document.getElementById('in-total').value) || 0,
            present: parseInt(document.getElementById('in-present').value) || 0
        };

        if (id) {
            const idx = app.data.findIndex(s => s.id == id);
            if (idx > -1) app.data[idx] = sub;
        } else {
            app.data.push(sub);
        }
        app.save();
        ui.render(app.data, app.settings, app.config);
        ui.close();
        if (app.currId == sub.id) {
            ui.close(); // Close Viz if open
            // Re-open viz with fresh data
            setTimeout(() => app.openViz(sub.id), 300);
        }
    },

    deleteSubject: () => {
        const id = document.getElementById('in-id').value;
        const msg = Tone.get('deleteConfirm', app.settings.tone);
        if (confirm(msg)) {
            app.data = app.data.filter(s => s.id != id);
            app.save();
            ui.render(app.data, app.settings, app.config);
            ui.close();
        }
    },

    processImport: () => {
        const txt = document.getElementById('in-import').value;
        const regex = /(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+)/g;
        let match, newData = [], lastIdx = 0;

        // Get the department's weekly schedule from config
        const deptConfig = app.config.departments[app.currentDepartment];
        if (!deptConfig) {
            alert("Error: Department configuration not found. Please select a valid department.");
            return;
        }

        while ((match = regex.exec(txt)) !== null) {
            const [_, t, p, dl] = match;
            let rawChunk = txt.substring(lastIdx, match.index).trim();

            // 1. Remove Portal Navigation Noise
            rawChunk = rawChunk.replace(/Student Portal \(Beta\)|Home|Client|Attendance|Report|Absent|Academic Term/gi, ' ');
            // 2. Remove Degree identifiers (e.g. B.Tech..2023...)
            rawChunk = rawChunk.replace(/B\.Tech[\.\w\d]+/g, ' ');
            // 3. Cleanup spacing
            rawChunk = rawChunk.replace(/\s+/g, ' ').trim();

            let code = "SUB";
            let name = rawChunk;

            // 4. Extract Code (e.g., 20CYS384 or 23LSE311)
            const cMatch = rawChunk.match(/([0-9]{2}[A-Z]{3}[0-9]{3})/);
            if (cMatch) {
                code = cMatch[1];
                // Name is usually AFTER the code in this portal
                const parts = rawChunk.split(code);
                if (parts[1] && parts[1].trim().length > 3) {
                    name = parts[1].trim();
                } else if (parts[0].trim().length > 3) {
                    name = parts[0].replace(code, '').trim();
                } else {
                    name = rawChunk.replace(code, '').trim();
                }
            }
            if (name.length < 2) name = code;

            // Basic sanitization
            name = name.replace(/[<>]/g, '');

            newData.push({
                id: Date.now() + Math.random(),
                code, name,
                total: parseInt(t),
                present: parseInt(p) + parseInt(dl),
                department: app.currentDepartment
            });
            lastIdx = regex.lastIndex;
        }

        if (newData.length) {
            app.data = newData;
            app.save();
            // Update config to use selected department's weekly schedule
            const configCopy = JSON.parse(JSON.stringify(app.config));
            configCopy.weeklySchedule = deptConfig.weeklySchedule;
            app.config = configCopy;
            ui.render(app.data, app.settings, app.config);
            ui.close();
        } else {
            alert("No recognizable data found. Ensure you copy the 'Total | Present' columns.");
        }
    },

    reset: () => {
        const msg = Tone.get('resetConfirm', app.settings.tone);
        if (confirm(msg)) {
            app.data = [];
            app.save();
            ui.render(app.data, app.settings, app.config);
            ui.close();
        }
    },

    // Viz
    openViz: (id) => {
        try {
            app.currId = id;
            const sub = app.data.find(s => s.id == id);
            if (!sub) return;

            document.getElementById('viz-title').innerText = sub.name;

            // Safety check for config
            if (!app.config || !app.config.weeklySchedule) {
                console.warn("Config not loaded, cannot calculate future classes");
                alert("Calendar data missing. Please check config.json.");
                return;
            }

            // Use injected config
            const dates = Logic.getFutureClasses(sub.code, app.config);
            app.vizState = new Array(dates.length).fill(1);

            const cont = document.getElementById('viz-container');
            cont.innerHTML = '';

            if (dates.length === 0) {
                cont.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem; padding:0 20px; width:100%; text-align:center;">No scheduled classes remaining.</span>';
            }

            const frag = document.createDocumentFragment();

            dates.forEach((dStr, i) => {
                const d = new Date(dStr);
                const card = document.createElement('div');
                card.className = 'day-card attend';
                card.innerHTML = `
                    <div class="day-header">${d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="day-body"></div>
                `;

                card.onclick = () => {
                    app.vizState[i] = app.vizState[i] ? 0 : 1;
                    card.className = app.vizState[i] ? 'day-card attend' : 'day-card miss';
                    app.updateVizStats();
                };
                frag.appendChild(card);
            });

            cont.appendChild(frag);
            app.updateVizStats();
            ui.sheet('viz');
        } catch (e) {
            console.error("Error opening viz:", e);
            alert("Could not open timeline. Please check console for details.");
        }
    },

    updateVizStats: () => {
        const sub = app.data.find(s => s.id == app.currId);
        const fut = app.vizState.length;
        const att = app.vizState.reduce((a, b) => a + b, 0);

        const curr = (sub.present / sub.total) * 100;
        const proj = ((sub.present + att) / (sub.total + fut)) * 100;

        document.getElementById('viz-curr').innerText = curr.toFixed(1) + '%';
        const pEl = document.getElementById('viz-proj');
        pEl.innerText = proj.toFixed(1) + '%';

        // Use Bauhaus vars
        const effectiveTarget = app.getEffectiveTarget();
        pEl.style.color = proj >= effectiveTarget ? 'var(--color-blue)' : 'var(--color-red)';
    },

    editFromViz: () => {
        ui.close();
        setTimeout(() => ui.sheet('add', app.currId), 300);
    }
};

// Expose to window so HTML onclick handlers work
window.app = app;
window.ui = ui;

// Initialize
app.init();
