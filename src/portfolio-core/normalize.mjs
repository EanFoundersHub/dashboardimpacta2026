/** Data-only preparation layer. It does not render UI or mutate source records. */
export function fold(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

export function slug(value='') {
  return fold(value).replace(/\s+/g,'-') || 'sin-nombre';
}

export function companyKey(record, source='directory') {
  const name = record.empresa ?? record.name ?? '';
  const cohort = record.cohorte ?? '';
  return `${source}:${slug(name)}${cohort ? `:${slug(cohort)}` : ''}`;
}

export function normalizeDirectory(record, index=0) {
  return Object.freeze({
    id: companyKey(record,'directory'), source:'companies', sourceIndex:index,
    name:record.empresa, founder:record.emprendedor, gender:record.genero,
    phase:record.fase, cohort:record.cohorte, sector:record.sector,
    divisions:[], businessModels:[...(record.modelos||[])], beneficiaries:[...(record.beneficiarios||[])],
    description:record.descripcion, location:null, logo:null,
    contact:{email:null,phone:null,website:null,social:{}},
    metrics:{employeesInitial:record.emp_inicial,employeesCurrent:record.emp_actual,employeesWomen:record.emp_mujeres,employeesMen:record.emp_hombres,employeesLeadership:record.emp_liderazgo,employeesProjected:record.emp_proyectados,sales:{...(record.ventas||{})},sales2024:record.ventas_2024,cagr:record.cagr,investmentReceived:record.inv_recibida,investmentRequired:record.inv_requerida,grantAmount:record.monto_grant},
    evidence:{certification:record.tiene_cert?{type:record.cert_tipo,name:record.cert_nombre}:null,exports:record.exporta?{regions:[...(record.region_export||[])]}:null,awards:record.tiene_premios?record.premios:null},
    raw:record
  });
}

export function normalizePortfolio(record, index=0) {
  return Object.freeze({
    id:companyKey(record,'portfolio'), source:'portfolio', sourceIndex:index,
    name:record.name, founder:record.founder, role:record.role, phase:record.fase||null,
    cohort:record.cohorte||null, sector:record.sector, divisions:[record.division].filter(Boolean),
    vertical:record.vertical, description:record.descripcion, location:record.ubicacion||null,
    logo:record.logo||null, initials:record.initials, impact:[...(record.impacto||[])],
    contact:{email:record.correo||null,phone:record.contacto||null,website:record.web||null,social:{instagram:record.instagram||null,linkedin:record.linkedin||null,facebook:record.facebook||null,tiktok:record.tiktok||null}},
    metrics:{employeesCurrent:record.emp,sales2024:record.ventas}, raw:record
  });
}

