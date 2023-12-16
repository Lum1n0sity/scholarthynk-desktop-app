const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');

document.addEventListener('DOMContentLoaded', async () => {
    // * IMPORTANT variable selection
    const store = new Store();
    const api_addr = "http://192.168.5.21:3000";
    const root = document.documentElement;

    // * Load dark/light mode:

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

    // * Load language:
    
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
        loadPath: `__dirname/../renderer/Translation/{{lng}}.yaml`
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

    // * Reset password
    const reset_pw = document.getElementById('reset_pw');

    reset_pw.addEventListener('click', () => {
        const newPassword = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirm').value;

        if (confirm == newPassword)
        {
            const code = store.get('code');

            const dataToSendResetPW = ({ newPassword: newPassword, code: code });

            store.delete('code');

            fetch(`${api_addr}/user/reset/password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendResetPW)
            })
            .then(response => response.json())
            .then(data => {
                const reset = data.reset;

                if (reset)
                {
                    ipcRenderer.send('reset');
                }
                else
                {
                    console.log('reset is false');
                }
            })
            .catch(error => {
                console.error('Fetch error: ', error);
            });
        }
    });
});