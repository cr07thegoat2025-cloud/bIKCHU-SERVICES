import crypto from "node:crypto";
const COOKIE = "bikchu_admin";
function secret(){return process.env.SESSION_SECRET || ""}
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url")}
export function setSession(res,req){
  const payload=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000})).toString("base64url");
  const value=payload+"."+sign(payload);
  const secure=req.headers["x-forwarded-proto"]==="https"?"; Secure":"";
  res.setHeader("Set-Cookie",COOKIE+"="+value+"; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800"+secure);
}
export function clearSession(res){res.setHeader("Set-Cookie",COOKIE+"=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure")}
export function authorized(req){
  if(!secret())return false;
  const raw=req.headers.cookie||"";
  const pair=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
  if(!pair)return false;
  const value=pair.slice(COOKIE.length+1),parts=value.split(".");
  if(parts.length!==2)return false;
  const expected=sign(parts[0]);
  const a=Buffer.from(parts[1]),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
  try{return JSON.parse(Buffer.from(parts[0],"base64url").toString()).exp>Date.now()}catch{return false}
}
export function supabaseReady(){return !!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)}
export async function db(path,options={}){
  if(!supabaseReady())throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  const base=process.env.SUPABASE_URL.replace(/\/$/,"");
  const r=await fetch(base+"/rest/v1/"+path,{...options,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json",Prefer:"return=representation",...(options.headers||{})}});
  const body=await r.json().catch(()=>null);
  if(!r.ok)throw new Error(body?.message||body?.error||"Database request failed");
  return body;
}
export function jsonError(res,error,status=500){return res.status(status).json({error:error?.message||"Server error"});}
