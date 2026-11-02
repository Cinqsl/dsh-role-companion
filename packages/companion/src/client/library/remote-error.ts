export interface ClientRemoteError {
  readonly code:string;
  readonly details?:unknown;
}

export function remoteErrorReason(error:ClientRemoteError):string {
  return error.details&&typeof error.details==='object'&&'reason'in error.details
    ?String(error.details.reason)
    :error.code;
}
