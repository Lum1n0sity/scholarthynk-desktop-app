const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');

document.addEventListener('DOMContentLoaded', async () => {
	// * IMPORTANT variable selection
	const store = new Store();
	const api_addr = 'http://192.168.5.21:3000';
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

	/**
	 * Updates the user interface language based on the translations provided by i18next.
	 * This function selects elements with the 'data-i18n' attribute and updates their content or attributes
	 * with the corresponding translation from i18next.
	 */
	function updateUILanguage() {
		document.querySelectorAll('[data-i18n]').forEach((element) => {
			const key = element.getAttribute('data-i18n');
			const attribute = element.getAttribute('data-i18n-attr') || 'textContent';

			if (attribute === 'placeholder') {
				element.setAttribute(attribute, i18next.t(key));
			} else if (attribute === 'textContent') {
				element.textContent = i18next.t(key);
			} else {
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
					loadPath: `${__dirname}/../../Translation/{{lng}}.yaml`
				}
			},
			(err, t) => {
				if (err) {
					console.error('Error initializing i18next:', err);
					return;
				}

				updateUILanguage();
			});

	// * Send code

	const send_code = document.getElementById('send_code');

	send_code.addEventListener('click', () => {
		const code_input = document.getElementById('reset_code');

		const code = code_input.value;

		const dataToSendCode = ({code: code});

		fetch(`${api_addr}/user/auth/reset_code`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSendCode)
		})
			.then(response => response.json())
			.then(data => {
				const auth = data.auth;

				if (auth) {
					code_input.value = '';

					store.set('code', code);

					window.location.href = './newPassword/newPW.html'
				}
			})
			.catch(error => {
				console.error('Fetch error: ', error);
			});
	});
});