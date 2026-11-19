const {clearCookie,json}=require("./lib/auth");exports.handler=async()=>json(200,{ok:true},{"Set-Cookie":clearCookie("embedify_session")});
