// Delete all the worker process:
//  node -e "import('./src/queue/researchQueue.js').then(m => m.researchQueue.obliterate({ force: true })).then(() => { console.log('Queue obliterated.'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); })"
