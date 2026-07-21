import{NextResponse}from'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{loadConfig}=require('@/governance/config.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const{getPool}=require('@/governance/db.cjs');export async function GET(){try{const c=loadConfig();await getPool(c).query('SELECT 1');return NextResponse.json({ok:true,service:'governed-wellness',database:'reachable'});}catch{return NextResponse.json({ok:false},{status:503});}}
