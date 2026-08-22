const Handlers = (options, path, cache) => {
  return {
    get: (_data, property, receiver) => {
      const value = Reflect.get(_data, property, receiver);

      // Pass symbols through unmodified
      if (typeof property === 'symbol') {
          return value;
      }

      (!options.onGet || options.onGet({ type: 'get', value, path: path.concat(property) }));

      if (value !== null && typeof value === 'object') {
          return State({ ...options, data: value }, path.concat(property), cache);
      }
      return value;
    },

    set: (_data, property, value, receiver) => {
      const oldValue = _data[property];
      const success = Reflect.set(_data, property, value, receiver);

      if (success && oldValue !== value) {
          (!options.onSet || options.onSet({ type: 'set', oldValue, value, path: path.concat(property) }));
      }
      return success;
    },

    deleteProperty: (_data, property) => {
      const exists = property in _data;
      const oldValue = _data[property];
      const success = Reflect.deleteProperty(_data, property);

      if (exists && success) {
          (!options.onDelete || options.onDelete({ type: 'delete', oldValue, path: path.concat(property) }));
      }
      return success;
    }
  }
};

function State(options = {}, path = [], cache = new WeakMap()) {
    // In-scope secure state with flexibility to use external objects (risk of external mutation)
    const data = options.data || Object.create(null);

    // Reuse existing proxy for identity preservation and to avoid memory leaks
    if (cache.has(data)) {
        return cache.get(data);
    }

    const proxy = new Proxy(data, Handlers(options, path, cache));
    cache.set(data, proxy);
    return proxy;
}
