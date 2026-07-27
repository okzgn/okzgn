document.addEventListener('DOMContentLoaded', function () {
  console.log('Main commons ready.');

  var upButton = document.getElementById('up');
  var scrollContainer = document.querySelector('main');
  var nav = document.querySelector('nav');
  var navTitle = document.querySelector('.nav-title');
  var menu = document.getElementById('menu');
  var mainTitle = document.querySelector('.main-title');

  function scrollOperation(target) {
    var state = false;

    function showOrHide() {
      var scroll = target[target === window ? 'scrollY' : 'scrollTop'];
      if (scroll > 100) {
        upButton.classList.add('show');
        navTitle.classList.add('collapse');
        navTitle.textContent = mainTitle.textContent;
      }
      else if (scroll < 80) {
        upButton.classList.remove('show');
        navTitle.classList.remove('collapse');
        navTitle.textContent = '';
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
});
