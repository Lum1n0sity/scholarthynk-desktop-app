document.addEventListener('DOMContentLoaded', () => {
    const nav_home = document.getElementById('nav_home');
    const nav_discover = document.getElementById('nav_discover');

    nav_home.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html';
    });

    nav_discover.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Discover/discover.html';
    });
});