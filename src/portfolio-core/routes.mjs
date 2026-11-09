const allowed = new Set(['q','source','phase','cohort','sector','division']);
export function parsePortfolioRoute(input) {
  const url=input instanceof URL?input:new URL(input,'https://impacta.local');
  const filters={}; for(const [k,v] of url.searchParams) if(allowed.has(k)&&v) filters[k]=v;
  const match=url.pathname.match(/^\/emprendedores\/([^/]+)$/);
  return {view:match?'detail':'directory',slug:match?decodeURIComponent(match[1]):null,filters};
}
export function buildPortfolioRoute({slug,filters={}}={}) {
  const path=slug?`/emprendedores/${encodeURIComponent(slug)}`:'/emprendedores';
  const query=new URLSearchParams(); for(const k of allowed) if(filters[k]) query.set(k,filters[k]);
  return path+(query.size?`?${query}`:'');
}

