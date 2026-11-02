import {createHash} from 'node:crypto';
/** Content stamp only. Home facts and source qualification remain the authority. */
export const contextTextDigest=(text:string):string=>createHash('sha256').update(text,'utf8').digest('hex');
