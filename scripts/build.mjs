import { build } from 'esbuild';
import { WorkspaceAnalyzer, FaceModelEmitter, writeWorkspaceArtifacts } from '@deepseek-ai/dsh-typert-generator';
import { mkdir, writeFile, cp, readdir } from 'node:fs/promises';
const root = new URL('..', import.meta.url).pathname;
const out = new URL('../packages/companion/lib/', import.meta.url).pathname;
await mkdir(out, {recursive:true});
// Register the unmodified published SDK declarations for the official analyzer.
const sdk = root + 'packages/.sdk-protocol';
await cp(root+'node_modules/@deepseek-ai/dsh-typert-protocol', sdk, {recursive:true});
await mkdir(sdk+'/src',{recursive:true});
for (const file of await readdir(sdk+'/lib/types')) { if (file.endsWith('.d.ts')) await cp(sdk+'/lib/types/'+file, sdk+'/src/'+file.replace('.d.ts','.ts')); }
await writeFile(sdk+'/tsconfig.json', JSON.stringify({compilerOptions:{module:'NodeNext',moduleResolution:'NodeNext',target:'ES2024',lib:['ESNext','DOM'],skipLibCheck:true,noEmit:true,allowImportingTsExtensions:true},include:['src/**/*.ts']}));
await build({ entryPoints:['packages/companion/src/index.ts'], outdir:out, entryNames:'[name]', outbase:'packages/companion/src', bundle:true, platform:'node', format:'esm', target:'node24', packages:'external', external:['@deepseek-ai/*'], tsconfig:'packages/companion/tsconfig.json' });
await build({ entryPoints:['packages/companion/src/runtime/index.ts'], outfile:out+'runtime.js', bundle:true, platform:'node', format:'esm', target:'node24' });
await build({ entryPoints:['packages/companion/src/home/index.ts'], outfile:out+'home.js', bundle:true, platform:'node', format:'esm', target:'node24' });
await build({ entryPoints:['packages/companion/src/adapters/local-files.ts'], outfile:out+'files.js', bundle:true, platform:'node', format:'esm', target:'node24' });
const model = new WorkspaceAnalyzer({root, packages:['dsh-role-companion'], faces:['host']}).analyze();
const artifact = new FaceModelEmitter(model.faces[0]).emit('dsh-role-companion');
writeWorkspaceArtifacts(root, [{...artifact,packageRoot:'packages/companion'}]);
await build({entryPoints:['packages/companion/src/client/index.tsx'],outfile:out+'client.cjs',bundle:true,platform:'browser',format:'cjs',target:'es2022',external:['react','react/jsx-runtime','zod'],jsx:'automatic'});
const { readFile, rm } = await import('node:fs/promises');
const client = await readFile(out+'client.cjs','utf8');
await writeFile(out+'client.js',`window.__ModuleLoader__.load({id: "dsh-role-companion", factory: (require) => { const module = {exports:{}}; const exports = module.exports;\n${client}\nreturn module.exports;\n} });\n`);
await rm(out+'client.cjs');
