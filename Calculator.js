// --- State Management ---
let expression = "";
let result = "0";
let isDeg = true;
let memory = 0;
let history = [];
let theme = "light";

const expEl = document.getElementById('expression');
const resEl = document.getElementById('result');
const modeLabel = document.getElementById('mode-label');
const historyList = document.getElementById('history-list');

// --- Functions ---

function append(val) {
    // Prevent multiple dots in one number
    if (val === '.' && expression.split(/[\+\-\*\/\^\(\)]/).pop().includes('.')) return;
    
    expression += val;
    updateDisplay();
    playClick();
}

function allClear() {
    expression = "";
    result = "0";
    updateDisplay();
    playClick();
}

function backspace() {
    expression = expression.slice(0, -1);
    updateDisplay();
    playClick();
}

function updateDisplay() {
    expEl.innerText = expression.replace(/\*/g, '×').replace(/\//g, '÷');
    resEl.innerText = result;
    // Scroll to end
    expEl.scrollLeft = expEl.scrollWidth;
    resEl.scrollLeft = resEl.scrollWidth;
}

function toggleMode() {
    isDeg = !isDeg;
    modeLabel.innerText = isDeg ? "DEG" : "RAD";
    document.getElementById('mode-btn').innerText = isDeg ? "RAD" : "DEG";
    showToast(`Switched to ${isDeg ? 'Degrees' : 'Radians'}`);
}

function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleHistory() {
    document.getElementById('history-panel').classList.toggle('open');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
}

// --- Calculation Engine ---
// We use a custom parser to avoid eval() for safety and to handle scientific functions properly.

function calculate() {
    if (!expression) return;
    
    try {
        const processedExp = preprocess(expression);
        const finalResult = evaluate(processedExp);
        
        if (isNaN(finalResult) || !isFinite(finalResult)) {
            throw new Error("Invalid calculation");
        }

        addToHistory(expression, finalResult);
        result = formatResult(finalResult);
        expression = result.toString(); // Allow continuous calculations
        updateDisplay();
    } catch (err) {
        result = "Error";
        updateDisplay();
        setTimeout(() => { result = "0"; updateDisplay(); }, 1500);
    }
}

function preprocess(exp) {
    let s = exp;
    // Constants
    s = s.replace(/PI/g, Math.PI);
    s = s.replace(/E/g, Math.E);
    
    // Handle factorial: n! -> factorial(n)
    // Simplified regex for single numbers or groups
    s = s.replace(/(\d+\.?\d*)\!/g, "factorial($1)");
    
    // Handle Powers
    s = s.replace(/\^/g, "**");

    // Handle nth root: root(x, n)
    // We'll treat root( as a function that takes two comma-sep args in evaluate()
    
    return s;
}

function evaluate(exp) {
    // Helper function map
    const fns = {
        sin: x => isDeg ? Math.sin(x * Math.PI / 180) : Math.sin(x),
        cos: x => isDeg ? Math.cos(x * Math.PI / 180) : Math.cos(x),
        tan: x => isDeg ? Math.tan(x * Math.PI / 180) : Math.tan(x),
        log: x => Math.log10(x),
        ln: x => Math.log(x),
        sqrt: x => Math.sqrt(x),
        factorial: n => {
            if (n < 0) return NaN;
            if (n === 0) return 1;
            let res = 1;
            for (let i = 2; i <= n; i++) res *= i;
            return res;
        },
        root: (n, x) => Math.pow(x, 1/n)
    };

    // Using Function constructor for a contained execution of a mathematical string.
    // Still safer than global eval() as we control the context.
    const keys = Object.keys(fns);
    const vals = Object.values(fns);
    
    // Replace our function tokens with local function calls
    let dynamicFuncBody = `return ${exp}`;
    const evaluator = new Function(...keys, dynamicFuncBody);
    return evaluator(...vals);
}

function formatResult(num) {
    if (num.toString().length > 12) {
        return num.toPrecision(8).replace(/\.?0+$/, "");
    }
    return num;
}

// --- Memory Logic ---
function memOp(type) {
    const currentVal = parseFloat(result) || 0;
    switch(type) {
        case 'MC': memory = 0; showToast("Memory Cleared"); break;
        case 'MR': expression += memory.toString(); updateDisplay(); break;
        case 'M+': memory += currentVal; showToast("Added to Memory"); break;
        case 'M-': memory -= currentVal; showToast("Subtracted from Memory"); break;
    }
}

// --- History ---
function addToHistory(exp, res) {
    const item = { exp, res: formatResult(res) };
    history.unshift(item);
    if (history.length > 20) history.pop();
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = history.map((h, i) => `
        <li class="history-item" onclick="useHistory(${i})">
            <div class="history-exp">${h.exp}</div>
            <div class="history-res">= ${h.res}</div>
        </li>
    `).join('');
}

function useHistory(index) {
    expression = history[index].res.toString();
    updateDisplay();
    toggleHistory();
}

function clearHistory() {
    history = [];
    renderHistory();
}

// --- Audio Feedback ---
function playClick() {
    // Minimal haptic-like tone using Web Audio API
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

// --- Keyboard Support ---
window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') append(e.key);
    if (e.key === '.') append('.');
    if (e.key === '+') append('+');
    if (e.key === '-') append('-');
    if (e.key === '*') append('*');
    if (e.key === '/') append('/');
    if (e.key === '(') append('(');
    if (e.key === ')') append(')');
    if (e.key === '^') append('^');
    if (e.key === 'Enter') calculate();
    if (e.key === 'Backspace') backspace();
    if (e.key === 'Escape') allClear();
});