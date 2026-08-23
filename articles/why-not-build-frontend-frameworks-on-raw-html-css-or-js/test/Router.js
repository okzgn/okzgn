class Router {
  constructor() {
    this.routes = [];
  }

  _safeDecode(val) {
    if (typeof val !== 'string') {
      return val;
    }

    try {
      return decodeURIComponent(val);
    }
    catch (e) {
      return val;
    }
  }

  _flattenCallbacks(callbacks) {
    const flat = callbacks.reduce((array, fn) => {
      return array.concat(Array.isArray(fn) ? this._flattenCallbacks(fn) : [fn]);
    }, []);

    for (let i = 0; i < flat.length; i++) {
      if (typeof flat[i] !== 'function') {
        throw new TypeError('Middleware handlers must be functions');
      }
    }
    return flat;
  }

  _register(pattern, callbacks, isMiddleware) {
    if (typeof pattern !== 'string') {
      throw new TypeError('Route pattern must be a string');
    }

    const flatCallbacks = this._flattenCallbacks(callbacks);
    if (flatCallbacks.length === 0) {
      throw new Error('At least one middleware/handler is required');
    }

    const cleanPattern = pattern.split(/[?#]/)[0].replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
    const normalizedPattern = '/' + cleanPattern;
    const segments = (cleanPattern === '' ? [] : cleanPattern.split('/'));

    const score = [];
    const paramNames = [];
    let wildcardCount = 0;
    let regexSource = '^';
    let hasOptional = false;

    if (segments.length === 0) {
      regexSource += '\\/?$';
      score.push(3);
    }
    else {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isLast = i === segments.length - 1;
        const isOptional = seg.charCodeAt(0) === 58 && seg.endsWith('?');

        if (hasOptional && !isOptional) {
          throw new Error(`Optional parameter in pattern "${pattern}" must be at the end of the route`);
        }

        if (seg === '*') {
          const name = wildcardCount === 0 ? 'wildcard' : `wildcard_${wildcardCount}`;
          paramNames.push(name);
          wildcardCount++;
          regexSource += isLast ? '\\/(.*)' : '\\/(.*?)';
          score.push(1);
        }
        else if (isOptional) {
          hasOptional = true;
          const paramName = seg.slice(1, -1);

          if (!paramName) {
            throw new Error(`Invalid optional parameter format in pattern "${pattern}"`);
          }

          regexSource += '(?:\\/([^\\/]+))?';
          paramNames.push(paramName);
          score.push(1.5);
        }
        else if (seg.charCodeAt(0) === 58) {
          const paramName = seg.slice(1);
          if (!paramName) {
            throw new Error(`Invalid parameter format in pattern "${pattern}"`);
          }

          regexSource += '\\/([^\\/]+)';
          paramNames.push(paramName);
          score.push(2);
        }
        else {
          regexSource += '\\/' + seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          score.push(3);
        }
      }
      regexSource += '\\/?$';
    }

    this.routes.push({
      index: this.routes.length,
      isMiddleware: isMiddleware,
      pattern: normalizedPattern,
      regex: new RegExp(regexSource),
      paramNames: paramNames,
      score: score,
      callbacks: flatCallbacks
    });

    return this;
  }

  use(...args) {
    if (args.length === 0) {
      throw new TypeError('use() requires at least one middleware handler');
    }

    if (typeof args[0] === 'string') {
      const pattern = args[0];
      const callbacks = args.slice(1);
      const clean = pattern.split(/[?#]/)[0].replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');

      if (clean === '' || clean === '*') {
        return this._register('*', callbacks, true);
      }

      this._register(`/${clean}`, callbacks, true);
      return this._register(`/${clean}/*`, callbacks, true);
    }

    return this._register('*', args, true);
  }

  add(pattern, ...callbacks) {
    return this._register(pattern, callbacks, false);
  }

  dispatch(rawPath, contextExtra = {}, options = {}) {
    if (typeof rawPath !== 'string') {
      throw new TypeError('The path must be a string');
    }

    const cleanPath = '/' + rawPath.split(/[?#]/)[0].replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
    const targetPath = cleanPath === '/' ? '/' : cleanPath;
    const matches = [];

    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      const match = route.regex.exec(targetPath);

      if (match) {
        const params = {};

        for (let j = 0; j < route.paramNames.length; j++) {
          const rawVal = match[j + 1];
          params[route.paramNames[j]] = rawVal !== undefined ? this._safeDecode(rawVal) : undefined;
        }

        matches.push({
          index: route.index,
          isMiddleware: route.isMiddleware,
          pattern: route.pattern,
          score: route.score,
          params: params,
          callbacks: route.callbacks
        });
      }
    }

    matches.sort((a, b) => {
      if (a.isMiddleware && !b.isMiddleware) {
        return -1;
      }

      if (!a.isMiddleware && b.isMiddleware) {
        return 1;
      }

      if (a.isMiddleware && b.isMiddleware) {
        return a.index - b.index;
      }

      const minLen = Math.min(a.score.length, b.score.length);
      for (let i = 0; i < minLen; i++) {
        if (b.score[i] !== a.score[i]) {
          return b.score[i] - a.score[i];
        }
      }

      if (a.score.length !== b.score.length) {
        return a.score.length - b.score.length;
      }

      return a.index - b.index;
    });


    const pipeline = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      for (let j = 0; j < match.callbacks.length; j++) {
        pipeline.push({
          fn: match.callbacks[j],
          params: match.params,
          pattern: match.pattern
        });
      }
    }

    const initialParams = (contextExtra && typeof contextExtra.params === 'object' && contextExtra.params !== null) ? Object.assign({}, contextExtra.params) : {};
    const initialRoutePath = (contextExtra && contextExtra.routePath !== undefined) ? contextExtra.routePath : '';

    const ctx = Object.assign({
        pathname: cleanPath,
        rawPath: rawPath,
        params: Object.assign({}, initialParams),
        routePath: initialRoutePath
      },
      contextExtra
    );

    const isAsync = Boolean((options && options.async === true) || (contextExtra && contextExtra.async === true));

    let lastIndex = -1;

    if (isAsync) {
      const runAsync = (index) => {
        if (index <= lastIndex) {
          return Promise.reject(new Error('next() called multiple times within the same middleware'));
        }
        lastIndex = index;

        if (index >= pipeline.length) {
          return Promise.resolve();
        }

        const current = pipeline[index];
        const prevParams = ctx.params;
        const prevRoutePath = ctx.routePath;

        ctx.params = Object.assign({}, current.params);
        ctx.routePath = current.pattern;

        try {
          const result = current.fn(ctx, () => runAsync(index + 1));

          return Promise.resolve(result).then(
            (val) => {
              ctx.params = prevParams;
              ctx.routePath = prevRoutePath;
              return val;
            },
            (e) => {
              ctx.params = prevParams;
              ctx.routePath = prevRoutePath;
              return Promise.reject(e);
            }
          );
        }
        catch (e) {
          ctx.params = prevParams;
          ctx.routePath = prevRoutePath;
          return Promise.reject(e);
        }
      };

      return runAsync(0).then(
        (finalVal) => {
          ctx.params = initialParams;
          ctx.routePath = initialRoutePath;
          return finalVal;
        },
        (e) => {
          ctx.params = initialParams;
          ctx.routePath = initialRoutePath;
          return Promise.reject(e);
        }
      );
    }

    const runSync = (index) => {
      if (index <= lastIndex) {
        throw new Error('next() called multiple times within the same middleware');
      }

      lastIndex = index;

      if (index >= pipeline.length) {
        return;
      }

      const current = pipeline[index];
      const prevParams = ctx.params;
      const prevRoutePath = ctx.routePath;

      ctx.params = Object.assign({}, current.params);
      ctx.routePath = current.pattern;

      try {
        return current.fn(ctx, () => runSync(index + 1));
      }
      finally {
        ctx.params = prevParams;
        ctx.routePath = prevRoutePath;
      }
    };

    try {
      return runSync(0);
    }
    finally {
      ctx.params = initialParams;
      ctx.routePath = initialRoutePath;
    }
  }
}

function RouterStart(options = {}) {
  const router = new Router();

  const normalizeBase = (base) => {
    if (!base || typeof base !== 'string'){
      return '';
    }

    const clean = base.split(/[?#]/)[0].replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
    return clean ? '/' + clean : '';
  };

  let basePath = normalizeBase(options.basePath);

  const extractInternalPath = (fullPath) => {
    if (!fullPath || typeof fullPath !== 'string') return '/';

    let path = fullPath;

    try {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        const urlObj = new URL(path);
        path = urlObj.pathname + urlObj.search + urlObj.hash;
      }
    }
    catch (e) {}

    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    if (basePath) {
      if (path === basePath || path === basePath + '/') {
        path = '/';
      }
      else if (path.startsWith(basePath + '/') || path.startsWith(basePath + '?') || path.startsWith(basePath + '#')) {
        path = path.slice(basePath.length);
      }
    }

    return path.startsWith('/') ? path : '/' + path;
  };

  const toBrowserUrl = (internalPath) => {
    const clean = internalPath.startsWith('/') ? internalPath : '/' + internalPath;

    if (!basePath){
      return clean;
    }

    if (clean === basePath || clean.startsWith(basePath + '/') || clean.startsWith(basePath + '?') || clean.startsWith(basePath + '#')) {
      return clean;
    }

    return basePath + clean;
  };


  const executeDispatch = (internalPath, extraContext = {}) => {
    let redirectedTo = null;

    const extendedContext = Object.assign({}, extraContext, {
      basePath: basePath,
      redirect: (targetUrl) => {
        redirectedTo = targetUrl;
      }
    });

    const result = router.dispatch(internalPath, extendedContext, options);

    if (result && typeof result.then === 'function') {
      return result.then((val) => {
        if (redirectedTo) {
          return router.go(redirectedTo, true, extraContext);
        }

        return val;
      });
    }

    if (redirectedTo) {
      return router.go(redirectedTo, true, extraContext);
    }

    return result;
  };

  router.go = (url, replace = false, extraContext = {}) => {
    const internalPath = extractInternalPath(url);
    const browserUrl = toBrowserUrl(internalPath);

    if (replace) {
      window.history.replaceState({}, '', browserUrl);
    }
    else {
      window.history.pushState({}, '', browserUrl);
    }

    return executeDispatch(internalPath, extraContext);
  };

  window.addEventListener('popstate', () => {
    const currentInternal = extractInternalPath(window.location.pathname + window.location.search + window.location.hash);
    executeDispatch(currentInternal);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');

    if (
      link &&
      link.hasAttribute('href') &&
      link.target !== '_blank' &&
      !link.hasAttribute('download') &&
      link.origin === window.location.origin &&
      e.button === 0 &&
      !e.metaKey && !e.ctrlKey &&
      !e.shiftKey && !e.altKey
    ) {
      const rawHref = link.getAttribute('href');

      if (link.hasAttribute('data-router-exclude')) {
        return;
      }

      if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
        return;
      }

      e.preventDefault();
      const targetPath = link.pathname + link.search + link.hash;
      router.go(targetPath);
    }
  });

  router.listen = (customBase) => {
    if (typeof customBase === 'string') {
      basePath = normalizeBase(customBase);
    }

    const fullCurrent = window.location.pathname + window.location.search + window.location.hash;
    const internalPath = extractInternalPath(fullCurrent);
    const browserUrl = toBrowserUrl(internalPath);

    if (window.location.pathname + window.location.search !== browserUrl.split('#')[0]) {
      window.history.replaceState({}, '', browserUrl);
    }

    return executeDispatch(internalPath);
  };

  return router;
}
