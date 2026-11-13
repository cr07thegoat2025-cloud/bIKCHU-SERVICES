import crypto from "node:crypto";
const OWNER_EMAIL="cr07thegoat2025@gmail.com";
const FROM_EMAIL=process.env.RESEND_FROM_EMAIL||"BIKCHU <onboarding@resend.dev>";
const allowed=new Set(["Basic","Advanced","Pro"]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
 try{
  const {name,email,package:pkg,idea,website}=req.body||{};
  if(website)return res.status(200).json({ok:true});
  if(typeof name!=="string"||name.trim().length<2||name.trim().length>80)return res.status(400).json({error:"Please enter a name between 2 and 80 characters."});
  if(typeof email!=="string"||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return res.status(400).json({error:"Please enter a valid email address."});
  if(!allowed.has(pkg))return res.status(400).json({error:"Please choose a listed package."});
  if(typeof idea!=="string"||idea.trim().length<15||idea.trim().length>5000)return res.status(400).json({error:"Tell us more about your app (15–5,000 characters)."});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:"Request storage is not configured yet. Please try again later."});
  const clean={name:name.trim(),email:email.trim().toLowerCase(),package:pkg,idea:idea.trim()};
  const reference="BK-"+crypto.randomBytes(4).toString("hex").toUpperCase();
  const base=process.env.SUPABASE_URL.replace(/\/$/,"");
  const saved=await fetch(base+"/rest/v1/project_requests",{method:"POST",headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({...clean,reference})});
  const savedData=await saved.json().catch(()=>null);
  if(!saved.ok){console.error("Supabase insert failed",savedData);return res.status(502).json({error:"We couldn't save your request. Please try again later."});}
  let emailSent=false;
  if(process.env.RESEND_API_KEY){
   const text=["New BIKCHU project request","Reference: "+reference,"Name: "+clean.name,"Client email: "+clean.email,"Package: "+pkg,"","Project idea:",clean.idea].join("\n");
   const html="<h2>New BIKCHU project request</h2><p><b>Reference:</b> "+esc(reference)+"</p><p><b>Name:</b> "+esc(clean.name)+"</p><p><b>Email:</b> "+esc(clean.email)+"</p><p><b>Package:</b> "+esc(pkg)+"</p><h3>Project idea</h3><p style='white-space:pre-wrap'>"+esc(clean.idea)+"</p>";
   try{const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:FROM_EMAIL,to:[OWNER_EMAIL],reply_to:clean.email,subject:"New BIKCHU request — "+reference,text,html})});emailSent=mail.ok;if(!mail.ok)console.error("Resend error",await mail.text());}catch(e){console.error("Resend error",e);}
  }
  return res.status(200).json({ok:true,reference,emailSent});
 }catch(e){console.error("Request submit failed",e);return res.status(500).json({error:"We couldn't submit your request right now."});}
}