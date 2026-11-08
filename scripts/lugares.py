import json, math, re
pois=json.load(open('pois.json'))['elements']
lm=json.load(open('landmarks.json'))
def km(a,b):
    R=6371; p=math.pi/180
    x=math.sin((b[0]-a[0])*p/2)**2+math.cos(a[0]*p)*math.cos(b[0]*p)*math.sin((b[1]-a[1])*p/2)**2
    return 2*R*math.asin(math.sqrt(x))
mins=lambda d: max(3, round(d*1.35/0.5))
zonas={
 'vinedos':   {'nombre':'Los Viñedos','lat':25.5738,'lng':-103.3828,'radio':700},
 'provitec':  {'nombre':'Provitec','lat':25.5300,'lng':-103.4330,'radio':600},
 'almendros': {'nombre':'Los Almendros','lat':25.5446,'lng':-103.3407,'radio':600},
 'acacias':   {'nombre':'Acacias, zona centro','lat':25.5450,'lng':-103.4300,'radio':900},
 'cantera':   {'nombre':'La Cantera','lat':25.6190,'lng':-103.3770,'radio':700},
 'rosita':    {'nombre':'Ampliación La Rosita','lat':25.5200,'lng':-103.3500,'radio':800},
 'senderos':  {'nombre':'Residencial Senderos','lat':25.6100,'lng':-103.3900,'radio':700},
 'los-angeles':{'nombre':'Ampliación Los Ángeles','lat':25.5491,'lng':-103.4474,'radio':600},
 'tec':       {'nombre':'Zona Tec de Monterrey','lat':25.5160,'lng':-103.3990,'radio':800},
 'gomez':     {'nombre':'Límite Torreón – Gómez Palacio','lat':25.5650,'lng':-103.4700,'radio':900},
 'torreon':   {'nombre':'Torreón','lat':25.5500,'lng':-103.4200,'radio':2500},
}
casaZona={'leones':'vinedos','linces':'vinedos','vinedos':'vinedos','vinedos-moderna':'vinedos','provitec':'provitec','almendros':'almendros',
 'acacia':'acacias','cantera':'cantera','rosita':'rosita','senderos':'senderos','depa-los-angeles':'los-angeles','loft-tec':'tec',
 'gomez-11':'gomez','gomez-10':'gomez','familiar-10':'torreon','depa-7':'torreon','jardin-14':'torreon','grande-14':'torreon'}
# landmarks manuales (coordenadas aproximadas conocidas) + los geocodificados
manual=[('Estadio Corona TSM','salir',25.5360,-103.3620),('Parque Industrial Oriente','trabajo',25.5470,-103.3330),('Parque Industrial Ferropuerto','trabajo',25.5700,-103.2850),
 ('Parque Industrial Mieleras','trabajo',25.4950,-103.2800),('Parque Industrial Lajat','trabajo',25.6000,-103.3650),('Plaza Cuatro Caminos','compras',25.5596,-103.4331),('Galerías Laguna','compras',25.5817,-103.4030),
 ('Tec de Monterrey Campus Laguna','escuela',25.5164,-103.3982),('UA de C, Ciudad Universitaria','escuela',25.5296,-103.3317),('Instituto Tecnológico de La Laguna','escuela',25.5322,-103.4363),('Universidad Iberoamericana','escuela',25.6111,-103.4012),
 ('Centro de Gómez Palacio','salir',25.5686,-103.4991),('Centro de Lerdo','salir',25.5390,-103.5230),('Paseo Morelos (centro)','salir',25.5405,-103.4480)]
L=[{'n':n,'t':t,'lat':a,'lng':b} for n,t,a,b in manual]
for n,v in lm.items():
    if v and not any(x['n'].split(' ')[0] in n for x in L) and 'Lerdo' not in n: L.append({'n':n.replace(', Torreón','').replace(' Torreón',''),'t':v['tipo'],'lat':v['lat'],'lng':v['lng']})
def tipo(t):
    a=t.get('amenity'); s=t.get('shop'); l=t.get('leisure'); tu=t.get('tourism'); lu=t.get('landuse')
    if a in('restaurant','cafe'): return 'comer'
    if s in('supermarket','mall','department_store'): return 'compras'
    if a=='hospital': return 'salud'
    if a in('university','college'): return 'escuela'
    if lu=='industrial': return 'trabajo'
    if l in('park','stadium') or tu: return 'salir'
def limpia(n): return re.sub(r'\s+',' ',n).strip()[:40]
MALO=re.compile(r'^(comedor|cafeter[ií]a|cocina|tacos?|restaurante?|fonda|lonchería|abarrotes|oxxo|parque|jard[ií]n)\b|trc|^\d|\bs\.?a\.?\b',re.I)
def ok(n): return len(n)>=6 and not MALO.search(n) and n!=n.lower() and not n.isupper()
cats=[('comer','Comer y café',5),('compras','Súper y compras',4),('salud','Salud',3),('escuela','Escuelas y universidades',3),('trabajo','Trabajo e industria',4),('salir','Para salir',4)]
cerca={}
for k,z in zonas.items():
    c=(z['lat'],z['lng']); out={}
    cand=[]
    for e in pois:
        t=e.get('tags',{}); ty=tipo(t)
        if not ty or not t.get('name') or not ok(limpia(t['name'])): continue
        p=e.get('center',e); d=km(c,(p['lat'],p['lon']))
        if ty=='comer' and d>3: continue
        if ty=='salir' and (t.get('leisure')=='park') and d>2.5: continue
        cand.append((ty,limpia(t['name']),d,'osm'))
    for x in L: cand.append((x['t'],x['n'],km(c,(x['lat'],x['lng'])),'lm'))
    for key,label,n in cats:
        seen=set(); lst=[]
        # primero los landmarks (nombres confiables), luego OSM por cercanía
        for ty,name,d,src in sorted([q for q in cand if q[0]==key], key=lambda q:(0 if q[3]=='lm' else 1, q[2])):
            nm=name.lower()
            if nm in seen or d>25: continue
            if src=='osm' and key in('salud','escuela','trabajo','compras') and d>12: continue
            seen.add(nm); lst.append({'n':name,'min':mins(d)})
            if len(lst)>=n: break
        out[label]=sorted(lst,key=lambda q:q['min'])
    cerca[k]=out
json.dump({'zonas':zonas,'casaZona':casaZona,'cerca':cerca},open('lugares.json','w'),ensure_ascii=False,indent=1)
for k in ('vinedos','provitec','acacias','torreon'):
    print(k, json.dumps(cerca[k],ensure_ascii=False)[:700]); print()
