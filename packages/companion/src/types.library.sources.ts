import type {HomeRevision} from './home/ids.ts';
import type {ContextSnapshotBasis,ContextSourceMetadata} from './home/context-snapshot.ts';

export type LibrarySourceKind='core'|'input'|'reply';
export type LibrarySourceSort='newest'|'oldest';
export type LibrarySourceCompleteness='all'|'complete'|'gap';
export type LibrarySourceAvailability='all'|'daily'|'archive';

export interface LibrarySourceQuery {
    readonly offset?:number;
    readonly limit?:number;
    readonly keyword?:string;
    readonly types?:readonly LibrarySourceKind[];
    readonly completeness?:LibrarySourceCompleteness;
    readonly availability?:LibrarySourceAvailability;
    readonly from?:string|null;
    readonly to?:string|null;
    readonly sort?:LibrarySourceSort;
}

export interface NormalizedLibrarySourceQuery {
    readonly keyword:string;
    readonly types:readonly LibrarySourceKind[];
    readonly completeness:LibrarySourceCompleteness;
    readonly availability:LibrarySourceAvailability;
    readonly from:string|null;
    readonly to:string|null;
    readonly sort:LibrarySourceSort;
}

export type LibrarySourceMetadata =
    |Extract<ContextSourceMetadata,{readonly ref:{readonly kind:'core'}}>
    |Extract<ContextSourceMetadata,{readonly ref:{readonly kind:'input'}}>
    |Extract<ContextSourceMetadata,{readonly ref:{readonly kind:'reply'}}>;

export interface LibrarySourceSummary {
    readonly source:LibrarySourceMetadata;
    /** Management-only display text; never persisted or projected to model context. */
    readonly preview:string;
    readonly occurredAt:string|null;
}

export interface LibrarySourcePage {
    readonly basis:ContextSnapshotBasis;
    readonly purpose:'management';
    readonly revision:HomeRevision;
    readonly query:NormalizedLibrarySourceQuery;
    readonly filterKey:string;
    readonly sources:readonly LibrarySourceSummary[];
    readonly offset:number;
    readonly limit:number;
    readonly total:number;
    readonly datasetTotal:number;
    readonly rangeStart:number;
    readonly rangeEnd:number;
    readonly more:boolean;
    readonly nextOffset:number|null;
}
