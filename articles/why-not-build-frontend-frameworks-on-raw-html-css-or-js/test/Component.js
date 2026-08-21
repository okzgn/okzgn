const Queue = { state: false, load: [], fail: [] };

class Component {
    constructor(name, fn) {
        this.name = name;

        const fails = [];
        this.fail = (fn) => fails.push(fn);

        this.load = (fn) => Queue.load.push(() => new Promise((resolve, reject) => {
            Promise.resolve()
            .then(() => fn())
            .then(resolve)
            .catch((e) => {
                fails.forEach((fn) => Queue.fail.push(fn));
                reject({ component: name, error: e });
            });
        }));

        this.load(fn);

        if (!Queue.state) {
            Queue.state = true;
            queueMicrotask(() => {
                Promise.all(Queue.load.map(fn => fn()))
                .then(() => {
                    Queue.load = [];
                    Queue.state = false;
                })
                .catch((CompErr) => {
                    Queue.fail.forEach(fn => fn());
                    Queue.fail = [];
                    Queue.state = false;
                });
            });
        }
        return this;
    }
}
