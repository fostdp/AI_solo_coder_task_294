import EnzymeKineticsMath from './lib/kineticsMath.js';
import CurvePlotter from './lib/curvePlotter.js';
import ParticleAnimation from './lib/particleAnimation.js';
import './styles/main.css';

const params = {
    s: 50,
    e: 10,
    km: 25,
    kcat: 100
};

let simulationState = {
    isRunning: false,
    time: 0,
    currentS: 50,
    currentP: 0
};

let timeData = [];
let currentPlotType = 'michaelis';
let animationId;
let lastTime = 0;

const kinetics = new EnzymeKineticsMath({
    Km: params.km,
    kcat: params.kcat,
    Et: params.e
});

const ratePlotter = new CurvePlotter('rateCanvas', {
    xAxis: { label: '底物浓度 [S] (mM)' },
    yAxis: { label: '反应速率 V (mM/s)' }
});

const timePlotter = new CurvePlotter('timeCanvas', {
    xAxis: { label: '时间 (s)' },
    yAxis: { label: '浓度 (mM)' },
    legendPosition: 'topLeft'
});

const particleAnim = new ParticleAnimation('animationCanvas');

function resizeCanvases() {
    const rateCanvas = document.getElementById('rateCanvas');
    const timeCanvas = document.getElementById('timeCanvas');
    const animCanvas = document.getElementById('animationCanvas');
    
    ratePlotter.resize(rateCanvas.offsetWidth, rateCanvas.offsetHeight);
    timePlotter.resize(timeCanvas.offsetWidth, timeCanvas.offsetHeight);
    particleAnim.resize(animCanvas.offsetWidth, animCanvas.offsetHeight);
    
    if (!simulationState.isRunning) {
        drawRateCurve();
        drawTimeCurve();
    }
}

function drawRateCurve() {
    ratePlotter.clearDatasets();
    
    let curveData;
    switch (currentPlotType) {
        case 'michaelis':
            curveData = kinetics.getRateCurve(0, 200, 100);
            ratePlotter.setConfig({
                xAxis: { label: '底物浓度 [S] (mM)' },
                yAxis: { label: '反应速率 V (mM/s)' }
            });
            ratePlotter.addDataset(curveData, {
                color: '#00d4ff',
                label: 'Michaelis-Menten',
                showPoints: false
            });
            const currentPoint = [{ x: params.s, y: kinetics.getRate(params.s) }];
            ratePlotter.addDataset(currentPoint, {
                color: '#ff4444',
                label: '当前点',
                showPoints: true,
                pointRadius: 8
            });
            break;
            
        case 'lineweaver':
            curveData = kinetics.getLineweaverBurk(10, 150, 30);
            ratePlotter.setConfig({
                xAxis: { label: '1/[S] (1/mM)' },
                yAxis: { label: '1/V (s/mM)' }
            });
            ratePlotter.addDataset(curveData, {
                color: '#ff6b6b',
                label: 'Lineweaver-Burk',
                showPoints: true,
                pointRadius: 4
            });
            break;
            
        case 'hanes':
            curveData = kinetics.getHanesWoolf(10, 150, 30);
            ratePlotter.setConfig({
                xAxis: { label: '[S] (mM)' },
                yAxis: { label: '[S]/V (s)' }
            });
            ratePlotter.addDataset(curveData, {
                color: '#4dabf7',
                label: 'Hanes-Woolf',
                showPoints: true,
                pointRadius: 4
            });
            break;
            
        case 'eadie':
            curveData = kinetics.getEadieHofstee(10, 150, 30);
            ratePlotter.setConfig({
                xAxis: { label: 'V/[S] (1/s)' },
                yAxis: { label: 'V (mM/s)' }
            });
            ratePlotter.addDataset(curveData, {
                color: '#00ff88',
                label: 'Eadie-Hofstee',
                showPoints: true,
                pointRadius: 4
            });
            break;
    }
    
    ratePlotter.render();
}

function drawTimeCurve() {
    timePlotter.clearDatasets();
    
    const substrateData = timeData.map(d => ({ x: d.time, y: d.S }));
    const productData = timeData.map(d => ({ x: d.time, y: d.P }));
    
    timePlotter.addDataset(substrateData, {
        color: '#ff6b6b',
        label: '底物 [S]',
        showPoints: false
    });
    
    timePlotter.addDataset(productData, {
        color: '#00ff88',
        label: '产物 [P]',
        showPoints: false
    });
    
    timePlotter.render();
}

function updateDisplay() {
    document.getElementById('sValue').textContent = params.s;
    document.getElementById('eValue').textContent = params.e;
    document.getElementById('kmValue').textContent = params.km;
    document.getElementById('kcatValue').textContent = params.kcat;
    
    document.getElementById('vmax').textContent = kinetics.getVmax().toFixed(3);
    document.getElementById('currentV').textContent = kinetics.getRate(simulationState.currentS).toFixed(3);
    document.getElementById('remainingS').textContent = simulationState.currentS.toFixed(2);
    document.getElementById('productP').textContent = simulationState.currentP.toFixed(2);
}

function simulate(timestamp) {
    if (!simulationState.isRunning) return;
    
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (deltaTime > 0.1) {
        animationId = requestAnimationFrame(simulate);
        return;
    }
    
    simulationState.time += deltaTime;
    
    const v = kinetics.getRate(simulationState.currentS);
    const deltaS = v * deltaTime;
    
    simulationState.currentS = Math.max(0, simulationState.currentS - deltaS);
    simulationState.currentP = Math.min(params.s, params.s - simulationState.currentS);
    
    timeData.push({
        time: simulationState.time,
        S: simulationState.currentS,
        P: simulationState.currentP
    });
    
    if (timeData.length > 500) {
        timeData = timeData.slice(-500);
    }
    
    if (Math.random() < 0.02) {
        particleAnim.convertToProduct();
    }
    
    drawTimeCurve();
    updateDisplay();
    
    if (simulationState.currentS > 0.001) {
        animationId = requestAnimationFrame(simulate);
    } else {
        simulationState.isRunning = false;
        particleAnim.stop();
        showStatus('反应完成！', 'success');
    }
}

function resetSimulation() {
    simulationState.isRunning = false;
    particleAnim.stop();
    simulationState.time = 0;
    simulationState.currentS = params.s;
    simulationState.currentP = 0;
    timeData = [{ time: 0, S: params.s, P: 0 }];
    particleAnim.reset();
    drawRateCurve();
    drawTimeCurve();
    updateDisplay();
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
        status.className = 'status';
    }, 3000);
}

async function saveExperiment() {
    const data = {
        params: { ...params },
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/experiments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            showStatus('实验参数保存成功！ID: ' + result.id, 'success');
        } else {
            showStatus('保存失败: ' + result.error, 'error');
        }
    } catch (e) {
        showStatus('保存失败: ' + e.message, 'error');
    }
}

async function saveScreenshot() {
    const tempCanvas = document.createElement('canvas');
    const rateCanvas = document.getElementById('rateCanvas');
    const timeCanvas = document.getElementById('timeCanvas');
    const animCanvas = document.getElementById('animationCanvas');
    
    tempCanvas.width = rateCanvas.width + timeCanvas.width;
    tempCanvas.height = Math.max(rateCanvas.height, timeCanvas.height) + animCanvas.height;
    const ctx = tempCanvas.getContext('2d');
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    ctx.drawImage(rateCanvas, 0, 0);
    ctx.drawImage(timeCanvas, rateCanvas.width, 0);
    ctx.drawImage(animCanvas, 0, Math.max(rateCanvas.height, timeCanvas.height));
    
    const image = tempCanvas.toDataURL('image/png');
    const id = Date.now();
    
    try {
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image, id })
        });
        const result = await response.json();
        if (result.success) {
            showStatus('截图保存成功！文件名: ' + result.filename, 'success');
        } else {
            showStatus('截图保存失败: ' + result.error, 'error');
        }
    } catch (e) {
        showStatus('截图保存失败: ' + e.message, 'error');
    }
}

function setupEventListeners() {
    document.getElementById('sConcentration').addEventListener('input', (e) => {
        params.s = parseInt(e.target.value);
        if (!simulationState.isRunning) {
            resetSimulation();
        }
        updateDisplay();
        drawRateCurve();
    });

    document.getElementById('eConcentration').addEventListener('input', (e) => {
        params.e = parseInt(e.target.value);
        kinetics.setParams({ Et: params.e });
        updateDisplay();
        drawRateCurve();
    });

    document.getElementById('km').addEventListener('input', (e) => {
        params.km = parseInt(e.target.value);
        kinetics.setParams({ Km: params.km });
        updateDisplay();
        drawRateCurve();
    });

    document.getElementById('kcat').addEventListener('input', (e) => {
        params.kcat = parseInt(e.target.value);
        kinetics.setParams({ kcat: params.kcat });
        updateDisplay();
        drawRateCurve();
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        if (!simulationState.isRunning) {
            simulationState.isRunning = true;
            lastTime = performance.now();
            particleAnim.start();
            animationId = requestAnimationFrame(simulate);
            showStatus('反应开始！', 'success');
        }
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        simulationState.isRunning = false;
        particleAnim.stop();
        showStatus('反应已暂停', 'success');
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        resetSimulation();
        showStatus('实验已重置', 'success');
    });

    document.getElementById('saveBtn').addEventListener('click', saveExperiment);
    document.getElementById('screenshotBtn').addEventListener('click', saveScreenshot);

    document.querySelectorAll('.plot-selector button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.plot-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPlotType = btn.dataset.plot;
            drawRateCurve();
        });
    });

    window.addEventListener('resize', resizeCanvases);
}

window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    resizeCanvases();
    resetSimulation();
});
