import { openSync, writeSync, closeSync, fsyncSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Raw-byte sink for a possible SSH stdout transport. No networking or execution.
// Reject before writing any chunk that would cross the bound; keep partial file.
export function cappedSink(path, maxBytes) {
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>12122)throw new Error('invalid_cap');
  const fd=openSync(path,'wx');let bytes=0,closed=false,failed=false;
  const hash=createHash('sha256');
  return {
    accept(chunk){
      if(closed||failed)throw new Error('sink_not_writable');
      if(!Buffer.isBuffer(chunk)||chunk.length>maxBytes-bytes){failed=true;throw new Error('byte_cap_exceeded');}
      let offset=0;
      try{while(offset<chunk.length){const n=writeSync(fd,chunk,offset,chunk.length-offset);if(n<=0)throw new Error('short_write');offset+=n;bytes+=n;}}
      catch(e){failed=true;throw e;}
      hash.update(chunk);
    },
    finish(){
      if(closed)throw new Error('sink_closed');
      try{fsyncSync(fd);}finally{closed=true;closeSync(fd);}
      if(failed||bytes!==maxBytes)throw new Error('incomplete_or_failed_stream');
      return {bytes,sha256:hash.digest('hex')};
    },
    closePartial(){if(!closed){closed=true;closeSync(fd);}},
  };
}
