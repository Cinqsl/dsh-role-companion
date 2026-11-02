export function createHookRuntime(leafTypes=[]) {
  const leaves=new Set(leafTypes);
  let stores=new Map();
  let currentKey='';
  let cursor=0;
  let effects=[];
  let dirty=false;
  let cleanups=new Map();
  const store=()=>{
    if(!stores.has(currentKey))stores.set(currentKey,[]);
    return stores.get(currentKey);
  };
  function useState(initial) {
    const index=cursor++,hooks=store();
    if(!(index in hooks))hooks[index]=typeof initial==='function'?initial():initial;
    return [hooks[index],value=>{
      const next=typeof value==='function'?value(hooks[index]):value;
      if(Object.is(next,hooks[index]))return;
      hooks[index]=next;
      dirty=true;
    }];
  }
  function useEffect(effect,dependencies) {
    const index=cursor++,hooks=store(),previous=hooks[index];
    const changed=!previous||!dependencies||!previous.dependencies
      ||dependencies.length!==previous.dependencies.length
      ||dependencies.some((value,position)=>!Object.is(value,previous.dependencies[position]));
    hooks[index]={dependencies,kind:'effect'};
    if(changed)effects.push({effect,index,key:currentKey});
  }
  function useRef(initial) {
    const index=cursor++,hooks=store();
    if(!(index in hooks))hooks[index]={current:initial};
    return hooks[index];
  }
  function renderNode(node,path) {
    if(node===null||node===undefined||typeof node==='boolean')return node;
    if(typeof node==='string'||typeof node==='number')return node;
    if(Array.isArray(node))return node.map((child,index)=>renderNode(child,`${path}.${index}`));
    if(typeof node.type==='function') {
      if(leaves.has(node.type.name))return node;
      const previousKey=currentKey;
      currentKey=`${path}:${node.type.name||'Anonymous'}`;
      cursor=0;
      const rendered=node.type(node.props);
      currentKey=previousKey;
      return renderNode(rendered,`${path}:${node.type.name||'Anonymous'}`);
    }
    if(typeof node.type==='symbol')return renderNode(node.props?.children,path);
    const props={...node.props};
    if('children'in props)props.children=renderNode(props.children,`${path}.children`);
    return {...node,props};
  }
  async function render(element) {
    let tree;
    do {
      dirty=false;
      effects=[];
      currentKey='root';
      cursor=0;
      tree=renderNode(element,'root');
      for(const descriptor of effects) {
        const cleanupKey=`${descriptor.key}:${descriptor.index}`;
        cleanups.get(cleanupKey)?.();
        const cleanup=descriptor.effect();
        if(typeof cleanup==='function')cleanups.set(cleanupKey,cleanup);
        else cleanups.delete(cleanupKey);
      }
      await new Promise(resolve=>setImmediate(resolve));
    } while(dirty);
    return tree;
  }
  function reset() {
    for(const cleanup of [...cleanups.values()].reverse())cleanup?.();
    stores=new Map();
    currentKey='';
    cursor=0;
    effects=[];
    dirty=false;
    cleanups=new Map();
  }
  return {exports:{useEffect,useRef,useState},render,reset};
}
