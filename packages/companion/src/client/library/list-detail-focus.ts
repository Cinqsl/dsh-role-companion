import {useEffect,useRef,useState} from 'react';

interface DetailOrigin {
  readonly key:string;
  readonly listScroll:number;
  readonly windowScroll:number;
}

export function useListDetailFocus<Element extends HTMLElement = HTMLDivElement>({
  open,
  focusKey,
  returnAttribute,
  revealOnNarrow=false,
}:{
  readonly open:boolean;
  readonly focusKey:string;
  readonly returnAttribute:string;
  readonly revealOnNarrow?:boolean;
}) {
  const listRef=useRef<Element|null>(null);
  const detailHeadingRef=useRef<HTMLHeadingElement|null>(null);
  const origin=useRef<DetailOrigin|null>(null);
  const [returnFocusKey,setReturnFocusKey]=useState('');

  useEffect(()=>{
    if(!open||!focusKey||typeof requestAnimationFrame!=='function')return;
    const frame=requestAnimationFrame(()=>{
      detailHeadingRef.current?.focus();
      if(revealOnNarrow&&typeof window!=='undefined'&&window.innerWidth<=760){
        detailHeadingRef.current?.scrollIntoView({block:'start'});
      }
    });
    return()=>cancelAnimationFrame(frame);
  },[focusKey,open,revealOnNarrow]);

  useEffect(()=>{
    if(open||!returnFocusKey||typeof requestAnimationFrame!=='function')return;
    const position=origin.current,key=returnFocusKey;
    const frame=requestAnimationFrame(()=>{
      if(listRef.current&&position?.key===key)listRef.current.scrollTop=position.listScroll;
      if(position?.key===key&&typeof window!=='undefined'&&typeof window.scrollTo==='function'){
        window.scrollTo(0,position.windowScroll);
      }
      const button=[...(listRef.current?.querySelectorAll<HTMLButtonElement>(`button[${returnAttribute}]`)??[])]
        .find(candidate=>candidate.getAttribute(returnAttribute)===key);
      button?.parentElement?.scrollIntoView({block:'nearest'});
      button?.focus({preventScroll:true});
      setReturnFocusKey('');
    });
    return()=>cancelAnimationFrame(frame);
  },[open,returnFocusKey,returnAttribute]);

  function captureOrigin(key:string):void {
    origin.current={
      key,
      listScroll:listRef.current?.scrollTop??0,
      windowScroll:typeof window!=='undefined'&&typeof window.scrollY==='number'?window.scrollY:0,
    };
    setReturnFocusKey('');
  }

  function rememberReturnFocus(key:string):void {
    setReturnFocusKey(key);
  }

  return {
    listRef,
    detailHeadingRef,
    captureOrigin,
    rememberReturnFocus,
  };
}
