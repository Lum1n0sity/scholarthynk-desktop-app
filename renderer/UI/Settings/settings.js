const rootPathSettings = require('electron-root-path').rootPath;
const pathSettings = require('path');
const {ipcRenderer, Store, config, fs} = require(pathSettings.join(rootPathSettings, 'utils.js'));

document.addEventListener('DOMContentLoaded', async () => {
	const store = new Store();

	// * Get dummy password:

	const username = store.get('username');

	const dataToSendDisplayPassword = ({username: username});

	fetch(`${config.apiUrl}/user/display/password`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(dataToSendDisplayPassword)
	})
		.then(response => response.json())
		.then(data => {
			const password_edit = document.getElementById('password_edit');

			password_edit.value = data.dummy;
		})
		.catch(error => {
			console.error('Fetch error: ', error);
		});

	// * Load username:

	const username_display = document.getElementById('username');
	username_display.textContent = username;

	const username_edit = document.getElementById('username_edit');
	username_edit.textContent = username;

	// * Assign html elements:

	const account_nav = document.getElementById('account_nav');
	const privacy_safety_nav = document.getElementById('privacy_safety_nav');
	const appearance_nav = document.getElementById('appearance_nav');
	const help_nav = document.getElementById('help_nav');
	const dev_log_nav = document.getElementById('dev_log_nav');
	const close_settings = document.getElementById('close_settings');

	const account_settings = document.getElementById('account_settings');
	const privacy_safety = document.getElementById('privacy_safety');
	const appearance = document.getElementById('appearance');

	const light_mode = document.getElementById('light_mode');
	const dark_mode = document.getElementById('dark_mode');
	const lang_save = document.getElementById('lang_save');

	const background = document.getElementById('background');

	const account_remove_btn = document.getElementById('account_remove_btn');
	const warning_account = document.getElementById('warning_account');
	const cancel_delete = document.getElementById('cancel_delete');
	const delete_delete = document.getElementById('delete_delete');

	const ok_404 = document.getElementById('ok_404');
	const ok_500 = document.getElementById('ok_500');

	const username_edit_btn = document.getElementById('username_edit_btn');
	const edit_username = document.getElementById('edit_username');
	const cancel_edit_username = document.getElementById('cancel_edit_username');
	const change_edit_username = document.getElementById('change_edit_username');
	const username_409 = document.getElementById('username_409');

	const next = document.getElementById('next');
	const changeStart = document.getElementById('changeStart');
	const uploadButton = document.getElementById('upload');
	const profilePicWin = document.getElementById('profile_pic_win');
	const profilePicPrev = document.getElementById('profile_pic_prev');
	const profile_pic = document.getElementById('profile_pic');

	const password_edit_btn = document.getElementById('password_edit_btn');

	let updated = false;
	let filePathProfilePic = null;
	let pictureDisplayedPrev = false;

	// * Settings navbar:

	account_nav.addEventListener('click', () => {
		account_settings.style.display = 'block';
		privacy_safety.style.display = 'none';
		appearance.style.display = 'none';
	});

	privacy_safety_nav.addEventListener('click', () => {
		account_settings.style.display = 'none';
		privacy_safety.style.display = 'block';
		appearance.style.display = 'none';
	});

	appearance_nav.addEventListener('click', () => {
		account_settings.style.display = 'none';
		privacy_safety.style.display = 'none';
		appearance.style.display = 'block';

		const mode = store.get('mode');

		if (mode == 'light') {
			light_mode.style.backgroundColor = '#454545c7';
		} else if (mode == 'dark') {
			dark_mode.style.backgroundColor = '#454545c7';
		}
	});

	close_settings.addEventListener('click', (event) => {
		event.preventDefault();

		window.location.href = '../Home/index.html';
	});

	// * Appearance; lang selection and dark/light mode switch:

	lang_save.addEventListener('click', () => {
		const selectedLang = document.getElementById('lang_select').value;

		store.set('lang', selectedLang);
	});

	light_mode.addEventListener('click', () => {
		store.set('mode', 'light');
		light_mode.style.backgroundColor = '#454545c7';
		dark_mode.style.backgroundColor = 'transparent';
	});

	dark_mode.addEventListener('click', () => {
		store.set('mode', 'dark');
		light_mode.style.backgroundColor = 'transparent';
		dark_mode.style.backgroundColor = '#454545c7';
	});

	// * Account Profile Picture change:

	changeStart.addEventListener('click', () => {
		background.style.display = 'block';
		profilePicWin.style.display = 'flex';
	});

	uploadButton.addEventListener('click', () => {
		pictureDisplayedPrev = false;
		filePathProfilePic = null;
		profilePicPrev.innerHTML = '';

		ipcRenderer.send('open-file-dialog');

		ipcRenderer.on('selected-file', (event, filePath) => {
			while (!pictureDisplayedPrev) {
				filePathProfilePic = filePath;

				const prevImg = document.createElement('img');

				prevImg.src = filePath;
				prevImg.classList.add('profilePrevImg');

				profilePicPrev.appendChild(prevImg);
				pictureDisplayedPrev = true;
			}
		});
	});

	next.addEventListener('click', () => {
		if (filePathProfilePic != null) {
			const username = store.get('username');

			const formData = new FormData();

			formData.append('username', username);

			const fileContent = fs.readFileSync(filePathProfilePic);
			const fileName = pathSettings.basename(filePathProfilePic);
			const fileType = pathSettings.extname(filePathProfilePic).toLowerCase();

			const mimeType =
				fileType === '.jpg' || fileType === '.jpeg'
					? 'image/jpeg'
					: fileType === '.png'
						? 'image/png'
						: null;

			if (mimeType) {
				formData.append('profilePic', new Blob([fileContent], {type: mimeType}), fileName);
			}

			fetch(`${config.apiUrl}/update/profilePic`, {
				method: 'POST',
				body: formData,
			})
				.then(response => response.json())
				.then(data => {
					background.style.display = 'none';
					profilePicWin.style.display = 'none';

					const updated = data.updated;

					if (updated) {
						const username = {username: store.get('username')};

						fetch(`${configRenderer.apiUrl}/get/profilePic`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify(username),
						})
							.then(response => {
								if (!response.ok) {
									throw new Error('Network response was not ok');
								}
								return response.blob();
							})
							.then(blob => {
								filePathProfilePic = null;
								const imageUrl = URL.createObjectURL(blob);

								profile_pic.src = imageUrl;
							})
							.catch(error => {
								console.error('Fetch error: ', error);
							});
					}
				})
				.catch(error => {
					console.error('Fetch error: ', error);
				});
		} else {
			background.style.display = 'none';
			profilePicWin.style.display = 'none';
		}
	});

	// * Account; account removal, username/password change and password request:

	account_remove_btn.addEventListener('click', () => {
		warning_account.style.display = 'block';
		background.style.display = 'block';
	});

	cancel_delete.addEventListener('click', () => {
		warning_account.style.display = 'none';
		background.style.display = 'none';
	});

	delete_delete.addEventListener('click', () => {
		const dataToSendDeleteUser = ({username: username});

		fetch(`${config.apiUrl}/user/delete`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendDeleteUser)
		})
			.then(response => {
				if (response.status == 500) {
					warning_account.style.display = 'none';

					const error_delete_500 = document.getElementById('error_delete_500');

					error_delete_500.style.display = 'block';
				} else if (response.status == 404) {
					warning_account.style.display = 'none';

					const error_delete_404 = document.getElementById('error_delete_404');

					error_delete_404.style.display = 'block';
				}

				return response.json();
			})
			.then(data => {
				const deleted = data.userDeleted;
				const userNotFound = data.userFound;

				if (deleted && !userNotFound) {
					warning_account.style.display = 'none';
					background.style.display = 'none';

					store.set('authToken', null);
					store.set('loggedIn', false);

					window.location.href = '../Login/login.html';
				} else if (userNotFound) {
					const error_delete_404 = document.getElementById('error_delete_404');

					error_delete_404.style.display = 'block';
				}
			})
			.catch(error => {
				console.error('Fetch error: ', error);
			});
	});

	ok_404.addEventListener('click', () => {
		const error_delete_404 = document.getElementById('error_delete_404');

		error_delete_404.style.display = 'none';
		background.style.display = 'none';
	});

	ok_500.addEventListener('click', () => {
		const error_delete_500 = document.getElementById('error_delete_500');

		error_delete_500.style.display = 'none';
		background.style.display = 'none';
	});

	username_edit_btn.addEventListener('click', () => {
		edit_username.style.display = 'block';
		background.style.display = 'block';
	});

	cancel_edit_username.addEventListener('click', () => {
		edit_username.style.display = 'none';
		background.style.display = 'none';
	})

	change_edit_username.addEventListener('click', () => {
		const new_username = document.getElementById('new_username').value;

		const dataToSendNewUsername = ({newUsername: new_username, oldUsername: username});

		fetch(`${config.apiUrl}/user/change/username`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendNewUsername)
		})
			.then(response => {
				if (response.status == 409) {
					username_409.style.display = 'block';
				} else if (response.ok) {
					updated = true;
				}
			})
			.then(data => {
				if (updated) {
					edit_username.style.display = 'none';
					username_409.style.display = 'none';
					background.style.display = 'none';

					username_display.textContent = new_username;
					username_edit.textContent = new_username;
					store.set('username', new_username);
					updated = false;
				}
			})
			.catch(error => {
				console.error('Fetch error: ', error);
			});
	});

	// * Password reset:

	password_edit_btn.addEventListener('click', () => {
		const dataToSendStartReset = ({username: username})

		fetch(`${config.apiUrl}/user/reset-pw-start`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendStartReset)
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				const emailSend = data.emailSend;

				if (emailSend) {
					ipcRenderer.send('email-received');
				}
			})
			.catch(error => {
				console.error('Fetch error: ', error);
			});
	});

	// * Update dummy password after password reset

	ipcRenderer.on('update-dummy', () => {
		console.log('Test1234');
		const dataToSendDisplayPassword = ({username: username});

		fetch(`${config.apiUrl}/user/display/password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendDisplayPassword)
		})
			.then(response => response.json())
			.then(data => {
				const password_edit = document.getElementById('password_edit');

				password_edit.value = data.dummy;
			})
			.catch(error => {
				console.error('Fetch error: ', error);
			});
	});
}); 