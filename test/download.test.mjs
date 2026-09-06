import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {downloadRelease,validateRelease,verifyArchive} from '../download.mjs';
test('requires pinned versions and integrity',()=>{
  assert.throws(()=>validateRelease('main','a'.repeat(64)));
  assert.throws(()=>validateRelease('1.0.0','bad'));
  assert.throws(()=>verifyArchive(Buffer.from('tampered'),'a'.repeat(64)));
});
test('redirected asset request never receives private credentials',async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'reader-download-'));
  try {
    const bytes=Buffer.from('test release'); let calls=0;
    const fetcher=async(url,options)=>{
      calls++;
      if(calls===1) {assert.match(options.headers.Authorization,/Bearer/);return Response.json({assets:[{id:123,name:'ckurdu-course-reader-1.0.0.tgz'}]});}
      if(calls===2)return new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/example'}});
      assert.equal(options.headers,undefined);return new Response(bytes);
    };
    const file=await downloadRelease({version:'1.0.0',sha256:createHash('sha256').update(bytes).digest('hex'),token:'test',directory,fetcher});
    assert.deepEqual(await readFile(file),bytes);
  }finally{await rm(directory,{recursive:true,force:true});}
});
