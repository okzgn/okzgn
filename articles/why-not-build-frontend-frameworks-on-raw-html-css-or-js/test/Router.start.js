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
