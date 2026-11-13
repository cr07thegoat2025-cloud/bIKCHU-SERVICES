import crypto from "node:crypto";
import {setSession,clearSession} from "../_lib/admin.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method==="DELETE"){clearSession(res);return res.status(200).json({ok:true});}
 if(req.method!=="POST"){res.setHeader("Allow","POST, DELETE");return res.status(405).json({error:"Method not allowed"});}
 const expected=process.env.ADMIN_PASSWORD||"",given=String(req.body?.password||"");
 if(!expected||!process.env.SESSION_SECRET)return res.status(503).json({error:"Admin login is not configured. Add ADMIN_PASSWORD and SESSION_SECRET in Vercel."});
 const a=Buffer.from(given),b=Buffer.from(expected);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:"Incorrect password."});
 setSession(res,req);return res.status(200).json({ok:true});
}