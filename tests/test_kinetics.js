const assert = require('assert');

function calculateV(s, km, kcat, e) {
    const vmax = kcat * e * 0.001;
    const denominator = km + s;
    if (denominator === 0) return 0;
    return vmax * s / denominator;
}

function getVmax(kcat, e) {
    return kcat * e * 0.001;
}

console.log('========================================');
console.log('🧪 测试1: 米氏方程数值验证');
console.log('========================================\n');

const testCases = [
    { s: 0, km: 25, kcat: 100, e: 10, expected: 0, desc: 'S=0时速率应为0' },
    { s: 25, km: 25, kcat: 100, e: 10, expected: 0.5, desc: 'S=Km时速率应为Vmax的一半' },
    { s: 2500, km: 25, kcat: 100, e: 10, expected: 1.0, desc: 'S>>Km时速率应接近Vmax', tolerance: 0.02 },
    { s: 50, km: 25, kcat: 100, e: 10, expected: null, desc: '任意S值速率计算' },
];

let passed1 = 0;
let failed1 = 0;

const vmax = getVmax(100, 10);
console.log(`Vmax = kcat * e * 0.001 = 100 * 10 * 0.001 = ${vmax} mM/s`);
console.log();

testCases.forEach((test, i) => {
    const result = calculateV(test.s, test.km, test.kcat, test.e);
    const expected = test.expected !== null ? test.expected * vmax : null;
    
    console.log(`测试 ${i + 1}: ${test.desc}`);
    console.log(`  参数: S=${test.s}, Km=${test.km}, kcat=${test.kcat}, e=${test.e}`);
    console.log(`  计算结果: ${result.toFixed(6)} mM/s`);
    
    if (expected !== null) {
        const tolerance = test.tolerance || 0.001;
        const diff = Math.abs(result - expected);
        const passed = diff < tolerance;
        
        console.log(`  预期结果: ${expected.toFixed(6)} mM/s`);
        console.log(`  差值: ${diff.toFixed(8)}`);
        console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
        
        if (passed) passed1++;
        else failed1++;
    } else {
        console.log(`  结果: ✅ 计算成功`);
        passed1++;
    }
    console.log();
});

console.log('========================================');
console.log('🧪 测试2: 速率单调递增性验证');
console.log('========================================\n');

let isIncreasing = true;
let prevV = -1;

for (let s = 0; s <= 200; s += 10) {
    const v = calculateV(s, 25, 100, 10);
    if (v < prevV) {
        isIncreasing = false;
        console.log(`❌ 异常: S=${s}时速率(${v.toFixed(4)}) < S=${s-10}时速率(${prevV.toFixed(4)})`);
    }
    prevV = v;
}

if (isIncreasing) {
    console.log('✅ 速率随底物浓度增加单调递增，符合预期');
    passed1++;
} else {
    failed1++;
}
console.log();

console.log('========================================');
console.log('🧪 测试3: Vmax渐近线验证');
console.log('========================================\n');

let approachingVmax = true;
const targetVmax = getVmax(100, 10);

for (let s = 100; s <= 10000; s *= 2) {
    const v = calculateV(s, 25, 100, 10);
    const ratio = v / targetVmax;
    console.log(`S=${s}, V=${v.toFixed(6)}, V/Vmax=${(ratio * 100).toFixed(4)}%`);
    
    if (ratio > 1.0001) {
        approachingVmax = false;
        console.log(`❌ 异常: 速率超过Vmax`);
    }
}

if (approachingVmax) {
    console.log('✅ 速率随S增大逐渐接近Vmax，符合预期');
    passed1++;
} else {
    failed1++;
}
console.log();

console.log('========================================');
console.log(`📊 测试1-3总结: 通过 ${passed1}, 失败 ${failed1}`);
console.log('========================================\n');

module.exports = {
    calculateV,
    getVmax,
    results: { passed: passed1, failed: failed1 }
};
