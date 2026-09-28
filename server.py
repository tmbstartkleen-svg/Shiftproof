#!/usr/bin/env python3
import base64, hashlib, hmac, json, mimetypes, os, re, secrets, sqlite3, sys, threading, time, uuid, webbrowser, io
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, 'shiftproof_v6.db')
UPLOAD_DIR = os.path.join(ROOT, 'uploads')
HOST = '127.0.0.1'
PORT = int(os.environ.get('SHIFTPROOF_PORT', '4788'))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def now_iso(): return datetime.now(timezone.utc).isoformat(timespec='seconds')
def uid(prefix): return f"{prefix}_{uuid.uuid4().hex[:12]}"
def conn():
    c=sqlite3.connect(DB, timeout=15)
    c.row_factory=sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def hash_pin(pin, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt.encode(), 120000).hex()
    return salt, digest

def check_pin(pin, salt, digest):
    return hmac.compare_digest(hash_pin(pin, salt)[1], digest)

def init_db():
    c=conn()
    c.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS facilities(id TEXT PRIMARY KEY,name TEXT NOT NULL,code TEXT,location TEXT,mode TEXT,customer_company_id TEXT,contractor_company_id TEXT);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,role TEXT,department TEXT,company_id TEXT,pin_salt TEXT,pin_hash TEXT,active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS memberships(user_id TEXT,facility_id TEXT,access_level TEXT,PRIMARY KEY(user_id,facility_id));
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,created_at TEXT,expires_at TEXT);
    CREATE TABLE IF NOT EXISTS lines(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,status TEXT,target REAL,actual REAL,staffed INTEGER,planned INTEGER,shift TEXT);
    CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,facility_id TEXT,line_id TEXT,name TEXT,type TEXT,status TEXT,critical INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS people(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,department TEXT,shift TEXT,status TEXT,skills TEXT,company_id TEXT);
    CREATE TABLE IF NOT EXISTS shifts(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,status TEXT,started_at TEXT,ended_at TEXT,leader TEXT,notes TEXT);
    CREATE TABLE IF NOT EXISTS issues(id TEXT PRIMARY KEY,facility_id TEXT,title TEXT,department TEXT,status TEXT,priority TEXT,asset_id TEXT,owner TEXT,proof_required INTEGER,created_at TEXT,closed_at TEXT);
    CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY,facility_id TEXT,title TEXT,department TEXT,status TEXT,priority TEXT,asset_id TEXT,owner TEXT,due TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS handoffs(id TEXT PRIMARY KEY,facility_id TEXT,from_dept TEXT,to_dept TEXT,subject TEXT,status TEXT,summary TEXT,created_at TEXT,created_by TEXT,ack_by TEXT,ack_at TEXT,completed_at TEXT,signature TEXT);
    CREATE TABLE IF NOT EXISTS sanitation(id TEXT PRIMARY KEY,facility_id TEXT,area TEXT,task TEXT,status TEXT,percent INTEGER,proof TEXT,owner TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS qa(id TEXT PRIMARY KEY,facility_id TEXT,area TEXT,status TEXT,result TEXT,owner TEXT,created_at TEXT,released_at TEXT);
    CREATE TABLE IF NOT EXISTS proofs(id TEXT PRIMARY KEY,facility_id TEXT,type TEXT,subject TEXT,asset TEXT,verifier TEXT,created_at TEXT,status TEXT,note TEXT,file_name TEXT,file_path TEXT,mime_type TEXT,sha256 TEXT,size_bytes INTEGER);
    CREATE TABLE IF NOT EXISTS mss(id TEXT PRIMARY KEY,facility_id TEXT,area TEXT,task TEXT,frequency TEXT,due_at TEXT,status TEXT,owner TEXT,proof_required INTEGER,completed_at TEXT);
    CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,facility_id TEXT,user_id TEXT,severity TEXT,title TEXT,body TEXT,created_at TEXT,read_at TEXT);
    CREATE TABLE IF NOT EXISTS production_orders(id TEXT PRIMARY KEY,facility_id TEXT,line_id TEXT,sku TEXT,product_name TEXT,allergen_group TEXT,target_qty REAL,actual_qty REAL,uom TEXT,status TEXT,planned_start TEXT,planned_end TEXT,priority INTEGER,sequence_no INTEGER,created_at TEXT);
    CREATE TABLE IF NOT EXISTS downtime(id TEXT PRIMARY KEY,facility_id TEXT,line_id TEXT,asset_id TEXT,category TEXT,reason TEXT,minutes REAL,status TEXT,started_at TEXT,ended_at TEXT,owner TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS changeovers(id TEXT PRIMARY KEY,facility_id TEXT,line_id TEXT,from_sku TEXT,to_sku TEXT,allergen_change INTEGER,planned_minutes REAL,actual_minutes REAL,status TEXT,started_at TEXT,completed_at TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS labor_assignments(id TEXT PRIMARY KEY,facility_id TEXT,person_id TEXT,department TEXT,line_id TEXT,task TEXT,status TEXT,start_at TEXT,end_at TEXT,qualification_match INTEGER,created_at TEXT);
    CREATE TABLE IF NOT EXISTS sla_metrics(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,owner_type TEXT,target REAL,actual REAL,uom TEXT,status TEXT,period TEXT,updated_at TEXT);
    CREATE TABLE IF NOT EXISTS plant_nodes(id TEXT PRIMARY KEY,facility_id TEXT,label TEXT,node_type TEXT,line_id TEXT,asset_id TEXT,x REAL,y REAL,status TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS sku_costs(id TEXT PRIMARY KEY,facility_id TEXT,sku TEXT,product_name TEXT,sanitation_minutes REAL,labor_hours REAL,chemical_cost REAL,avg_changeover_minutes REAL,allergen_complexity INTEGER,updated_at TEXT);
    CREATE TABLE IF NOT EXISTS root_causes(id TEXT PRIMARY KEY,facility_id TEXT,downtime_id TEXT,cause_category TEXT,cause_detail TEXT,corrective_action TEXT,recurrence_count INTEGER,confidence REAL,created_at TEXT);
    CREATE TABLE IF NOT EXISTS escalation_rules(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,metric TEXT,operator TEXT,threshold REAL,severity TEXT,department TEXT,enabled INTEGER,last_triggered_at TEXT);
    CREATE TABLE IF NOT EXISTS asset_scans(id TEXT PRIMARY KEY,facility_id TEXT,asset_id TEXT,user_id TEXT,scan_type TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS role_permissions(role TEXT,permission TEXT,enabled INTEGER DEFAULT 1,PRIMARY KEY(role,permission));
    CREATE TABLE IF NOT EXISTS integrations(id TEXT PRIMARY KEY,facility_id TEXT,name TEXT,type TEXT,status TEXT,endpoint TEXT,token TEXT,last_sync_at TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS webhook_events(id TEXT PRIMARY KEY,facility_id TEXT,integration_id TEXT,event_type TEXT,payload TEXT,status TEXT,received_at TEXT,processed_at TEXT);
    CREATE TABLE IF NOT EXISTS notification_deliveries(id TEXT PRIMARY KEY,facility_id TEXT,notification_id TEXT,channel TEXT,destination TEXT,status TEXT,detail TEXT,created_at TEXT,sent_at TEXT);
    CREATE TABLE IF NOT EXISTS llm_settings(id TEXT PRIMARY KEY,facility_id TEXT,provider TEXT,model TEXT,enabled INTEGER,updated_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,facility_id TEXT,user_id TEXT,action TEXT,entity_type TEXT,entity_id TEXT,detail TEXT,created_at TEXT);
    CREATE INDEX IF NOT EXISTS idx_audit_facility ON audit_log(facility_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_issue_facility ON issues(facility_id,status);
    CREATE INDEX IF NOT EXISTS idx_handoff_facility ON handoffs(facility_id,status);
    ''')
    count=c.execute('SELECT COUNT(*) n FROM facilities').fetchone()['n']
    if count==0: seed(c)
    c.commit(); c.close()

def seed(c):
    customer='co_customer'; contractor='co_contractor'; facility='fac_demo'
    c.executemany('INSERT INTO companies VALUES(?,?,?)',[(customer,'Summit Foods','Customer'),(contractor,'StartKleen','Contractor')])
    c.execute('INSERT INTO facilities VALUES(?,?,?,?,?,?,?)',(facility,'Summit Foods — Central Plant','SFC-01','Midwest','Contract Sanitation',customer,contractor))
    c.executemany('INSERT INTO facilities VALUES(?,?,?,?,?,?,?)',[
      ('fac_north','Summit Foods — North Plant','SFN-02','Nebraska','Hybrid Sanitation',customer,contractor),
      ('fac_south','Summit Foods — South Plant','SFS-03','Tennessee','In-house Sanitation',customer,None)])
    demo_users=[
      ('u_pm','Morgan Reed','plantmanager@demo.local','Plant Manager','Management',customer,'1111','Executive'),
      ('u_prod','Alex Rivera','production@demo.local','Production Supervisor','Production',customer,'2222','Supervisor'),
      ('u_san','Jordan Lee','sanitation@demo.local','Sanitation Site Manager','Sanitation',contractor,'3333','Manager'),
      ('u_qa','Casey Patel','qa@demo.local','QA Manager','Quality',customer,'4444','Manager'),
      ('u_maint','Taylor Brooks','maintenance@demo.local','Maintenance Lead','Maintenance',customer,'5555','Lead')]
    for id_,name,email,role,dept,co,pin,level in demo_users:
        salt,dig=hash_pin(pin); c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,1)',(id_,name,email,role,dept,co,salt,dig)); c.execute('INSERT INTO memberships VALUES(?,?,?)',(id_,facility,level))
        if id_=='u_pm':
            c.execute('INSERT INTO memberships VALUES(?,?,?)',(id_,'fac_north','Executive'))
            c.execute('INSERT INTO memberships VALUES(?,?,?)',(id_,'fac_south','Executive'))
    lines=[('l101','Line 101','Running',94,91,7,8,'1st'),('l103','Line 103','Running',96,97,8,8,'1st'),('l104','Line 104','Watch',95,86,6,8,'1st'),('raw','Raw Grind','Running',93,92,5,5,'1st')]
    for id_,name,status,target,actual,staffed,planned,shift in lines:c.execute('INSERT INTO lines VALUES(?,?,?,?,?,?,?,?,?)',(id_,facility,name,status,target,actual,staffed,planned,shift))
    assets=[('a_bagger','l104','Bagger #2','Bagger','Maintenance Watch',1),('a_conv','l103','Transfer Conveyor','Conveyor','Available',1),('a_former','l101','Former #1','Former','Available',1),('a_grinder','raw','Grinder #4','Grinder','Sanitation Required',1)]
    for id_,line,name,typ,status,crit in assets:c.execute('INSERT INTO assets VALUES(?,?,?,?,?,?,?)',(id_,facility,line,name,typ,status,crit))
    people=[('p1','Jamie Cole','Production','1st','Working','Line 101,Line 103,LOTO',customer),('p2','Sam Ortiz','Production','1st','Working','Line 104,Bagger #2',customer),('p3','Chris Hall','Sanitation','3rd','Working','Raw,Pre-op,LOTO',contractor),('p4','Devin Moore','Sanitation','3rd','Working','RTE,Line 103',contractor),('p5','Avery Kim','Quality','1st','Working','Pre-op,HACCP',customer)]
    for id_,name,dept,shift,status,skills,co in people:c.execute('INSERT INTO people VALUES(?,?,?,?,?,?,?,?)',(id_,facility,name,dept,shift,status,skills,co))
    t=now_iso();
    c.execute('INSERT INTO shifts VALUES(?,?,?,?,?,?,?,?)',('sh_current',facility,'Day Production','Active',t,None,'Alex Rivera','Current production shift'))
    c.execute('INSERT INTO issues VALUES(?,?,?,?,?,?,?,?,?,?,?)',('i1',facility,'Repeated bagger micro-stops','Production','In Progress','High','a_bagger','Maintenance',1,t,None))
    c.execute('INSERT INTO issues VALUES(?,?,?,?,?,?,?,?,?,?,?)',('i2',facility,'Residue underneath grinder frame','Sanitation','Awaiting Verification','High','a_grinder','Sanitation',1,t,None))
    c.execute('INSERT INTO tickets VALUES(?,?,?,?,?,?,?,?,?,?)',('t1',facility,'Inspect Bagger #2 drive','Maintenance','In Progress','High','a_bagger','Taylor Brooks','Before shift end',t))
    c.execute('INSERT INTO sanitation VALUES(?,?,?,?,?,?,?,?,?)',('s1',facility,'Raw Grind','Grinder #4 frame','Awaiting Verification',100,'Required','Chris Hall',t))
    c.execute('INSERT INTO sanitation VALUES(?,?,?,?,?,?,?,?,?)',('s2',facility,'Line 103','Transfer conveyor sanitation','In Progress',50,'Required','Devin Moore',t))
    c.execute('INSERT INTO qa VALUES(?,?,?,?,?,?,?,?)',('q1',facility,'Raw Grind','Pending','Awaiting sanitation verification','QA',t,None))
    c.execute('INSERT INTO handoffs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('h1',facility,'Production','Maintenance','Bagger #2','In Progress','Repeated micro-stops observed. Inspect drive and tracking.',t,'u_prod','u_maint',t,None,'Taylor Brooks'))
    c.execute('INSERT INTO handoffs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('h2',facility,'Maintenance','Sanitation','Grinder #4','Awaiting Action','Maintenance entry completed. Re-clean and verify before QA release.',t,'u_maint',None,None,None,None))
    tomorrow=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat(timespec='seconds')
    c.execute('INSERT INTO mss VALUES(?,?,?,?,?,?,?,?,?,?)',('m1',facility,'Raw Grind','Deep clean overhead framework','Weekly',tomorrow,'Due','Sanitation',1,None))
    c.execute('INSERT INTO notifications VALUES(?,?,?,?,?,?,?,?)',('n1',facility,'u_pm','warning','Line 104 below target','Current attainment is below the configured target. Review Bagger #2 downtime.',t,None))
    c.execute('INSERT INTO notifications VALUES(?,?,?,?,?,?,?,?)',('n2',facility,'u_san','high','Verification required','Grinder #4 sanitation task is awaiting proof before QA release.',t,None))
    c.executemany('INSERT INTO production_orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[
      ('o1',facility,'l101','SKU-CHX-001','Original Chicken Bites','None',46000,41820,'lb','Running',t,(datetime.now(timezone.utc)+timedelta(hours=4)).isoformat(timespec='seconds'),1,1,t),
      ('o2',facility,'l103','SKU-BBQ-014','BBQ Chicken Bites','None',38000,36900,'lb','Running',t,(datetime.now(timezone.utc)+timedelta(hours=3)).isoformat(timespec='seconds'),2,2,t),
      ('o3',facility,'l104','SKU-MILK-022','Cream Sauce Meal','Milk',26000,22360,'lb','At Risk',t,(datetime.now(timezone.utc)+timedelta(hours=5)).isoformat(timespec='seconds'),1,3,t),
      ('o4',facility,'l104','SKU-EGG-031','Egg Glaze Product','Egg',18000,0,'lb','Planned',(datetime.now(timezone.utc)+timedelta(hours=5)).isoformat(timespec='seconds'),(datetime.now(timezone.utc)+timedelta(hours=8)).isoformat(timespec='seconds'),3,4,t)])
    c.executemany('INSERT INTO downtime VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[
      ('dt1',facility,'l104','a_bagger','Equipment','Bagger #2 micro-stop / tracking',26,'Open',t,None,'Maintenance',t),
      ('dt2',facility,'l101',None,'Material','Film replenishment delay',9,'Closed',t,t,'Production',t),
      ('dt3',facility,'l103',None,'Labor','Packoff staffing shortage',14,'Closed',t,t,'Production',t)])
    c.executemany('INSERT INTO changeovers VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[
      ('co1',facility,'l104','SKU-MILK-022','SKU-EGG-031',1,45,0,'Planned',None,None,t),
      ('co2',facility,'l103','SKU-BBQ-014','SKU-CHX-001',0,25,23,'Complete',t,t,t)])
    c.executemany('INSERT INTO labor_assignments VALUES(?,?,?,?,?,?,?,?,?,?,?)',[
      ('la1',facility,'p1','Production','l101','Line operator','Active',t,None,1,t),
      ('la2',facility,'p2','Production','l104','Bagger / packoff','Active',t,None,1,t),
      ('la3',facility,'p3','Sanitation','raw','Raw sanitation lead','Planned',None,None,1,t),
      ('la4',facility,'p4','Sanitation','l103','Line 103 sanitation','Planned',None,None,1,t)])
    c.executemany('INSERT INTO sla_metrics VALUES(?,?,?,?,?,?,?,?,?,?)',[
      ('sla1',facility,'First-pass pre-op','Contractor',98,96.8,'%', 'Watch','Rolling 30 days',t),
      ('sla2',facility,'Staffing fulfillment','Contractor',97,94.2,'%', 'Watch','Current week',t),
      ('sla3',facility,'Corrective action closure','Shared',15,12.4,'min','Met','Current week',t),
      ('sla4',facility,'MSS completion','Contractor',100,100,'%', 'Met','Current month',t)])
    c.executemany('INSERT INTO plant_nodes VALUES(?,?,?,?,?,?,?,?,?,?)',[
      ('pn1',facility,'Raw Grind','Area','raw',None,14,50,'Running',t),
      ('pn2',facility,'Line 101','Line','l101',None,34,27,'Running',t),
      ('pn3',facility,'Line 103','Line','l103',None,58,27,'Running',t),
      ('pn4',facility,'Line 104','Line','l104',None,81,27,'Watch',t),
      ('pn5',facility,'Bagger #2','Asset','l104','a_bagger',82,48,'Maintenance Watch',t),
      ('pn6',facility,'QA / Pre-Op','Area',None,None,57,73,'Pending',t),
      ('pn7',facility,'Sanitation Staging','Area',None,None,29,76,'Ready',t)])
    c.executemany('INSERT INTO sku_costs VALUES(?,?,?,?,?,?,?,?,?,?)',[
      ('sc1',facility,'SKU-CHX-001','Original Chicken Bites',38,4.2,18.50,22,0,t),
      ('sc2',facility,'SKU-BBQ-014','BBQ Chicken Bites',44,4.8,21.20,26,0,t),
      ('sc3',facility,'SKU-MILK-022','Cream Sauce Meal',72,8.5,38.60,48,3,t),
      ('sc4',facility,'SKU-EGG-031','Egg Glaze Product',66,7.9,34.10,44,2,t)])
    c.executemany('INSERT INTO root_causes VALUES(?,?,?,?,?,?,?,?,?)',[
      ('rc1',facility,'dt1','Equipment','Bagger drive/tracking drift after repeated micro-stops','Inspect belt tracking and drive alignment; verify after sanitation',3,0.86,t),
      ('rc2',facility,'dt3','Labor','Packoff staffing below plan','Cross-train and stage qualified backup operator',2,0.74,t)])
    c.executemany('INSERT INTO escalation_rules VALUES(?,?,?,?,?,?,?,?,?,?)',[
      ('er1',facility,'Production attainment risk','line_attainment','<',90,'high','Production',1,None),
      ('er2',facility,'Downtime escalation','open_downtime_minutes','>',20,'high','Maintenance',1,None),
      ('er3',facility,'Sanitation verification delay','sanitation_eta','>',45,'warning','Sanitation',1,None),
      ('er4',facility,'QA release block','qa_blocks','>',0,'critical','Quality',1,None)])
    c.executemany('INSERT INTO lines VALUES(?,?,?,?,?,?,?,?,?)',[
      ('n201','fac_north','Line 201','Running',95,96,9,9,'1st'),('n202','fac_north','Line 202','Running',94,93,7,8,'1st'),
      ('s301','fac_south','Line 301','Watch',95,89,6,8,'1st'),('s302','fac_south','Line 302','Running',94,95,7,7,'1st')])
    c.executemany('INSERT INTO issues VALUES(?,?,?,?,?,?,?,?,?,?,?)',[
      ('ni1','fac_north','Minor staffing gap on Line 202','Production','Open','Medium',None,'Production',0,t,None),
      ('si1','fac_south','Pre-op reclean required','Quality','Open','High',None,'Sanitation',1,t,None)])
    c.executemany('INSERT INTO qa VALUES(?,?,?,?,?,?,?,?)',[
      ('nq1','fac_north','North RTE','Released','Pass','QA',t,t),
      ('sq1','fac_south','South Raw','Pending','Awaiting reclean','QA',t,None)])
    c.executemany('INSERT INTO sanitation VALUES(?,?,?,?,?,?,?,?,?)',[
      ('ns1','fac_north','North RTE','Night sanitation','In Progress',72,'Required','Sanitation',t),
      ('ss1','fac_south','South Raw','Raw sanitation','In Progress',61,'Required','Sanitation',t)])
    perms={
      'Plant Manager':['enterprise.view','facility.view','work.write','people.manage','integrations.manage','roles.manage','ai.use'],
      'Production Supervisor':['facility.view','work.write','production.write','ai.use'],
      'Sanitation Site Manager':['facility.view','work.write','sanitation.write','proof.write','ai.use'],
      'QA Manager':['facility.view','work.write','qa.release','proof.write','ai.use'],
      'Maintenance Lead':['facility.view','work.write','maintenance.write','ai.use']}
    for role,plist in perms.items():
        for perm in plist:c.execute('INSERT OR IGNORE INTO role_permissions VALUES(?,?,1)',(role,perm))
    c.executemany('INSERT INTO integrations VALUES(?,?,?,?,?,?,?,?,?)',[
      ('int_erp',facility,'ERP / Production Import','ERP','Configured','/api/webhook/int_erp','wh_erp_demo',None,t),
      ('int_cmms',facility,'CMMS Work Orders','CMMS','Configured','/api/webhook/int_cmms','wh_cmms_demo',None,t)])
    c.execute('INSERT INTO llm_settings VALUES(?,?,?,?,?,?)',('llm1',facility,'OpenAI-compatible',os.environ.get('SHIFTPROOF_LLM_MODEL','gpt-5.6'),1,t))
    c.execute('INSERT INTO audit_log(facility_id,user_id,action,entity_type,entity_id,detail,created_at) VALUES(?,?,?,?,?,?,?)',(facility,'system','SEED','facility',facility,'Demo plant initialized for v6',t))

def audit(c, facility_id, user_id, action, entity_type, entity_id, detail=''):
    c.execute('INSERT INTO audit_log(facility_id,user_id,action,entity_type,entity_id,detail,created_at) VALUES(?,?,?,?,?,?,?)',(facility_id,user_id,action,entity_type,entity_id,detail,now_iso()))

def visible_facilities(c,user_id):
    return [r['facility_id'] for r in c.execute('SELECT facility_id FROM memberships WHERE user_id=?',(user_id,))]

def session_user(handler):
    cookie=handler.headers.get('Cookie',''); m=re.search(r'sp_session=([^;]+)',cookie)
    if not m:return None
    token=m.group(1); c=conn(); row=c.execute('''SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>? AND u.active=1''',(token,now_iso())).fetchone(); c.close(); return dict(row) if row else None

def can_write(user, op):
    if not user:return False
    if user['role'] in ('Plant Manager','QA Manager','Sanitation Site Manager','Maintenance Lead','Production Supervisor'):return True
    return False

def has_permission(c,user,permission):
    if not user:return False
    row=c.execute('SELECT enabled FROM role_permissions WHERE role=? AND permission=?',(user['role'],permission)).fetchone()
    return bool(row and int(row['enabled'] or 0))

def enterprise_snapshot(c,user_id):
    facs=visible_facilities(c,user_id); out=[]
    for fid in facs:
        fac=c.execute('SELECT * FROM facilities WHERE id=?',(fid,)).fetchone()
        if not fac: continue
        snap=plant_snapshot(c,fid); lines=snap['lines']; issues=[x for x in snap['issues'] if x['status']!='Closed']; qa=[x for x in snap['qa'] if x['status']!='Released']; san=[x for x in snap['sanitation'] if x['status']!='Complete']
        avg=round(sum(float(x['actual'] or 0) for x in lines)/max(1,len(lines)),1) if lines else 0
        score=max(0,100-len([x for x in issues if x['priority'] in ('High','Critical')])*7-len(qa)*5-len([x for x in lines if float(x['actual'] or 0)<float(x['target'] or 0)])*3)
        out.append({'facility':dict(fac),'pxs':score,'avgAttainment':avg,'openIssues':len(issues),'qaBlocks':len(qa),'sanitationOpen':len(san),'lineCount':len(lines)})
    return sorted(out,key=lambda x:x['pxs'])

def llm_answer(c,facility_id,question):
    fallback=ask_plant(c,facility_id,question)
    key=os.environ.get('SHIFTPROOF_LLM_KEY','').strip(); url=os.environ.get('SHIFTPROOF_LLM_URL','').strip(); model=os.environ.get('SHIFTPROOF_LLM_MODEL','gpt-5.6').strip()
    if not key or not url:
        fallback['mode']='grounded-rules-v6'; fallback['llmConfigured']=False; return fallback
    snap=plant_snapshot(c,facility_id); compact={'facility':snap['facility'],'lines':snap['lines'],'orders':snap['orders'][:20],'downtime':snap['downtime'][:30],'sanitation':snap['sanitation'][:30],'qa':snap['qa'][:20],'issues':snap['issues'][:30]}
    prompt='You are ShiftProof Shift Commander. Answer only from the supplied plant JSON. If evidence is missing, say so. Be concise and cite supporting entity IDs in brackets. Question: '+question+'\nPlant JSON: '+json.dumps(compact,separators=(',',':'))[:28000]
    payload=json.dumps({'model':model,'input':prompt}).encode()
    try:
        req=Request(url,data=payload,headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
        with urlopen(req,timeout=25) as r: data=json.loads(r.read().decode())
        text=''
        if isinstance(data,dict):
            text=data.get('output_text') or data.get('text') or ''
            if not text:
                for item in data.get('output',[]) or []:
                    for ct in item.get('content',[]) or []:
                        if isinstance(ct,dict) and ct.get('text'): text+=ct.get('text')
        if not text: raise ValueError('LLM returned no readable text')
        return {'answer':text,'evidence':fallback.get('evidence',[]),'generatedAt':now_iso(),'mode':'llm-grounded-v6','llmConfigured':True,'model':model}
    except Exception as e:
        fallback['mode']='grounded-rules-v6-fallback'; fallback['llmConfigured']=True; fallback['llmError']=str(e)[:220]; return fallback

def rows(c, table, facility_id, order='rowid DESC'):
    allowed={'lines','assets','people','shifts','issues','tickets','handoffs','sanitation','qa','proofs','mss','notifications','production_orders','downtime','changeovers','labor_assignments','sla_metrics','plant_nodes','sku_costs','root_causes','escalation_rules','asset_scans','role_permissions','integrations','webhook_events','notification_deliveries','llm_settings','audit_log'}
    assert table in allowed
    return [dict(x) for x in c.execute(f'SELECT * FROM {table} WHERE facility_id=? ORDER BY {order}',(facility_id,))]

def plant_snapshot(c, facility_id):
    fac=dict(c.execute('SELECT * FROM facilities WHERE id=?',(facility_id,)).fetchone())
    return {
      'facility':fac,
      'lines':rows(c,'lines',facility_id,'name'), 'assets':rows(c,'assets',facility_id,'name'), 'people':rows(c,'people',facility_id,'name'),
      'shifts':rows(c,'shifts',facility_id,'started_at DESC'), 'issues':rows(c,'issues',facility_id,'created_at DESC'), 'tickets':rows(c,'tickets',facility_id,'created_at DESC'),
      'handoffs':rows(c,'handoffs',facility_id,'created_at DESC'), 'sanitation':rows(c,'sanitation',facility_id,'created_at DESC'), 'qa':rows(c,'qa',facility_id,'created_at DESC'),
      'proofs':rows(c,'proofs',facility_id,'created_at DESC'), 'mss':rows(c,'mss',facility_id,'due_at'), 'notifications':rows(c,'notifications',facility_id,'created_at DESC'),
      'orders':rows(c,'production_orders',facility_id,'sequence_no'), 'downtime':rows(c,'downtime',facility_id,'created_at DESC'), 'changeovers':rows(c,'changeovers',facility_id,'created_at DESC'),
      'labor':rows(c,'labor_assignments',facility_id,'created_at DESC'), 'sla':rows(c,'sla_metrics',facility_id,'name'), 'plantNodes':rows(c,'plant_nodes',facility_id,'label'),
      'skuCosts':rows(c,'sku_costs',facility_id,'sku'), 'rootCauses':rows(c,'root_causes',facility_id,'created_at DESC'), 'escalationRules':rows(c,'escalation_rules',facility_id,'name'), 'assetScans':rows(c,'asset_scans',facility_id,'created_at DESC')[:50],
      'rolePermissions':[dict(x) for x in c.execute('SELECT * FROM role_permissions ORDER BY role,permission')], 'integrations':rows(c,'integrations',facility_id,'created_at DESC'), 'webhookEvents':rows(c,'webhook_events',facility_id,'received_at DESC')[:50], 'notificationDeliveries':rows(c,'notification_deliveries',facility_id,'created_at DESC')[:50], 'llmSettings':rows(c,'llm_settings',facility_id,'updated_at DESC'), 'audit':rows(c,'audit_log',facility_id,'created_at DESC')[:100]
    }

def oee_components(c, facility_id):
    snap=plant_snapshot(c,facility_id)
    dt=sum(float(x['minutes'] or 0) for x in snap['downtime'])
    planned=480*max(1,len(snap['lines']))
    availability=max(0,min(100,100*(planned-dt)/planned))
    performance=max(0,min(100,sum(float(l['actual'] or 0) for l in snap['lines'])/max(1,len(snap['lines']))))
    qa_blocks=len([q for q in snap['qa'] if q['status']!='Released'])
    quality_issues=len([i for i in snap['issues'] if i['department']=='Quality' and i['status']!='Closed'])
    quality=max(90,min(100,100-qa_blocks*1.5-quality_issues*2.0))
    oee=(availability/100)*(performance/100)*(quality/100)*100
    return {'availability':round(availability,1),'performance':round(performance,1),'quality':round(quality,1),'oee':round(oee,1)}

def sanitation_forecast(c, facility_id):
    tasks=rows(c,'sanitation',facility_id,'created_at DESC')
    active=[x for x in tasks if x['status']!='Complete']
    labor_minutes=0.0
    for x in active:
        remain=max(0,100-int(x['percent'] or 0))/100
        base=60.0
        if 'grinder' in (x['task'] or '').lower(): base=90
        elif 'conveyor' in (x['task'] or '').lower(): base=55
        labor_minutes+=remain*base
    active_workers=max(1,len([p for p in rows(c,'people',facility_id,'name') if p['department']=='Sanitation' and p['status']=='Working']))
    eta=round(labor_minutes/active_workers)
    return {'etaMinutes':eta,'laborMinutes':round(labor_minutes),'activeWorkers':active_workers,'activeTasks':len(active)}

def sequence_optimizer(c, facility_id):
    orders=[o for o in rows(c,'production_orders',facility_id,'sequence_no') if o['status'] not in ('Complete','Closed')]
    weights={'None':0,'':0,'Soy':1,'Wheat':2,'Egg':3,'Milk':4,'Peanut':5,'Tree Nut':6}
    # Cluster low-allergen runs first and preserve priority within groups; higher allergen complexity runs later.
    optimized=sorted(orders,key=lambda o:(weights.get(o['allergen_group'],3),int(o['priority'] or 3),int(o['sequence_no'] or 99)))
    transitions=[]; saved=0
    prev=None
    for idx,o in enumerate(optimized,1):
        risk='standard'
        if prev and prev.get('allergen_group')!=o.get('allergen_group') and o.get('allergen_group') not in ('None',''):
            risk='allergen-control'; saved+=12
        transitions.append({'sequence':idx,'id':o['id'],'sku':o['sku'],'product':o['product_name'],'allergen':o['allergen_group'],'lineId':o['line_id'],'transition':risk})
        prev=o
    return {'orders':transitions,'estimatedChangeoverMinutesAvoided':max(0,saved),'logic':'Groups lower-allergen products earlier while respecting production priority within allergen groups.'}

def sku_cost_summary(c, facility_id):
    costs=rows(c,'sku_costs',facility_id,'sku')
    return sorted(costs,key=lambda x:(float(x['labor_hours'] or 0)*28+float(x['chemical_cost'] or 0)),reverse=True)

def trigger_escalations(c, facility_id):
    rules=rows(c,'escalation_rules',facility_id,'name'); snap=plant_snapshot(c,facility_id); sf=sanitation_forecast(c,facility_id)
    values={
      'line_attainment':min([float(l['actual'] or 0) for l in snap['lines']] or [100]),
      'open_downtime_minutes':sum(float(d['minutes'] or 0) for d in snap['downtime'] if d['status']!='Closed'),
      'sanitation_eta':sf['etaMinutes'],
      'qa_blocks':len([q for q in snap['qa'] if q['status']!='Released'])}
    fired=[]
    for r in rules:
        if not int(r['enabled'] or 0): continue
        v=values.get(r['metric']); th=float(r['threshold'] or 0); op=r['operator']
        hit=(op=='<' and v<th) or (op=='>' and v>th) or (op=='<=' and v<=th) or (op=='>=' and v>=th)
        if hit: fired.append({'id':r['id'],'name':r['name'],'severity':r['severity'],'department':r['department'],'metric':r['metric'],'value':v,'threshold':th})
    return fired

def ask_plant(c, facility_id, question):
    q=(question or '').strip().lower(); snap=plant_snapshot(c,facility_id); cmd=commander(c,facility_id); sf=sanitation_forecast(c,facility_id); opt=sequence_optimizer(c,facility_id); oee=oee_components(c,facility_id)
    citations=[]
    if any(k in q for k in ('downtime','stop','loss','bottleneck')):
        items=sorted(snap['downtime'],key=lambda x:float(x['minutes'] or 0),reverse=True)
        if not items:return {'answer':'No downtime has been recorded for this facility.','evidence':[]}
        top=items[:3]; ans='Largest recorded losses: '+ '; '.join(f"{x['reason']} ({x['minutes']} min)" for x in top)+'.'
        citations=[{'type':'downtime','id':x['id']} for x in top]
    elif any(k in q for k in ('sanitation','clean','pre-op','preop')):
        ans=f"Sanitation has {sf['activeTasks']} active task(s), about {sf['laborMinutes']} labor-minutes remaining, and a modeled completion ETA of {sf['etaMinutes']} minutes with {sf['activeWorkers']} active sanitation worker(s)."
        citations=[{'type':'sanitation','id':x['id']} for x in snap['sanitation'] if x['status']!='Complete'][:5]
    elif any(k in q for k in ('oee','availability','performance','quality')):
        ans=f"Modeled OEE is {oee['oee']}%: availability {oee['availability']}%, performance {oee['performance']}%, quality {oee['quality']}%."
        citations=[{'type':'line','id':x['id']} for x in snap['lines']]
    elif any(k in q for k in ('sequence','schedule','allergen','order')):
        seq=', '.join(f"{x['sequence']}. {x['sku']}" for x in opt['orders']) or 'No active orders'
        ans=f"Recommended production sequence: {seq}. Estimated avoidable changeover time from this modeled sequence: {opt['estimatedChangeoverMinutesAvoided']} minutes."
        citations=[{'type':'production_order','id':x['id']} for x in opt['orders']]
    elif any(k in q for k in ('labor','staff','people','employee')):
        gaps=[l for l in snap['lines'] if int(l['staffed'] or 0)<int(l['planned'] or 0)]
        ans=f"{len(gaps)} line(s) are below planned staffing. "+('Largest visible gap is '+gaps[0]['name']+f" at {gaps[0]['staffed']}/{gaps[0]['planned']}." if gaps else 'No tracked staffing gaps are present.')
        citations=[{'type':'line','id':x['id']} for x in gaps]
    elif any(k in q for k in ('cost','sku','expensive')):
        costs=sku_cost_summary(c,facility_id); top=costs[0] if costs else None
        ans=(f"Highest modeled sanitation-cost SKU is {top['sku']} ({top['product_name']}): {top['labor_hours']} labor-hours, ${top['chemical_cost']:.2f} chemical cost, and {top['sanitation_minutes']} sanitation minutes per modeled run." if top else 'No SKU sanitation-cost models are loaded.')
        citations=[{'type':'sku_cost','id':top['id']}] if top else []
    else:
        ans=cmd['summary']+' '+(' '.join(cmd['risks'][:2]) if cmd['risks'] else '')
        citations=[{'type':'facility','id':facility_id}]
    return {'answer':ans,'evidence':citations,'generatedAt':now_iso(),'mode':'grounded-rules-v5'}

def commander(c, facility_id):
    snap=plant_snapshot(c,facility_id); risks=[]; actions=[]
    open_issues=[i for i in snap['issues'] if i['status']!='Closed']
    high=[i for i in open_issues if i['priority'] in ('High','Critical')]
    blocked_qa=[q for q in snap['qa'] if q['status'] in ('Blocked','Pending')]
    late_lines=[l for l in snap['lines'] if float(l['actual'] or 0)<float(l['target'] or 0)]
    open_tickets=[t for t in snap['tickets'] if t['status']!='Closed']
    incomplete_san=[s for s in snap['sanitation'] if s['status']!='Complete']
    overdue=[]
    for m in snap['mss']:
        try:
            if m['status']!='Complete' and datetime.fromisoformat(m['due_at']) < datetime.now(timezone.utc):overdue.append(m)
        except:pass
    score=max(0,100-len(high)*7-len(blocked_qa)*5-len(late_lines)*3-len(overdue)*6)
    proof_total=max(1,len(snap['proofs'])+len([i for i in snap['issues'] if i['proof_required']]))
    proof_closed=len(snap['proofs']); proof_score=min(100,round(100*proof_closed/proof_total))
    if high:risks.append(f"{len(high)} high-priority issue(s) remain open, led by {high[0]['title']}.")
    if late_lines:risks.append(f"{len(late_lines)} production line(s) are below target; {late_lines[0]['name']} is at {late_lines[0]['actual']}% vs {late_lines[0]['target']}% target.")
    if blocked_qa:risks.append(f"{len(blocked_qa)} QA area(s) are not released to production.")
    if incomplete_san:risks.append(f"{len(incomplete_san)} sanitation task(s) remain incomplete or awaiting verification.")
    if overdue:risks.append(f"{len(overdue)} MSS task(s) are overdue.")
    if open_tickets:actions.append(f"Review {len(open_tickets)} open maintenance/operations ticket(s) and clear blockers before the next handoff.")
    if any(s['status']=='Awaiting Verification' for s in incomplete_san):actions.append('Capture verification proof for sanitation work awaiting approval, then route to QA.')
    if late_lines:actions.append(f"Investigate {late_lines[0]['name']} loss drivers and rebalance qualified labor if the constraint is staffing-related.")
    if not risks:risks.append('No material cross-department risks are currently detected from the entered plant data.')
    if not actions:actions.append('Maintain current execution plan and complete normal shift handoff verification.')
    avg_att=round(sum(float(l['actual'] or 0) for l in snap['lines'])/max(1,len(snap['lines'])),1)
    dt_minutes=round(sum(float(x['minutes'] or 0) for x in snap['downtime']),1)
    oc=oee_components(c,facility_id); oee=oc['oee']
    open_orders=[o for o in snap['orders'] if o['status'] not in ('Complete','Closed')]
    at_risk=[o for o in open_orders if o['status']=='At Risk']
    active_san=[x for x in snap['sanitation'] if x['status']!='Complete']
    sf=sanitation_forecast(c,facility_id); sanitation_eta=sf['etaMinutes']
    if at_risk: risks.append(f"{len(at_risk)} production order(s) are at risk; {at_risk[0]['sku']} is the highest active exception.")
    if dt_minutes>30: actions.append(f"Downtime totals {dt_minutes} min in the current view; focus on the largest repeat loss before the next run.")
    if any(int(x['allergen_change'] or 0)==1 and x['status']!='Complete' for x in snap['changeovers']): actions.append('An allergen changeover is planned; verify sequence, sanitation scope, and QA release before startup.')
    summary=f"Plant execution is {score}/100, modeled OEE is {oee}%, and average line attainment is {avg_att}%. {len(open_orders)} active production order(s), {len(open_issues)} open issue(s), and {len(blocked_qa)} QA item(s) are in workflow."
    return {'pxs':score,'proofScore':proof_score,'avgAttainment':avg_att,'oee':oee,'oeeComponents':oc,'downtimeMinutes':dt_minutes,'sanitationEtaMinutes':sanitation_eta,'sanitationForecast':sf,'escalations':trigger_escalations(c,facility_id),'summary':summary,'risks':risks,'actions':actions,'generatedAt':now_iso()}

class Handler(BaseHTTPRequestHandler):
    server_version='ShiftProofONE/6.0'
    def log_message(self,fmt,*args): sys.stdout.write('[ShiftProof] '+fmt%args+'\n')
    def send_json(self,obj,status=200,headers=None):
        data=json.dumps(obj,separators=(',',':')).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(data))); self.send_header('Cache-Control','no-store');
        if headers:
            for k,v in headers.items():self.send_header(k,v)
        self.end_headers(); self.wfile.write(data)
    def read_json(self):
        try:
            n=int(self.headers.get('Content-Length','0')); return json.loads(self.rfile.read(n) or b'{}')
        except Exception:return {}
    def auth(self):
        u=session_user(self)
        if not u:self.send_json({'ok':False,'error':'unauthorized'},401); return None
        return u
    def serve_file(self,path):
        path=os.path.abspath(path)
        if not path.startswith(ROOT): self.send_error(403); return
        if not os.path.isfile(path): self.send_error(404); return
        mt=mimetypes.guess_type(path)[0] or 'application/octet-stream'; data=open(path,'rb').read(); self.send_response(200); self.send_header('Content-Type',mt); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        p=urlparse(self.path).path
        if p in ('/','/index.html'): return self.serve_file(os.path.join(ROOT,'index.html'))
        if p.startswith('/uploads/'):
            safe=os.path.basename(unquote(p.split('/uploads/',1)[1])); return self.serve_file(os.path.join(UPLOAD_DIR,safe))
        if p=='/api/session':
            u=session_user(self); return self.send_json({'ok':True,'user':u})
        if p=='/api/demo-users':
            c=conn(); data=[dict(x) for x in c.execute('SELECT name,email,role,department FROM users WHERE active=1 ORDER BY department')]; c.close(); return self.send_json({'ok':True,'users':data})
        if p=='/api/bootstrap':
            u=self.auth();
            if not u:return
            c=conn(); facs=visible_facilities(c,u['id']); facilities=[dict(x) for x in c.execute('SELECT * FROM facilities WHERE id IN (%s)'%(','.join('?'*len(facs))),facs)] if facs else []
            selected=self.headers.get('X-Facility') or (facs[0] if facs else None)
            if selected not in facs: selected=facs[0] if facs else None
            payload={'ok':True,'user':u,'facilities':facilities,'activeFacilityId':selected,'data':plant_snapshot(c,selected) if selected else None,'commander':commander(c,selected) if selected else None}; c.close(); return self.send_json(payload)
        if p=='/api/commander':
            u=self.auth();
            if not u:return
            facility=self.headers.get('X-Facility'); c=conn(); facs=visible_facilities(c,u['id']);
            if facility not in facs:c.close(); return self.send_json({'ok':False,'error':'forbidden'},403)
            out=commander(c,facility); c.close(); return self.send_json({'ok':True,'commander':out})
        if p=='/api/enterprise':
            u=self.auth();
            if not u:return
            c=conn()
            if not has_permission(c,u,'enterprise.view'):
                c.close(); return self.send_json({'ok':False,'error':'forbidden'},403)
            data=enterprise_snapshot(c,u['id']); c.close(); return self.send_json({'ok':True,'facilities':data})
        if p=='/manifest.webmanifest': return self.serve_file(os.path.join(ROOT,'manifest.webmanifest'))
        if p=='/sw.js': return self.serve_file(os.path.join(ROOT,'sw.js'))
        if p=='/api/intelligence':
            u=self.auth();
            if not u:return
            facility=self.headers.get('X-Facility'); c=conn(); facs=visible_facilities(c,u['id']);
            if facility not in facs:c.close(); return self.send_json({'ok':False,'error':'forbidden'},403)
            payload={'oee':oee_components(c,facility),'sanitationForecast':sanitation_forecast(c,facility),'optimizer':sequence_optimizer(c,facility),'skuCosts':sku_cost_summary(c,facility),'escalations':trigger_escalations(c,facility)}; c.close(); return self.send_json({'ok':True,'intelligence':payload})
        if p.startswith('/qr/') and p.endswith('.png'):
            asset_id=os.path.basename(p)[0:-4]; c=conn(); a=c.execute('SELECT * FROM assets WHERE id=?',(asset_id,)).fetchone(); c.close()
            if not a:return self.send_error(404)
            try:
                import qrcode
                target=f'http://{HOST}:{PORT}/#asset={asset_id}'
                img=qrcode.make(target); buf=io.BytesIO(); img.save(buf,format='PNG'); data=buf.getvalue(); self.send_response(200); self.send_header('Content-Type','image/png'); self.send_header('Content-Length',str(len(data))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(data); return
            except Exception as e:return self.send_json({'ok':False,'error':'QR generation unavailable: '+str(e)},500)
        if p.startswith('/asset/'):
            return self.serve_file(os.path.join(ROOT,'index.html'))
        self.send_error(404)
    def do_POST(self):
        p=urlparse(self.path).path; body=self.read_json()
        if p=='/api/login':
            email=str(body.get('email','')).strip().lower(); pin=str(body.get('pin',''))
            c=conn(); row=c.execute('SELECT * FROM users WHERE lower(email)=? AND active=1',(email,)).fetchone()
            if not row or not check_pin(pin,row['pin_salt'],row['pin_hash']): c.close(); return self.send_json({'ok':False,'error':'Invalid email or PIN'},401)
            token=secrets.token_urlsafe(32); exp=(datetime.now(timezone.utc)+timedelta(hours=12)).isoformat(timespec='seconds'); c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(token,row['id'],now_iso(),exp)); c.commit(); c.close(); return self.send_json({'ok':True},200,headers={'Set-Cookie':f'sp_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200'})
        if p=='/api/logout':
            cookie=self.headers.get('Cookie',''); m=re.search(r'sp_session=([^;]+)',cookie); c=conn();
            if m:c.execute('DELETE FROM sessions WHERE token=?',(m.group(1),)); c.commit(); c.close(); return self.send_json({'ok':True},headers={'Set-Cookie':'sp_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})
        if p.startswith('/api/webhook/'):
            integration_id=p.rsplit('/',1)[-1]; token=self.headers.get('X-ShiftProof-Token','') or body.get('token',''); c=conn(); integ=c.execute('SELECT * FROM integrations WHERE id=?',(integration_id,)).fetchone()
            if not integ or not hmac.compare_digest(str(integ['token'] or ''),str(token or '')): c.close(); return self.send_json({'ok':False,'error':'invalid webhook token'},403)
            ev=uid('wh'); event_type=str(body.get('eventType','external.event')); c.execute('INSERT INTO webhook_events VALUES(?,?,?,?,?,?,?,?)',(ev,integ['facility_id'],integration_id,event_type,json.dumps(body)[:50000],'Received',now_iso(),None)); c.execute('UPDATE integrations SET last_sync_at=? WHERE id=?',(now_iso(),integration_id)); audit(c,integ['facility_id'],'integration','WEBHOOK','integration',integration_id,event_type); c.commit(); c.close(); return self.send_json({'ok':True,'eventId':ev})
        if p!='/api/action': return self.send_error(404)
        u=self.auth();
        if not u:return
        op=body.get('op'); facility=body.get('facilityId'); c=conn(); facs=visible_facilities(c,u['id'])
        if facility not in facs:c.close(); return self.send_json({'ok':False,'error':'forbidden'},403)
        if not can_write(u,op):c.close(); return self.send_json({'ok':False,'error':'read-only role'},403)
        try:
            result=self.handle_action(c,u,facility,op,body)
            c.commit(); c.close(); self.send_json({'ok':True,'result':result})
        except Exception as e:
            c.rollback(); c.close(); self.send_json({'ok':False,'error':str(e)},400)
    def handle_action(self,c,u,f,op,b):
        t=now_iso()
        if op=='create_issue':
            id_=uid('i'); c.execute('INSERT INTO issues VALUES(?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b['title'],b.get('department',u['department']),'Open',b.get('priority','Medium'),b.get('assetId'),b.get('owner','Unassigned'),1 if b.get('proofRequired') else 0,t,None)); audit(c,f,u['id'],'CREATE','issue',id_,b['title']); return id_
        if op=='advance_issue':
            row=c.execute('SELECT * FROM issues WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); order=['Open','Assigned','In Progress','Awaiting Verification','Closed']; nxt=order[min(order.index(row['status'])+1,len(order)-1)]; c.execute('UPDATE issues SET status=?,closed_at=? WHERE id=?',(nxt,t if nxt=='Closed' else None,b['id'])); audit(c,f,u['id'],'ADVANCE','issue',b['id'],nxt); return nxt
        if op=='close_issue':
            row=c.execute('SELECT * FROM issues WHERE id=? AND facility_id=?',(b['id'],f)).fetchone();
            if row['proof_required']:
                proofs=c.execute('SELECT COUNT(*) n FROM proofs WHERE facility_id=? AND (subject LIKE ? OR asset=(SELECT name FROM assets WHERE id=?))',(f,'%'+row['title']+'%',row['asset_id'])).fetchone()['n']
                if proofs==0: raise ValueError('Proof is required before this issue can be closed.')
            c.execute('UPDATE issues SET status="Closed",closed_at=? WHERE id=?',(t,b['id'])); audit(c,f,u['id'],'CLOSE','issue',b['id'],'Verified closure'); return 'Closed'
        if op=='create_ticket':
            id_=uid('t'); c.execute('INSERT INTO tickets VALUES(?,?,?,?,?,?,?,?,?,?)',(id_,f,b['title'],b.get('department','Maintenance'),'Ready',b.get('priority','Medium'),b.get('assetId'),b.get('owner','Unassigned'),b.get('due','Next shift'),t)); audit(c,f,u['id'],'CREATE','ticket',id_,b['title']); return id_
        if op=='advance_ticket':
            r=c.execute('SELECT status FROM tickets WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); order=['Blocked','Ready','In Progress','Closed']; nxt=order[min(order.index(r['status'])+1,3)] if r['status'] in order else 'Ready'; c.execute('UPDATE tickets SET status=? WHERE id=?',(nxt,b['id'])); audit(c,f,u['id'],'ADVANCE','ticket',b['id'],nxt); return nxt
        if op=='create_handoff':
            id_=uid('h'); c.execute('INSERT INTO handoffs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b.get('from',u['department']),b['to'],b['subject'],'Awaiting Action',b.get('summary',''),t,u['id'],None,None,None,None)); audit(c,f,u['id'],'CREATE','handoff',id_,b['subject']); return id_
        if op=='sign_handoff':
            sig=str(b.get('signature') or u['name']).strip(); c.execute('UPDATE handoffs SET status="Acknowledged",ack_by=?,ack_at=?,signature=? WHERE id=? AND facility_id=?',(u['id'],t,sig,b['id'],f)); audit(c,f,u['id'],'SIGN','handoff',b['id'],sig); return 'Acknowledged'
        if op=='advance_handoff':
            r=c.execute('SELECT status FROM handoffs WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); order=['Awaiting Action','Acknowledged','In Progress','Completed']; nxt=order[min(order.index(r['status'])+1,3)] if r['status'] in order else 'Acknowledged'; c.execute('UPDATE handoffs SET status=?,completed_at=? WHERE id=?',(nxt,t if nxt=='Completed' else None,b['id'])); audit(c,f,u['id'],'ADVANCE','handoff',b['id'],nxt); return nxt
        if op=='create_sanitation':
            id_=uid('s'); c.execute('INSERT INTO sanitation VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,b['area'],b['task'],'Ready',0,b.get('proof','Required'),b.get('owner','Unassigned'),t)); audit(c,f,u['id'],'CREATE','sanitation',id_,b['task']); return id_
        if op=='advance_sanitation':
            r=c.execute('SELECT * FROM sanitation WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); pct=min(100,int(r['percent'])+25); st='Awaiting Verification' if pct==100 else 'In Progress'; c.execute('UPDATE sanitation SET percent=?,status=? WHERE id=?',(pct,st,b['id'])); audit(c,f,u['id'],'ADVANCE','sanitation',b['id'],f'{pct}%'); return st
        if op=='qa_action':
            status='Released' if b['action']=='Pass' else 'Blocked'; result='Pass' if status=='Released' else 'Re-clean required'; c.execute('UPDATE qa SET status=?,result=?,released_at=? WHERE id=? AND facility_id=?',(status,result,t if status=='Released' else None,b['id'],f)); audit(c,f,u['id'],'QA_'+status.upper(),'qa',b['id'],result)
            if status=='Blocked':
                q=c.execute('SELECT area FROM qa WHERE id=?',(b['id'],)).fetchone(); id_=uid('h'); c.execute('INSERT INTO handoffs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,'Quality','Sanitation','QA reclean — '+q['area'],'Awaiting Action','QA inspection requires corrective sanitation before release.',t,u['id'],None,None,None,None))
            return status
        if op=='release_asset':
            a=c.execute('SELECT * FROM assets WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); c.execute('UPDATE assets SET status="Sanitation Required" WHERE id=?',(b['id'],)); tid=uid('t'); hid=uid('h'); c.execute('INSERT INTO tickets VALUES(?,?,?,?,?,?,?,?,?,?)',(tid,f,'Post-maintenance clean — '+a['name'],'Sanitation','Ready','High',a['id'],'Sanitation','Before production release',t)); c.execute('INSERT INTO handoffs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(hid,f,'Maintenance','Sanitation',a['name'],'Awaiting Action','Maintenance work complete. Sanitation re-clean required before QA release.',t,u['id'],None,None,None,None)); audit(c,f,u['id'],'RELEASE_TO_SANITATION','asset',a['id'],a['name']); return hid
        if op=='create_proof':
            id_=uid('pr'); fn=fp=mime=sha=''; size=0; dataurl=b.get('dataUrl')
            if dataurl:
                m=re.match(r'^data:([^;]+);base64,(.+)$',dataurl,re.S)
                if not m: raise ValueError('Invalid evidence file encoding.')
                mime=m.group(1); raw=base64.b64decode(m.group(2));
                if len(raw)>30*1024*1024: raise ValueError('Evidence file exceeds 30 MB local MVP limit.')
                ext=mimetypes.guess_extension(mime) or '.bin'; safe=re.sub(r'[^A-Za-z0-9_.-]','_',b.get('fileName','evidence'))[:60]; fn=f'{id_}_{safe}';
                if not os.path.splitext(fn)[1]:fn+=ext
                fp=os.path.join(UPLOAD_DIR,fn); open(fp,'wb').write(raw); sha=hashlib.sha256(raw).hexdigest(); size=len(raw)
            c.execute('INSERT INTO proofs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b.get('type',u['department']),b['subject'],b.get('asset',''),u['name'],t,'Verified',b.get('note',''),fn,('/uploads/'+fn if fn else ''),mime,sha,size)); audit(c,f,u['id'],'CREATE','proof',id_,b['subject']); return {'id':id_,'sha256':sha,'path':'/uploads/'+fn if fn else ''}
        if op=='create_mss':
            id_=uid('m'); c.execute('INSERT INTO mss VALUES(?,?,?,?,?,?,?,?,?,?)',(id_,f,b['area'],b['task'],b.get('frequency','Weekly'),b['dueAt'],'Due',b.get('owner','Sanitation'),1 if b.get('proofRequired',True) else 0,None)); audit(c,f,u['id'],'CREATE','mss',id_,b['task']); return id_
        if op=='complete_mss':
            r=c.execute('SELECT * FROM mss WHERE id=? AND facility_id=?',(b['id'],f)).fetchone();
            if r['proof_required'] and not b.get('proofId'): raise ValueError('MSS proof is required before completion.')
            c.execute('UPDATE mss SET status="Complete",completed_at=? WHERE id=?',(t,b['id'])); audit(c,f,u['id'],'COMPLETE','mss',b['id'],r['task']); return 'Complete'
        if op=='create_shift':
            id_=uid('sh'); c.execute('INSERT INTO shifts VALUES(?,?,?,?,?,?,?,?)',(id_,f,b['name'],'Active',t,None,b.get('leader',u['name']),b.get('notes',''))); audit(c,f,u['id'],'START','shift',id_,b['name']); return id_
        if op=='close_shift':
            c.execute('UPDATE shifts SET status="Closed",ended_at=? WHERE id=? AND facility_id=?',(t,b['id'],f)); audit(c,f,u['id'],'CLOSE','shift',b['id'],'Shift closed'); return 'Closed'
        if op=='create_line':
            id_=uid('l'); c.execute('INSERT INTO lines VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,b['name'],b.get('status','Running'),float(b.get('target',95)),float(b.get('actual',0)),int(b.get('staffed',0)),int(b.get('planned',0)),b.get('shift','Current'))); audit(c,f,u['id'],'CREATE','line',id_,b['name']); return id_
        if op=='update_line':
            c.execute('UPDATE lines SET status=?,target=?,actual=?,staffed=?,planned=? WHERE id=? AND facility_id=?',(b['status'],float(b['target']),float(b['actual']),int(b['staffed']),int(b['planned']),b['id'],f)); audit(c,f,u['id'],'UPDATE','line',b['id'],'Production metrics updated'); return 'Updated'
        if op=='create_asset':
            id_=uid('a'); c.execute('INSERT INTO assets VALUES(?,?,?,?,?,?,?)',(id_,f,b.get('lineId'),b['name'],b.get('type','Equipment'),b.get('status','Available'),1 if b.get('critical') else 0)); audit(c,f,u['id'],'CREATE','asset',id_,b['name']); return id_
        if op=='create_order':
            id_=uid('o'); c.execute('INSERT INTO production_orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b.get('lineId'),b['sku'],b.get('productName',''),b.get('allergenGroup','None'),float(b.get('targetQty',0)),0,b.get('uom','lb'),'Planned',b.get('plannedStart',t),b.get('plannedEnd',t),int(b.get('priority',3)),int(b.get('sequenceNo',99)),t)); audit(c,f,u['id'],'CREATE','production_order',id_,b['sku']); return id_
        if op=='update_order':
            c.execute('UPDATE production_orders SET actual_qty=?,status=?,sequence_no=? WHERE id=? AND facility_id=?',(float(b.get('actualQty',0)),b.get('status','Running'),int(b.get('sequenceNo',99)),b['id'],f)); audit(c,f,u['id'],'UPDATE','production_order',b['id'],b.get('status','Running')); return 'Updated'
        if op=='create_downtime':
            id_=uid('dt'); mins=float(b.get('minutes',0)); c.execute('INSERT INTO downtime VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b.get('lineId'),b.get('assetId'),b.get('category','Equipment'),b['reason'],mins,b.get('status','Open'),b.get('startedAt',t),None,b.get('owner',u['department']),t)); audit(c,f,u['id'],'CREATE','downtime',id_,b['reason']); return id_
        if op=='close_downtime':
            c.execute('UPDATE downtime SET status="Closed",ended_at=? WHERE id=? AND facility_id=?',(t,b['id'],f)); audit(c,f,u['id'],'CLOSE','downtime',b['id'],'Downtime closed'); return 'Closed'
        if op=='create_changeover':
            id_=uid('co'); c.execute('INSERT INTO changeovers VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b.get('lineId'),b.get('fromSku',''),b.get('toSku',''),1 if b.get('allergenChange') else 0,float(b.get('plannedMinutes',30)),0,'Planned',None,None,t)); audit(c,f,u['id'],'CREATE','changeover',id_,b.get('toSku','')); return id_
        if op=='advance_changeover':
            r=c.execute('SELECT status FROM changeovers WHERE id=? AND facility_id=?',(b['id'],f)).fetchone(); st=r['status'] if r else 'Planned'; nxt='In Progress' if st=='Planned' else 'Complete'; c.execute('UPDATE changeovers SET status=?,started_at=COALESCE(started_at,?),completed_at=?,actual_minutes=? WHERE id=?',(nxt,t,t if nxt=='Complete' else None,float(b.get('actualMinutes',0)) if nxt=='Complete' else 0,b['id'])); audit(c,f,u['id'],'ADVANCE','changeover',b['id'],nxt); return nxt
        if op=='create_labor_assignment':
            id_=uid('la'); person=c.execute('SELECT * FROM people WHERE id=? AND facility_id=?',(b['personId'],f)).fetchone(); skill=(person['skills'] or '').lower() if person else ''; line=c.execute('SELECT name FROM lines WHERE id=? AND facility_id=?',(b.get('lineId'),f)).fetchone(); line_name=(line['name'] if line else '').lower(); qual=1 if (not line_name or line_name in skill or b.get('forceQualified')) else 0; c.execute('INSERT INTO labor_assignments VALUES(?,?,?,?,?,?,?,?,?,?,?)',(id_,f,b['personId'],b.get('department',person['department'] if person else ''),b.get('lineId'),b.get('task',''),b.get('status','Active'),t,None,qual,t)); audit(c,f,u['id'],'ASSIGN','labor',id_,b.get('task','')); return {'id':id_,'qualificationMatch':qual}
        if op=='update_sla':
            c.execute('UPDATE sla_metrics SET actual=?,status=?,updated_at=? WHERE id=? AND facility_id=?',(float(b['actual']),b.get('status','Watch'),t,b['id'],f)); audit(c,f,u['id'],'UPDATE','sla',b['id'],str(b['actual'])); return 'Updated'
        if op=='ask_plant':
            out=llm_answer(c,f,b.get('question','')); audit(c,f,u['id'],'ASK','plant',f,(b.get('question','') or '')[:180]); return out
        if op=='optimize_sequence':
            opt=sequence_optimizer(c,f)
            for x in opt['orders']: c.execute('UPDATE production_orders SET sequence_no=? WHERE id=? AND facility_id=?',(x['sequence'],x['id'],f))
            audit(c,f,u['id'],'OPTIMIZE','production_sequence',f,json.dumps(opt)[:500]); return opt
        if op=='auto_plan_sanitation':
            created=[]; active=[o for o in rows(c,'production_orders',f,'sequence_no') if o['status'] not in ('Complete','Closed')]
            existing={(x['area'],x['task']) for x in rows(c,'sanitation',f,'created_at DESC') if x['status']!='Complete'}
            for o in active:
                line=c.execute('SELECT name FROM lines WHERE id=?',(o['line_id'],)).fetchone(); area=line['name'] if line else 'Production'
                allergen=o['allergen_group'] or 'None'; task=f"Post-run sanitation — {o['sku']}" + (f" — allergen control: {allergen}" if allergen not in ('None','') else '')
                if (area,task) in existing: continue
                id_=uid('s'); c.execute('INSERT INTO sanitation VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,area,task,'Ready',0,'Required','Sanitation',t)); created.append(id_)
            audit(c,f,u['id'],'AUTO_PLAN','sanitation',f,f'{len(created)} tasks created'); return {'created':created,'count':len(created)}
        if op=='record_root_cause':
            id_=uid('rc'); c.execute('INSERT INTO root_causes VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,b['downtimeId'],b.get('causeCategory','Equipment'),b['causeDetail'],b.get('correctiveAction',''),int(b.get('recurrenceCount',1)),float(b.get('confidence',0.7)),t)); audit(c,f,u['id'],'CREATE','root_cause',id_,b['causeDetail']); return id_
        if op=='update_sku_cost':
            row=c.execute('SELECT id FROM sku_costs WHERE facility_id=? AND sku=?',(f,b['sku'])).fetchone(); id_=row['id'] if row else uid('sc')
            vals=(b['sku'],b.get('productName',''),float(b.get('sanitationMinutes',0)),float(b.get('laborHours',0)),float(b.get('chemicalCost',0)),float(b.get('avgChangeoverMinutes',0)),int(b.get('allergenComplexity',0)),t)
            if row:c.execute('UPDATE sku_costs SET product_name=?,sanitation_minutes=?,labor_hours=?,chemical_cost=?,avg_changeover_minutes=?,allergen_complexity=?,updated_at=? WHERE id=?',(vals[1],vals[2],vals[3],vals[4],vals[5],vals[6],vals[7],id_))
            else:c.execute('INSERT INTO sku_costs VALUES(?,?,?,?,?,?,?,?,?,?)',(id_,f,*vals))
            audit(c,f,u['id'],'UPSERT','sku_cost',id_,b['sku']); return id_
        if op=='record_asset_scan':
            a=c.execute('SELECT * FROM assets WHERE id=? AND facility_id=?',(b['assetId'],f)).fetchone()
            if not a: raise ValueError('Asset not found')
            id_=uid('scan'); c.execute('INSERT INTO asset_scans VALUES(?,?,?,?,?,?)',(id_,f,a['id'],u['id'],b.get('scanType','QR'),t)); audit(c,f,u['id'],'SCAN','asset',a['id'],a['name']); return {'scanId':id_,'asset':dict(a)}
        if op=='update_node_position':
            c.execute('UPDATE plant_nodes SET x=?,y=? WHERE id=? AND facility_id=?',(float(b['x']),float(b['y']),b['id'],f)); audit(c,f,u['id'],'MOVE','plant_node',b['id'],f"{b['x']},{b['y']}"); return 'Updated'
        if op=='set_permission':
            if not has_permission(c,u,'roles.manage'): raise ValueError('Role permission management is restricted.')
            c.execute('INSERT INTO role_permissions(role,permission,enabled) VALUES(?,?,?) ON CONFLICT(role,permission) DO UPDATE SET enabled=excluded.enabled',(b['role'],b['permission'],1 if b.get('enabled') else 0)); audit(c,f,u['id'],'SET_PERMISSION','role',b['role'],b['permission']); return 'Updated'
        if op=='create_integration':
            if not has_permission(c,u,'integrations.manage'): raise ValueError('Integration management is restricted.')
            id_=uid('int'); token=secrets.token_urlsafe(20); c.execute('INSERT INTO integrations VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,b['name'],b.get('type','Webhook'),'Configured',f'/api/webhook/{id_}',token,None,t)); audit(c,f,u['id'],'CREATE','integration',id_,b['name']); return {'id':id_,'token':token,'endpoint':f'/api/webhook/{id_}'}
        if op=='send_notification_test':
            id_=uid('nd'); c.execute('INSERT INTO notification_deliveries VALUES(?,?,?,?,?,?,?,?,?)',(id_,f,None,b.get('channel','In-app'),b.get('destination',u['email']), 'Sent','Simulated local v6 delivery',t,t)); audit(c,f,u['id'],'SEND_TEST','notification_delivery',id_,b.get('channel','In-app')); return id_
        if op=='draft_handoff':
            snap=plant_snapshot(c,f); cmd=commander(c,f); lines=[x for x in snap['lines'] if float(x['actual'] or 0)<float(x['target'] or 0)]; dt=sorted(snap['downtime'],key=lambda x:float(x['minutes'] or 0),reverse=True); text=f"AI draft: PXS {cmd['pxs']}, modeled OEE {cmd['oee']}%. "; text+=f"{len(lines)} line(s) below target. " if lines else 'All tracked lines at/above target. '; text+=f"Largest downtime: {dt[0]['reason']} ({dt[0]['minutes']} min). " if dt else 'No downtime recorded. '; text+=f"Sanitation forecast: {cmd['sanitationEtaMinutes']} modeled minutes remaining. "; text+=f"Open QA blocks: {len([q for q in snap['qa'] if q['status']!='Released'])}."; audit(c,f,u['id'],'DRAFT','handoff','ai',text[:220]); return text
        if op=='read_notification':
            c.execute('UPDATE notifications SET read_at=? WHERE id=? AND (user_id=? OR user_id IS NULL)',(t,b['id'],u['id'])); return 'Read'
        raise ValueError('Unsupported action')

if __name__=='__main__':
    init_db()
    server=ThreadingHTTPServer((HOST,PORT),Handler)
    url=f'http://{HOST}:{PORT}'
    print(f'ShiftProof ONE v6 running at {url}')
    if '--no-open' not in sys.argv: threading.Timer(0.7,lambda:webbrowser.open(url)).start()
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()