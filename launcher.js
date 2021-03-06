const cluster = require('cluster');
const {onError} = require('./helpers/functions');

(async () => {
    if (cluster.isMaster) {
        process.title = `hyp-${process.env.CHAIN}-master`;
        require('./master').main().catch(onError);
    } else {
        process.title = `hyp-${process.env.CHAIN}-${process.env['worker_role']}:${process.env.worker_id}`;
        let delay = 0;
        // Make sure readers are launched later
        // TODO: use IPC to trigger
        if (process.env['worker_role'] === 'reader') {
            delay = process.env.DESERIALIZERS * 200;
        }
        setTimeout(() => {
            switch (process.env['worker_role']) {
                case 'reader': {
                    require('./workers/state-reader.worker').run().catch(onError);
                    break;
                }
                case 'deserializer': {
                    require('./workers/deserializer.worker').run().catch(onError);
                    break;
                }
                case 'continuous_reader': {
                    require('./workers/state-reader.worker').run().catch(onError);
                    break;
                }
                case 'ingestor': {
                    require('./workers/indexer.worker').run().catch(onError);
                    break;
                }
                case 'router': {
                    require('./workers/ws-router.worker').run().catch(onError);
                    break;
                }
            }
        }, delay);
    }
})();
