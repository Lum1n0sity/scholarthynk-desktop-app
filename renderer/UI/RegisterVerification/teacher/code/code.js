const rootPathCodeT = require('electron-root-path').rootPath;
const pathCodeT = require('path');
const { config, ipcRenderer, Store, fs } = require(pathCodeT.join(rootPathCodeT, 'utils.js'));

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();

    const next = document.getElementById('next');
    const back = document.getElementById('back');

    const code_inputs = document.querySelectorAll('.code-input');
    const tries_display = document.getElementById('tries-display');

    const return_register_page = document.getElementById('return-register-page');

    let filledInputCount = 0;
    let triesLeft = 3;

    tries_display.textContent = `: ${triesLeft}`;

    for (let i = 0; i < code_inputs.length; i++) 
    {
        code_inputs[i].addEventListener('input', function () {
            if (this.value.length >= 1) 
            {
                if (i < code_inputs.length - 1) 
                {
                    code_inputs[i + 1].focus();
                    filledInputCount++;
                }
            }
        });

        code_inputs[i].addEventListener('keydown', function (event) {
            if (event.key === 'Backspace' && i > 0 && this.value.length === 0) 
            {
                code_inputs[i - 1].focus();
                filledInputCount--;
            }
        });
    }

    code_inputs[code_inputs.length - 1].addEventListener('change', function () {
        if (this.value.trim() === '') 
        {
            filledInputCount--;
        }
    });

    document.addEventListener('keydown', (event) => {
        if (filledInputCount >= 5 && triesLeft != 0 || (event.key === 'Enter' && filledInputCount > 0 && triesLeft != 0)) 
        {
            setTimeout(verifyCode, 0);
        }
    });

    back.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '../email/email.html';
    });

    return_register_page.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '../../../Login/Register/register.html';
    });

    async function verifyCode() 
    {
        let allInputsFilled = true;
        for (let i = 0; i < code_inputs.length; i++) 
        {
            if (code_inputs[i].value.trim() === '') 
            {
                allInputsFilled = false;
                break;
            }
        }

        if (allInputsFilled) 
        {
            let codeStr = '';
            for (let i = 0; i < code_inputs.length; i++) 
            {
                codeStr += code_inputs[i].value.trim();
            }

            const code = parseInt(codeStr, 10);

            const rememberD = store.get('remember');

            console.log(rememberD);

            if (code != null) 
            {
                const school = store.get('school');;
                const username = store.get('tempUsername');
                const password = store.get('tempPassword');
                const register_email = store.get('tempEmail');
                const pathProfilePic = store.get('tempProfilePic');
                
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                formData.append('email', register_email);
                formData.append('school', school);
                formData.append('code', code);
                
                if (pathProfilePic != null) 
                {
                    const fileContent = fs.readFileSync(pathProfilePic);
                    const fileName = pathCodeT.basename(pathProfilePic);
                    const fileType = pathCodeT.extname(pathProfilePic).toLowerCase();
                
                    const mimeType =
                        fileType === '.jpg' || fileType === '.jpeg'
                            ? 'image/jpeg'
                            : fileType === '.png'
                            ? 'image/png'
                            : null;
                
                    if (mimeType) 
                    {
                        formData.append('profilePic', new Blob([fileContent], { type: mimeType }), fileName);
                    }
                } 
                else 
                {
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

                fetch(`${config.apiUrl}/verify-teacher-auth`, {
                    method: "POST",
                    body: formData
                })
                .then(response => {
                    if (response.status == 422) 
                    {
                        if (triesLeft != 0) 
                        {
                            triesLeft--;
                            if (triesLeft == 0)
                            {
                                tries_display.textContent = ': none';

                                for (let i = 0; i < code_inputs.length; i++)
                                {
                                    code_inputs[i].value = '';
                                    code_inputs[i].disabled = true;
                                }

                                resetVerification();

                                return_register_page.style.display = 'block';
                                return;
                            }
                            else
                            {
                                tries_display.textContent = `: ${triesLeft}`;
                            }
                        } 
                    }

                    return response.json();
                })
                .then(data => {
                    const accountCreated = data.accountCreated;
                    const userToken = data.token;
                    const role = data.role;
                    const remember = store.get('remember');
                        
                    if (accountCreated == true)
                    {
                        store.set('username', username);                                                                          
                        store.set('role', role);
        
                        if (remember)
                        {                    
                            store.set('authToken', userToken);
                            store.set('loggedIn', true);

                            resetVerification();
                            ipcRenderer.send('teacher-verified');
                        }
                        else
                        {
                            resetVerification();
                            ipcRenderer.send('teacher-verified');
                        }
                    }
                })
                .catch(error => {
                    console.error('Fetch error', error);
                });
            }
        }
    }

    function resetVerification()
    {
        const school = store.get('school');
        const email = store.get('email');

        const resetData = ({ school: school, email: email });

        fetch(`${config.apiUrl}/reset/teacher-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resetData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const resetSuccessfull = data.resetSuccessfull;

            if (resetSuccessfull)
            {
                store.delete('email');
                store.delete('tempUsername');
                store.delete('tempProfilePic');
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        })
    }
});