const rootPathLogin = require('electron-root-path').rootPath;
const pathLogin = require('path');
const {
  fs,
  WebSocket,
  ipcRenderer,
  Store,
  config,
  shell
} = require(pathLogin.join(rootPathLogin, 'utils.js'));

document.addEventListener('DOMContentLoaded', () => {
	const store = new Store();
	let authToken = store.get('authToken');
	const loggedOut = store.get('loggedOut');

	if (authToken != null) {
		authToken = JSON.parse(authToken);

		authToken = authToken.value;
	}

	const root = document.documentElement;

	/**
	 * Switches the appearance mode of the application between light and dark.
	 *
	 * This function retrieves the current mode from the store and toggles the appearance
	 * of various elements in the application based on the mode. If no mode is set in the store,
	 * it defaults to the dark mode.
	 */
	function switchAppearance() {
		const mode = store.get('mode');

		if (mode == null) {
			root.style.setProperty('--background', '#161616');
			root.style.setProperty('--primary', '#2F2F2F');
			root.style.setProperty('--selected-primary', '#454545c7');
			root.style.setProperty('--text-color', '#ffffff');
			root.style.setProperty('--alt-primary', '#1C1C1C');
		} else {
			if (mode === 'light') {
				root.style.setProperty('--background', '#E0E0E0');
				root.style.setProperty('--primary', '#CCCCCC');
				root.style.setProperty('--selected-primary', '#A0A0A0C7');
				root.style.setProperty('--text-color', '#000000');
				root.style.setProperty('--alt-primary', '#D8D8D8');
			} else {
				root.style.setProperty('--background', '#161616');
				root.style.setProperty('--primary', '#2F2F2F');
				root.style.setProperty('--selected-primary', '#454545c7');
				root.style.setProperty('--text-color', '#ffffff');
				root.style.setProperty('--alt-primary', '#1C1C1C');
			}
		}
	}

	switchAppearance();

	const connection_error = document.getElementById('connection_error');
	const login_error_message = document.getElementById('error_msg');

	const login_container = document.getElementById('login_container');

	if (authToken != null && loggedOut == false) {
		const dataToSendAutoLogin = ({token: authToken});
		connection_error.style.display = 'none';

		fetch(`${config.apiUrl}/user/auth`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendAutoLogin)
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				const allowLogin = data.allowLogin;
				const username = data.username;

				if (allowLogin == true) {
					store.set('username', username);

					store.set('loggedIn', true);

					window.location.href = '../Home/index.html';
				}
			})
			.catch(error => {
				login_container.style.borderRadius = '10px 0px 0px 0px';
				connection_error.style.display = 'block';
			});
	}

	const sign_in = document.getElementById('login');
	const switch_sign_up = document.getElementById('register_switch');

	const show_pw = document.getElementById('show_pw');
	const hide_pw = document.getElementById('hide_pw');
	const pw_input = document.getElementById('password_input');

	const remember_checkbox = document.getElementById('remember_checkbox');

	let isPWVisible = false;

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

	switch_sign_up.addEventListener('click', (event) => {
		event.preventDefault();

		window.location.href = './Register/register.html';
	});

	document.addEventListener('keydown', (event) => {
		const username = document.getElementById('username_input').value.trim();
		const password = document.getElementById('password_input').value;

		if (event.key == 'Enter' && username.length != 0 && password.length != 0) {
			connection_error.style.display = 'none';
			login_error_message.style.display = 'none';
			login_container.style.borderRadius = '10px 0px 0px 10px';

			const dataToSendLogin = ({username: username, password: password});

			fetch(`${config.apiUrl}/user/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSendLogin),
			})
				.then(response => {
					if (response.status === 401) {
						login_container.style.borderRadius = '10px 0px 0px 0px';
						login_error_message.style.display = 'block';
						return;
					}

					return response.json();
				})
				.then(data => {
					const allowLogin = data != null ? data.allowLogin : null;
					const userToken = data != null ? data.token : null;
					const role = data != null ? data.role : null;
					const school = data != null ? data.school : null;

					if (allowLogin != null && userToken != null) {
						if (allowLogin == true) {
							store.set('username', username);
							store.set('role', role);
							store.set('school', school);

							if (remember_checkbox.checked) {
								const data = {value: userToken};
								store.set('authToken', JSON.stringify(data));
								store.set('loggedIn', true);
							}

							window.location.href = '../Home/index.html';
						}
					}
				})
				.catch(error => {
					console.error('Fetch error: ', error);
					login_container.style.borderRadius = '10px 0px 0px 0px';
					connection_error.style.display = 'block';
				});
		}
	});

	sign_in.addEventListener('click', () => {
		const username = document.getElementById('username_input').value;
		const password = document.getElementById('password_input').value;

		connection_error.style.display = 'none';
		login_error_message.style.display = 'none';
		login_container.style.borderRadius = '10px 0px 0px 10px';

		const dataToSendLogin = ({username: username, password: password});

		fetch(`${config.apiUrl}/user/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendLogin),
		})
			.then(response => {
				if (response.status === 401) {
					login_container.style.borderRadius = '10px 0px 0px 0px';
					login_error_message.style.display = 'block';
					return;
				}

				return response.json();
			})
			.then(data => {
				const allowLogin = data != null ? data.allowLogin : null;
				const userToken = data != null ? data.token : null;
				const role = data != null ? data.role : null;
				const school = data != null ? data.school : null;

				if (allowLogin != null && userToken != null) {
					if (allowLogin == true) {
						store.set('username', username);
						store.set('role', role);
						store.set('school', school);

						if (remember_checkbox.checked) {
							const data = {value: userToken};
							store.set('authToken', JSON.stringify(data));
							store.set('loggedIn', true);
						}

						window.location.href = '../Home/index.html';
					}
				}
			})
			.catch(error => {
				console.error('Fetch error: ', error);
				login_container.style.borderRadius = '10px 0px 0px 0px';
				connection_error.style.display = 'block';
			});
	});
});
