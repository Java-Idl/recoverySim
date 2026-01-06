
export const Tone = {
    // Dictionary of phrases for each level
    levels: {
        professional: {
            emptyState: "No subjects found. Please add a course to begin tracking.",
            modalAdd: "Add Subject",
            modalEdit: "Edit Subject",
            modalImport: "Import Data",
            modalSettings: "Settings",
            btnSave: "Save",
            btnDelete: "Delete",
            btnImport: "Import",
            statusImpossible: "Goal not achievable",
            statusDanger: "Requirement: {n} more classes",
            statusBuffer: "Safe to skip: {n} classes",
            statusSafe: "Total Safe Skips: {n}",
            deleteConfirm: "Are you sure you want to delete this subject?",
            resetConfirm: "Are you sure you want to reset all data? This cannot be undone.",
            importPlaceholder: "Paste your attendance table here..."
        },
        sarcastic: {
            emptyState: "It's quiet here. Too quiet. Add a subject?",
            modalAdd: "Manifest Destiny (Add)",
            modalEdit: "Rewrite History (Edit)",
            modalImport: "Mass Ingestion (Import)",
            modalSettings: "The Laws of Physics (Settings)",
            btnSave: "Commit to Database",
            btnDelete: "Expunge Record",
            btnImport: "Process & Pray",
            statusImpossible: "Optimistic Max: {n}%",
            statusDanger: "Requirement: {n} (No Skips)",
            statusBuffer: "Bunk Budget: {n}",
            statusSafe: "Potential: {n}",
            deleteConfirm: "Are you sure you want to drop this subject from reality?",
            resetConfirm: "Nuclear Option: Wipe all data? This cannot be undone.",
            importPlaceholder: "Dump your portal table here. We'll handle the parsing trauma."
        },
        unhinged: {
            emptyState: "Wow, look at all this nothing. Are you even enrolled? Add a subject.",
            modalAdd: "Plot Your Demise (Add)",
            modalEdit: "Gaslight the System (Edit)",
            modalImport: "Garbage In, Garbage Out (Import)",
            modalSettings: "Modify Reality (Settings)",
            btnSave: "Sign Your Soul",
            btnDelete: "Rage Quit Subject",
            btnImport: "Roll the Dice",
            statusImpossible: "Cooked. Max is {n}%",
            statusDanger: "Attend {n} or Drop Out",
            statusBuffer: "Slack off: {n} times",
            statusSafe: "Total Slacking Capacity: {n}",
            deleteConfirm: "Giving up? Classic. Delete this subject?",
            resetConfirm: "Destroying evidence? Coward. Wipe everything?",
            importPlaceholder: "Copy-paste that mess here. I dare you."
        }
    },

    get: (key, level = 'professional', params = {}) => {
        const dict = Tone.levels[level] || Tone.levels.professional;
        let text = dict[key] || Tone.levels.professional[key] || key;

        // Simple interpolation
        Object.keys(params).forEach(k => {
            text = text.replace(`{${k}}`, params[k]);
        });
        return text;
    }
};
