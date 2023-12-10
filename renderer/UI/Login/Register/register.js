const Store = require('electron-store');

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();

    const root = document.documentElement;
    
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

    const sign_up = document.getElementById('register');
    const switch_sign_up = document.getElementById('register_switch');

    const show_pw = document.getElementById('show_pw');
    const hide_pw = document.getElementById('hide_pw');
    const pw_input = document.getElementById('password_input');

    const remember_checkbox = document.getElementById('remember_checkbox');

    const api_addr = "http://192.168.5.21:3000";

    let isPWVisible = false;
    
    show_pw.addEventListener('click', () => {
        if (!isPWVisible)
        {
            pw_input.type = 'text';
            isPWVisible = true;
            show_pw.style.display = 'none';
            hide_pw.style.display = 'block';
        }
    });

    hide_pw.addEventListener('click', () => {
        if (isPWVisible)
        {
            pw_input.type = 'password';
            isPWVisible = false;
            show_pw.style.display = 'block';
            hide_pw.style.display = 'none';
        }
    });

    switch_sign_up.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../login.html';
    });

    sign_up.addEventListener('click', () => {
        const connection_error = document.getElementById('connection_error');

        connection_error.style.display = 'none';

        const username = document.getElementById('username_input').value;
        const password = document.getElementById('password_input').value;
        const email = document.getElementById('email_input').value;

        dataToSendRegister = ({ username: username, password: password, email: email });

        fetch(`${api_addr}/user/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendRegister),
        })
        .then (response => {
            const register_error_message = document.getElementById('error_msg');

            if (response.status === 401)
            {
                register_error_message.style.display = 'block';
                return;
            }

            return response.json();
        })
        .then(data => {
            const accountCreated = data.accountCreated;
            const userToken = data.token;

            if (accountCreated == true)
            {
                store.set('username', username);                                                                          

                if (remember_checkbox.checked)
                {                    
                    const data = { value: userToken };
                    store.set('authToken', JSON.stringify(data));
                    store.set('loggedIn', true);
                }
                window.location.href = '../../Home/index.html';
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
            connection_error.style.display = 'block';
        });
    });
});