document.addEventListener('DOMContentLoaded', function () {
  console.log('Article Ready.');
  hljs.configure({ cssSelector: 'pre code, .inline-code' });
  hljs.highlightAll();
});
