const { config, ipcRenderer, Store } = require('../../../../utils.js');

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();

    const sign_up = document.getElementById('register');
    const switch_sign_up = document.getElementById('register_switch');

    const show_pw = document.getElementById('show_pw');
    const hide_pw = document.getElementById('hide_pw');
    const pw_input = document.getElementById('password_input');

    const remember_checkbox = document.getElementById('remember_checkbox');

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
        const register_container = document.getElementById('register_container');
        const connection_error = document.getElementById('connection_error');

        connection_error.style.display = 'none';

        const username = document.getElementById('username_input').value;
        const password = document.getElementById('password_input').value;
        const email = document.getElementById('email_input').value;
        
        const role_select = document.getElementById('role_select');
        const roleI = role_select.selectedIndex;
        const role = role_select.options[roleI].value;

        store.set('tempUsername', username);

        register_container.style.borderRadius = '0px 10px 10px 0px';

        dataToSendRegister = ({ username: username, password: password, email: email, role: role });

        fetch(`${config.apiUrl}/user/register`, {
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
                register_container.style.borderRadius = '0px 10px 0px 0px';
                register_error_message.style.display = 'block';
                return;
            }
            else if (response.status === 308)
            {
                if (role == 'teacher')
                {
                    ipcRenderer.send('verify-teacher');
                }
                else if (role == 'dev')
                {
                    ipcRenderer.send('verify-dev');
                }
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
            register_container.style.borderRadius = '0px 10px 0px 0px';
            connection_error.style.display = 'block';
        });
    });
});