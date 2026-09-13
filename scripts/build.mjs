import {cp, mkdir, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'build');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (base && !/^\/[a-zA-Z0-9._-]+$/.test(base)) throw new Error('Invalid BASE_PATH');
let canonical = process.env.CANONICAL_ORIGIN || '';
if (canonical) {
 const u = new URL(canonical);
 if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash || u.username || u.password) throw new Error('Use an HTTPS origin for CANONICAL_ORIGIN');
 canonical = u.origin;
}
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
await cp(path.join(root,'dist'), output, {recursive:true});
const routes=[];
async function walk(dir) {
 for (const item of await readdir(dir,{withFileTypes:true})) {
  const file=path.join(dir,item.name);
  if(item.isDirectory()){await walk(file);continue;}
  if(!item.name.endsWith('.html'))continue;
  let html=await readFile(file,'utf8');
  // Prefix root-relative URLs for GitHub project Pages; leave external URLs and fragments intact.
  html=html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g,(_,attr,value)=>`${attr}="${base}/${value}"`);
  const route='/'+path.relative(output,file).split(path.sep).join('/').replace(/index\.html$/,'');
  routes.push(route);
  if(canonical) html=html.replace('</head>',`<link rel="canonical" href="${canonical}${route}">\n</head>`);
  await writeFile(file,html);
 }
}
await walk(output);
await writeFile(path.join(output,'.nojekyll'),'');
if(canonical){
 await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${canonical}${r}</loc></url>`).join('')}</urlset>`);
 await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${canonical}/sitemap.xml\n`);
}
console.log(`Built ${routes.length} pages, base=${base||'/'}; canonical=${canonical||'pending live main-site URL'}`);
