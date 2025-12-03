// script.js — client-side JSON formatter/validator
(function () {
    const rawInput = document.getElementById('rawInput');
    const processBtn = document.getElementById('processBtn');
    const clearBtn = document.getElementById('clearBtn');
    const outputColumn = document.getElementById('outputColumn');
    const formattedOutput = document.getElementById('formattedOutput');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const messageEl = document.getElementById('message');
    const indentSelect = document.getElementById('indent');
    const tabsSelect = document.getElementById('tabsSelect');
    const autoFixQuotes = document.getElementById('autoFixQuotes');

    function showMessage(text, type = 'info') {
        messageEl.textContent = text;
        messageEl.style.color = type === 'error' ? '#b91c1c' : '#065f46';
        setTimeout(() => { if (messageEl.textContent === text) messageEl.textContent = ''; }, 4000);
    }

    function cleanInput(s) {
        let t = s.trim();
        if (autoFixQuotes && autoFixQuotes.checked) {
            // Best-effort fixes:
            // 1) remove trailing commas
            t = t.replace(/,\s*([}\]])/g, '$1');
            // 2) replace single quotes around strings with double quotes (simple case)
            t = t.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '\"$1\"');
        }
        return t;
    }

    function process() {
        const indent = parseInt(indentSelect.value, 10) || 4;
        let raw = rawInput.value.trim();
        let fixes = [];

        // Step 0: Remove outer single or double quotes
        if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
            raw = raw.slice(1, -1);
            fixes.push("Removed outer quotes");
        }

        // Step 1: Auto-correct Python-style literals
        raw = raw.replace(/\bTrue\b/g, () => { fixes.push("Converted True → true"); return "true"; });
        raw = raw.replace(/\bFalse\b/g, () => { fixes.push("Converted False → false"); return "false"; });
        raw = raw.replace(/\bNone\b/g, () => { fixes.push("Converted None → null"); return "null"; });

        // Step 2: Fix inner single quotes
        const before = raw;
        raw = raw.replace(/'/g, '"');
        if (raw !== before) fixes.push("Converted inner single quotes → double quotes");

        // Step 3: Fix unquoted object keys
        raw = raw.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, (match, prefix, key) => {
            fixes.push(`Fixed key → "${key}"`);
            return `${prefix}"${key}":`;
        });

        const fixesListEl = document.getElementById('fixesList');
        fixesListEl.innerHTML = "";

        try {
            const parsed = JSON.parse(raw);
            const formatted = JSON.stringify(parsed, null, indent);
            formattedOutput.textContent = formatted;
            outputColumn.style.display = "block";

            if (fixes.length > 0) {
                showMessage('success', "Auto-fixes applied");
                fixesListEl.style.display = "block";
                fixesListEl.innerHTML = "<strong>Fixes applied:</strong><ul>" + fixes.map(f => `<li>${f}</li>`).join("") + "</ul>";
            } else {
                showMessage('success', "JSON successfully formatted");
            }
        } catch (err) {
            formattedOutput.textContent = "Invalid JSON: " + err.message;
            outputColumn.style.display = "block";
            showMessage('error', "Invalid JSON: " + err.message);
            console.error(err);
        }
    }

    processBtn.addEventListener('click', process);
    clearBtn.addEventListener('click', () => { rawInput.value = ''; formattedOutput.textContent = ''; outputColumn.style.display = 'none'; showMessage('Cleared'); });

    copyBtn.addEventListener('click', () => {
        const text = formattedOutput.textContent || rawInput.value;
        navigator.clipboard.writeText(text).then(() => showMessage('Copied to clipboard'));
    });

    downloadBtn.addEventListener('click', () => {
        const text = formattedOutput.textContent || rawInput.value;
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'data.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    minifyBtn.addEventListener('click', () => {
        try {
            const obj = JSON.parse(formattedOutput.textContent || rawInput.value);
            formattedOutput.textContent = JSON.stringify(obj);
            showMessage('Minified JSON');
        } catch (e) { showMessage('Cannot minify: invalid JSON', 'error'); }
    });

    // Tabs select updates indentation and re-formats if visible
    tabsSelect.addEventListener('change', () => {
        const cur = tabsSelect.value;
        indentSelect.value = cur;
        if (formattedOutput.textContent) process();
    });

    // Keyboard shortcut: Ctrl/Cmd + Enter
    rawInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault(); process();
        }
    });

    // initial hide
    outputColumn.style.display = 'none';
})();
