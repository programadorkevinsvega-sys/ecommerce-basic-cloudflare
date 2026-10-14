const ALLOWED=new Set(['p','h2','h3','h4','ul','ol','li','blockquote','strong','b','em','i','u','s','a','img','figure','figcaption','br','hr']);

export function sanitizeBlogHtml(input:string):string{
  const source=input.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style|iframe|object|svg|math|form|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  return source.replace(/<\/?([a-z0-9-]+)\b([^>]*)>/gi,(raw,tag:string,attrs:string)=>{
    const name=tag.toLowerCase();if(!ALLOWED.has(name))return '';
    const closing=raw.startsWith('</');if(closing)return ['img','br','hr'].includes(name)?'':`</${name}>`;
    const safe:string[]=[];
    if(name==='a'){
      const href=attribute(attrs,'href');if(href&&safeLink(href))safe.push(`href="${escapeAttr(href)}"`);
      const target=attribute(attrs,'target');if(target==='_blank')safe.push('target="_blank"','rel="noopener noreferrer"');
    }
    if(name==='img'){
      const src=attribute(attrs,'src');if(!src||!/^\/media\/[0-9a-f-]{36}$/i.test(src))return '';
      safe.push(`src="${escapeAttr(src)}"`);const alt=attribute(attrs,'alt');if(alt)safe.push(`alt="${escapeAttr(alt)}"`);safe.push('loading="lazy"');
    }
    return `<${name}${safe.length?` ${safe.join(' ')}`:''}${['img','br','hr'].includes(name)?' />':'>'}`;
  });
}

function attribute(source:string,name:string):string|undefined{const match=source.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'));return match?.[1]??match?.[2]??match?.[3];}
function safeLink(value:string):boolean{if(value.startsWith('/')&&value[1]!=='/'&&value[1]!=='\\')return true;if(!/^https:\/\//i.test(value))return false;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}}
function escapeAttr(value:string):string{return value.replace(/[&"<>]/g,(char)=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[char]||char));}
