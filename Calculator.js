const display = document.getElementById('display');
const expressionDiv = document.getElementById('expression');
const historyList = document.getElementById('history-list');
const numberSystemBtns = document.querySelectorAll('.number-system-btn');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

// --- New Settings Elements ---
const settingsPanel = document.getElementById('settings-panel');
const bgTypeRadios = document.querySelectorAll('input[name="bg-type"]');
const gradientSettings = document.getElementById('gradient-settings');
const solidSettings = document.getElementById('solid-settings');
const gradColor1 = document.getElementById('grad-color1');
const gradColor2 = document.getElementById('grad-color2');
const gradDirection = document.getElementById('grad-direction');
const solidColor = document.getElementById('solid-color');

// --- Confirm Modal Elements ---
const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

let calculationHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];
let isResultDisplayed = false;
let currentBase = 'dec';
let originalDecimalValue = null;
let isFractionDisplayed = false;
let memoryValue = 0;

const functionNames = [
    'sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(',
    'sinh(', 'cosh(', 'tanh(', 'asinh(', 'acosh(', 'atanh(',
    'log(', 'ln(', 'sqrt(', 'cbrt(', 'tenPow(', 'exp(', 'abs('
];

// --- Math Functions ---
const sin = (deg) => Math.sin(deg * Math.PI / 180);
const cos = (deg) => Math.cos(deg * Math.PI / 180);
const tan = (deg) => Math.tan(deg * Math.PI / 180);
const asin = (val) => Math.asin(val) * 180 / Math.PI;
const acos = (val) => Math.acos(val) * 180 / Math.PI;
const atan = (val) => Math.atan(val) * 180 / Math.PI;
const abs = (val) => Math.abs(val);
const tenPow = (val) => Math.pow(10, val);
const log = (val) => Math.log10(val);
const ln = (val) => Math.log(val);
const sqrt = (val) => Math.sqrt(val);
const cbrt = (val) => Math.cbrt(val);
const sinh = (val) => Math.sinh(val);
const cosh = (val) => Math.cosh(val);
const tanh = (val) => Math.tanh(val);
const asinh = (val) => Math.asinh(val);
const acosh = (val) => Math.acosh(val);
const atanh = (val) => Math.atanh(val);
const exp = (val) => Math.exp(val);

const gcd = (a, b) => b ? gcd(b, a % b) : a;
const factorial = (n) => {
    if (n < 0 || n % 1 !== 0) return NaN;
    if (n > 170) return Infinity;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
    result *= i;
    }
    return result;
};

// --- New Settings Functions ---
function toggleSettings() {
    settingsPanel.classList.toggle('show');
}

function updateBackground() {
    const bgType = document.querySelector('input[name="bg-type"]:checked').value;
    let backgroundStyle = '';
    const settings = { type: bgType };

    if (bgType === 'gradient') {
    backgroundStyle = `linear-gradient(${gradDirection.value}, ${gradColor1.value}, ${gradColor2.value})`;
    settings.color1 = gradColor1.value;
    settings.color2 = gradColor2.value;
    settings.direction = gradDirection.value;
    } else {
    backgroundStyle = solidColor.value;
    settings.color = solidColor.value;
    }

    document.body.style.background = backgroundStyle;
    localStorage.setItem('calculatorBackground', JSON.stringify(settings));
}

function loadBackgroundSettings() {
    const savedSettings = localStorage.getItem('calculatorBackground');
    if (savedSettings) {
    const settings = JSON.parse(savedSettings);

    if (settings.type === 'solid') {
        document.querySelector('input[name="bg-type"][value="solid"]').checked = true;
        solidColor.value = settings.color;
        solidSettings.style.display = 'block';
        gradientSettings.style.display = 'none';
    } else {
        document.querySelector('input[name="bg-type"][value="gradient"]').checked = true;
        gradColor1.value = settings.color1 || '#D3D3D3';
        gradColor2.value = settings.color2 || '#A9A9A9';
        gradDirection.value = settings.direction || '135deg';
        solidSettings.style.display = 'none';
        gradientSettings.style.display = 'block';
    }
    }
    updateBackground();
}

// --- Event Listeners for Settings ---
bgTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
    if (e.target.value === 'solid') {
        solidSettings.style.display = 'block';
        gradientSettings.style.display = 'none';
    } else {
        solidSettings.style.display = 'none';
        gradientSettings.style.display = 'block';
    }
    updateBackground();
    });
});
[gradColor1, gradColor2, gradDirection, solidColor].forEach(el => {
    el.addEventListener('input', updateBackground);
});

// --- Notification ---
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// --- Confirm Modal ---
function showConfirm(message, onYes) {
    confirmMessage.textContent = message;
    confirmModal.classList.add("show");

    function cleanup() {
    confirmModal.classList.remove("show");
    confirmYes.removeEventListener("click", yesHandler);
    confirmNo.removeEventListener("click", noHandler);
    }

    function yesHandler() {
    cleanup();
    if (onYes) onYes();
    }

    function noHandler() {
    cleanup();
    }

    confirmYes.addEventListener("click", yesHandler);
    confirmNo.addEventListener("click", noHandler);
}

// --- Calculator Functions ---
numberSystemBtns.forEach(btn => {
    btn.addEventListener('click', () => changeNumberSystem(btn.dataset.base));
});

function changeNumberSystem(base) {
    if (base === currentBase) return;
    try {
    const currentValue = display.value;
    let decimalValue;
    if (currentBase === 'dec') decimalValue = parseFloat(currentValue);
    else if (currentBase === 'hex') decimalValue = parseInt(currentValue, 16);
    else if (currentBase === 'bin') decimalValue = parseInt(currentValue, 2);
    else if (currentBase === 'oct') decimalValue = parseInt(currentValue, 8);

    if (isNaN(decimalValue)) {
        showNotification("Invalid number for conversion");
        return;
    }

    let newValue;
    if (base === 'dec') newValue = decimalValue.toString();
    else if (base === 'hex') newValue = Math.round(decimalValue).toString(16).toUpperCase();
    else if (base === 'bin') newValue = Math.round(decimalValue).toString(2);
    else if (base === 'oct') newValue = Math.round(decimalValue).toString(8);

    calculationHistory.push(`${currentValue} (${currentBase}) → ${newValue} (${base})`);
    updateHistory();
    display.value = newValue;
    currentBase = base;
    numberSystemBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.base === base));
    } catch (error) {
    display.value = 'Error';
    isResultDisplayed = true;
    }
}

function appendValue(value) {
    if (isResultDisplayed) {
    if (['+', '-', '*', '/', '%', '**'].includes(value)) {
        expressionDiv.textContent = display.value + value;
    } else {
        display.value = '';
        expressionDiv.textContent = '';
    }
    isResultDisplayed = false;
    }

    if (currentBase !== 'dec' && !getValidCharsForBase(currentBase).includes(value)) {
    showNotification(`Invalid digit for ${currentBase.toUpperCase()} mode.`);
    return;
    }

    if (display.value === '0' && value !== '.') display.value = '';
    display.value += value;
    isFractionDisplayed = false;
}

function appendHexValue(value) {
    if (currentBase !== 'hex') {
    showNotification(`Hex values only available in HEX mode.`);
    return;
    }
    appendValue(value);
}

function getValidCharsForBase(base) {
    const hexChars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    if (base === 'hex') return hexChars;
    if (base === 'bin') return ['0', '1'];
    if (base === 'oct') return hexChars.slice(0, 8);
    return [...hexChars.slice(0, 10), '.'];
}

function appendConstant(symbol) {
    if (isResultDisplayed) clearForNewInput();
    if (display.value === '0') display.value = '';
    display.value += symbol === 'π' ? 'π' : 'e';
}

function appendFunction(func) {
    if (isResultDisplayed) clearForNewInput();
    if (display.value === '0') display.value = '';
    display.value += func + '(';
}

function appendOperator(op) {
    if (isResultDisplayed) {
    expressionDiv.textContent = display.value + op;
    isResultDisplayed = false;
    }
    display.value += op;
}

function reciprocal() {
    if (display.value === 'Error') return;
    if (isResultDisplayed) {
    display.value = `1/(${display.value})`;
    isResultDisplayed = false;
    } else {
    if (display.value === '0') {
        display.value = '1/(';
    } else {
        let currentExpr = display.value;
        display.value = `1/(${currentExpr})`;
    }
    }
}

function insertRandom() {
    const randomNum = Math.random().toPrecision(15);
    if (isResultDisplayed) {
    clearForNewInput();
    display.value = randomNum;
    return;
    }
    if (display.value === '0') {
    display.value = randomNum;
    } else {
    const lastChar = display.value.slice(-1);
    if (!isNaN(parseInt(lastChar)) || lastChar === ')' || lastChar === 'π' || lastChar === 'e') {
        display.value += '*' + randomNum;
    } else {
        display.value += randomNum;
    }
    }
}

function clearForNewInput() {
    display.value = '';
    expressionDiv.textContent = '';
    isResultDisplayed = false;
}

function clearDisplay() {
    display.value = '0';
    expressionDiv.textContent = '';
    isResultDisplayed = false;
    isFractionDisplayed = false;
    originalDecimalValue = null;
}

function deleteLast() {
    if (display.value === 'Error' || isResultDisplayed) return clearDisplay();
    if (display.value === '0') return;

    let currentValue = display.value;

    for (const func of functionNames) {
    if (currentValue.endsWith(func)) {
        display.value = currentValue.slice(0, -func.length);
        return;
    }
    }

    if (currentValue.endsWith('π') || currentValue.endsWith('e')) {
    display.value = currentValue.slice(0, -1);
    return;
    }

    const multiCharOperators = ['**2', '**'];
    for (const op of multiCharOperators) {
    if (currentValue.endsWith(op)) {
        display.value = currentValue.slice(0, -op.length);
        return;
    }
    }

    display.value = currentValue.slice(0, -1);
    if (display.value === '') display.value = '0';
    isFractionDisplayed = false;
}

function decimalToFraction(_decimal) {
    if (Math.abs(_decimal) > 1e12) return _decimal.toExponential(9);
    if (_decimal % 1 === 0) return _decimal.toString();
    const tolerance = 1.0E-9, sign = _decimal < 0 ? "-" : "";
    const decimal = Math.abs(_decimal);
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = decimal;
    do {
        let a = Math.floor(b);
        [h1, h2] = [a * h1 + h2, h1];
        [k1, k2] = [a * k1 + k2, k1];
        b = 1 / (b - a);
    } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
    return k1 > 99999 ? _decimal.toString() : `${sign}${h1}/${k1}`;
}

function toggleFractionDecimal() {
    if (display.value === 'Error' || display.value === '0') return;
    if (isFractionDisplayed) {
    display.value = originalDecimalValue;
    isFractionDisplayed = false;
    } else {
    try {
        const num = eval(display.value.replace(/π/g, "Math.PI").replace(/e/g, "Math.E"));
        if (!isNaN(num)) {
            originalDecimalValue = num.toString();
            display.value = decimalToFraction(num);
            isFractionDisplayed = true;
        } else {
            showNotification("Invalid value for conversion");
        }
    } catch {
        showNotification("Invalid expression for conversion");
    }
    }
}

function calculateResult() {
    if (display.value === '' || isResultDisplayed) return;
    let expr = display.value;
    expressionDiv.textContent = expr + ' =';
    try {
    expr = expr.replace(/π/g, "Math.PI").replace(/e/g, "Math.E");
    expr = expr.replace(/(\d+(\.\d+)?)!/g, (match, n) => `factorial(${n})`);

    let result = eval(expr);
    result = parseFloat(result.toPrecision(15));
    display.value = result;
    calculationHistory.push(`${expressionDiv.textContent} ${result}`);
    updateHistory();
    isResultDisplayed = true;
    isFractionDisplayed = false;
    originalDecimalValue = null;
    } catch (error) {
    display.value = 'Error';
    isResultDisplayed = true;
    }
}

function toggleHistory() {
    const historyPanel = document.querySelector('.history-panel');
    historyPanel.style.display = historyPanel.style.display === 'none' ? 'flex' : 'none';
}

function clearAllHistory() {
    if (calculationHistory.length === 0) {
    showNotification("History is already empty");
    return;
    }

    showConfirm("Are you sure you want to clear all calculation history?", () => {
    calculationHistory = [];
    updateHistory();
    showNotification("History cleared");
    });
}

function updateHistory() {
    historyList.innerHTML = '';
    calculationHistory.slice().reverse().forEach(calc => {
    const li = document.createElement('li');
    li.textContent = calc;
    historyList.appendChild(li);
    });

    if (typeof(Storage) !== "undefined") {
    localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadBackgroundSettings();

    if (typeof(Storage) !== "undefined") {
    const savedHistory = localStorage.getItem('calcHistory');
    if (savedHistory) {
        calculationHistory = JSON.parse(savedHistory);
        updateHistory();
    }
    }
});

// --- Memory Functions ---
function memoryStore() {
    try {
    const value = eval(display.value.replace(/π/g, "Math.PI").replace(/e/g, "Math.E"));
    memoryValue = value;
    showNotification(`Stored ${value} in memory`);
    } catch (error) {
    showNotification("Invalid value for memory storage");
    }
}

function memoryRecall() {
    if (isResultDisplayed) clearForNewInput();
    display.value = memoryValue;
}

function memoryAdd() {
    try {
    const value = eval(display.value.replace(/π/g, "Math.PI").replace(/e/g, "Math.E"));
    memoryValue += value;
    showNotification(`Added ${value} to memory`);
    } catch (error) {
    showNotification("Invalid value for memory operation");
    }
}

function memorySubtract() {
    try {
    const value = eval(display.value.replace(/π/g, "Math.PI").replace(/e/g, "Math.E"));
    memoryValue -= value;
    showNotification(`Subtracted ${value} from memory`);
    } catch (error) {
    showNotification("Invalid value for memory operation");
    }
}

function memoryClear() {
    memoryValue = 0;
    showNotification("Memory cleared");
}

function factorialFunction() {
    try {
    const value = eval(display.value.replace(/π/g, "Math.PI").replace(/e/g, "Math.E"));
    const result = factorial(value);
    if (isNaN(result)) {
        showNotification("Invalid input for factorial");
        return;
    }
    if (result === Infinity) {
        showNotification("Factorial value too large");
        return;
    }
    display.value = result;
    expressionDiv.textContent = `${value}! =`;
    calculationHistory.push(`${value}! = ${result}`);
    updateHistory();
    isResultDisplayed = true;
    } catch (error) {
    showNotification("Error calculating factorial");
    }
}

// --- Keydown Handler (fixed) ---
document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (
    key === 'Backspace' ||
    key === 'Enter' || key === '=' ||
    key === 'Escape' || key.toLowerCase() === 'c' ||
    key === '^' ||
    (key >= '0' && key <= '9') ||
    ['+', '-', '*', '/', '.', '(', ')', '%'].includes(key) ||
    /^[a-fA-F]$/.test(key)
    ) {
    e.preventDefault();
    }

    if (key === 'Backspace') {
    deleteLast();
    } else if (key >= '0' && key <= '9' || ['+', '-', '*', '/', '.', '(', ')', '%'].includes(key)) {
    appendValue(key);
    } else if (/^[a-fA-F]$/.test(key)) {
    appendHexValue(key.toUpperCase());
    } else if (key === '^') {
    appendValue('**');
    } else if (key === 'Enter' || key === '=') {
    calculateResult();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    clearDisplay();
    }
});

document.addEventListener('DOMContentLoaded', loadBackgroundSettings);