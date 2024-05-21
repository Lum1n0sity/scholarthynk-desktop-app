const rootPathEmailT = require('electron-root-path').rootPath;
const pathEmailT = require('path');
const {config, ipcRenderer, Store} = require(pathEmailT.join(rootPathEmailT, 'utils.js'));

document.addEventListener('DOMContentLoaded', () => {
	const store = new Store();

	const input_school = document.getElementById('school');
	const search_output = document.getElementById('search-output');
	const selected_school_container = document.getElementById('selected-school');

	const nextButtons = document.querySelectorAll('.next');
	const back = document.getElementById('back');

	let selectedSchool = '';
	let currentPage = 'school';

	nextButtons.forEach(next => {
		next.addEventListener('click', (event) => {
			if (currentPage == 'school' & selectedSchool.length != 0) {
				currentPage = 'email';

				const dataToSendEmailEnding = ({name: selectedSchool});

				fetch(`${config.apiUrl}/get-school-email`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(dataToSendEmailEnding)
				})
					.then(response => response.json())
					.then(data => {
						const emailEnding = data.ending[0].emailEnding;

						const emailPart2 = document.getElementById('part2-email');
						emailPart2.textContent = emailEnding;
					})
					.catch(error => {
						console.error('Fetch error: ', error);
					});

				const school = document.getElementById('school-select');
				const email = document.getElementById('send-email-div');

				school.style.display = 'none';
				email.style.display = 'block';
			} else if (currentPage == 'email') {
				const emailP1 = document.getElementById('part1-email').value;
				const emailP2 = document.getElementById('part2-email').textContent;

				const email = emailP1 + emailP2;

				const dataToSendStartVerifyTeacher = ({email: email, school: selectedSchool});

				console.log(dataToSendStartVerifyTeacher);

				fetch(`${config.apiUrl}/teacher-verify-code`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(dataToSendStartVerifyTeacher)
				})
					.then(response => {
						if (response.status == 404) {
							console.log('Email not found!');
						}

						return response.json();
					})
					.then(data => {
						console.log(data);
						const emailSend = data.emailSend;

						if (emailSend) {
							store.set('email', email);

							event.preventDefault();

							window.location.href = '../code/code.html';
						}

					})
					.catch(error => {
						console.error('Fetch error', error);
					});
			}
		});
	});

	back.addEventListener('click', () => {
		if (currentPage == 'email') {
			currentPage = 'school';

			const school = document.getElementById('school-select');
			const email = document.getElementById('send-email-div');

			school.style.display = 'block';
			email.style.display = 'none';
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			search_output.style.display = 'none';
			input_school.style.borderRadius = '6px 6px 6px 6px';

			input_school.value = '';
			search_output.innerHTML = '';
		}
	});

	input_school.addEventListener('focus', () => {
		selected_school_container.style.display = 'none';
	})

	input_school.addEventListener('keyup', (event) => {
		if (event.key === 'Enter') {
			search_output.style.display = 'none';
			input_school.style.borderRadius = '6px 6px 6px 6px';

			search_output.innerHTML = '';

			const inputValue = input_school.value;

			if (inputValue !== '') {
				const dataToSendSearchSchool = {input: inputValue};

				fetch(`${config.apiUrl}/search-school`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
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

								const name = result.name;

								school.classList.add('school-button');
								school.textContent = name;

								school.addEventListener('click', () => {
									const schoolName = school.textContent;
									selected_school_container.innerHTML = '';

									const selected_school_name = document.createElement('p');

									selected_school_name.textContent = schoolName;
									selected_school_container.style.display = 'flex';
									selected_school_container.appendChild(selected_school_name);

									search_output.style.display = 'none';
									input_school.style.borderRadius = '6px 6px 6px 6px';

									input_school.value = '';
									search_output.innerHTML = '';

									selectedSchool = schoolName;
									store.set('school', schoolName);
								});

								search_output.appendChild(school);
							});
						}
					})
					.catch(error => {
						console.error('Fetch error: ', error);
					});
			} else {
				console.error('var input is empty or undefined!');
			}
		}
	});
});