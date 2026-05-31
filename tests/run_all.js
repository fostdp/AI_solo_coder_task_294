const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          酶促反应动力学模拟 - 完整测试套件                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');

const startTime = Date.now();

async function runAllTests() {
    let totalPassed = 0;
    let totalFailed = 0;
    const testResults = [];

    console.log('加载测试模块...\n');

    const kinetics = require('./test_kinetics');
    totalPassed += kinetics.results.passed;
    totalFailed += kinetics.results.failed;
    testResults.push({ name: '米氏方程数值验证', ...kinetics.results });

    const boundaries = require('./test_boundaries');
    totalPassed += boundaries.results.passed;
    totalFailed += boundaries.results.failed;
    testResults.push({ name: '参数边界值溢出测试', ...boundaries.results });

    const backend = await require('./test_backend');
    totalPassed += backend.passed;
    totalFailed += backend.failed;
    testResults.push({ name: '后端API测试', passed: backend.passed, failed: backend.failed });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                        测试总结报告                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    testResults.forEach((test, i) => {
        const status = test.failed === 0 ? '✅' : '❌';
        console.log(`║  ${i + 1}. ${status} ${test.name.padEnd(30)} 通过: ${String(test.passed).padStart(2)}  失败: ${String(test.failed).padStart(2)} ║`);
    });
    
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    const totalTests = totalPassed + totalFailed;
    const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
    const overallStatus = totalFailed === 0 ? '✅ 全部通过' : '❌ 有失败';
    
    console.log(`║                                                           ║`);
    console.log(`║  总测试数: ${String(totalTests).padEnd(38)}║`);
    console.log(`║  通过: ${String(totalPassed).padEnd(3)}  |  失败: ${String(totalFailed).padEnd(3)}  |  通过率: ${passRate.padStart(5)}%         ║`);
    console.log(`║  总耗时: ${duration.toFixed(2)}s${' '.repeat(41)}║`);
    console.log(`║  整体状态: ${overallStatus.padEnd(42)}║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const reportDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
        timestamp: new Date().toISOString(),
        duration: duration,
        totalTests: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        passRate: passRate,
        testResults: testResults
    };
    
    fs.writeFileSync(
        path.join(reportDir, 'test_report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log(`📊 测试报告已保存到: data/test_report.json\n`);

    if (totalFailed > 0) {
        console.log('⚠️  部分测试失败，请检查详细输出\n');
        process.exit(1);
    } else {
        console.log('🎉 所有测试通过！\n');
        process.exit(0);
    }
}

runAllTests().catch(console.error);
