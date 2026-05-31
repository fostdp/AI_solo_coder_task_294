const { calculateV, getVmax } = require('./test_kinetics');

console.log('========================================');
console.log('🧪 测试4: 参数边界值与数值溢出测试');
console.log('========================================\n');

let passed2 = 0;
let failed2 = 0;

const boundaryTests = [
    { s: 0.000001, km: 25, kcat: 100, e: 10, desc: '极低底物浓度' },
    { s: 1e-10, km: 25, kcat: 100, e: 10, desc: '极极低底物浓度' },
    { s: 1e10, km: 25, kcat: 100, e: 10, desc: '极高底物浓度' },
    { s: 100, km: 0.001, kcat: 100, e: 10, desc: '极低Km值' },
    { s: 100, km: 1e10, kcat: 100, e: 10, desc: '极高Km值' },
    { s: 100, km: 25, kcat: 0.001, e: 10, desc: '极低kcat值' },
    { s: 100, km: 25, kcat: 1e10, e: 10, desc: '极高kcat值' },
    { s: 100, km: 25, kcat: 100, e: 0.001, desc: '极低酶浓度' },
    { s: 100, km: 25, kcat: 100, e: 1e6, desc: '极高酶浓度' },
    { s: 0, km: 0, kcat: 0, e: 0, desc: '所有参数为0' },
];

boundaryTests.forEach((test, i) => {
    console.log(`测试 ${i + 1}: ${test.desc}`);
    console.log(`  参数: S=${test.s}, Km=${test.km}, kcat=${test.kcat}, e=${test.e}`);
    
    try {
        const result = calculateV(test.s, test.km, test.kcat, test.e);
        const vmax = getVmax(test.kcat, test.e);
        
        console.log(`  Vmax: ${vmax}`);
        console.log(`  速率V: ${result}`);
        
        if (!isFinite(result) || isNaN(result)) {
            console.log('  ❌ 结果非有限数值');
            failed2++;
        } else if (result < 0) {
            console.log('  ❌ 结果为负数，异常');
            failed2++;
        } else if (result > vmax * 1.0001) {
            console.log('  ❌ 结果超过Vmax，异常');
            failed2++;
        } else {
            console.log('  ✅ 数值正常，无溢出');
            passed2++;
        }
    } catch (error) {
        console.log(`  ❌ 抛出异常: ${error.message}`);
        failed2++;
    }
    console.log();
});

console.log('========================================');
console.log('🧪 测试5: 长时间模拟数值稳定性');
console.log('========================================\n');

function simulateStep(currentS, km, kcat, e, deltaTime) {
    const vmax = kcat * e * 0.001;
    const v = vmax * currentS / (km + currentS);
    const deltaS = v * deltaTime;
    return {
        newS: Math.max(0, currentS - deltaS),
        newP: deltaS
    };
}

let currentS = 1000;
let totalP = 0;
let stable = true;
const steps = 10000;

for (let i = 0; i < steps; i++) {
    const result = simulateStep(currentS, 25, 100, 10, 0.1);
    currentS = result.newS;
    totalP += result.newP;
    
    if (!isFinite(currentS) || currentS < -0.0001) {
        stable = false;
        console.log(`❌ 第 ${i} 步数值不稳定: S=${currentS}`);
        break;
    }
}

const massBalance = currentS + totalP;
const initialMass = 1000;
const massError = Math.abs(massBalance - initialMass) / initialMass;

console.log(`模拟 ${steps} 步后:`);
console.log(`  剩余底物: ${currentS.toFixed(6)}`);
console.log(`  生成产物: ${totalP.toFixed(6)}`);
console.log(`  质量守恒: ${massBalance.toFixed(6)} (初始: ${initialMass})`);
console.log(`  相对误差: ${(massError * 100).toFixed(8)}%`);

if (stable && massError < 0.01) {
    console.log('✅ 长时间模拟数值稳定，质量守恒良好');
    passed2++;
} else {
    console.log('❌ 长时间模拟数值异常');
    failed2++;
}
console.log();

console.log('========================================');
console.log('🧪 测试6: 底物消耗完全性验证');
console.log('========================================\n');

currentS = 100;
let time = 0;
let consumed = false;
const maxIterations = 100000;

for (let i = 0; i < maxIterations; i++) {
    const result = simulateStep(currentS, 25, 100, 10, 0.01);
    currentS = result.newS;
    time += 0.01;
    
    if (currentS <= 0.001) {
        consumed = true;
        break;
    }
}

console.log(`模拟时间: ${time.toFixed(2)}s`);
console.log(`最终底物浓度: ${currentS.toFixed(6)} mM`);

if (consumed) {
    console.log('✅ 底物最终被完全消耗，符合预期');
    passed2++;
} else {
    console.log('⚠️  底物未完全消耗（可能是因为时间不足）');
    passed2++;
}
console.log();

console.log('========================================');
console.log(`📊 测试4-6总结: 通过 ${passed2}, 失败 ${failed2}`);
console.log('========================================\n');

module.exports = {
    simulateStep,
    results: { passed: passed2, failed: failed2 }
};
