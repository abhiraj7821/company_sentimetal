abhishekrajput@Abhisheks-MacBook-Air backend % npm start

> company_sentimental_backend@1.0.0 start
> node src/server.js

◇ injected env (16) from .env // tip: ⌘ enable debugging { debug: true }
{"level":30,"time":1784965028307,"pid":74957,"hostname":"Abhisheks-MacBook-Air.local","redisUrlSet":true,"redisUrlHost":"127.0.0.1","msg":"Redis connection target"}
{"level":30,"time":1784965028358,"pid":74957,"hostname":"Abhisheks-MacBook-Air.local","msg":"SentinelSwarm API listening on port 3000"}
{"level":30,"time":1784965028372,"pid":74957,"hostname":"Abhisheks-MacBook-Air.local","msg":"Connected to Redis"}
^C
abhishekrajput@Abhisheks-MacBook-Air backend %

abhishekrajput@Abhisheks-MacBook-Air backend % npm worker
Unknown command: "worker"

Did you mean this?
npm run worker # run the "worker" package script
To see a list of supported npm commands, run:
npm help
abhishekrajput@Abhisheks-MacBook-Air backend % npm run worker

> company_sentimental_backend@1.0.0 worker
> node src/queue/worker.js

◇ injected env (16) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
{"level":30,"time":1784965094650,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","redisUrlSet":true,"redisUrlHost":"127.0.0.1","msg":"Redis connection target"}
{"level":30,"time":1784965095663,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Connected to Redis"}
{"level":30,"time":1784965095910,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Initializing Postgres checkpointer..."}
{"level":40,"time":1784965095966,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","err":{"type":"Error","message":"getaddrinfo ENOTFOUND base","stack":"Error: getaddrinfo ENOTFOUND base\n at /Users/abhishekrajput/Desktop/company_sentimetal/backend/node_modules/pg-pool/index.js:45:11\n at process.processTicksAndRejections (node:internal/process/task_queues:104:5)\n at async PostgresSaver.setup (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/node_modules/@langchain/langgraph-checkpoint-postgres/dist/index.js:90:18)\n at async getCheckpointer (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/graph/checkpointer.js:44:5)\n at async buildGraph (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/graph/buildGraph.js:22:24)\n at async getGraph (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/graph/streamHandlers.js:64:41)\n at async runGraphAndProject (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/graph/streamHandlers.js:77:17)\n at async withAbortController (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/queue/worker.js:40:12)\n at async Worker.connection [as processFn] (file:///Users/abhishekrajput/Desktop/company_sentimetal/backend/src/queue/worker.js:55:7)\n at async /Users/abhishekrajput/Desktop/company_sentimetal/backend/node_modules/bullmq/dist/cjs/classes/worker.js:589:32","errno":-3008,"code":"ENOTFOUND","syscall":"getaddrinfo","hostname":"base"},"msg":"Postgres checkpointer failed, falling back to Sqlite in-memory"}
{"level":30,"time":1784965096205,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Graph compiled successfully."}
{"level":30,"time":1784965096280,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Supervisor running research agents sequentially..."}
{"level":30,"time":1784965096280,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Supervisor: running news agent..."}
[newsApi] NewsData.io query: ITC
[newsApi] full URL: https://newsdata.io/api/1/market?apikey=REDACTED&qInTitle=ITC&language=en&size=10&prioritydomain=medium&removeduplicate=1&sort=relevancy
{"level":30,"time":1784965115866,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Supervisor: all agents complete."}
{"level":30,"time":1784965115873,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Aggregating research findings..."}
{"level":30,"time":1784965115888,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Writing draft report..."}
{"level":30,"time":1784965133585,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Critic reviewing draft report..."}
{"level":30,"time":1784965145965,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Writing draft report..."}
{"level":30,"time":1784965160078,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Critic reviewing draft report..."}
{"level":30,"time":1784965164527,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Writing draft report..."}
{"level":30,"time":1784965176657,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Critic reviewing draft report..."}
{"level":40,"time":1784965185499,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","priorRevisions":2,"msg":"Critic reached max revision attempts; forcing approval to break the loop."}
{"level":30,"time":1784965185514,"pid":75499,"hostname":"Abhisheks-MacBook-Air.local","msg":"Awaiting human approval..."}
^C
abhishekrajput@Abhisheks-MacBook-Air backend %
