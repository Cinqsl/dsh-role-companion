/** Host selection changes independently of every Home revision and rules version. */
declare const selectionVersion: unique symbol;
export type ProfileSelectionVersion = number & { readonly [selectionVersion]: 'RoleCompanion.ProfileSelectionVersion' };
export function ProfileSelectionVersion(value: unknown): ProfileSelectionVersion {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw Object.assign(new Error('INVALID_PROFILE_VERSION'), {code:'INVALID_PROFILE_VERSION'});
    return value as ProfileSelectionVersion;
}
export type QQProfileVersion=number&{readonly[selectionVersion]:'RoleCompanion.QQProfileVersion'};
export function QQProfileVersion(value:unknown):QQProfileVersion{
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw Object.assign(new Error('INVALID_QQ_PROFILE_VERSION'),{code:'INVALID_QQ_PROFILE_VERSION'});
    return value as QQProfileVersion;
}
/** Machine-local file bindings advance independently of portable Home permissions. */
export type FileMappingVersion=number&{readonly[selectionVersion]:'RoleCompanion.FileMappingVersion'};
export function FileMappingVersion(value:unknown):FileMappingVersion{
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw Object.assign(new Error('INVALID_FILE_MAPPING_VERSION'),{code:'INVALID_FILE_MAPPING_VERSION'});
    return value as FileMappingVersion;
}
