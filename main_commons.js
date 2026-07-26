document.addEventListener('DOMContentLoaded', function () {
  console.log('Main commons ready.');

  var menuButton = document.getElementById('menu');
  var scrollContainer = document.querySelector('main');
  var navContainer = document.querySelector('nav');
  var navTitle = document.querySelector('h2.nav-title');
  var navMainTitle = document.querySelector('h1.main-title');

  function scrollOperation(target) {
    var state = false;

    function showOrHide() {
      var scroll = target[target === window ? 'scrollY' : 'scrollTop'];
      if (scroll > 100) {
        menuButton.classList.add('show');
        navContainer.classList.add('show');
        navTitle.textContent = navMainTitle.textContent;
      }
      else if (scroll < 80) {
        menuButton.classList.remove('show');
        navContainer.classList.remove('show');
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

  menuButton.addEventListener('click', function(event) {
    event.preventDefault();
    returnToTop();
  });
});
