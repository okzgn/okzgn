document.addEventListener('DOMContentLoaded', function () {
  var
    upButton = document.getElementById('up'),
    scrollContainer = document.querySelector('main'),
    nav = document.querySelector('nav'),
    navTitle = document.querySelector('.nav-title'),
    menu = document.getElementById('menu'),
    mainTitle = document.querySelector('.main-title'),
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

  function menuOperation(event) {
    var ariaExpanded = menu.getAttribute('aria-expanded');
    if (ariaExpanded === 'false') {
      menu.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-label', 'Close menu');
      return nav.classList.add('expanded');
    }
    menu.setAttribute('aria-expanded', 'false');
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
});
