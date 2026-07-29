document.addEventListener('DOMContentLoaded', function () {
  var
    upButton = document.getElementById('up'),
    scrollContainer = document.querySelector('main'),
    nav = document.querySelector('nav'),
    navTitle = document.querySelector('.nav-title'),
    menu = document.getElementById('menu'),
    mainTitle = document.querySelector('.main-title'),
    menuListContainer = document.querySelector('nav .menu-list'),
    menuList = document.querySelector('nav .menu-list ol'),
    points = document.querySelectorAll('h2, h3, h4, h5, h6');

  if (
    !upButton ||
    !scrollContainer ||
    !nav ||
    !navTitle ||
    !menu ||
    !mainTitle ||
    !menuList ||
    !points
  ) {
    return console.info('There is an element that cannot be found.');
  }

  var prevTitle = navTitle ? navTitle.textContent : '';
  mainTitle = mainTitle ? mainTitle.textContent : '';

  function iterateByCond(elements, cond, mode) {
    var
      prev = true,
      next = false,
      _prev = [],
      _next = [],
      current;

    if (mode) {
      var i = elements.length;
      while (i--) {
        if (next) {
          _next.push(elements[i]);
        }

        if (cond.call(elements[i])) {
          prev = false;
          current = elements[i];
          next = true;
        }

        if (prev) {
          _prev.push(elements[i]);
        }
      }
    }
    else {
      for (var i = 0; i < elements.length; i++) {
        if (next) {
          _next.push(elements[i]);
        }

        if (cond.call(elements[i])) {
          prev = false;
          current = elements[i];
          next = true;
        }

        if (prev) {
          _prev.push(elements[i]);
        }
      }
    }

    if (!current) { return null; }
    return { prev: _prev, current: current, next: _next };
  }

  function observer(selector, showFn, hideFn) {
    if (typeof showFn != 'function' && typeof hideFn != 'function') {
      return;
    }

    var _thresholds = [];
    for (var threshold = 0; threshold <= 1; threshold += 0.02) {
      _thresholds.push(Number(threshold.toFixed(2)));
    }

    var _handler = new IntersectionObserver(function (intersections) {
      intersections.forEach(function (entry, index, array) {
        if (!entry.isIntersecting) { return hideFn.call(entry.target, entry); }
        var _index = entry.intersectionRect,
          _array = ((_index.width * _index.height) / (window.innerWidth * window.innerHeight));
        if (entry.intersectionRatio > 0.74 || _array > 0.74) { return showFn.call(entry.target, 75, _index); }
        else if (entry.intersectionRatio > 0.49 || _array > 0.49) { return showFn.call(entry.target, 50, _index); }
        else if (entry.intersectionRatio > 0.24 || _array > 0.24) { return showFn.call(entry.target, 25, _index); }
        hideFn.call(entry.target);
      });
    }, { threshold: _thresholds });

    var _elements = (typeof selector !== 'string' ? (typeof selector === 'object' && selector ? (selector.length ? selector : [selector]) : null) : document.querySelectorAll(selector));
    if (_elements) {
      _elements.forEach(function (element) {
        _handler.observe(element);
      });
    }
  }

  function scrollOperation(target) {
    var state = false;

    function showOrHide() {
      var scroll = target[target === window ? 'scrollY' : 'scrollTop'];
      if (scroll > 100) {
        upButton.classList.add('show');
        navTitle.textContent = mainTitle;
      }
      else if (scroll < 80) {
        upButton.classList.remove('show');
        navTitle.textContent = prevTitle;
      }

      state = false;
    }

    return function () {
      if (!state) {
        state = true;
        requestAnimationFrame(showOrHide);
      }
    }
  }

  function returnToTop() {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function menuState(state) {
    return typeof state === 'undefined' ? (menu.getAttribute('aria-expanded') === 'false' ? false : true) : menu.setAttribute('aria-expanded', (state ? 'true' : 'false'));
  }

  function scrollSituate(scrollContainer, element) {
    clearTimeout(scrollSituate.timeout);
    scrollSituate.timeout = setTimeout(function () {
      var
        rectContainer = scrollContainer.getBoundingClientRect(),
        rectElement = element.getBoundingClientRect(),
        visibleDistance = rectElement.top - rectContainer.top,
        totalDistance = visibleDistance + scrollContainer.scrollTop;

      scrollContainer.scrollTo({ top: totalDistance });
    }, 100);
  }

  function menuOperation(event) {
    if (!menuState()) {
      menuState(true);
      menu.setAttribute('aria-label', 'Close menu');

      var selectedAnchors = iterateByCond(anchors, function () { return this.classList.contains('cta-blue-button'); });
      console.log(selectedAnchors); if (selectedAnchors) {
        scrollSituate(menuListContainer, selectedAnchors.current);
      }
      return nav.classList.add('expanded');
    }

    menuState(false);
    menu.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('expanded');
  }

  scrollContainer.addEventListener('scroll', scrollOperation(scrollContainer), { passive: true });

  upButton.addEventListener('click', function(event) {
    event.preventDefault();
    returnToTop();
  });

  menu.addEventListener('click', menuOperation);

  points.forEach(function (point) {
    var anchor = point.id || point.textContent.replace(/['"\(\)\[\]]/g, '').replace(/[^a-zA-Z0-9]/g, '-').replace(/^\-|\-$/g, '').toLowerCase();
    var visibleAnchor = point.textContent.replace(/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/g, '');

    point.id = anchor;

    var menuListItem = document.createElement('li');
    var menuListItemLink = document.createElement('a');
    menuListItemLink.href = '#' + anchor;
    menuListItemLink.textContent = visibleAnchor;
    menuListItem.appendChild(menuListItemLink);
    menuList.appendChild(menuListItem);

    menuListItemLink.addEventListener('click', menuOperation);
  });

  var
    anchors = document.querySelectorAll('nav .menu-list a');

  if (!anchors) { return console.error('There is no anchors.'); }

  observer(points,
    function show(visibleRatio) {
      var id = this.id;
      console.log('show', id);
      clearTimeout(show.timeout);
      show.timeout = setTimeout(function () {
        var elements = iterateByCond(anchors, function () { return this.getAttribute('href') === '#' + id; });
        if (!elements) { return; }
        elements.current.classList.add('cta-blue-button');
        elements.prev.forEach(function (element) {
          element.classList.add('cta-blue-button');
        });
        scrollSituate(menuListContainer, elements.current);
      }, 200);

    },

    function hide() {
      var id = this.id;
      console.log('hide', id);
      clearTimeout(hide.timeout);
      hide.timeout = setTimeout(function () {
        var elements = iterateByCond(anchors, function () { return this.getAttribute('href') === '#' + id; });
        if (!elements) { return; }
        elements.current.classList.remove('cta-blue-button');
        elements.next.forEach(function (element) {
          element.classList.remove('cta-blue-button');
        });
        if (elements.prev.length) {
          scrollSituate(menuListContainer, elements.prev[elements.prev.length - 1]);
        }
      }, 200);
    }
  );

  var hash = window.location.hash + '';
  if (hash) {
    var element = iterateByCond(anchors, function () { return this.getAttribute('href') === hash; });
    if (element) {
      element.current.click();
    }
  }
});
