import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { aggregateVentures, filterVentures, metricRows } from '../src/portfolio-core/metrics.mjs';

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../data/public-data.js',import.meta.url),'utf8'),sandbox);
const ventures=sandbox.window.IMPACTA_PUBLIC_DATA;

test('muestra completa coincide con la fuente preparada',()=>{
  const a=aggregateVentures(ventures);
  assert.deepEqual(a,{count:116,employees:1584,employeesKnown:58,employeesMissing:58,sales2024:38805546447,salesKnown:58,salesMissing:58});
});

test('búsqueda Astrolab usa el mismo registro para cuadrícula e indicadores',()=>{
  const list=filterVentures(ventures,{q:'Astrolab'}),a=aggregateVentures(list);
  assert.equal(list.length,1);assert.equal(list[0].name,'Astrolab');assert.equal(a.employees,9);assert.equal(a.sales2024,157000000);
});

test('filtro Salud produce los valores esperados verificables',()=>{
  const a=aggregateVentures(filterVentures(ventures,{division:'Salud'}));
  assert.deepEqual(a,{count:5,employees:38,employeesKnown:5,employeesMissing:0,sales2024:1690857542,salesKnown:5,salesMissing:0});
});

test('cero y ausencia permanecen diferenciados',()=>{
  const zero=ventures.find(v=>v.slug==='agroadvisers'),missing=ventures.find(v=>v.slug==='biomasnest');
  assert.equal(zero.metrics.employees,0);assert.equal(zero.metrics.sales2024,0);
  assert.equal(missing.metrics.employees,null);assert.equal(missing.metrics.sales2024,null);
  const rows=metricRows([zero,missing],'employees');assert.equal(rows[0].value,0);assert.equal(rows[1].value,null);
});

test('búsqueda sin coincidencias tiene conjunto y agregados vacíos',()=>{
  const list=filterVentures(ventures,{q:'zzzz-no-existe'}),a=aggregateVentures(list);
  assert.equal(list.length,0);assert.equal(a.count,0);assert.equal(a.employees,0);assert.equal(a.sales2024,0);
});
