const http = require('http');

console.log('========================================');
console.log('🧪 回归测试 - Bug修复验证');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        req.write(jsonData);
        req.end();
    });
}

function calculateV(s, km, kcat, e) {
    if (s <= 0.001) return 0;
    const vmax = kcat * e * 0.001;
    const denominator = km + s;
    if (denominator === 0) return 0;
    return vmax * s / denominator;
}

async function runTests() {
    console.log('测试1: 底物耗尽后速率归零');
    const sValues = [0, 0.0001, 0.001, 0.002, 1];
    let allZero = true;
    sValues.forEach(s => {
        const v = calculateV(s, 25, 100, 10);
        console.log(`  S=${s}, V=${v}`);
        if (s <= 0.001 && v !== 0) {
            allZero = false;
        }
    });
    
    if (allZero && calculateV(0.002, 25, 100, 10) > 0) {
        console.log('  ✅ 底物耗尽后速率正确归零');
        passed++;
    } else {
        console.log('  ❌ 速率归零逻辑有问题');
        failed++;
    }
    console.log();

    console.log('测试2: 后端参数范围校验 - 非法参数');
    const invalidParams = [
        { params: { s: -1, e: 10, km: 25, kcat: 100 }, desc: 's为负数' },
        { params: { s: 20000, e: 10, km: 25, kcat: 100 }, desc: 's超出上限' },
        { params: { s: 'invalid', e: 10, km: 25, kcat: 100 }, desc: 's不是数字' },
        { params: { s: 50, e: -5, km: 25, kcat: 100 }, desc: 'e为负数' },
        { params: { s: 50, e: 2000000, km: 25, kcat: 100 }, desc: 'e超出上限' },
    ];

    let allRejected = true;
    for (const test of invalidParams) {
        const result = await postRequest('/api/experiments', test);
        console.log(`  ${test.desc}: 状态码=${result.status}`);
        if (result.status !== 400) {
            allRejected = false;
        }
    }

    if (allRejected) {
        console.log('  ✅ 所有非法参数都被正确拒绝');
        passed++;
    } else {
        console.log('  ❌ 部分非法参数未被拒绝');
        failed++;
    }
    console.log();

    console.log('测试3: 后端参数范围校验 - 合法参数');
    const validParams = { s: 50, e: 10, km: 25, kcat: 100 };
    const validResult = await postRequest('/api/experiments', { params: validParams });
    console.log(`  状态码: ${validResult.status}`);
    
    if (validResult.status === 200 && validResult.data.success) {
        console.log('  ✅ 合法参数被正确接受');
        passed++;
    } else {
        console.log('  ❌ 合法参数被错误拒绝');
        failed++;
    }
    console.log();

    console.log('测试4: 后端截图接口校验');
    const screenshotTests = [
        { image: 'invalid', desc: '非base64格式' },
        { image: 'data:image/jpeg;base64,abc', desc: '非PNG格式' },
        { image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', desc: '有效PNG' },
    ];

    for (const test of screenshotTests) {
        const result = await postRequest('/api/screenshot', { image: test.image, id: 'test' });
        console.log(`  ${test.desc}: 状态码=${result.status}`);
        
        if (test.desc === '有效PNG') {
            if (result.status === 200) {
                console.log('    ✅ 有效截图被正确接受');
                passed++;
            } else {
                console.log('    ❌ 有效截图被错误拒绝');
                failed++;
            }
        } else {
            if (result.status === 400) {
                console.log('    ✅ 无效截图被正确拒绝');
                passed++;
            } else {
                console.log('    ❌ 无效截图未被拒绝');
                failed++;
            }
        }
    }
    console.log();

    console.log('========================================');
    console.log(`📊 回归测试总结: 通过 ${passed}, 失败 ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        console.log('🎉 所有回归测试通过！');
    }
}

runTests().catch(console.error);
