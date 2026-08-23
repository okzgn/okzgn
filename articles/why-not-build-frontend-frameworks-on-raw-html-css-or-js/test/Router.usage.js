const app = RouterStart({ async: true });

app.use((ctx, next) => {
    console.log('Navigation event:', ctx.pathname);
    return next();
});

let isLogged = false;
app.use('/dashboard',
  (ctx, next) => {
    if (!isLogged) {
      ctx.redirect('/login');
      return;
    }
    return next();
  },
  (ctx, next) => {
    console.info('Access granted.');
    return next();
  }
);

let viewBox;
document.addEventListener('DOMContentLoaded', () => {
  viewBox = document.getElementById('view');
});

app.add('/', (ctx) => {
    viewBox.innerHTML = '<h2>Home</h2>';
});

app.add('/login', (ctx) => {
    viewBox.innerHTML = '<h2>Login (click Auth)</h2>';
});

app.add('/auth', (ctx) => {
  isLogged = !isLogged;
    viewBox.innerHTML = '<h2>Auth toggle: ' + (isLogged ? 'on' : 'off') + '</h2>';
});

app.add('/dashboard', (ctx) => {
    viewBox.innerHTML = '<h2>Dashboard</h2>';
});

const lastSlash = (window.location.pathname.lastIndexOf('/') + 1);
const currentPathDirname = (lastSlash ? window.location.pathname.substring(0, lastSlash) : window.location.pathname);

app.listen(currentPathDirname);
