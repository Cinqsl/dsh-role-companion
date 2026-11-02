import {validateRestoreRequest,type RestoreRequest} from '../home/restores.ts';
import {ProfileSelectionVersion} from '../host-contracts.ts';
import {HomeError} from '../home/errors.ts';
/** A local operation locator only. It cannot make a copied Home executable. */
export interface RestoreProfilePointer extends RestoreRequest {readonly requestedProfileVersion:ProfileSelectionVersion;}
export const emptyRestoreProfile={operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0} as const;
export function readRestoreProfile(value:unknown):RestoreProfilePointer|undefined{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!Object.hasOwn(emptyRestoreProfile,key))||Reflect.ownKeys(value).length!==6)throw new HomeError('INVALID_RESTORE_PROFILE');
    const field=(key:string)=>Object.getOwnPropertyDescriptor(value,key)?.value;
    if(field('operationId')===''){if(Object.entries(emptyRestoreProfile).some(([key,expected])=>field(key)!==expected))throw new HomeError('INVALID_RESTORE_PROFILE');return undefined;}
    const request={operationId:field('operationId'),backupPath:field('backupPath'),destination:field('destination'),expectedRoleId:field('expectedRoleId'),expectedManifestDigest:field('expectedManifestDigest')};
    if(!validateRestoreRequest(request))throw new HomeError('INVALID_RESTORE_PROFILE');return {...request,requestedProfileVersion:ProfileSelectionVersion(field('requestedProfileVersion'))};
}
