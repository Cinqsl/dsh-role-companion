import type {OperationId} from './ids.ts';
export class HomeError extends Error {
    constructor(readonly code:string,message=code,readonly operationId?:OperationId){super(message);}
}
