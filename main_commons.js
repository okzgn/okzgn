document.addEventListener('DOMContentLoaded', function () {
  console.log('Main commons ready.');

  var upButton = document.getElementById('up');
  var scrollContainer = document.querySelector('main');

  var nav = document.querySelector('nav');
  var navTitle = document.querySelector('.nav-title');
  var prevTitle = navTitle ? navTitle.textContent : '';

  var menu = document.getElementById('menu');
  var mainTitle = document.querySelector('.main-title');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('scroll', scrollOperation(window), { passive: true });
  scrollContainer.addEventListener('scroll', scrollOperation(scrollContainer), { passive: true });

  upButton.addEventListener('click', function(event) {
    event.preventDefault();
    returnToTop();
  });

  menu.addEventListener('click', function (event) {
    var ariaExpanded = menu.getAttribute('aria-expanded');
    if (ariaExpanded === 'false') {
      menu.setAttribute('aria-expanded', 'true');
      return nav.classList.add('expanded');
    }
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('expanded');
  });

  var menuList = document.querySelector('nav .menu-list ol');
  var points = document.querySelectorAll('h2, h3, h4, h5, h6');
  points.forEach(function (point) {
    var anchor = point.id || point.textContent.replace(/[^a-zA-Z0-9]/g, '-').replace(/^\-|\-$/g, '').toLowerCase();
    var visibleAnchor = point.textContent.replace(/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/g, '');

    point.id = anchor;

    var menuListItem = document.createElement('li');
    var menuListItemLink = document.createElement('a');
    menuListItemLink.href = '#' + anchor;
    menuListItemLink.textContent = visibleAnchor;
    menuListItem.appendChild(menuListItemLink);
    menuList.appendChild(menuListItem);
  });
});
