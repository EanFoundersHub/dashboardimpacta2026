import { fold } from './normalize.mjs';

export function createRepository(records) {
  const all=[...records];
  const byId=new Map(all.map(x=>[x.id,x]));
  return Object.freeze({
    all:()=>[...all],
    get:id=>byId.get(id)||null,
    query(filters={}) {
      const q=fold(filters.q||'');
      return all.filter(x=>{
        if(filters.source && x.source!==filters.source) return false;
        if(filters.phase && x.phase!==filters.phase) return false;
        if(filters.cohort && x.cohort!==filters.cohort) return false;
        if(filters.sector && x.sector!==filters.sector) return false;
        if(filters.division && !x.divisions.includes(filters.division)) return false;
        if(q && !fold([x.name,x.founder,x.description,x.sector,x.vertical,x.location].filter(Boolean).join(' ')).includes(q)) return false;
        return true;
      });
    },
    facets(field) {
      const values=field==='division'?all.flatMap(x=>x.divisions):all.map(x=>x[field]);
      return [...values.filter(Boolean).reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map())]
        .map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value,'es'));
    }
  });
}

