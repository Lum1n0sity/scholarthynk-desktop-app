const rootPathRegister = require('electron-root-path').rootPath;
const pathRegister = require('path');
const { config, ipcRenderer, Store, fs } = require(pathRegister.join(rootPathRegister, 'utils.js'));

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();

    const loader = document.getElementById('loader');

    const sign_up = document.getElementById('register');
    const switch_sign_up = document.getElementById('register_switch');

    const show_pw = document.getElementById('show_pw');
    const hide_pw = document.getElementById('hide_pw');
    const pw_input = document.getElementById('password_input');
    const input_school = document.getElementById('school');
    const search_output = document.getElementById('search-output');

    const remember_checkbox = document.getElementById('remember_checkbox');

    const background = document.getElementById('background');
    const tos_pop_up = document.getElementById('tos_pop_up');
    const accept = document.getElementById('accept');
    const decline = document.getElementById('decline');

    const tab_tos = document.getElementById('tos');
    const tab_pp = document.getElementById('privacy_policy');

    let isPWVisible = false;
    let selectedSchool = '';
    let selectedTab = 'tos';

    const filePathToS = path.join(rootPathRegister, 'terms_of_service.txt');
    const filePathPP = path.join(rootPathRegister, 'privacy_policy.txt');
    
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

    input_school.addEventListener('focus', () => {
        input_school.value = '';
        input_school.style.borderRadius = '6px 6px 6px 6px';
        search_output.innerHTML = '';
        search_output.style.display = 'none';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key = 'Escape')
        {
            input_school.style.borderRadius = '6px 6px 6px 6px';
            search_output.innerHTML = '';
            search_output.style.display = 'none';
        }
    });

    input_school.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') 
        {
            search_output.style.display = 'none';
            input_school.style.borderRadius = '6px 6px 6px 6px';

            search_output.innerHTML = '';

            const inputValue = input_school.value;
    
            if (inputValue !== '') 
            {
                const dataToSendSearchSchool = { input: inputValue };
    
                fetch(`${config.apiUrl}/search-school`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dataToSendSearchSchool)
                })
                .then(response => response.json())
                .then(data => {
                    const results = data.result;

                    if (results.length != 0)
                    {
                        input_school.style.borderRadius = '6px 6px 0px 0px';
                        search_output.style.display = 'block';

                        results.forEach(result => {
                            const school = document.createElement('button');
                                
                            const name = result.name;

                            school.classList.add('school-button');
                            school.textContent = name;

                            school.addEventListener('click', () => {
                                const schoolName = school.textContent;

                                input_school.value = schoolName;
                                selectedSchool = schoolName;

                                input_school.style.borderRadius = '6px 6px 6px 6px';
                                search_output.style.display = 'none';
                                search_output.innerHTML = '';
                            });

                            search_output.appendChild(school);
                        });
                    }
                })
                .catch(error => {
                    console.error('Fetch error: ', error);
                });
            } 
            else 
            {
                console.error('var input is empty or undefined!');
            }
        }
    });

    switch_sign_up.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../login.html';
    });

    sign_up.addEventListener('click', (event) => {
        const document_viewer = document.getElementById('document-view');

        fs.readFile(filePathToS, 'utf-8', (err, data) => {
            if (err)
            {
                console.error('Error reading file: ', err);
                document_viewer.value = 'Error loading the Terms of Service! Please contact us under raphael221@outlook.de';
            }
            else
            {
                document_viewer.value = data;
            }
        });

        background.style.display = 'block';
        tos_pop_up.style.display = 'block';
    });

    decline.addEventListener('click', () => {
        background.style.display = 'none';
        tos_pop_up.style.display = 'none';
    });

    tab_tos.addEventListener('click', () => {
        if (selectedTab != 'tos')
        {
            tab_pp.classList.remove('selected');
            tab_tos.classList.add('selected');

            const document_viewer = document.getElementById('document-view');
            selectedTab = 'tos';

            fs.readFile(filePathToS, 'utf-8', (err, data) => {
                if (err)
                {
                    console.error('Error reading file: ', err);
                    document_viewer.value = 'Error loading the Terms of Service! Please contact us under raphael221@outlook.de';
                }
                else
                {
                    document_viewer.value = data;
                }
            });
        }
    });

    tab_pp.addEventListener('click', () => {
        if (selectedTab != 'pp')
        {
            tab_tos.classList.remove('selected');
            tab_pp.classList.add('selected');

            const document_viewer = document.getElementById('document-view');
            selectedTab = 'pp';

            fs.readFile(filePathPP, 'utf-8', (err, data) => {
                if (err)
                {
                    console.error('Error reading file: ', err);
                    document_viewer.value = 'Error loading the Privacy Policy! Please contact us under raphael221@outlook.de';
                }
                else
                {
                    document_viewer.value = data;
                }
            });
        }
    });

    accept.addEventListener('click', () => {
        tos_pop_up.style.display = 'none';
        loader.style.display = 'block';
        const connection_error = document.getElementById('connection_error');

        const username = document.getElementById('username_input').value;
        const password = document.getElementById('password_input').value;
        const email = document.getElementById('email_input').value;
        
        const role_select = document.getElementById('role_select');
        const roleI = role_select.selectedIndex;
        const role = role_select.options[roleI].value;

        if (selectedSchool.length == 0)
        {
            selectedSchool = input_school.value;
        }
        
        dataToSendRegister = ({ username: username, password: password, email: email, role: role, school: selectedSchool });

        fetch(`${config.apiUrl}/user/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendRegister),
        })
        .then (response => {
            const register_error_message = document.getElementById('error_msg');
            const error_msg_undefined = document.getElementById('error_msg_undefined');

            if (response.status === 401)
            {
                background.style.display = 'none';
                register_error_message.style.right = '2%';

                setTimeout(() => {
                    register_error_message.style.right = '-35%';
                }, 10000);

                return;
            }
            else if (response.status === 500)
            {
                background.style.display = 'none';
                error_msg_undefined.style.right = '2%';

                setTimeout(() => {
                    error_msg_undefined.style.right = '-35%';
                }, 10000);
            }
            else if (response.status === 308)
            {
                if (role == 'teacher')
                {
                    store.set('tempUsername', username);
                    store.set('tempPassword', password);
                    store.set('tempEmail', email);
                    store.set('remember', remember_checkbox.checked)

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
            const accountCreated = data != null ? data.accountCreated : null;
            const userToken = data != null ? data.token : null;
            const role = "student";

            if (accountCreated == true)
            {
                store.set('username', username);                                                                          
                store.set('role', role);

                if (remember_checkbox.checked)
                {                    
                    store.set('authToken', userToken);
                    store.set('loggedIn', true);

                    window.location.href = '../../Home/index.html';
                }
                else
                {
                    window.location.href = '../../Home/index.html';
                }
            }
        })
        .catch(error => {
            background.style.display = 'none';
            console.error('Fetch error: ', error);
            connection_error.style.right = '2%';

            setTimeout(() => {
                connection_error.style.right = '-35%';
            }, 10000);
        });
    });

    ipcRenderer.on('registration-successfull', () => {
        window.location.href = '../../Home/index.html';
    });
});