import type {ContextSourceMetadata} from '../home/context-snapshot.ts';

const normalizedSpace=(value:string):string=>value.replace(/\s+/gu,' ').trim();

export function librarySourceTime(source:ContextSourceMetadata):string|null {
  const kind=source.ref.kind;
  switch(kind){
    case 'core':
    case 'knowledge':
      return null;
    case 'input': {
      const input=source as Extract<ContextSourceMetadata,{readonly ref:{readonly kind:'input'}}>;
      return input.origin==='history'
        ?normalizedSpace(input.reportedAt??input.occurredAt)
        :input.occurredAt;
    }
    case 'reply':
    case 'tool': {
      const timed=source as Extract<ContextSourceMetadata,{readonly ref:{readonly kind:'reply'|'tool'}}>;
      return timed.occurredAt;
    }
    default:{
      const unreachable:never=kind;
      return unreachable;
    }
  }
}
