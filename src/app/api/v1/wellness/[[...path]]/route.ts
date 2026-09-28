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
let service:ReturnType<typeof createService>;function getService(){if(!service){const c=loadConfig();service=createService({config:c,pool:getPool(c),providers:createProviders(c)});}return service;}
async function dispatch(request:Request,context:{params:Promise<{path?:string[]}>}){const started=Date.now(),requestId=crypto.randomUUID(),{path=[]}=await context.params,rawBody=['POST','PATCH','PUT'].includes(request.method)?await request.text():'';let body={};if(rawBody)try{body=JSON.parse(rawBody)}catch{return NextResponse.json({error:'Request body must be valid JSON'},{status:400})}const localAuthEnabled=process.env.AUTH_MODE!=='oidc'&&process.env.BOOTSTRAP_ACKNOWLEDGEMENT==='create-initial-admin';const localUser=localAuthEnabled?await localAuth.session(localAuth.requestToken(request)):null;const principal=localUser?{...localUser,name:localUser.email||localUser.subject}:undefined;const result=await getService()({method:request.method,path:`wellness/${path.join('/')}`,headers:Object.fromEntries(request.headers.entries()),body,rawBody,principal});console.info(JSON.stringify({event:'wellness.request',requestId,method:request.method,route:path.join('/'),status:result.status,durationMs:Date.now()-started}));return NextResponse.json(result.body,{status:result.status,headers:{'x-request-id':requestId}});}export const GET=dispatch;export const POST=dispatch;
