#!/usr/bin/env node
import { start, syncAssets } from './index.mjs';
import { downloadRelease } from './download.mjs';
import { spawnSync } from 'node:child_process';
const [command, version, sha256, directory] = process.argv.slice(2);
if(command==='start') await start();
else if(command==='sync-assets') await syncAssets();
else if(command==='download') console.log(await downloadRelease({version,sha256,directory}));
else if(command==='install') {
  const file=await downloadRelease({version,sha256,directory});
  const result=spawnSync('npm',['install','--save-exact','--ignore-scripts',file],{stdio:'inherit'});
  if(result.error || result.status!==0) throw new Error('npm installation failed');
}
else throw new Error('Usage: reader-launcher start | sync-assets | download/install VERSION SHA256 [DIRECTORY]');
