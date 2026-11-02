/** Input admission stops first; protocol observers survive until Home release. */
export interface InboundPort{
  seal():void;
  drain():Promise<void>;
  dispose():Promise<void>;
}
