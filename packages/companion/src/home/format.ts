import {HomeError} from './errors.ts';
import type {RoleId} from './ids.ts';
import type {StorageGenerationPointer} from './storage-generation.ts';

/** A Home format is a pair of plain integers; it never carries a path or a capability. */
export interface HomeFormat {readonly major:number;readonly minor:number;}
/**
 * The only format relations this build understands. `1.0` is the root-inline authority;
 * `2.0` is the same authority re-homed inside a storage generation. Every other pair is
 * opened read-only instead of being guessed, upgraded or downgraded.
 */
export const HOME_FORMATS=Object.freeze([
    Object.freeze({major:1,minor:0,layout:'root-inline' as const}),
    Object.freeze({major:2,minor:0,layout:'generation' as const}),
] as const);
export const HOME_CURRENT_FORMAT:HomeFormat=Object.freeze({major:1,minor:0});
export const HOME_UPGRADE_TARGET:HomeFormat=Object.freeze({major:2,minor:0});
export type HomeLayout='root-inline'|'storage-generation';
export const sameFormat=(a:HomeFormat,b:HomeFormat)=>a.major===b.major&&a.minor===b.minor;
export const formatText=(value:HomeFormat)=>value.major+'.'+value.minor;
export const plainFormat=(value:HomeFormat):{readonly major:number;readonly minor:number}=>({major:value.major,minor:value.minor});
function fail(code:string):never{throw new HomeError(code);}
const pair=(value:unknown):HomeFormat=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('UNKNOWN_FORMAT');
    const raw=value as {major?:unknown;minor?:unknown};
    if(typeof raw.major!=='number'||typeof raw.minor!=='number'||!Number.isSafeInteger(raw.major)||!Number.isSafeInteger(raw.minor)||raw.major<0||raw.minor<0)fail('UNKNOWN_FORMAT');
    return {major:raw.major,minor:raw.minor};
};
export const knownFormat=(value:HomeFormat)=>HOME_FORMATS.some(format=>format.major===value.major&&format.minor===value.minor);
/** Every declared format names the content shape; the layout names where that content lives. */
export const formatLayout=(value:HomeFormat):HomeLayout=>value.major===2?'storage-generation':'root-inline';
/**
 * The root `identity.json` may only declare the root-inline layout. A pair this build knows
 * but cannot host as a root layout is a missing authority, not a corrupt identity.
 */
export function admitRootFormat(value:unknown):HomeFormat{
    const format=pair(value);
    if(format.major===1&&format.minor===0)return HOME_CURRENT_FORMAT;
    if(HOME_FORMATS.some(known=>known.major===format.major))fail('FORMAT_AUTHORITY_MISSING');
    fail('UNKNOWN_FORMAT');
}
/** A head declares the content format it holds; only known pairs may be replayed. */
export function admitHeadFormat(value:unknown):HomeFormat{
    const format=pair(value);
    if(!knownFormat(format))fail('UNKNOWN_FORMAT');
    return format;
}
/** The root identity is frozen at creation; only `1.0` may be written by `createRoleHome`. */
export const ROOT_IDENTITY_FORMAT=HOME_CURRENT_FORMAT;
/** A serialized `{major,minor}` body used by heads and generators. */
export const formatBody=(value:HomeFormat)=>Object.freeze({major:value.major,minor:value.minor});
export interface FormatUpgradeTarget {readonly to?:HomeFormat;readonly available:boolean;readonly reason:string;}
/** Home-owned facts a panel projects; no path or execution grant is included. */
export interface FormatStatus {
    readonly roleId:RoleId;
    readonly identity:HomeFormat;
    readonly format:HomeFormat;
    readonly layout:HomeLayout;
    readonly generation?:StorageGenerationPointer;
    readonly upgrade:FormatUpgradeTarget;
}
