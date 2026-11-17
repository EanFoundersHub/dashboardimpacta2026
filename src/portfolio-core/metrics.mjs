import { fold } from './normalize.mjs';

export const PORTFOLIO_SOURCE = Object.freeze({
  name:'Portafolio editorial preparado',
  cutoff:'enero de 2026',
  salesPeriod:'2024'
});

export function filterVentures(records, state={}) {
  const q=fold(state.q||'');
  return records.filter(v=>(!state.division||v.division===state.division)
    &&(!state.phase||v.phase===state.phase)
    &&(!q||fold([v.name,v.founder,v.description,v.sector,v.vertical,v.location].filter(Boolean).join(' ')).includes(q)));
}

export function aggregateVentures(records) {
  const result={count:records.length,employees:0,employeesKnown:0,employeesMissing:0,sales2024:0,salesKnown:0,salesMissing:0};
  for(const v of records){
    const employees=v?.metrics?.employees;
    if(employees==null)result.employeesMissing++;else{result.employees+=Number(employees)||0;result.employeesKnown++}
    const sales=v?.metrics?.sales2024;
    if(sales==null)result.salesMissing++;else{result.sales2024+=Number(sales)||0;result.salesKnown++}
  }
  return Object.freeze(result);
}

export function metricRows(records, metric) {
  if(metric==='employees')return records.map(v=>({id:v.id,name:v.name,value:v.metrics?.employees??null}));
  if(metric==='sales')return records.map(v=>({id:v.id,name:v.name,value:v.metrics?.sales2024??null}));
  if(metric==='missing')return records.filter(v=>v.metrics?.employees==null||v.metrics?.sales2024==null).map(v=>({id:v.id,name:v.name,value:[v.metrics?.employees==null?'Empleos':'Ventas'].concat(v.metrics?.employees==null&&v.metrics?.sales2024==null?['Empleos','Ventas']:[]).filter((x,i,a)=>a.indexOf(x)===i).join(' · ')}));
  return records.map(v=>({id:v.id,name:v.name,value:v.division||'Sin dato'}));
}
