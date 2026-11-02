import {HomeError} from '../home/errors.ts';
import type {ContextSnapshotReader,ContextSourceMetadata} from '../home/context-snapshot.ts';
import type {
    LibrarySourceAvailability,
    LibrarySourceCompleteness,
    LibrarySourceKind,
    LibrarySourceMetadata,
    LibrarySourcePage,
    LibrarySourceQuery,
    LibrarySourceSort,
    LibrarySourceSummary,
    NormalizedLibrarySourceQuery,
} from '../types.library.sources.ts';
import {boundedPreview} from './library-preview.ts';
import {librarySourceTime} from './library-source-time.ts';

const sourceKinds:readonly LibrarySourceKind[]=['core','input','reply'];
const completenessValues:readonly LibrarySourceCompleteness[]=['all','complete','gap'];
const availabilityValues:readonly LibrarySourceAvailability[]=['all','daily','archive'];
const sortValues:readonly LibrarySourceSort[]=['newest','oldest'];

function invalid():never {
    throw new HomeError('INVALID_LIBRARY_SOURCE_QUERY');
}

function plainObject(value:unknown):boolean {
    return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
}

function normalizedSpace(value:string):string {
    return value.replace(/\s+/gu,' ').trim();
}

function canonicalTime(value:unknown):string|null {
    if(value===undefined||value===null||value==='')return null;
    if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return invalid();
    return new Date(value).toISOString();
}

function normalizeQuery(value:LibrarySourceQuery):{
    readonly query:NormalizedLibrarySourceQuery;
    readonly offset:number;
    readonly limit:number;
    readonly filterKey:string;
} {
    if(!plainObject(value))return invalid();
    const allowed=['availability','completeness','from','keyword','limit','offset','sort','to','types'];
    if(Object.keys(value).some(key=>!allowed.includes(key)))return invalid();
    const offset=value.offset??0,limit=value.limit??20;
    if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit!==20&&limit!==50)return invalid();
    const keyword=typeof value.keyword==='string'?normalizedSpace(value.keyword):value.keyword===undefined?'':invalid();
    if(Array.from(keyword).length>200)return invalid();
    const requestedTypes=value.types===undefined?sourceKinds:value.types;
    if(!Array.isArray(requestedTypes)||!requestedTypes.length||requestedTypes.some(type=>!sourceKinds.includes(type)))return invalid();
    const types=sourceKinds.filter(type=>requestedTypes.includes(type));
    if(new Set(requestedTypes).size!==requestedTypes.length)return invalid();
    const completeness=value.completeness??'all',availability=value.availability??'all',sort=value.sort??'newest';
    if(!completenessValues.includes(completeness)||!availabilityValues.includes(availability)||!sortValues.includes(sort))return invalid();
    const from=canonicalTime(value.from),to=canonicalTime(value.to);
    if(from&&to&&Date.parse(from)>Date.parse(to))return invalid();
    const query:NormalizedLibrarySourceQuery={keyword,types,completeness,availability,from,to,sort};
    return {query,offset,limit,filterKey:JSON.stringify(query)};
}

function sourceKey(source:ContextSourceMetadata,kind:LibrarySourceKind):string {
    return kind==='core'?'core':kind+':'+String((source.ref as {readonly id:string}).id);
}

function matchesTime(source:ContextSourceMetadata,kind:LibrarySourceKind,query:NormalizedLibrarySourceQuery):boolean {
    if(kind==='core')return true;
    const occurredAt=librarySourceTime(source);
    if(!occurredAt||!Number.isFinite(Date.parse(occurredAt)))return false;
    const time=Date.parse(occurredAt);
    return (!query.from||time>=Date.parse(query.from))&&(!query.to||time<=Date.parse(query.to));
}

function compare(left:LibrarySourceSummary,right:LibrarySourceSummary,order:LibrarySourceSort):number {
    const leftKind=left.source.ref.kind,rightKind=right.source.ref.kind;
    if(leftKind==='core'||rightKind==='core')return leftKind===rightKind?0:leftKind==='core'?-1:1;
    const timeDifference=(Date.parse(left.occurredAt!)||0)-(Date.parse(right.occurredAt!)||0);
    if(timeDifference)return order==='newest'?-timeDifference:timeDifference;
    return sourceKey(left.source,leftKind).localeCompare(sourceKey(right.source,rightKind));
}

/**
 * Project a bounded management list from one fixed ContextSnapshotReader.
 * Search and filtering happen before pagination over every readable source kind.
 */
export async function readLibrarySources(reader:ContextSnapshotReader,request:LibrarySourceQuery):Promise<LibrarySourcePage> {
    if(reader.purpose!=='management')throw new HomeError('INVALID_CONTEXT_PURPOSE');
    const {query,offset,limit,filterKey}=normalizeQuery(request);
    const dataset=(await reader.list()).filter(source=>sourceKinds.includes(source.ref.kind as LibrarySourceKind));
    const candidates:LibrarySourceSummary[]=[];
    for(const source of dataset){
        const kind=source.ref.kind as LibrarySourceKind;
        if(!query.types.includes(kind))continue;
        let body='';
        try {
            body=(await reader.read(source.ref)).text;
        } catch(error) {
            if(!error||typeof error!=='object'||!('code'in error)||error.code!=='CONTEXT_SOURCE_CLEANED')throw error;
        }
        const searchable=normalizedSpace(body).toLocaleLowerCase();
        if(query.keyword&&!searchable.includes(query.keyword.toLocaleLowerCase()))continue;
        if(query.completeness!=='all'&&source.completeness!==query.completeness)continue;
        if(query.availability==='daily'&&!source.availableForDaily||query.availability==='archive'&&source.availableForDaily)continue;
        if(!matchesTime(source,kind,query))continue;
        candidates.push({source:source as LibrarySourceMetadata,preview:boundedPreview(body),occurredAt:librarySourceTime(source)});
    }
    candidates.sort((left,right)=>compare(left,right,query.sort));
    const sources=candidates.slice(offset,offset+limit),total=candidates.length,end=Math.min(offset+sources.length,total);
    return {
        basis:reader.basis,
        purpose:'management',
        revision:reader.basis.revision,
        query,
        filterKey,
        sources,
        offset,
        limit,
        total,
        datasetTotal:dataset.length,
        rangeStart:sources.length?offset+1:0,
        rangeEnd:end,
        more:offset+sources.length<total,
        nextOffset:offset+sources.length<total?offset+sources.length:null,
    };
}
