import {realpath,readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import type {ProfileContext,RuntimeResolution} from '@deepseek-ai/dsh-app-boot';
import {cliConfigurationPaths} from '../host/file-source-checkpoint.ts';
import {FileActionError} from '../actions/files.ts';
export interface FileLaunchSources {readonly kind:'official-cli'|'official-desktop';readonly entryFile:string;readonly configurationPaths:readonly string[];check():void;}
const unproven=():never=>{throw new FileActionError('FILE_PROTECTION_UNPROVEN');};
/** Original launcher facts, not ProfileContext.overlays or model-supplied flags. */
export async function inspectFileLaunchSources(profile:ProfileContext,resolution:RuntimeResolution):Promise<FileLaunchSources>{
    const cwd=process.cwd(),script=process.argv[1];if(cwd!==profile.cwd||!script)unproven();const entry=await realpath(script);const cli=resolution.entries.filter(x=>x.name==='@deepseek-ai/dsh');if(cli.length!==1)unproven();const expectedCli=await realpath(join(cli[0]!.packageDir,'lib/bin.js'));
    let kind:FileLaunchSources['kind'],configurationPaths:string[]=[];
    if(entry===expectedCli){
        kind='official-cli';configurationPaths=cliConfigurationPaths(cwd);
    }else{
        const runtime=process.argv[2],project=process.argv[3];if(!runtime||!project||profile.name!=='desktop'||resolve(project)!==resolve(profile.dir)||resolve(profile.installAnchor)!==resolve(runtime,'node_modules/@deepseek-ai/dsh/package.json'))unproven();
        const expected=join(runtime,'node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js');if(entry!==await realpath(expected))unproven();const metadata:unknown=JSON.parse(await readFile(join(dirname(dirname(expected)),'package.json'),'utf8'));if(!metadata||typeof metadata!=='object'||!('name'in metadata)||metadata.name!=='@deepseek-ai/dsh-desktop-host'||!('version'in metadata)||metadata.version!=='0.2.1-rc.3')unproven();
        // Official desktop-host/src/index.ts passes patchFiles:[]; no arbitrary embedding inherits this claim.
        kind='official-desktop';configurationPaths=[];
    }
    const sourceScript=process.argv[1],runtime=kind==='official-desktop'?process.argv[2]:undefined,project=kind==='official-desktop'?process.argv[3]:undefined;
    return Object.freeze({kind,entryFile:entry,configurationPaths:Object.freeze(configurationPaths),check(){if(process.cwd()!==cwd||process.argv[1]!==sourceScript||kind==='official-cli'&&JSON.stringify(cliConfigurationPaths(cwd))!==JSON.stringify(configurationPaths)||kind==='official-desktop'&&(process.argv[2]!==runtime||process.argv[3]!==project))throw new FileActionError('STALE_FILE_PROTECTION');}});
}
