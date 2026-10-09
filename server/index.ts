import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const port = Number(process.env.PORT || 3000);
const maxAge = 30 * 24 * 60 * 60 * 1000;
const production = process.env.NODE_ENV === 'production';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined, max: 10, connectionTimeoutMillis: 5000 }) : null;
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));
const languages = [{code:'en',label:'English'},{code:'es',label:'Spanish'},{code:'fr',label:'French'},{code:'de',label:'German'},{code:'it',label:'Italian'},{code:'pt',label:'Portuguese'},{code:'ja',label:'Japanese'},{code:'ko',label:'Korean'},{code:'zh',label:'Chinese'},{code:'ru',label:'Russian'},{code:'ar',label:'Arabic'},{code:'hi',label:'Hindi'},{code:'nl',label:'Dutch'},{code:'pl',label:'Polish'},{code:'tr',label:'Turkish'}];
type User = { id:string; email:string; username:string; preferredLanguage:string };
declare global { namespace Express { interface Request { svUser?: User } } }
const fail=(res:Response,status:number,code:string,message:string)=>res.status(status).json({error:message,code});
const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
function normalizeEmail(input:string){const v=input.trim().toLowerCase();const at=v.lastIndexOf('@');if(at<1)return v;const local=v.slice(0,at),domain=v.slice(at+1);return ['gmail.com','googlemail.com'].includes(domain)?local.split('+')[0].replace(/\./g,'')+'@gmail.com':v;}
const normalizeUsername=(s:string)=>s.trim().toLowerCase();
function cookie(req:Request,name:string){for(const part of (req.headers.cookie||'').split(';')){const [key,...value]=part.trim().split('=');if(key===name){try{return decodeURIComponent(value.join('='));}catch{return '';}}}return '';}
function setCookie(res:Response,token:string,age:number){res.setHeader('Set-Cookie',token? `streamvoice_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(age/1000)}${production?'; Secure':''}`:`streamvoice_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${production?'; Secure':''}`);}
async function hashPassword(password:string,salt:string){const derived=await scrypt(password,Buffer.from(salt,'hex'),64) as Buffer;return derived.toString('hex');}
function equalHex(a:string,b:string){const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===y.length&&x.length>0&&timingSafeEqual(x,y);}
function needsDb(_req:Request,res:Response,next:NextFunction){if(!pool)return fail(res,503,'SV-DB-001','Database is not configured. Set DATABASE_URL in the server environment.');next();}
async function auth(req:Request,_res:Response,next:NextFunction){try{if(!pool)return next();const token=cookie(req,'streamvoice_session');if(!token||token.length>256)return next();const q=await pool.query('SELECT a.id,a.email,a.username,a.preferred_language,s.id AS session_id FROM sv_sessions s JOIN sv_accounts a ON a.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.deleted_at IS NULL LIMIT 1',[tokenHash(token)]);if(q.rowCount){const r=q.rows[0];req.svUser={id:r.id,email:r.email,username:r.username,preferredLanguage:r.preferred_language};await pool.query("UPDATE sv_sessions SET expires_at=now()+interval '30 days',updated_at=now() WHERE id=$1",[r.session_id]);}next();}catch(e){next(e);}}
async function newSession(userId:string){if(!pool)throw new Error('Database not configured');const token=randomBytes(32).toString('base64url');await pool.query("INSERT INTO sv_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 days')",[randomUUID(),userId,tokenHash(token)]);return token;}

app.get('/health',async(_req,res)=>{if(!pool)return res.status(503).json({ok:false,service:'StreamVoice API',database:'not_configured'});try{await pool.query('SELECT 1');res.json({ok:true,service:'StreamVoice API',database:'connected'});}catch{res.status(503).json({ok:false,service:'StreamVoice API',database:'unavailable'});}});
app.get('/api/system/infrastructure',(_req,res)=>res.json({ok:true,provider:'standalone',databaseProvider:'PostgreSQL',secretsExposed:false}));
app.get('/api/languages',(_req,res)=>res.json({languages}));
app.post('/api/auth/signup',needsDb,async(req,res,next)=>{try{
const email=String(req.body?.email||'').trim().toLowerCase(),username=String(req.body?.username||'').trim(),password=String(req.body?.password||''),language=String(req.body?.preferredLanguage||'en');
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return fail(res,400,'SV-AUTH-001','Enter a valid email address.');
if(!/^[A-Za-z0-9_]{3,24}$/.test(username))return fail(res,400,'SV-AUTH-002','Username must be 3-24 characters using letters, numbers, or underscores.');
if(password.length<8||password.length>128)return fail(res,400,'SV-AUTH-003','Password must be 8-128 characters.');
if(!languages.some(x=>x.code===language))return fail(res,400,'SV-AUTH-004','Unsupported preferred language.');
const salt=randomBytes(16).toString('hex'),digest=await hashPassword(password,salt),id=randomUUID(),client=await pool!.connect();
try{await client.query('BEGIN');const ins=await client.query('INSERT INTO sv_accounts(id,email,email_key,username,username_key,password_salt,password_hash,preferred_language) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id',[id,email,normalizeEmail(email),username,normalizeUsername(username),salt,digest,language]);if(!ins.rowCount){const c=await client.query('SELECT email_key=$1 AS email_conflict FROM sv_accounts WHERE email_key=$1 OR username_key=$2 LIMIT 1',[normalizeEmail(email),normalizeUsername(username)]);await client.query('ROLLBACK');return fail(res,409,c.rows[0]?.email_conflict?'SV-AUTH-005':'SV-AUTH-006',c.rows[0]?.email_conflict?'An account with that email already exists.':'That username is already taken.');}await client.query('INSERT INTO sv_chat_settings(user_id,enabled,language) VALUES($1,true,$2)',[id,language]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK').catch(()=>undefined);throw e;}finally{client.release();}
const token=await newSession(id);setCookie(res,token,maxAge);return res.status(201).json({ok:true,user:{username,email,preferredLanguage:language}});
}catch(e){next(e);}});
app.post('/api/auth/login',needsDb,async(req,res,next)=>{try{const identifier=String(req.body?.identifier||'').trim(),password=String(req.body?.password||'');if(!identifier||!password||password.length>128)return fail(res,400,'SV-AUTH-007','Enter your username or email and password.');const key=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)?normalizeEmail(identifier):normalizeUsername(identifier);const q=await pool!.query('SELECT id,email,username,password_salt,password_hash,preferred_language FROM sv_accounts WHERE (email_key=$1 OR username_key=$1) AND deleted_at IS NULL LIMIT 1',[key]);const a=q.rows[0],candidate=a?await hashPassword(password,a.password_salt):'';if(!a||!equalHex(candidate,a.password_hash))return fail(res,401,'SV-AUTH-009','Invalid username/email or password.');const token=await newSession(a.id);setCookie(res,token,maxAge);return res.json({ok:true,user:{username:a.username,email:a.email,preferredLanguage:a.preferred_language}});}catch(e){next(e);}});
app.post('/api/auth/logout',needsDb,async(req,res,next)=>{try{const token=cookie(req,'streamvoice_session');if(token)await pool!.query('DELETE FROM sv_sessions WHERE token_hash=$1',[tokenHash(token)]);setCookie(res,'',0);res.json({ok:true});}catch(e){next(e);}});
app.get('/api/auth/me',needsDb,auth,(req,res)=>{if(!req.svUser)return fail(res,401,'SV-AUTH-010','Your StreamVoice session is missing or expired. Please log in again.');res.json({user:{username:req.svUser.username,email:req.svUser.email,preferredLanguage:req.svUser.preferredLanguage},session:{active:true,persistent:true}});});
app.use((req,res)=>fail(res,404,'SV-ROUTE-404',`Route not implemented: ${req.method} ${req.path}`));
app.use((err:unknown,_req:Request,res:Response,_next:NextFunction)=>{console.error('StreamVoice API request failed:',err instanceof Error?err.message:'unknown error');fail(res,500,'SV-SERVER-500','The server could not complete the request.');});
if(process.env.NODE_ENV!=='test'){const server=app.listen(port,'127.0.0.1',()=>console.log(`StreamVoice API listening on 127.0.0.1:${port}`));const stop=async()=>{server.close();if(pool)await pool.end();process.exit(0);};process.on('SIGTERM',stop);process.on('SIGINT',stop);}
export {app,pool};
