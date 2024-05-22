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

    const profilePicWin = document.getElementById('profile_pic_win');
    const profilePicPrev = document.getElementById('profile_pic_prev');
    const uploadButton = document.getElementById('upload');
    const next = document.getElementById('next');

    const errorRegisterUsername = document.getElementById('error_register_username');
    const closeErrorRegisterUsername = document.getElementById('close_error_message_username');

    const errorRegisterUndefined = document.getElementById('error_register_undefined');
    const closeErrorRegisterUndefined = document.getElementById('close_error_message_undefined');

    const errorRegisterConnection = document.getElementById('error_register_connection');
    const closeErrorRegisterConnection = document.getElementById('close_error_message_connection');

    const errorStudentVerify = document.getElementById('error_register_student');
    const closeErrorStudentVerify = document.getElementById('close_error_message_student');

    let isPWVisible = false;
    let selectedSchool = '';
    let selectedTab = 'tos';
    let filePathProfilePic = '';

    const filePathToS = path.join(rootPathRegister, 'terms_of_service.txt');
    const filePathPP = path.join(rootPathRegister, 'privacy_policy.txt');
    
    show_pw.addEventListener('click', () => {
        if (!isPWVisible) {
            pw_input.type = 'text';
            isPWVisible = true;
            show_pw.style.display = 'none';
            hide_pw.style.display = 'block';
        }
    });

    hide_pw.addEventListener('click', () => {
        if (isPWVisible) {
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
        if (event.key = 'Escape') {
            input_school.style.borderRadius = '6px 6px 6px 6px';
            search_output.innerHTML = '';
            search_output.style.display = 'none';
        }
    });

    input_school.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            search_output.style.display = 'none';
            input_school.style.borderRadius = '6px 6px 6px 6px';

            search_output.innerHTML = '';

            const inputValue = input_school.value;
    
            if (inputValue !== '') {
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

                    if (results.length != 0) {
                        input_school.style.borderRadius = '6px 6px 0px 0px';
                        search_output.style.display = 'block';

                        results.forEach(result => {
                            const school = document.createElement('button');
                                
                            const name = result.schoolName;

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
                    errorRegisterConnection.style.display = 'flex';

                    closeErrorRegisterConnection.addEventListener('click', () => { errorRegisterConnection.style.display = 'none'; });
                });
            } 
            else {
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
            if (err) {
                console.error('Error reading file: ', err);
                document_viewer.value = 'Error loading the Terms of Service! Please contact us under raphael221@outlook.de';
                accept.disabled = true;
            }
            else {
                document_viewer.value = data;
            }
        });

        background.style.display = 'block';
        tos_pop_up.style.display = 'block';
    });

    decline.addEventListener('click', () => {
        background.style.display = 'none';
        tos_pop_up.style.display = 'none';
        accept.disabled = false;
    });

    tab_tos.addEventListener('click', () => {
        if (selectedTab != 'tos') {
            tab_pp.classList.remove('selected');
            tab_tos.classList.add('selected');

            const document_viewer = document.getElementById('document-view');
            selectedTab = 'tos';

            fs.readFile(filePathToS, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Error reading file: ', err);
                    document_viewer.value = 'Error loading the Terms of Service! Please contact us under raphael221@outlook.de';
                    accept.disabled = true;
                }
                else {
                    document_viewer.value = data;
                }
            });
        }
    });

    tab_pp.addEventListener('click', () => {
        if (selectedTab != 'pp') {
            tab_tos.classList.remove('selected');
            tab_pp.classList.add('selected');

            const document_viewer = document.getElementById('document-view');
            selectedTab = 'pp';

            fs.readFile(filePathPP, 'utf-8', (err, data) => {
                if (err)
                {
                    console.error('Error reading file: ', err);
                    document_viewer.value = 'Error loading the Privacy Policy! Please contact us under raphael221@outlook.de';
                    accept.disabled = true;
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
        profilePicWin.style.display = 'flex';
    });

    uploadButton.addEventListener('click', () => {
        ipcRenderer.send('open-file-dialog');

        ipcRenderer.on('selected-file', (event, filePath) => {
            filePathProfilePic = filePath;

            const prevImg = document.createElement('img');

            prevImg.src = filePath;
            prevImg.classList.add('profilePrevImg');

            profilePicPrev.appendChild(prevImg);
        });
    });

    next.addEventListener('click', async () => {
        const username = document.getElementById('username_input').value;
        const password = document.getElementById('password_input').value;
        const email = document.getElementById('email_input').value;
        const role_select = document.getElementById('role_select');
        const roleI = role_select.selectedIndex;
        const role = role_select.options[roleI].value;

        if (selectedSchool.length == 0) {
            selectedSchool = input_school.value;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('school', selectedSchool);

        if (filePathProfilePic != null && filePathProfilePic.length != 0) {
            const fileContent = fs.readFileSync(filePathProfilePic);
            const fileName = pathRegister.basename(filePathProfilePic);
            const fileType = pathRegister.extname(filePathProfilePic).toLowerCase();

            const mimeType =
                fileType === '.jpg' || fileType === '.jpeg'
                    ? 'image/jpeg'
                    : fileType === '.png'
                    ? 'image/png'
                    : null;

            if (mimeType) {
                formData.append('profilePic', new Blob([fileContent], { type: mimeType }), fileName);
            }
        }
        else {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');

            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            ctx.fillStyle = randomColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const initials = username
                .split(' ')
                .map((word) => word.charAt(0))
                .join('');

            const textX = canvas.width / 2;
            const textY = canvas.height / 2;

            ctx.fillText(initials.toUpperCase(), textX, textY);

            const blob = await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/png');
            });

            formData.append('profilePic', blob, `profile_pic_${username}.png`);
        }

        profilePicWin.style.display = 'none';
        loader.style.display = 'block';
        const connection_error = document.getElementById('connection_error');

        fetch(`${config.apiUrl}/user/register`, {
            method: "POST",
            body: formData,
        })
        .then (response => {
            if (response.status === 401) {
                background.style.display = 'none';
                loader.style.display = 'none';
                errorRegisterUsername.style.display = 'flex';

                closeErrorRegisterUsername.addEventListener('click', () => { errorRegisterUsername.style.display = 'none'; });
            }
            else if (response.status === 500) {
                background.style.display = 'none';
                loader.style.display = 'none';
                errorRegisterUndefined.style.display = 'flex';

                closeErrorRegisterUndefined.addEventListener('click', () => { errorRegisterUndefined.style.display = 'none'; });
            }
            else if (response.status === 400) {
                background.style.display = 'none';
                loader.style.display = 'none';
                errorRegisterUndefined.style.display = 'flex';

                closeErrorRegisterUndefined.addEventListener('click', () => { errorRegisterUndefined.style.display = 'none'; });
            }
            else if (response.status === 404) {
                background.style.display = 'none';
                loader.style.display = 'none';
                errorStudentVerify.style.display = 'flex';

                closeErrorStudentVerify.addEventListener('click', () => { errorStudentVerify.style.display = 'none'; });
            }
            else if (response.status === 308) {
                if (role == 'teacher') {
                    store.set('tempUsername', username);
                    store.set('tempPassword', password);
                    store.set('tempEmail', email);
                    store.set('remember', remember_checkbox.checked);

                    ipcRenderer.send('verify-teacher');
                }
                else if (role == 'developer') {
                    ipcRenderer.send('verify-dev');
                }
            }

            return response.json();
        })
        .then(data => {
            const accountCreated = data != null ? data.accountCreated : null;
            const userToken = data != null ? data.token : null;
            const role = "student";

            if (accountCreated == true) {
                store.set('username', username);
                store.set('role', role);
                store.set('school', selectedSchool);
                store.set('loggedIn', true);

                if (remember_checkbox.checked) {
                    store.set('authToken', userToken);

                    window.location.href = '../../Home/index.html';
                }
                else {
                    window.location.href = '../../Home/index.html';
                }
            }
        })
        .catch(error => {
            background.style.display = 'none';
            loader.style.display = 'none';
            console.error('Fetch error: ', error);
            errorRegisterConnection.style.display = 'flex';

            closeErrorRegisterConnection.addEventListener('click', () => { errorRegisterConnection.style.display = 'none'; });
        });
    });

    ipcRenderer.on('registration-successfull', () => {
        window.location.href = '../../Home/index.html';
    });
});