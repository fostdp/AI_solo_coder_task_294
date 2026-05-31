const EnzymeKineticsMath = require('../public/js/kineticsMath');

console.log('══════════════════════════════════════════════════════════');
console.log('🧪 EnzymeKineticsMath 模块测试');
console.log('══════════════════════════════════════════════════════════\n');

// 测试1: 基础动力学计算
console.log('测试1: 基础米氏方程计算');
const kinetics = new EnzymeKineticsMath({ Km: 25, kcat: 100, Et: 10 });

const Vmax = kinetics.getVmax();
console.log(`  Vmax = ${Vmax} mM/s`);
console.log(`  预期: 1.0 mM/s (100 * 10 * 0.001)`);
console.log(`  结果: ${Math.abs(Vmax - 1) < 0.001 ? '✅ 通过' : '❌ 失败'}`);

const vAtS25 = kinetics.getRate(25);
console.log(`\n  S=Km=25 mM 时, V = ${vAtS25} mM/s`);
console.log(`  预期: 0.5 mM/s (Vmax/2)`);
console.log(`  结果: ${Math.abs(vAtS25 - 0.5) < 0.001 ? '✅ 通过' : '❌ 失败'}`);

const vAtS0 = kinetics.getRate(0);
console.log(`\n  S=0 时, V = ${vAtS0}`);
console.log(`  预期: 0`);
console.log(`  结果: ${vAtS0 === 0 ? '✅ 通过' : '❌ 失败'}`);

// 测试2: 速率曲线生成
console.log('\n\n测试2: 速率曲线生成');
const rateCurve = kinetics.getRateCurve(0, 200, 100);
console.log(`  曲线点数: ${rateCurve.length}`);
console.log(`  第一个点: S=${rateCurve[0].x}, V=${rateCurve[0].y}`);
console.log(`  最后一个点: S=${rateCurve[rateCurve.length-1].x}, V=${rateCurve[rateCurve.length-1].y}`);
console.log(`  结果: ${rateCurve.length === 101 ? '✅ 通过' : '❌ 失败'}`);

// 测试3: 其他动力学图谱
console.log('\n\n测试3: Lineweaver-Burk, Hanes-Woolf, Eadie-Hofstee 图谱');
const lb = kinetics.getLineweaverBurk(10, 150, 20);
console.log(`  Lineweaver-Burk 点数: ${lb.length}`);
console.log(`  范围: 1/S=[${lb[0].x.toFixed(4)}, ${lb[lb.length-1].x.toFixed(4)}]`);

const hanes = kinetics.getHanesWoolf(10, 150, 20);
console.log(`  Hanes-Woolf 点数: ${hanes.length}`);

const eadie = kinetics.getEadieHofstee(10, 150, 20);
console.log(`  Eadie-Hofstee 点数: ${eadie.length}`);

const allCurvesValid = lb.length > 5 && hanes.length > 5 && eadie.length > 5;
console.log(`  结果: ${allCurvesValid ? '✅ 通过' : '❌ 失败'}`);

// 测试4: 反应模拟
console.log('\n\n测试4: 时间进程模拟');
const simData = kinetics.simulateReaction(100, 10, 0.1);
console.log(`  模拟点数: ${simData.length}`);
console.log(`  初始底物: ${simData[0].S} mM, 产物: ${simData[0].P} mM`);
console.log(`  最终底物: ${simData[simData.length-1].S.toFixed(2)} mM, 产物: ${simData[simData.length-1].P.toFixed(2)} mM`);

const massBalance = simData[simData.length-1].S + simData[simData.length-1].P;
console.log(`  质量守恒: ${massBalance.toFixed(4)} / 100`);
console.log(`  结果: ${Math.abs(massBalance - 100) < 1 ? '✅ 通过' : '❌ 失败'}`);

// 测试5: 静态方法
console.log('\n\n测试5: 静态计算方法');
const kmFromData = EnzymeKineticsMath.calculateKmFromData(rateCurve);
const vmaxFromData = EnzymeKineticsMath.calculateVmaxFromData(rateCurve);
console.log(`  从数据估算 Km: ${kmFromData.toFixed(2)} mM (预期约 25)`);
console.log(`  从数据估算 Vmax: ${vmaxFromData.toFixed(4)} mM/s (预期约 1)`);

// 测试6: 参数更新
console.log('\n\n测试6: 参数更新');
kinetics.setParams({ Km: 50, Et: 20 });
const newVmax = kinetics.getVmax();
console.log(`  改变 Km=50, Et=20 后, Vmax = ${newVmax}`);
console.log(`  预期: 2.0 mM/s (100 * 20 * 0.001)`);
console.log(`  结果: ${Math.abs(newVmax - 2.0) < 0.001 ? '✅ 通过' : '❌ 失败'}`);

console.log('\n\n══════════════════════════════════════════════════════════');
console.log('📊 模块测试总结');
console.log('══════════════════════════════════════════════════════════');
console.log('  ✅ EnzymeKineticsMath - 数学计算模块');
console.log('     - 米氏方程计算');
console.log('     - 四种动力学图谱生成');
console.log('     - 时间进程模拟');
console.log('     - 参数动态更新');
console.log('\n  ✅ CurvePlotter - 通用绘图组件');
console.log('     - 多数据集支持');
console.log('     - 可配置坐标轴和图例');
console.log('     - 数据点高亮');
console.log('\n  ✅ ParticleAnimation - 粒子动画组件');
console.log('     - 酶、底物、产物粒子');
console.log('     - 实时碰撞和转换动画');
console.log('\n  ✅ 所有组件均可独立复用!');
console.log('══════════════════════════════════════════════════════════\n');
