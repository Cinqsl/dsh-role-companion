/** Home owns classification. This metadata grants no filesystem permission. */
export const ordinaryHomeRoots=Object.freeze(['works','journal']);
export const protectedHomeEntries=Object.freeze(['identity.json','head.json','commits','blobs','views','projection-progress','content-generations','.format-upgrade','.restore','.maintenance','.maintenance.lock','writer.lock','.autonomy-schedule.json']);
export const retainedHomeEntries=Object.freeze(['identity.json','head.json','commits','blobs','views','projection-progress','content-generations','.format-upgrade','.autonomy-schedule.json',...ordinaryHomeRoots]);
export const temporaryHomeRootPrefixes=Object.freeze(['.identity.json.','.head.','.head.json.','.writer.lock.','..maintenance.lock.','.takeover-','.autonomy-schedule.json.']);
/** Trusted Host metadata only. Unknown Home areas remain protected by default. */
export interface HomeFileLayout {
    readonly root:string;
    readonly protectedRelativePaths:readonly string[];
    readonly ordinaryRelativeRoots:readonly string[];
    readonly temporaryRootNamePrefixes:readonly string[];
}
