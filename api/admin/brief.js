import {authorized,db,jsonError} from "../_lib/admin.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!authorized(req))return res.status(401).json({error:"Please sign in again."});
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
 if(!process.env.OPENROUTER_API_KEY)return res.status(503).json({error:"Add OPENROUTER_API_KEY in Vercel to enable AI briefs."});
 try{
  const id=String(req.body?.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Invalid request ID."});
  const rows=await db("project_requests?id=eq."+encodeURIComponent(id)+"&select=*");
  const item=rows?.[0];if(!item)return res.status(404).json({error:"Request not found."});
  const prompt="Create a practical project brief for this small client app request. Include: summary, MVP features, questions to clarify, risks/complexity, and a realistic draft quote range in USD based on the selected package. Do not promise delivery or claim work has been done. Selected package: "+item.package+". Client idea: "+item.idea;
  const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENROUTER_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENROUTER_MODEL||"openrouter/auto",messages:[{role:"user",content:prompt}],max_tokens:900})});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error?.message||"OpenRouter request failed");
  const text=data.choices?.[0]?.message?.content;if(!text)throw new Error("AI returned an empty brief.");
  const quote=(text.match(/(?:quote|price|cost)[^\n]*/i)||[])[0]||"Review the brief and agree a quote manually.";
  await db("project_requests?id=eq."+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({ai_brief:text,ai_quote:quote,updated_at:new Date().toISOString()})});
  return res.status(200).json({ok:true});
 }catch(e){return jsonError(res,e,502);}
}