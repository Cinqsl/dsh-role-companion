import type {Context} from '@deepseek-ai/cordis';
/** PresetTree is independent from the profile tree; only public entry/tree metadata is traversed. */
export function fileSourceEntries(ctx:Context){
    const entries=new Set([...ctx.loader.entries()]);
    const trees=new Set([...entries].map(entry=>entry.parent.tree));
    for(const runtime of ctx.root.registry.values())for(const fiber of runtime.fibers){const entry=fiber.entry;if(entry){entries.add(entry);trees.add(entry.parent.tree);}}
    for(const tree of trees)for(const entry of tree.entries()){entries.add(entry);trees.add(entry.parent.tree);}
    return [...entries];
}
