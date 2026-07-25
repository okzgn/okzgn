document.addEventListener('DOMContentLoaded', function () {
  console.log('Main commons ready.');

  var menuButton = document.getElementById('menu');
  var scrollContainer = document.querySelector('main');
  var navContainer = document.querySelector('nav');
  var navTitle = document.querySelector('h2.nav-title');
  var navMainTitle = document.querySelector('h1.main-title');

  function showOrHideMenu(target) {
    return function () {
      clearTimeout(showOrHideMenu.timeout);
      showOrHideMenu.timeout = setTimeout(function () {
        if (target[target === window ? 'scrollY' : 'scrollTop'] > 96) {
          menuButton.classList.add('show');
          navContainer.style.display = 'flex';
          navTitle.textContent = navMainTitle.textContent;
        }
        else {
          menuButton.classList.remove('show');
          navContainer.style.display = 'none';
          navTitle.textContent = '';
        }
      }, 500);
    }
  }

  function returnToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('scroll', showOrHideMenu(window));
  scrollContainer.addEventListener('scroll', showOrHideMenu(scrollContainer));

  menuButton.addEventListener('click', function(event) {
    event.preventDefault();
    returnToTop();
  });
});
