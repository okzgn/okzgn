const Queue = {
  state: false,
  load: [],
  pending: [],
  fail: [],

  unlockQueue: () => {
    Queue.state = false;
    if (Queue.load.length > 0 || Queue.pending.length > 0) {
      Queue.process();
    }
  },

  flushLoad: () => {
    const gates = Queue.load.splice(0);
    for (const loadFn of gates) {
      Queue.pending.push(loadFn());
    }
  },

  execute: () => {
    const toProcess = Queue.pending.splice(0);

    return Promise.all(toProcess).then(() => {
      if (Queue.load.length > 0 || Queue.pending.length > 0) {
        Queue.flushLoad();
        return Queue.execute();
      }

      const fails = Queue.fail.splice(0);
      return fails.reduce((promise, failFn) => {
        return promise.then(() => failFn()).catch(Queue.unhandledFail);
      }, Promise.resolve());
    });
  },

  process: () => {
    Queue.flushLoad();

    if (!Queue.state && Queue.pending.length > 0) {
      Queue.state = true;

      queueMicrotask(() => {
        Queue.execute()
        .then(Queue.unlockQueue, (errorResponse) => {
          Queue.unlockQueue();
          Queue.unhandledFail(errorResponse);
        });
      });
    }
  },

  unhandledFail: (errorResponse) => {
    console.error('Unhandled Fail:', errorResponse);
  }
};

class Component {
    constructor(name, fn) {
        this.name = name;

        const fails = [];
        this.fail = (failFn) => {
          fails.push(failFn);

          return this;
        };

        let current = Promise.resolve(name);
        let error = false;
        let lastError = null;

        this.load = (loadFn) => {
          let openGate;
          const gate = new Promise((resolve) => {
            openGate = resolve;
          });

          const currentFirst = (current = current
          .then((prevResult) => gate.then(() => prevResult))
          .then((result) => {
            if (error) {
              return;
            }
            return loadFn(result);
          })
          .catch((e) => {
            if (!error) {
              error = true;
              lastError = e;

              Queue.fail.push(() => {
                return fails.reduce(
                  (promise, failFn) => promise.then((prevResult) => {
                    return Promise.resolve(failFn(prevResult)).then((errorResult) => {
                      return errorResult === undefined ? prevResult : errorResult;
                    });
                  }),
                  Promise.resolve(e)
                );
              });
            }
          }));

          Queue.load.push(() => {
            openGate();
            return currentFirst;
          });

          Queue.process();
          return this;
        }

        if (typeof fn === 'function') {
          this.load(fn);
        }

        Object.defineProperty(this, 'ok', {
          get: () => current.then((result) => {
            if (error) {
              return Promise.reject(lastError);
            }
            return result;
          }),
          configurable: false
        });
    }
}
