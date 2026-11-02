export function boundedPreview(text:string,max=160,fallback=''):string {
  const normalized=text.replace(/\s+/gu,' ').trim();
  return Array.from(normalized).slice(0,max).join('')||fallback;
}
