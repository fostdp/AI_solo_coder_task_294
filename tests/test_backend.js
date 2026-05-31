const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🧪 测试7: 后端API测试 - 参数保存');
console.log('========================================\n');

let passed3 = 0;
let failed3 = 0;

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

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
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
        req.end();
    });
}

async function testApi() {
    try {
        console.log('测试7.1: 保存实验参数API');
        const testParams = {
            params: { s: 50, e: 10, km: 25, kcat: 100 },
            timestamp: new Date().toISOString()
        };
        
        const saveResult = await postRequest('/api/experiments', testParams);
        console.log(`  状态码: ${saveResult.status}`);
        console.log(`  响应:`, saveResult.data);
        
        if (saveResult.status === 200 && saveResult.data.success) {
            console.log('  ✅ 参数保存API正常');
            passed3++;
        } else {
            console.log('  ❌ 参数保存API异常');
            failed3++;
        }
        console.log();
        
        console.log('测试7.2: 获取实验参数API');
        const getResult = await getRequest('/api/experiments');
        console.log(`  状态码: ${getResult.status}`);
        
        if (getResult.status === 200 && getResult.data.success) {
            console.log(`  实验记录数: ${getResult.data.data.length}`);
            console.log('  ✅ 获取参数API正常');
            passed3++;
        } else {
            console.log('  ❌ 获取参数API异常');
            failed3++;
        }
        console.log();
        
        console.log('========================================');
        console.log('🧪 测试8: 后端API测试 - 截图保存');
        console.log('========================================\n');
        
        console.log('测试8.1: 小尺寸截图保存');
        const smallImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        
        const smallResult = await postRequest('/api/screenshot', { image: smallImage, id: 'test_small' });
        console.log(`  状态码: ${smallResult.status}`);
        console.log(`  响应:`, smallResult.data);
        
        if (smallResult.status === 200 && smallResult.data.success) {
            console.log('  ✅ 小截图保存成功');
            passed3++;
        } else {
            console.log('  ❌ 小截图保存失败');
            failed3++;
        }
        console.log();
        
        console.log('测试8.2: 验证截图文件存在');
        const screenshotPath = path.join(__dirname, '..', 'data', 'screenshots', 'screenshot_test_small.png');
        
        if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath);
            console.log(`  文件大小: ${stats.size} bytes`);
            console.log('  ✅ 截图文件已保存');
            passed3++;
        } else {
            console.log('  ❌ 截图文件不存在');
            failed3++;
        }
        console.log();
        
        console.log('测试8.3: 前端页面可访问');
        const pageResult = await getRequest('/');
        console.log(`  状态码: ${pageResult.status}`);
        
        if (pageResult.status === 200) {
            console.log('  ✅ 前端页面可正常访问');
            passed3++;
        } else {
            console.log('  ❌ 前端页面访问异常');
            failed3++;
        }
        console.log();
        
    } catch (error) {
        console.log(`  ❌ 请求失败: ${error.message}`);
        failed3 += 5;
    }
    
    console.log('========================================');
    console.log(`📊 测试7-8总结: 通过 ${passed3}, 失败 ${failed3}`);
    console.log('========================================\n');
    
    return { passed: passed3, failed: failed3 };
}

module.exports = testApi();
