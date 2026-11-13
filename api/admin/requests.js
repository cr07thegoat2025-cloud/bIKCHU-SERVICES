import {authorized,db,jsonError} from "../_lib/admin.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!authorized(req))return res.status(401).json({error:"Please sign in again."});
 try{
  if(req.method==="GET"){const rows=await db("project_requests?select=*&order=created_at.desc");return res.status(200).json({requests:rows||[]});}
  if(req.method==="PATCH"){
   const {id,status}=req.body||{};
   const allowed=["New","Reviewing","Approved","In Progress","Completed","Declined"];
   if(typeof id!=="string"||!allowed.includes(status))return res.status(400).json({error:"Invalid request update."});
   const rows=await db("project_requests?id=eq."+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({status,updated_at:new Date().toISOString()})});
   if(!rows?.length)return res.status(404).json({error:"Request not found."});
   return res.status(200).json({ok:true});
  }
  res.setHeader("Allow","GET, PATCH");return res.status(405).json({error:"Method not allowed"});
 }catch(e){return jsonError(res,e,500);}
}