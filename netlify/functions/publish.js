const {getSession,json,canManageGuild,botApi,safeError}=require("./lib/auth");
const httpsUrl=(value)=>{if(!value)return null;try{const u=new URL(value);return u.protocol==="https:"?u.toString():null;}catch{return null;}};
exports.handler=async(event)=>{try{
 if(event.httpMethod!=="POST")return json(405,{error:"Use POST to publish an embed."});
 const s=getSession(event);if(!s)return json(401,{error:"Please sign in with Discord first."});
 const origin=event.headers.origin;if(origin&&process.env.URL&&new URL(origin).host!==new URL(process.env.URL).host)return json(403,{error:"Request origin was not allowed."});
 let body;try{body=JSON.parse(event.body||"{}");}catch{return json(400,{error:"Invalid request body."});}
 const {guildId,channelId,title,description,color,footer}=body;
 if(!/^\d{17,20}$/.test(guildId||"")||!/^\d{17,20}$/.test(channelId||""))return json(400,{error:"Choose a server and channel first."});
 if(!await canManageGuild(s,guildId))return json(403,{error:"You need Manage Server or Administrator permission."});
 if((title||"").length>256||(description||"").length>4000||(footer||"").length>2048)return json(400,{error:"One of the embed fields is too long."});
 if(!title&&!description)return json(400,{error:"Add a title or description before publishing."});
 const channel=await botApi("/channels/"+channelId);if(channel.guild_id!==guildId||(channel.type!==0&&channel.type!==5))return json(400,{error:"That channel does not belong to the selected server or is not a text channel."});
 const hex=/^#[0-9a-fA-F]{6}$/.test(color||"")?color.slice(1):"8b7cff";
 const embed={color:parseInt(hex,16)};
 if(title)embed.title=title;if(description)embed.description=description;if(footer)embed.footer={text:footer};
 const embedUrl=httpsUrl(body.url),image=httpsUrl(body.image),thumbnail=httpsUrl(body.thumbnail),banner=httpsUrl(body.banner);
 const isDirectImage=(value)=>!value||/\\.(png|jpe?g|gif|webp|avif)(?:$|[?#])/i.test(value);
 if(body.url&&!embedUrl||body.image&&!image||body.thumbnail&&!thumbnail||body.banner&&!banner)return json(400,{error:"Embed links and image URLs must use HTTPS."});
 if(banner&&!isDirectImage(banner))return json(400,{error:"Banner image must be a direct PNG, JPG, GIF, WEBP, or AVIF image URL."});
 if(embedUrl)embed.url=embedUrl;if(image)embed.image={url:image};if(thumbnail)embed.thumbnail={url:thumbnail};
 const author=body.author||{};if(author.name){if(author.name.length>256)return json(400,{error:"Author name is too long."});embed.author={name:author.name};const au=httpsUrl(author.url),ai=httpsUrl(author.icon);if(author.url&&!au||author.icon&&!ai)return json(400,{error:"Author URLs must use HTTPS."});if(au)embed.author.url=au;if(ai)embed.author.icon_url=ai;}
 const fields=Array.isArray(body.fields)?body.fields:[];if(fields.length>25)return json(400,{error:"Discord allows up to 25 embed fields."});
 if(fields.some(x=>!x||typeof x.name!=="string"||typeof x.value!=="string"||!x.name.trim()||!x.value.trim()||x.name.length>256||x.value.length>1024))return json(400,{error:"Each field needs a name and value within Discord's length limits."});
 if(fields.length)embed.fields=fields.map(x=>({name:x.name,value:x.value,inline:Boolean(x.inline)}));
 if(body.timestamp)embed.timestamp=new Date().toISOString();
 const components=[];const buttons=Array.isArray(body.buttons)?body.buttons:[];
 if(buttons.length>20)return json(400,{error:"You can add up to 20 link buttons."});
 for(let i=0;i<buttons.length;i+=5){const group=buttons.slice(i,i+5).map(b=>{const url=httpsUrl(b.url);if(!b.label||b.label.length>80||!url)throw new Error("Each button needs a label (up to 80 characters) and an HTTPS URL.");return {type:2,style:5,label:b.label,url};});components.push({type:1,components:group});}
 const select=body.select||{},options=Array.isArray(select.options)?select.options:[];
 if(options.length){if(options.length>25)return json(400,{error:"A dropdown can have up to 25 options."});if(components.length>=5)return json(400,{error:"Too many component rows. Remove some buttons to make room for the dropdown."});if(options.some(o=>!o.label||!o.value||o.label.length>100||o.value.length>100||(o.description||"").length>100))return json(400,{error:"Dropdown options need labels and values under 100 characters."});components.push({type:1,components:[{type:3,custom_id:"embedify:dashboard-select",placeholder:(select.placeholder||"Choose an option").slice(0,150),min_values:1,max_values:1,options:options.map(o=>({label:o.label,value:o.value,...(o.description?{description:o.description}:{})}))}]});}
 if(banner)await botApi("/channels/"+channelId+"/messages","POST",{content:banner});
 await botApi("/channels/"+channelId+"/messages","POST",{embeds:[embed],...(components.length?{components}:{})});
 return json(200,{ok:true});
 }catch(e){return json(e.status||400,{error:safeError(e)});}};
