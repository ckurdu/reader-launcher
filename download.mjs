import { createHash } from 'node:crypto';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

export function validateRelease(version, sha256) {
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected an explicit x.y.z release');
  if(!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Expected a pinned SHA-256 digest');
}
export function verifyArchive(bytes, sha256) {
  if(createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('Release checksum mismatch');
}
export async function downloadRelease({version,sha256,directory='vendor',token=process.env.READER_GITHUB_TOKEN,fetcher=fetch}) {
  validateRelease(version,sha256);
  if(!token) throw new Error('READER_GITHUB_TOKEN is required for private release downloads');
  const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const release=await fetcher(`https://api.github.com/repos/ckurdu/course-reader/releases/tags/v${version}`,{headers,signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!release.ok) throw new Error(`GitHub release lookup failed (${release.status})`);
  const metadata=await release.json();
  const filename=`ckurdu-course-reader-${version}.tgz`;
  const asset=metadata.assets?.find(a=>a.name===filename);
  if(!asset || !Number.isSafeInteger(asset.id)) throw new Error('Release package missing');
  let response=await fetcher(`https://api.github.com/repos/ckurdu/course-reader/releases/assets/${asset.id}`,{headers:{...headers,Accept:'application/octet-stream'},redirect:'manual',signal:AbortSignal.timeout(30000)});
  if([301,302,303,307,308].includes(response.status)) {
    const url=new URL(response.headers.get('location'));
    if(url.protocol!=='https:' || !(url.hostname.endsWith('.githubusercontent.com') || url.hostname==='release-assets.githubusercontent.com')) throw new Error('Unexpected release redirect');
    // Signed download URLs carry their own authorization. Never forward the GitHub token.
    response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
  }
  if(!response.ok) throw new Error(`GitHub asset download failed (${response.status})`);
  const chunks=[]; let size=0;
  for await(const chunk of response.body) {
    size+=chunk.length;
    if(size>30*1024*1024) throw new Error('Release package exceeds 30 MiB');
    chunks.push(chunk);
  }
  const bytes=Buffer.concat(chunks); verifyArchive(bytes,sha256);
  await mkdir(directory,{recursive:true});
  const target=path.resolve(directory,filename), temporary=`${target}.${process.pid}.tmp`;
  await writeFile(temporary,bytes,{mode:0o600}); await rename(temporary,target);
  return target;
}
