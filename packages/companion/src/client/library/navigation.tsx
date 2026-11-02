import {useRef} from 'react';
import type {RoleLibraryView} from './types.ts';

export const libraryViews:readonly {readonly id:RoleLibraryView;readonly label:string}[]=[
    {id:'overview',label:'概览'},
    {id:'sources',label:'来源'},
    {id:'knowledge',label:'知识'},
    {id:'executions',label:'执行记录'},
    {id:'maintenance',label:'维护'},
];

export function RoleLibraryNavigation({activeView,onSelect}:{
    readonly activeView:RoleLibraryView;
    readonly onSelect:(view:RoleLibraryView)=>void;
}) {
    const menu=useRef<HTMLDetailsElement|null>(null);
    const activeLabel=libraryViews.find(item=>item.id===activeView)?.label??'概览';
    const select=(view:RoleLibraryView)=>{
        if(menu.current)menu.current.open=false;
        onSelect(view);
    };
    return <nav className="rcLibraryNav" aria-label="资料库一级视图">
      <div className="rcLibraryFullNav">
        {libraryViews.map(item=><button key={item.id} type="button" aria-current={activeView===item.id?'page':undefined} onClick={()=>select(item.id)}>{item.label}</button>)}
      </div>
      <details className="rcLibraryMenu" ref={menu}>
        <summary><span>当前分类</span><strong>{activeLabel}</strong></summary>
        <div className="rcLibraryMenuOptions">
          {libraryViews.map(item=><button key={item.id} type="button" aria-current={activeView===item.id?'page':undefined} onClick={()=>select(item.id)}>{item.label}</button>)}
        </div>
      </details>
    </nav>;
}
