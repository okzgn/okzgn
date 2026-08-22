const Queue = {
  state: false,
  load: [],
  fail: [],

  unlockQueue: () => {
    Queue.state = false;
    if (Queue.load.length > 0) {
      Queue.process();
    }
  },

  process: () => {
    if (!Queue.state && Queue.load.length) {
      Queue.state = true;
      queueMicrotask(() => {
        const toLoad = [];
        while (Queue.load.length > 0) {
          toLoad.push(Queue.load.shift());
        }

        Promise.all(toLoad.map(loadFn => loadFn()))
        .then(() => {
          const fails = Queue.fail.splice(0, Queue.fail.length);

          return fails.reduce((promise, failFn) => {
            return promise.then(() => failFn()).catch(Queue.unhandledFail);
          }, Promise.resolve());
        })
        .then(Queue.unlockQueue, (errorResponse) => {
          Queue.unlockQueue();
          Queue.unhandledFail(errorResponse);
        });
      });
    }
  },

  unhandledFail: (errorResponse) => {
    console.error(errorResponse);
  }
};

class Component {
    constructor(name, fn) {
        this.name = name;

        const fails = [];
        this.fail = (fn) => {
          fails.push(fn);

          return this;
        };

        let current = Promise.resolve(name);
        let error = false;
        let lastError = null;

        this.load = (fn) => {
          let openGate;
          const gate = new Promise((resolve) => {
            openGate = resolve;
          });

          current = current
          .then((prevResult) => gate.then(() => prevResult))
          .then((result) => {
            if (error) {
              return;
            }
            return fn(result);
          })
          .catch((e) => {
            if (!error) {
              error = true;
              lastError = e;

              Queue.fail.push(() => {
                return fails.reduce(
                  (promise, failFn) => promise.then((prevResult) => {
                    const errorResponse = failFn(prevResult);
                    return (errorResponse === undefined ? prevResult : errorResponse);
                  }),
                  Promise.resolve(e)
                );
              });
            }
          });

          Queue.load.push(() => {
            openGate();
            return current;
          });

          Queue.process();
          return this;
        }

        this.load(fn);

        Object.defineProperty(this, 'ok', {
          get: () => current.then((result) => {
            if (error) {
              return Promise.reject(lastError);
            }

            return result;
          }),
          configurable: false
        });
        return this;
    }
}
