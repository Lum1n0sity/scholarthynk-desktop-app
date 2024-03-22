const rootPath = require('electron-root-path').rootPath;
const path = require('path');
const { fsBackend, i18next, ipcRenderer: rendererJSIpcRenderer, Store: storeJSRenderer, config: configRenderer } = require(path.join(rootPath, 'utils.js'));

document.addEventListener('DOMContentLoaded', async () => {
    const store = new storeJSRenderer();
    const root = document.documentElement;

    /**
    * Changes the appearance of the web page based on the value stored in the `mode` variable.
    * 
    * @returns {void}
    */

    function switchAppearance() 
    {
        const mode = store.get('mode');

        if (mode == null) 
        {
            root.style.setProperty('--background', '#161616');
            root.style.setProperty('--primary', '#2F2F2F');
            root.style.setProperty('--selected-primary', '#454545c7');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--alt-primary', '#1C1C1C');
        } 
        else 
        {
            if (mode === 'light') 
            {
                root.style.setProperty('--background', '#E0E0E0');
                root.style.setProperty('--primary', '#CCCCCC');
                root.style.setProperty('--selected-primary', '#A0A0A0C7');
                root.style.setProperty('--text-color', '#000000');
                root.style.setProperty('--alt-primary', '#D8D8D8');
            } 
            else 
            {
                root.style.setProperty('--background', '#161616');
                root.style.setProperty('--primary', '#2F2F2F');
                root.style.setProperty('--selected-primary', '#454545c7');
                root.style.setProperty('--text-color', '#ffffff');
                root.style.setProperty('--alt-primary', '#1C1C1C');
            }
        }
    }

    switchAppearance();
    
    /**
    * Updates the language of the user interface elements based on the translations provided by the i18next library.
    *
    * @example
    * updateUILanguage();
    *
    * @returns {void} None
    */

    function updateUILanguage() 
    {
       document.querySelectorAll('[data-i18n]').forEach((element) => {
          const key = element.getAttribute('data-i18n');
          const attribute = element.getAttribute('data-i18n-attr') || 'textContent';
 
          if (attribute === 'placeholder') 
          {
            element.setAttribute(attribute, i18next.t(key));
          } 
          else if (attribute === 'textContent') 
          {
            element.textContent = i18next.t(key);
          } 
          else 
          {
            element[attribute] = i18next.t(key);
          }
       });
    }
 
    const storedLang = store.get('lang') || 'en';
 
    await i18next
    .use(fsBackend)
    .init({
        lng: storedLang,
        fallbackLng: 'en',
        backend: {
            loadPath: path.join(rootPath, `/renderer/Translation/{{lng}}.yaml`),
        }
    }, 
    (err, t) => {
       if (err) 
       {
          console.error('Error initializing i18next:', err);
          return;
       }
 
       updateUILanguage();
    });

    const nav_home = document.getElementById('nav_home');
    const nav_discover = document.getElementById('nav_discover');
    const nav_courses = document.getElementById('nav_courses');
    const nav_logout = document.getElementById('nav_logout');

    const user_options = document.getElementById('user_options');
    const profile_pic = document.getElementById('profile_pic');
    const settings_user_options = document.getElementById('settings_user_options');
    const feedback_user_options = document.getElementById('feedback_user_options');

    const username = { username: store.get('username') };

    fetch(`${configRenderer.apiUrl}/get/profilePic`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(username),
    })
    .then(response => {
        if (!response.ok) 
        {
            throw new Error('Network response was not ok');
        }
        return response.blob();
    })
    .then(blob => {
        const imageUrl = URL.createObjectURL(blob);

        profile_pic.src = imageUrl;
    })
    .catch(error => {
        console.error('Fetch error: ', error);
    });    

    nav_home.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html';
    });

    nav_discover.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Discover/discover.html';
    });

    nav_courses.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Courses/courses.html';
    });

    nav_logout.addEventListener('click', (event) => {
        event.preventDefault();

        const username = store.get('username');
        const userData = ({ username: username});

        fetch(`${configRenderer.apiUrl}/user/updateStatus`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            const updated = data.updated;

            if (updated)
            {
                window.location.href = "../Login/login.html";
                store.set('loggedIn', false);
                store.set('loggedOut', true);
                store.delete('authToken');
                store.delete('school');
                store.delete('role');
                store.delete('username');
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });

    user.addEventListener('click', () => {
        user_options.style.display = user_options.style.display === 'flex' ? 'none' : 'flex';
    });

    settings_user_options.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Settings/settings.html';
    });
});