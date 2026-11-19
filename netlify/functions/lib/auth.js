const crypto = require("node:crypto");
const COOKIE = "embedify_session";
const STATE_COOKIE = "embedify_oauth_state";
function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters.");return s;}
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url");}
function pack(value){const body=Buffer.from(JSON.stringify(value)).toString("base64url");return body+"."+sign(body);}
function unpack(value){if(!value)return null;const [body,sig]=value.split(".");if(!body||!sig)return null;const expected=sign(body);const a=Buffer.from(sig);const b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;try{return JSON.parse(Buffer.from(body,"base64url").toString("utf8"));}catch{return null;}}
function cookies(event){const raw=event.headers.cookie||event.headers.Cookie||"";return Object.fromEntries(raw.split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}));}
function cookie(name,value,maxAge){return name+"="+encodeURIComponent(value)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge;}
function clearCookie(name){return name+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";}
function json(statusCode,body,headers={}){return {statusCode,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers},body:JSON.stringify(body)};}
function redirect(location,headers={}){return {statusCode:302,headers:{Location:location,"Cache-Control":"no-store",...headers},body:""};}
function getSession(event){const c=cookies(event);const s=unpack(c[COOKIE]);if(!s||!s.access_token||!s.user||s.expires_at<Date.now())return null;return s;}
async function discord(path,token,method="GET",body){const res=await fetch("https://discord.com/api/v10"+path,{method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json().catch(()=>({}));if(!res.ok){const err=new Error(data.message||"Discord API request failed.");err.status=res.status;throw err;}return data;}
async function botApi(path,method="GET",body){const token=process.env.DISCORD_TOKEN;if(!token)throw new Error("DISCORD_TOKEN is not configured in Netlify.");const res=await fetch("https://discord.com/api/v10"+path,{method,headers:{"Authorization":"Bot "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json().catch(()=>({}));if(!res.ok){const err=new Error(data.message||"Discord bot request failed.");err.status=res.status;throw err;}return data;}
async function userGuilds(session){return discord("/users/@me/guilds",session.access_token);}
async function canManageGuild(session,guildId){const guilds=await userGuilds(session);const g=guilds.find(x=>x.id===guildId);if(!g)return false;const p=BigInt(g.permissions||"0");return Boolean(g.owner||(p&8n)||(p&32n));}
function safeError(e){if(e.status===401)return "Your Discord login expired. Please sign in again.";if(e.status===403)return "Discord denied this action. Check the bot's server and channel permissions.";if(e.status===404)return "Embedify is not in that server, or the selected channel is unavailable.";return e.message||"Something went wrong.";}
module.exports={COOKIE,STATE_COOKIE,pack,unpack,cookies,cookie,clearCookie,json,redirect,getSession,discord,botApi,userGuilds,canManageGuild,safeError};
