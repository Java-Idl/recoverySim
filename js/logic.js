/* --- LOGIC ENGINE --- */
export const Logic = {
    getEffectiveDay: (date, config) => {
        const day = date.getDay();
        const dateStr = date.toISOString().split('T')[0];
        if (day === 0 || day === 6 || config.holidays.includes(dateStr)) return null;
        return day;
    },
    getFutureClasses: (code, config) => {
        const codeKey = code.match(/\d{3}/)?.[0];
        if (!codeKey) return []; // Or handle gracefully
        
        let classes = [];
        let cursor = new Date(); 
        cursor.setDate(cursor.getDate() + 1); // Start from tomorrow
        
        const end = new Date(config.semEndDate); 
        end.setHours(23,59,59);
        
        // Prevent infinite loops if dates are messed up
        if (cursor > end) return [];

        while (cursor <= end) {
            const day = Logic.getEffectiveDay(cursor, config);
            if (day && config.weeklySchedule[day]) {
                const match = Object.keys(config.weeklySchedule[day]).find(k => codeKey.includes(k));
                if (match) {
                    const count = config.weeklySchedule[day][match];
                    for(let i=0; i<count; i++) classes.push(cursor.toISOString().split('T')[0]);
                }
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        return classes;
    },
    calc: (p, t, future, target) => {
        const curr = t > 0 ? (p/t)*100 : 0;
        const max = t+future > 0 ? ((p+future)/(t+future))*100 : 0;
        const isDanger = curr < target;
        const isImpossible = max < target;
        let needed = 0, buffer = 0;
        
        if (isDanger && !isImpossible) needed = Math.max(0, Math.ceil(((target/100)*t - p) / (1 - target/100)));
        if (!isDanger) buffer = Math.max(0, Math.floor((p - (target/100)*t) / (target/100)));
        
        return { curr, max, isDanger, isImpossible, needed, buffer };
    }
};
