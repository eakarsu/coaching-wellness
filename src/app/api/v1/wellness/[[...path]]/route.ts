import{NextResponse}from'next/server';
import crypto from 'node:crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{loadConfig}=require('@/governance/config.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{getPool}=require('@/governance/db.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{createProviders}=require('@/governance/providers.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{createService}=require('@/governance/service.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const localAuth=require('@/governance/local-auth.cjs');
let service:ReturnType<typeof createService>;
function getService(){
  if(!service){
    const localMode=process.env.AUTH_MODE!=='oidc'&&process.env.BOOTSTRAP_ACKNOWLEDGEMENT==='create-initial-admin';
    // Local sessions supply the principal. OIDC and external provider settings are
    // required only when those integrations are actually used.
    const c=localMode?{
      databaseUrl:process.env.DATABASE_URL,
      // Match the local-auth pool, which connects to the same local database.
      databaseSsl:false,
      webhookSecret:process.env.WEBHOOK_SIGNING_SECRET,
      ...Object.fromEntries(['billing','video','wearable','notification'].map(name=>[name,{
        baseUrl:process.env[`${name.toUpperCase()}_BASE_URL`],
        token:process.env[`${name.toUpperCase()}_BEARER_TOKEN`],
      }])),
    }:loadConfig();
    if(!c.databaseUrl||!c.webhookSecret||c.webhookSecret.length<32)throw new Error('Local wellness runtime configuration is incomplete');
    service=createService({config:c,pool:getPool(c),providers:createProviders(c)});
  }
  return service;
}
async function dispatch(request:Request,context:{params:Promise<{path?:string[]}>}){const started=Date.now(),requestId=crypto.randomUUID(),{path=[]}=await context.params,rawBody=['POST','PATCH','PUT'].includes(request.method)?await request.text():'';let body={};if(rawBody)try{body=JSON.parse(rawBody)}catch{return NextResponse.json({error:'Request body must be valid JSON'},{status:400})}const localAuthEnabled=process.env.AUTH_MODE!=='oidc'&&process.env.BOOTSTRAP_ACKNOWLEDGEMENT==='create-initial-admin';const localUser=localAuthEnabled?await localAuth.session(localAuth.requestToken(request)):null;const principal=localUser?{...localUser,name:localUser.email||localUser.subject}:undefined;let runtime:ReturnType<typeof createService>;try{runtime=getService();}catch{return NextResponse.json({error:'The wellness runtime is not configured. Contact an administrator.'},{status:503,headers:{'x-request-id':requestId}})}const result=await runtime({method:request.method,path:`wellness/${path.join('/')}`,headers:Object.fromEntries(request.headers.entries()),body,rawBody,principal});console.info(JSON.stringify({event:'wellness.request',requestId,method:request.method,route:path.join('/'),status:result.status,durationMs:Date.now()-started}));return NextResponse.json(result.body,{status:result.status,headers:{'x-request-id':requestId}});}export const GET=dispatch;export const POST=dispatch;
