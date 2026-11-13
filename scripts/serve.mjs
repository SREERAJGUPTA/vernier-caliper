import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.STATIC_DIRECTORY??'dist');
const port=Number(process.env.PORT??4173);
const base='/vernier-caliper/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.map':'application/json','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url??'/',`http://localhost:${port}`);
  if(url.pathname==='/'||url.pathname===base.slice(0,-1)){res.writeHead(302,{Location:base});res.end();return;}
  if(!url.pathname.startsWith(base)){res.writeHead(404);res.end('Serve this build at /vernier-caliper/.');return;}
  const relative=decodeURIComponent(url.pathname.slice(base.length))||'index.html';const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)&&file!==root)throw new Error('Forbidden');
  const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','Service-Worker-Allowed':base});res.end(bytes);
}catch{res.writeHead(404);res.end('Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`Precision Lab: http://127.0.0.1:${port}${base}`));
