import { readFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function loadConfig(root = process.cwd()) {
  return JSON.parse(await readFile(path.join(root, 'course.config.json'), 'utf8'));
}
export async function start(root = process.cwd()) {
  const { createApp } = await import('@ckurdu/course-reader');
  const config = await loadConfig(root);
  const app = createApp({config,siteDirectory:path.join(root,'protected-site')});
  const port=Number(process.env.PORT || 3000), host=process.env.HOST || '0.0.0.0';
  const server=app.listen(port,host,()=>console.log(`${config.title} listening on ${host}:${port}`));
  for(const signal of ['SIGTERM','SIGINT']) process.once(signal,()=>server.close(error=>process.exit(error?1:0)));
  return server;
}
export async function syncAssets(root = process.cwd()) {
  const entry=fileURLToPath(import.meta.resolve('@ckurdu/course-reader'));
  const packageRoot=path.dirname(path.dirname(entry));
  for(const relative of ['site/app','protected-site/app']) {
    const destination=path.join(root,relative);
    await mkdir(destination,{recursive:true});
    await cp(path.join(packageRoot,'app'),destination,{recursive:true});
  }
  for(const name of ['theme.scss','focus-mode.html']) {
    await cp(path.join(packageRoot,'quarto',name),path.join(root,'site',name));
  }
}
