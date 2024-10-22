let flipFlopCount = 1;
let generatedFormulas = [];


document.addEventListener('DOMContentLoaded', (event) => {
    loadInputs();
});

function showExample() {
    addFlipFlop();
    addFlipFlop();

    // Flip Flop 0: Q0'*Q2'+Q1*Q2  Q1
    // Flip Flop 1: Q0*Q2'          Q0*Q1*Q2
    // Flip Flop 2: Q0*Q1           Q0*Q1
    document.getElementById('J0').value = 'Q1\'*Q2\' + Q1*Q2';
    document.getElementById('K0').value = 'Q1';

    document.getElementById('J1').value = 'Q0*Q2\'';
    document.getElementById('K1').value = 'Q0*Q1*Q2';

    document.getElementById('J2').value = 'Q0\'*Q1';
    document.getElementById('K2').value = 'Q0*Q1';

    document.getElementById('example-intro').style.display = 'block';

    saveInputs();
}

function addFlipFlop() {
    const container = document.getElementById('flipFlopContainer');
    const newFlipFlop = document.createElement('div');
    newFlipFlop.classList.add('flip-flop-input');
    newFlipFlop.innerHTML = `
        <label>Flip Flop ${flipFlopCount}:</label>
        <input class='input' type="text" id="J${flipFlopCount}" placeholder="J${flipFlopCount} expression (e.g., Q0'*Q1)">
        <input class='input' type="text" id="K${flipFlopCount}" placeholder="K${flipFlopCount} expression (e.g., Q0*Q1)">
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

        // 如果初始状态为0，保留
        if (cycle === 0) {
            timerResult.push([...Q]);
            continue;
        }

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

    const table = document.createElement('table');
    table.classList.add('mdui-table');
    table.innerHTML = `
        <tr>
            <th>Cycle</th>
            <th>Q</th>
            <th>十进制</th>
        </tr>
    `;
    timerResult.forEach((state, idx) => {
        // 翻转二进制数组
        state.reverse();
        const num = parseInt(state.join(''), 2);
        table.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${state.join('')}</td>
                <td>${num}</td>
            </tr>
        `;
    });

    document.getElementById('timerResultTable').innerHTML = '';
    document.getElementById('timerResultTable').appendChild(table);

    mdui.snackbar({
        message: '电路已生成',
        position: 'right-top'
    });

    
    // 序列，如果是循环序列，最后一个状态是~，否则是->
    const sequence = [];
    timerResult.forEach((state, idx) => {
        const num = parseInt(state.join(''), 2);
        sequence.push(num);
    });

    const isCircular = checkIsCircular(sequence);

   //  drawStateDiagram(sequence, isCircular);


    saveInputs();
}

function checkIsCircular(sequence) {
    const last = sequence[sequence.length - 1];
    return sequence.includes(last, sequence.length - 1);
}

function drawStateDiagram(sequence, isCircular) {
    console.log('Drawing state diagram:', sequence, isCircular);
    const canvas = document.getElementById('stateDiagram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const statePositions = {};
    const radius = 20;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const numStates = sequence.length;

    // 根据节点数量决定排列方式
    if (numStates < 4) {
        // 直线排列
        const spacing = 100;
        sequence.forEach((state, idx) => {
            const x = centerX + (idx - (numStates - 1) / 2) * spacing;
            const y = centerY;
            statePositions[state] = { x, y };
        });
    } else if (numStates === 4) {
        // 正方形排列
        const side = 120;
        const positions = [
            { x: centerX - side / 2, y: centerY - side / 2 },
            { x: centerX + side / 2, y: centerY - side / 2 },
            { x: centerX + side / 2, y: centerY + side / 2 },
            { x: centerX - side / 2, y: centerY + side / 2 }
        ];
        sequence.forEach((state, idx) => {
            statePositions[state] = positions[idx];
        });
    } else {
        const angleStep = (2 * Math.PI) / numStates;
        const radiusOrbit = Math.min(centerX, centerY) - 60;
        sequence.forEach((state, idx) => {
            const angle = idx * angleStep;
            const x = centerX + radiusOrbit * Math.cos(angle);
            const y = centerY + radiusOrbit * Math.sin(angle);
            statePositions[state] = { x, y };
        });
    }

    sequence.forEach((state, idx) => {
        const nextState = sequence[(idx + 1) % sequence.length];
        const { x, y } = statePositions[state];
        const { x: nextX, y: nextY } = statePositions[nextState];

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(state, x - 5, y + 5);

        if (isCircular || idx < sequence.length - 1) {
            drawArrow(ctx, x, y, nextX, nextY, radius);
        }
    });

    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.fillText(isCircular ? 'Circular Sequence' : 'Non-circular Sequence', 10, canvas.height - 10);
}

function drawArrow(ctx, fromX, fromY, toX, toY, radius) {
    const headLength = 10; // 箭头长度
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // 从圆圈边缘开始画线
    const startX = fromX + radius * Math.cos(angle);
    const startY = fromY + radius * Math.sin(angle);
    const endX = toX - radius * Math.cos(angle);
    const endY = toY - radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 画箭头
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
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

    while (flipFlopCount < numFlipFlops) {
        addFlipFlop();
    }

    generatedFormulas.forEach((formula, index) => {
        document.getElementById(`J${index}`).value = formula.J;
        document.getElementById(`K${index}`).value = formula.K;
    });

    saveInputs();
}
