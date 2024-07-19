let flipFlopCount = 1;
let generatedFormulas = [];

document.addEventListener('DOMContentLoaded', (event) => {
    loadInputs();
});

function addFlipFlop() {
    const container = document.getElementById('flipFlopContainer');
    const newFlipFlop = document.createElement('div');
    newFlipFlop.classList.add('flip-flop-input');
    newFlipFlop.innerHTML = `
        <label>Flip Flop ${flipFlopCount}:</label>
        <input class="input" type="text" id="J${flipFlopCount}" placeholder="J${flipFlopCount} expression (e.g., Q0'*Q1)">
        <input class="input" type="text" id="K${flipFlopCount}" placeholder="K${flipFlopCount} expression (e.g., Q0*Q1)">
    `;
    container.appendChild(newFlipFlop);
    flipFlopCount++;
    saveInputs();
}

function parseExpression(expression, Q) {
    return expression
        .replace(/Q(\d+)'/g, (match, p1) => `!(${Q[parseInt(p1)] || 0})`)
        .replace(/Q(\d+)/g, (match, p1) => `(${Q[parseInt(p1)] || 0})`)
        .replace(/\*/g, ' && ')
        .replace(/\+/g, ' || ');
}

function evaluateExpression(expression) {
    try {
        return eval(expression) ? 1 : 0;
    } catch (error) {
        return 0;
    }
}

function jkFlipFlop(J, K, Q) {
    if (J === 0 && K === 0) return Q;
    if (J === 0 && K === 1) return 0;
    if (J === 1 && K === 0) return 1;
    if (J === 1 && K === 1) return Q === 0 ? 1 : 0;
}

function generateCircuit() {
    const Q = Array(flipFlopCount).fill(0);
    const timerResult = [];

    for (let cycle = 0; cycle < 10; cycle++) {
        const newQ = [...Q];

        for (let i = 0; i < flipFlopCount; i++) {
            const Jexp = document.getElementById(`J${i}`).value;
            const Kexp = document.getElementById(`K${i}`).value;

            const J = evaluateExpression(parseExpression(Jexp, Q));
            const K = evaluateExpression(parseExpression(Kexp, Q));

            newQ[i] = jkFlipFlop(J, K, Q[i]);
        }

        Q.forEach((_, idx) => Q[idx] = newQ[idx]);
        timerResult.push([...Q]);
    }

    document.getElementById('timerResult').innerHTML = 
        timerResult.map((state, idx) => `Cycle ${idx + 1}: ${state.join(', ')}`).join('<br>');

    saveInputs();
}

function saveInputs() {
    const inputs = {};
    for (let i = 0; i < flipFlopCount; i++) {
        inputs[`J${i}`] = document.getElementById(`J${i}`).value;
        inputs[`K${i}`] = document.getElementById(`K${i}`).value;
    }
    localStorage.setItem('flipFlopInputs', JSON.stringify(inputs));
}

function loadInputs() {
    const savedInputs = JSON.parse(localStorage.getItem('flipFlopInputs'));
    if (savedInputs) {
        Object.keys(savedInputs).forEach(key => {
            const id = key.slice(1);
            if (id >= flipFlopCount) {
                addFlipFlop();
            }
            document.getElementById(key).value = savedInputs[key];
        });
    }
}

function clearInputs() {
    localStorage.removeItem('flipFlopInputs');
    location.reload();
}

function generateJKFormulas() {
    const sequenceInput = document.getElementById('sequenceInput').value;
    const sequenceParts = sequenceInput.split('~');
    const sequence = sequenceParts[0].split(',').map(num => parseInt(num.trim()));

    const isCircular = sequenceParts.length > 1;

    const numFlipFlops = Math.ceil(Math.log2(Math.max(...sequence) + 1));
    const stateTable = sequence.map(num => num.toString(2).padStart(numFlipFlops, '0').split('').map(bit => parseInt(bit)));

    if (isCircular) {
        stateTable.push(stateTable[0]);
    }

    generatedFormulas = [];

    for (let i = 0; i < numFlipFlops; i++) {
        let jFormula = [];
        let kFormula = [];

        for (let t = 0; t < stateTable.length - 1; t++) {
            const currentState = stateTable[t];
            const nextState = stateTable[t + 1];

            const currentBit = currentState[i];
            const nextBit = nextState[i];

            if (currentBit === 0 && nextBit === 1) {
                jFormula.push(`(${currentState.map((bit, idx) => bit ? `Q${idx}` : `!Q${idx}`).join(' && ')})`);
            } else if (currentBit === 1 && nextBit === 0) {
                kFormula.push(`(${currentState.map((bit, idx) => bit ? `Q${idx}` : `!Q${idx}`).join(' && ')})`);
            }
        }

        generatedFormulas.push({
            J: jFormula.join(' || ') || '0',
            K: kFormula.join(' || ') || '0'
        });
    }

    const resultContainer = document.getElementById('jkFormulasResult');
    resultContainer.innerHTML = '';
    generatedFormulas.forEach((formula, index) => {
        resultContainer.innerHTML += `<p>Flip Flop ${index}: J = ${formula.J}, K = ${formula.K}</p>`;
    });
}

function fillGeneratedFormulas() {
    const numFlipFlops = generatedFormulas.length;

    // Ensure there are enough input fields
    while (flipFlopCount < numFlipFlops) {
        addFlipFlop();
    }

    generatedFormulas.forEach((formula, index) => {
        document.getElementById(`J${index}`).value = formula.J;
        document.getElementById(`K${index}`).value = formula.K;
    });

    saveInputs();
}
