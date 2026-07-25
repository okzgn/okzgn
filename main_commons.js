document.addEventListener('DOMContentLoaded', function () {
    console.log('Main commons ready.');

  function showOrHideMenu(target) {
      return function () {
        if(target[target === window ? 'scrollY' : 'scrollTop'] > 96){
            menuButton.classList.add('show');
        }
        else {
            menuButton.classList.remove('show');
        }
      }
    }

    var menuButton = document.getElementById('menu');
    var scrollContainer = document.querySelector('main');

    window.addEventListener('scroll', showOrHideMenu(window));
    scrollContainer.addEventListener('scroll', showOrHideMenu(scrollContainer));

  menuButton.addEventListener('click', function (event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
