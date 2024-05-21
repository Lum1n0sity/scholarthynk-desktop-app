const rootPathIndex = require('electron-root-path').rootPath;
const pathIndex = require('path');
const {
	fs,
	flatpickr,
	WebSocket,
	ipcRenderer,
	Store,
	config,
	Chart,
	shell
} = require(pathIndex.join(rootPathIndex, 'utils.js'));
const devConsoleClass = require('../console');
document.addEventListener('DOMContentLoaded', () => {
	const devConsole = new devConsoleClass('console_output');
	const store = new Store();
	const ws = new WebSocket(`${config.webSocket}`);

	store.delete('assignment');

	const forbiddenExtensions = ['.exe', '.sh', '.bat', '.cmd', '.com', '.jar'];

	ws.addEventListener('open', function (event) {
		ws.send(JSON.stringify({type: 'login', username: store.get('username')}));
	});

	const role = store.get('role');
	const lang = store.get('lang');

	const studentFeatures = document.getElementById('student');
	const teacherFeatures = document.getElementById('teacher');
	const devFeatures = document.getElementById('dev');

	const dev_list = document.getElementById('dev_list');

	// * User display
	const username_display = document.getElementById('username');
	const orga_role = document.getElementById('school_role');

	let loadedProfilePic;

	username_display.textContent = store.get('username');

	const usernameProfilePic = ({username: store.get('username')});

	getProfilePic(name)
		.then((profilePic) => {
			loadedProfilePic = profilePic;
		});

	const orga_role_text = `${store.get('school')} - ${role.charAt(0).toUpperCase() + role.slice(1)}`;
	orga_role.textContent = orga_role_text;

	const command_input = document.getElementById('command_input');
	const command_input_student = document.getElementById('command_input_student');
	const command_input_teacher = document.getElementById('command_input_teacher');

	// * Teacher student base:
	const students_list = document.getElementById('students-list');

	// * Dev Schools base:
	const schools_list = document.getElementById('schools_list');

	// * Student Role Dev Console Toggle
	const studentDevConsole = document.getElementById('toggle_console_student');

	if (role == 'student') {
		studentFeatures.style.display = 'block';
		studentDevConsole.style.display = 'none';
	} else if (role == 'teacher') {
		// * Get all students
		const school = store.get('school');
		const schoolName = ({school: school});

		getStudents()
			.then(students => {
				students.forEach(async (student) => {
					let isExpanded = false;

					const student_list_button = document.createElement('div');
					student_list_button.classList.add('student-list-button');

					student_list_button.textContent = student;

					student_list_button.addEventListener('click', async () => {
						student_list_button.classList.remove('expanded');
						try {
							const studentData = await getStudentsData(student, school);

							if (isExpanded) {
								student_list_button.classList.remove('expanded');
								isExpanded = false;

								const p_elements = student_list_button.querySelectorAll('.student-info-p');
								const buttons = student_list_button.querySelectorAll('.update-students');

								p_elements.forEach(element => {
									element.remove();
								});

								buttons.forEach(button => {
									button.remove();
								});
							} else {
								student_list_button.classList.add('expanded');
								isExpanded = true;

								const grade_p = document.createElement('p');
								const graduationYear_p = document.createElement('p');
								const update_student_btn = document.createElement('button');
								const gradebook_student_btn = document.createElement('button');

								if (lang == 'en') {
									grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
									graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
									update_student_btn.textContent = 'Update';
									gradebook_student_btn.textContent = "Gradebook";
								} else if (lang == 'de') {
									grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
									graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
									update_student_btn.textContent = 'Update';
									gradebook_student_btn.textContent = "Noten";
								}

								grade_p.classList.add('student-info-p');
								graduationYear_p.classList.add('student-info-p');
								update_student_btn.classList.add('button');
								update_student_btn.classList.add('update-students');
								gradebook_student_btn.classList.add('button');
								gradebook_student_btn.classList.add('update-students');

								gradebook_student_btn.style.marginLeft = '2%';

								update_student_btn.addEventListener('click', () => {
									openStudentManager();
								});

								gradebook_student_btn.addEventListener('click', async () => {
									await openGradebook(student);
								});

								student_list_button.appendChild(grade_p);
								student_list_button.appendChild(graduationYear_p);
								student_list_button.appendChild(update_student_btn);
								student_list_button.appendChild(gradebook_student_btn);
							}
						} catch (error) {
							console.error('Error loading student data: ', error);
						}
					});

					students_list.appendChild(student_list_button);
				});
			})

		teacherFeatures.style.display = 'block';
	} else if (role == 'developer') {
		// * Get all stored school names and display them in the schools list
		fetch(`${config.apiUrl}/dev/get-schools`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => response.json())
			.then(data => {
				const schools = data.schools;

				schools.forEach(school => {
					const schoolListItem = document.createElement('p');
					schoolListItem.classList.add('school-list-item');

					schoolListItem.textContent = school;

					schools_list.appendChild(schoolListItem);
				});
			})
			.catch(error => {
				devConsole.error('Fetch error');
				console.error('Fetch error: ', error);
			});

		devFeatures.style.display = 'block';

		fetch(`${config.apiUrl}/dev/load-devs`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => response.json())
			.then(data => {
				const usernames = data.usernames;

				usernames.forEach(name => {
					const developer = document.createElement('p');
					const remove_dev = document.createElement('button');

					developer.classList.add('developer-list-item');
					remove_dev.classList.add('remove-dev');

					developer.textContent = name;
					remove_dev.textContent = 'Remove';

					const username = name;

					remove_dev.addEventListener('click', () => {
						const requestDataRemove = ({username: username});
						fetch(`${config.apiUrl}/dev/remove-dev`, {
							method: 'DELETE',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify(requestDataRemove)
						})
							.then(response => response.json())
							.then(data => {
								const removed = data.removed;

								if (removed) {
									const pElements = dev_list.querySelectorAll('p');

									pElements.forEach(element => {
										if (element.textContent.trim() === `${username}Remove`) {
											element.remove();
										}
									});
								}
							})
							.catch(err => {
								devConsole.error('Fetch error');
								console.error('Fetch error', err);
							});
					});

					developer.appendChild(remove_dev);
					dev_list.appendChild(developer);
				})
			})
			.catch(err => {
				devConsole.error('Fetch error');
				console.error('Fetch error', err);
			});
	}

	const background = document.getElementById('background');

	// * -------------------------------------------------------------------------
	// * General functions / Most used requests
	/**
	 * Returns the profile picture URL for a given username.
	 *
	 * @param {string} name - The username.
	 * @returns {string} The profile picture URL.
	 */
	async function getProfilePic(name) {
		const username = {username: name};

		try {
			const response = await fetch(`${config.apiUrl}/get/profilePic`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(username),
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const blob = await response.blob();
			const imageUrl = URL.createObjectURL(blob);
			return imageUrl;
		} catch (error) {
			return '../../images/avatar.svg';
		}
	}

	/**
	 * Returns an array of all students in a specific school.
	 *
	 * @param {string} schoolName - The name of the school.
	 * @returns {Array<string>} An array of student names.
	 */
	async function getStudents() {
		try {
			const schoolName = store.get('school');

			const school = ({ school: schoolName });

			const response = await fetch(`${config.apiUrl}/teacher/get-students`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(school)
			});

			if (!response.ok) {
				throw new Error('Failed to fetch students');
			}

			const data = await response.json();
			const students = data.students;
			return students;
		} catch (error) {
			console.error('Fetch error: ', error);
			throw error;
		}
	}

	/**
	 * Returns information about a specific student.
	 *
	 * @param {string} student - The name of the student.
	 * @param {string} school - The name of the school.
	 * @returns {object} The student information.
	 */
	async function getStudentsData(student, school) {
		const studentQueryData = {student: student, school: school};

		try {
			const response = await fetch(`${config.apiUrl}/teacher/get-student-info`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(studentQueryData)
			});

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Fetch error: ', error);
			throw error;
		}
	}

	/**
	 * Generates a unique identifier for buttons.
	 *
	 * @returns {string} A unique identifier for buttons.
	 */
	function generateUniqueId() {
		return 'btn_' + Math.floor(Math.random() * 1000);
	}

	/**
	 * Retrieves text content recursively from an HTML element, excluding elements with a specific class name.
	 *
	 * @param {HTMLElement} element - The HTML element from which to retrieve text content.
	 * @param {string} excludeClassName - The class name of elements to be excluded from text retrieval.
	 * @returns {string} The text content retrieved recursively from the HTML element.
	 */
	function getTextContentRecursive(element, excludeClassName) {
		let textContent = '';

		for (const node of element.childNodes) {
			if (node.nodeType === 3) {
				textContent += node.textContent.trim();
			} else if (node.nodeType === 1 && !node.classList.contains(excludeClassName)) {
				textContent += getTextContentRecursive(node, excludeClassName);
			}
		}

		return textContent;
	}


	// * -------------------------------------------------------------------------
	// * -------------------------------------------------------------------------
	// ! Student:
	// * Assignment-Viewer:
	const assignment_container_student = document.getElementById('assignment_container');

	const errorInvalidFileType = document.getElementById('error_student_invalid_file');
	const closeErrorInvalidFileType = document.getElementById('close_error_message_invalid_file');

	/**
	 * Returns an array of all assignments for a specific student.
	 *
	 * @param {string} school - The name of the school.
	 * @param {string} student - The name of the student.
	 * @returns {Array<object>} An array of assignment objects.
	 */
	async function getAssignmentsStudent() {
		// * Prepare Request data:
		const getAssignmentsData = ({school: store.get('school'), name: store.get('username')});

		fetch(`${config.apiUrl}/student/get-assignments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(getAssignmentsData)
		})
			.then(response => response.json())
			.then(data => {
				// console.log(data)
				const assignments = data.assignments;

				let subjects = [];
				let sectionsCreated = [];

				for (let i = 0; i < assignments.length; i++) {
					subjects.push(assignments[i].subject);
				}

				subjects.forEach(subject => {
					if (!sectionsCreated.includes(subject)) {
						const container = document.createElement('div');
						const separator_wrapper = document.createElement('div');
						const separator_p1 = document.createElement('div');
						const separator_p = document.createElement('p');
						const separator_p2 = document.createElement('div');

						let classSubject = subject;

						if (subject.includes('_')) {
							subject = subject.replace(/ /g, ' ');
							let wordsArray = subject.split('_');

							for (let i = 0; i < wordsArray.length; i++) {
								if (wordsArray[i] !== 'and') {
									wordsArray[i] = wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1);
								}
							}

							subject = wordsArray.join(' ');
						} else {
							subject = subject.charAt(0).toUpperCase() + subject.slice(1);
						}

						if (subject == 'Physical Education') {
							separator_p.style.maxWidth = '35%';
						} else if (subject == 'Religious Studies/Ethics') {
							separator_p.style.maxWidth = '40%';
						}

						container.classList.add('assignments-subject-div');
						container.classList.add(`subject-${classSubject}`);
						separator_wrapper.classList.add('subject-separator-wrapper');
						separator_p1.classList.add('subject-separator-p1');
						separator_p.classList.add('subject-separator-p');
						separator_p2.classList.add('subject-separator-p2');

						separator_p.textContent = subject;

						separator_wrapper.appendChild(separator_p1);
						separator_wrapper.appendChild(separator_p);
						separator_wrapper.appendChild(separator_p2);
						container.appendChild(separator_wrapper);
						assignment_container_student.appendChild(container);

						sectionsCreated.push(classSubject);
					}
				});

				assignments.forEach(assignment => {
					const submitted = assignment.studentsSubmitted != null ? assignment.studentsSubmitted.includes(data.student.name) : false;
					const title = assignment.title;
					const desc = assignment.description;
					const due = assignment.dueDate;
					const assignmentSubject = assignment.subject;

					const assignmentElement = document.createElement('button');

					assignmentElement.classList.add('assignment');
					assignmentElement.textContent = title;

					assignmentElement.addEventListener('click', (event) => {
						if (assignmentElement.classList.contains('expanded') && !event.target.matches('.ignore')) {
							assignmentElement.classList.remove('expanded');
							assignmentElement.style.background = 'transparent';

							const p_elements = assignmentElement.querySelectorAll('p');
							const buttons = assignmentElement.querySelectorAll('button');

							p_elements.forEach(element => {
								element.remove();
							});

							buttons.forEach(element => {
								element.remove();
							});
						} else if (!event.target.matches('.add-file-assignment') && !event.target.matches('.ignore')) {
							assignmentElement.classList.add('expanded');
							assignmentElement.style.background = 'var(--selected-primary)';

							const description = document.createElement('p');
							const dueDate = document.createElement('p');
							const submittedElement = document.createElement('p');
							const addFile = document.createElement('button');

							description.textContent = desc;

							if (lang == 'en') {
								addFile.textContent = 'Add File';
								dueDate.textContent = `Due ${due}`;
								if (submitted) {
									submittedElement.textContent = `Submitted: Yes`;
								} else {
									submittedElement.textContent = `Submitted: No`;
								}
							} else if (lang == 'de') {
								addFile.textContent = 'Datei Hinzufügen';
								dueDate.textContent = `Bis ${due}`;
								if (submitted) {
									submittedElement.textContent = `Abgegeben: Ja`;
								} else {
									submittedElement.textContent = `Abgegeben: Nein`;
								}
							}

							addFile.classList.add('ignore');

							addFile.classList.add('button');
							addFile.classList.add('add-file-assignment');
							addFile.style.fontSize = '1vw';
							addFile.style.marginTop = '1%';

							description.style.marginTop = '1%';

							const filesDiv = document.createElement('div');
							filesDiv.classList.add('file-div');
							filesDiv.classList.add('ignore');

							const formData = new FormData();
							formData.append('school', store.get('school'));
							formData.append('assignment', title);
							formData.append('student', data.student.name);

							let submitButtonExists = false;
							const addFileHandler = () => {

								ipcRenderer.send('open-file-dialog');

								const fileButton = document.createElement('button');
								fileButton.classList.add('file-button');
								fileButton.classList.add('ignore');

								ipcRenderer.once('selected-file', (event, filePath) => {

									if (filePath != null && filePath.length != 0) {
										const fileContent = fs.readFileSync(filePath);
										const fileName = pathIndex.basename(filePath);
										const fileType = getFileExtension(filePath);

										if (!isForbiddenExtension(fileType)) {
											const mimeType = 'application/octet-stream';
											formData.append(`${fileName}`, new Blob([fileContent], {type: mimeType}), fileName);

											const fileIconImg = document.createElement('img');
											const fileNameP = document.createElement('p');

											submitButton = document.createElement('button');

											fileIconImg.classList.add('ignore');
											fileNameP.classList.add('ignore');
											submitButton.classList.add('button');

											const documentFileTypes = ['.txt', '.doc', '.docx', '.odt', '.rtf'];
											const audioFileTypes = ['.mp3', '.wav', '.ogg', '.flac'];
											const presentationFileTypes = ['.ppt', '.pptx'];

											if (documentFileTypes.includes(fileType)) {
												fileIconImg.src = '../../images/icons/document.svg';
											} else if (audioFileTypes.includes(fileType)) {
												fileIconImg.src = '../../images/icons/audio.svg';
											} else if (fileType == '.pdf') {
												fileIconImg.src = '../../images/icons/pdf.svg';
											} else if (presentationFileTypes.includes(fileType)) {
												fileIconImg.src = '../../images/icons/powerpoint.svg';
											} else {
												fileIconImg.src = '../../images/icons/mjml.svg';
											}

											fileNameP.textContent = fileName;
											submitButton.textContent = 'Submit';

											submitButton.style.fontSize = '1vw';
											submitButton.style.marginTop = '1%';

											fileButton.appendChild(fileIconImg);
											fileButton.appendChild(fileNameP);

											fileButton.addEventListener('click', () => {
												const fileToDelete = fileNameP.textContent;

												fileButton.remove();

												formData.delete(fileToDelete);

												let filesExist = false;
												for (const key of formData.keys()) {
													if (key !== 'school' && key !== 'assignment' && key !== 'username') {
														filesExist = true;
														break;
													}
												}

												if (!filesExist) {
													submitButton.remove();
												}
											});

											submitButton.addEventListener('click', () => {
												fetch(`${config.apiUrl}/student/submit-file`, {
													method: 'POST',
													body: formData
												})
													.then(response => response.json())
													.then(data => {
														console.log(data);
													})
													.catch(err => {
														console.error('Fetch error:', err);
													});
											});

											filesDiv.appendChild(fileButton);
											assignmentElement.appendChild(filesDiv);
											if (!submitButtonExists) {
												assignmentElement.appendChild(submitButton);
												submitButtonExists = true;
											}
										}
									} else {
										errorInvalidFileType.style.display = 'flex';

										closeErrorInvalidFileType.addEventListener('click', () => { errorInvalidFileType.style.display = 'none'; });
									}
								});
							};

							addFile.addEventListener('click', addFileHandler);

							assignmentElement.appendChild(description);
							assignmentElement.appendChild(dueDate);
							assignmentElement.appendChild(submittedElement);
							if (!submitted) {
								assignmentElement.appendChild(addFile);
							}
						}
					});

					const container = document.querySelector(`.subject-${assignmentSubject}`);
					container.appendChild(assignmentElement);
				});
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	}

	getAssignmentsStudent();

	/**
	 * Returns true if the given file extension is forbidden, false otherwise.
	 *
	 * @param {string} extension - The file extension to check.
	 * @returns {boolean} True if the extension is forbidden, false otherwise.
	 */
	function isForbiddenExtension(extension) {
		return forbiddenExtensions.includes(extension.toLowerCase());
	}

	/**
	 * Returns the lowercase extension of a file path.
	 *
	 * @param {string} filePath - The path of the file.
	 * @returns {string} The lowercase extension of the file.
	 */
	function getFileExtension(filePath) {
		return pathIndex.extname(filePath).toLowerCase();
	}


	// * -------------------------------------------------------------------------
	// * -------------------------------------------------------------------------
	// ! Teacher:
	// * Open / Close student manager:
	const update_students = document.getElementById('update_students');
	const student_manager = document.getElementById('student_manager');
	const close_student_manager = document.getElementById('close_student_manager');

	update_students.addEventListener('click', () => {
		openStudentManager();
	});

	// * Search students:
	const input_student = document.getElementById('search_student_input');

	input_student.addEventListener('keyup', (event) => {
		if (event.key === 'Enter') {
			students_list.innerHTML = '';

			const input = input_student.value;
			const school = store.get('school');

			const queryData = ({input: input, school: school});

			fetch(`${config.apiUrl}/teacher/search-student`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(queryData)
			})
				.then(response => response.json())
				.then(data => {
					const searchResults = data.searchResults;

					if (searchResults.length != 0) {
						searchResults.forEach(result => {
							const student_list_button = document.createElement('button');
							student_list_button.classList.add('student-list-button');

							student_list_button.textContent = result.name;

							let isExpanded = false;

							student_list_button.addEventListener('click', async () => {
								student_list_button.classList.remove('expanded');
								try {
									const studentData = await getStudentsData(result.name, school);

									if (isExpanded) {
										isExpanded = false;

										const p_elements = student_list_button.querySelectorAll('.student-info-p');
										const buttons = student_list_button.querySelectorAll('.update-students');

										p_elements.forEach(element => {
											element.remove();
										});

										buttons.forEach(button => {
											button.remove();
										})
									} else {
										student_list_button.classList.add('expanded');
										isExpanded = true;

										const grade_p = document.createElement('p');
										const graduationYear_p = document.createElement('p');
										const update_student_btn = document.createElement('button');
										const gradebook_student_btn = document.createElement('button');

										if (lang == 'en') {
											grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
											graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
											update_student_btn.textContent = 'Update';
											gradebook_student_btn.textContent = "Gradebook";
										} else if (lang == 'de') {
											grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
											graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
											update_student_btn.textContent = 'Update';
											gradebook_student_btn.textContent = 'Noten';
										}

										grade_p.classList.add('student-info-p');
										graduationYear_p.classList.add('student-info-p');
										update_student_btn.classList.add('button');
										update_student_btn.classList.add('update-students');
										gradebook_student_btn.classList.add('button');
										gradebook_student_btn.classList.add('update-students');

										gradebook_student_btn.style.marginLeft = '2%';

										update_student_btn.addEventListener('click', () => {
											openStudentManager();
										});

										gradebook_student_btn.addEventListener('click', async () => {
											await openGradebook(result.name);
										});

										student_list_button.appendChild(grade_p);
										student_list_button.appendChild(graduationYear_p);
										student_list_button.appendChild(update_student_btn);
										student_list_button.appendChild(gradebook_student_btn);
									}
								} catch (error) {
									console.error('Error loading student data: ', error);
								}
							});

							students_list.appendChild(student_list_button);
						});
					}
				})
				.catch(error => {
					console.error('Fetch error: ', error);
				});
		}
	});

	/**
	 * Opens the student manager interface asynchronously.
	 *
	 * This function displays the student manager interface along with background,
	 * loads student data, and dynamically creates buttons for each student.
	 * It also allows expanding student details and performing actions like editing
	 * or deleting students.
	 */
	async function openStudentManager() {
		let isExpanded = false;

		student_manager.style.display = 'block';
		background.style.display = 'block';

		// * Load students:

		const school = store.get('school');
		const studentsResult = await getStudents();

		const students = studentsResult;

		const gradeDivs = Array.from({length: 10}, (_, index) => document.getElementById(`grade_${index + 1}`));

		for (const student of students) {
			const name = student;

			const student_list_button = document.createElement('button');
			student_list_button.classList.add('student-list-button');
			student_list_button.classList.add('student-manager-student')
			student_list_button.classList.add('draggable');

			student_list_button.id = generateUniqueId();

			student_list_button.setAttribute('draggable', true);

			student_list_button.textContent = name;

			const studentData = await getStudentsData(name, school);

			student_list_button.addEventListener('dragstart', (event) => {
				drag(event);
			});

			student_list_button.addEventListener('click', async () => {
				student_list_button.classList.remove('expanded');
				try {
					const studentData = await getStudentsData(name, school);

					if (isExpanded) {
						student_list_button.classList.remove('expanded');
						isExpanded = false;

						const p_elements = student_list_button.querySelectorAll('.student-info-p');
						const button = student_list_button.querySelectorAll('.button');

						p_elements.forEach(element => {
							element.remove();
						});

						button.forEach(element => {
							element.remove();
						});
					} else {
						student_list_button.classList.add('expanded');
						isExpanded = true;

						const grade_p = document.createElement('p');
						const graduationYear_p = document.createElement('p');
						const btn_div = document.createElement('div');
						const edit_btn = document.createElement('button');
						const delete_btn = document.createElement('button');

						if (lang == 'en') {
							grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
							graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
							edit_btn.textContent = 'Edit';
							delete_btn.textContent = 'Delete';
						} else if (lang == 'de') {
							grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
							graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
							edit_btn.textContent = 'Bearbeiten';
							delete_btn.textContent = 'Löschen';
						}

						grade_p.classList.add('student-info-p');
						grade_p.classList.add('exclude');
						graduationYear_p.classList.add('student-info-p');
						graduationYear_p.classList.add('exclude');
						btn_div.classList.add('btn-div');
						edit_btn.classList.add('update-students');
						edit_btn.classList.add('button');
						edit_btn.classList.add('edit-student-manager');
						edit_btn.classList.add('exclude');
						delete_btn.classList.add('delete-student');
						delete_btn.classList.add('button');
						delete_btn.classList.add('exclude');

						edit_btn.addEventListener('click', () => {
							const student_name = getTextContentRecursive(student_list_button, 'exclude');

							openStudentEditor(student_name);
						});

						delete_btn.addEventListener('click', () => {
							const student_name = getTextContentRecursive(student_list_button, 'exclude');

							openDeleteWarning(student_name);
						});


						btn_div.appendChild(edit_btn);
						btn_div.appendChild(delete_btn);

						student_list_button.appendChild(grade_p);
						student_list_button.appendChild(graduationYear_p);
						student_list_button.appendChild(btn_div);
					}
				} catch (error) {
					console.error('Error loading student data: ', error);
				}
			});

			const gradeDiv = gradeDivs[studentData.studentInfo.grade - 1];

			if (gradeDiv) {
				const existingButton = gradeDiv.querySelector('.add-student');

				gradeDiv.insertBefore(student_list_button, existingButton);
			} else {
				console.error(`Invalid grade: ${studentData.studentInfo.grade}`);
			}
		}
	}

	close_student_manager.addEventListener('click', () => {
		student_manager.style.display = 'none';
		background.style.display = 'none';

		//* Unload students:
		const students = document.querySelectorAll('.student-manager-student');

		students.forEach(element => {
			element.remove();
		});
	});

	/**
	 * Allows dropping elements by preventing the default behavior of the event.
	 *
	 * @param {Event} event - The dragover event.
	 */
	function allowDrop(event) {
		event.preventDefault();
	}

	/**
	 * Initiates a drag operation for draggable elements.
	 *
	 * @param {DragEvent} event - The dragstart event.
	 */
	function drag(event) {
		if (event.target.classList.contains('draggable')) {
			event.dataTransfer.setData('text', event.target.id)
		}
	}

	const gradeDivs = document.querySelectorAll('.grade');

	/**
	 * Handles the dropping of draggable elements into valid drop targets.
	 *
	 * @param {DragEvent} event - The drop event.
	 */
	function drop(event) {
		event.preventDefault();
		var data = event.dataTransfer.getData('text');
		var draggableElement = document.getElementById(data);

		if (draggableElement.classList.contains('draggable') && event.target.classList.contains('valid-drop-target')) {
			const existingButton = event.target.querySelector('.add-student');
			event.target.insertBefore(draggableElement, existingButton);

			const school = store.get('school');
			const student = draggableElement.textContent;
			const gradeRaw = event.target.id;

			const gradeNumber = parseInt(gradeRaw.replace(/^grade_/, ''), 10);

			updateStudentData(student, school, gradeNumber);
		}
	}

	gradeDivs.forEach(div => {
		div.addEventListener('dragover', (event) => {
			allowDrop(event);
		});

		div.addEventListener('drop', (event) => {
			drop(event);
		});
	});

	/**
	 * Updates student data by sending a request to the server.
	 *
	 * @param {string} student - The name of the student to update.
	 * @param {string} school - The name of the school the student belongs to.
	 * @param {number} grade - The grade of the student.
	 */
	function updateStudentData(student, school, grade) {
		const updateData = ({student: student, school: school, grade: grade});

		fetch(`${config.apiUrl}/teacher/update-student-info`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		});
	}

	const open_add_student_btns = document.querySelectorAll('.add-student');
	const add_student_win = document.getElementById('add_student_win');
	const close_student_win = document.getElementById('close_add_student');
	const add_student = document.getElementById('add-student-data');

	open_add_student_btns.forEach(button => {
		button.addEventListener('click', () => {
			add_student_win.style.display = 'block';

			const grade_input = document.getElementById('student_grade');

			const classList = button.classList;

			let gradeNumber = null;

			for (const className of classList) {
				if (className.startsWith('grade_')) {
					gradeNumber = parseInt(className.replace(/^grade_/, ''), 10);
					break;
				}
			}

			grade_input.value = gradeNumber;
		});
	})

	close_student_win.addEventListener('click', () => {
		add_student_win.style.display = 'none';
	});

	add_student.addEventListener('click', async () => {
		const name = document.getElementById('student_name').value;
		const grade = document.getElementById('student_grade').value;
		const school = store.get('school');

		const studentData = ({name: name, grade: grade, school: school});

		fetch(`${config.apiUrl}/teacher/add-student`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(studentData)
		})
			.then(response => response.json())
			.then(data => {
				addStudent(name, school, grade);
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	});

	/**
	 * Adds a new student to the student list and updates the interface.
	 *
	 * @param {string} name - The name of the new student.
	 * @param {string} school - The name of the school the student belongs to.
	 * @param {number} grade - The grade of the new student.
	 */
	async function addStudent(name, school, grade) {
		const gradeDiv = document.getElementById(`grade_${grade}`);

		const student_list_button = document.createElement('button');
		student_list_button.classList.add('student-list-button');
		student_list_button.classList.add('student-manager-student')
		student_list_button.classList.add('draggable');

		student_list_button.id = generateUniqueId();

		student_list_button.setAttribute('draggable', true);

		student_list_button.textContent = name;

		student_list_button.addEventListener('dragstart', (event) => {
			drag(event);
		});

		student_list_button.addEventListener('click', async () => {
			student_list_button.classList.remove('expanded');
			try {
				const studentData = await getStudentsData(name, school);

				if (isExpanded) {
					student_list_button.classList.remove('expanded');
					isExpanded = false;

					const p_elements = student_list_button.querySelectorAll('.student-info-p');
					const button = student_list_button.querySelectorAll('.button');

					p_elements.forEach(element => {
						element.remove();
					});

					button.forEach(element => {
						element.remove();
					});
				} else {
					student_list_button.classList.add('expanded');
					isExpanded = true;

					const grade_p = document.createElement('p');
					const graduationYear_p = document.createElement('p');
					const btn_div = document.createElement('div');
					const edit_btn = document.createElement('button');
					const delete_btn = document.createElement('button');

					if (lang == 'en') {
						grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
						graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
						edit_btn.textContent = 'Edit';
						delete_btn.textContent = 'Delete';
					} else if (lang == 'de') {
						grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
						graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
						edit_btn.textContent = 'Bearbeiten';
						delete_btn.textContent = 'Löschen';
					}

					grade_p.classList.add('student-info-p');
					grade_p.classList.add('exclude');
					graduationYear_p.classList.add('student-info-p');
					graduationYear_p.classList.add('exclude');
					btn_div.classList.add('btn-div');
					edit_btn.classList.add('update-students');
					edit_btn.classList.add('button');
					edit_btn.classList.add('edit-student-manager');
					edit_btn.classList.add('exclude');
					delete_btn.classList.add('delete-student');
					delete_btn.classList.add('button');
					delete_btn.classList.add('exclude');

					edit_btn.addEventListener('click', () => {
						const student_name = getTextContentRecursive(student_list_button, 'exclude');

						openStudentEditor(student_name);
					});

					delete_btn.addEventListener('click', () => {
						const student_name = getTextContentRecursive(student_list_button, 'exclude');

						openDeleteWarning(student_name);
					});

					btn_div.appendChild(edit_btn);
					btn_div.appendChild(delete_btn);

					student_list_button.appendChild(grade_p);
					student_list_button.appendChild(graduationYear_p);
					student_list_button.appendChild(btn_div);
				}
			} catch (error) {
				console.error('Error loading student data: ', error);
			}
		});

		const add_student = gradeDiv.querySelector('.add-student');

		gradeDiv.insertBefore(student_list_button, add_student);
	}

	const edit_student_win = document.getElementById('edit_student_win');
	const close_edit_win = document.getElementById('close_edit_student');
	const update_student_data = document.getElementById('edit-student-data');

	/**
	 * Opens the student editor window and loads data for the specified student.
	 *
	 * @param {string} name - The name of the student to edit.
	 */
	async function openStudentEditor(name) {
		edit_student_win.style.display = 'block';

		// * Load student data
		const school = store.get('school');

		const studentData = await getStudentsData(name, school);

		const name_input = document.getElementById('student_name_edit');
		const grade_input = document.getElementById('student_grade_edit');
		const year_input = document.getElementById('student_grad_year_edit');

		name_input.value = name;
		grade_input.value = studentData.studentInfo.grade;
		year_input.value = studentData.studentInfo.expectedGraduationYear;
	}

	close_edit_win.addEventListener('click', () => {
		edit_student_win.style.display = 'none';

		// * Unload data
		const name_input = document.getElementById('student_name_edit');
		const grade_input = document.getElementById('student_grade_edit');
		const year_input = document.getElementById('student_grad_year_edit');

		name_input.value = '';
		grade_input.value = '';
		year_input.value = '';
	});

	update_student_data.addEventListener('click', () => {
		const school = store.get('school');
		const name = document.getElementById('student_name_edit').value;
		const grade = document.getElementById('student_grade_edit').value;
		const year = document.getElementById('student_grad_year_edit').value;

		const updatedData = ({school: school, name: name, grade: grade, year: year});

		fetch(`${config.apiUrl}/teacher/update-student`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updatedData)
		})
			.then(response => response.json())
			.then(data => {
				const updated = data.updated;
				const grade_updated = data.grade;

				if (updated) {
					const buttons = student_manager.querySelectorAll('button');

					let student;
					buttons.forEach(button => {
						if (button.textContent.trim() === name) {
							student = button;
						}
					});

					const gradeDiv = document.getElementById(`grade_${grade_updated}`);
					const add_student = gradeDiv.querySelector('.add-student');

					gradeDiv.insertBefore(student, add_student);

					edit_student_win.style.display = 'none';

					// * Unload data
					const name_input = document.getElementById('student_name_edit');
					const grade_input = document.getElementById('student_grade_edit');
					const year_input = document.getElementById('student_grad_year_edit');

					name_input.value = '';
					grade_input.value = '';
					year_input.value = '';
				}
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	});

	const delete_warning = document.getElementById('delete_warning');
	const delete_warning_cancel = document.getElementById('delete_warning_cancel');
	const delete_warning_delete = document.getElementById('delete_warning_delete');

	/**
	 * Opens a warning window for deleting a student and stores the student's name for deletion.
	 *
	 * @param {string} name - The name of the student to be deleted.
	 */
	function openDeleteWarning(name) {
		delete_warning.style.display = 'block';
		store.set('delete-student', name);
	}

	delete_warning_cancel.addEventListener('click', () => {
		delete_warning.style.display = 'none';
	});

	delete_warning_delete.addEventListener('click', () => {
		const name = store.get('delete-student');
		const school = store.get('school');

		if (name.length != 0) {
			store.delete('delete-student');

			const studentRemoveData = ({school: school, name: name});

			fetch(`${config.apiUrl}/teacher/delete-student`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(studentRemoveData)
			})
				.then(response => response.json())
				.then(data => {
					const removed = data.removed;

					if (removed) {
						delete_warning.style.display = 'none';

						const buttons = student_manager.querySelectorAll('button');

						let student;
						buttons.forEach(button => {
							if (button.textContent.trim() === name) {
								student = button;
							}
						});

						student.remove();
					}
				})
				.catch(err => {
					console.error('Fetch error: ', err);
				});
		} else {
			delete_warning.style.display = 'none';
		}
	});


	// * --------------------------------------------------------------------------
	// * Assignment Manager
	const assignment_container = document.getElementById('assingnment_container');

	// * Add Assignment vars
	const open_add_assignment = document.getElementById('open_add_assingnment');
	const add_assignment_win = document.getElementById('add_assignment_win');
	const close_add_assignment = document.getElementById('close_add_assignment');
	const create_assignment = document.getElementById('add_assignment');
	const search_student = document.getElementById('search_students_assignment');
	const search_student_output = document.getElementById('search_output');
	const student_display = document.getElementById('student_display');

	// * Delete Assignment vars
	const remove_assignment_win = document.getElementById('remove_assignment_win');
	const cancel_delete_assignment = document.getElementById('cancel_delete_assignment');
	const confirm_delete_assignment = document.getElementById('confirm_delete_assignment');

	// * Update Assignment vars
	const update_assigment_win = document.getElementById('update_assignment_win');
	const close_update_assignment = document.getElementById('close_update_assignment');
	const update_assignment = document.getElementById('update_assignment');
	const search_student_update = document.getElementById('search_students_assignment_update');
	const search_student_output_update = document.getElementById('search_output_update');

	// * Error Messages Assignments
	const error_assignment_duplicate = document.getElementById('error_assignment_duplicate');
	const close_error_message = document.getElementById('close_error_message');

	let assignedStudentsArray = [];

	// * Assign Input for Date Picker
	flatpickr('#due_date_assignment', {
		minDate: 'today',
		dateFormat: 'd.m.Y',
	});

	flatpickr('#due_date_assignment_update', {
		minDate: 'today',
		dateFormat: 'd.m.Y',
	});

	// * Load Assignments
	/**
	 * Retrieves assignments data from the server and dynamically creates buttons for each assignment.
	 *
	 * This function sends a request to the server to get assignments data for the current school.
	 * It then dynamically creates buttons for each assignment, allowing the user to expand each assignment
	 * to view details such as description, subject, assigned students, and due date. Additionally, it provides
	 * functionality to update, remove, and view results for each assignment.
	 */
	function getAssignments() {
		const assignmentsRequestData = ({school: store.get('school')});

		fetch(`${config.apiUrl}/teacher/get-assignments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(assignmentsRequestData)
		})
			.then(response => response.json())
			.then(data => {
				const assignments = data.assignments;

				assignments.forEach(assignment => {
					const title = assignment.title;

					const assignmentElement = document.createElement('button');

					assignmentElement.classList.add('assignment');
					assignmentElement.textContent = title;

					assignmentElement.addEventListener('click', () => {
						if (assignmentElement.classList.contains('expanded')) {
							assignmentElement.classList.remove('expanded');
							assignmentElement.style.background = 'transparent';

							const p_elements = assignmentElement.querySelectorAll('p');
							const buttons = assignmentElement.querySelectorAll('button');

							p_elements.forEach(element => {
								element.remove();
							});

							buttons.forEach(element => {
								element.remove();
							});
						} else {
							assignmentElement.classList.add('expanded');
							assignmentElement.style.background = 'var(--selected-primary)';

							const description = document.createElement('p');
							const subject = document.createElement('p');
							const assignedStudents = document.createElement('p');
							const dueDate = document.createElement('p');
							const update = document.createElement('button');
							const viewResults = document.createElement('button');
							const remove = document.createElement('button');

							let subjectText = '';

							if (assignment.subject.includes('_')) {
								subjectText = assignment.subject.replace(/_/g, ' ');

								let wordsArray = subjectText.split(' ');

								for (let i = 0; i < wordsArray.length; i++) {
									if (wordsArray[i] !== 'and') {
										wordsArray[i] = wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1);
									}
								}

								subjectText = wordsArray.join(' ');
							} else {
								subjectText = assignment.subject.charAt(0).toUpperCase() + assignment.subject.slice(1);
							}

							description.textContent = assignment.description;
							subject.textContent = subjectText;
							assignedStudents.textContent = assignment.students.join(', ');
							dueDate.textContent = assignment.dueDate;
							update.textContent = 'Update';

							if (lang == 'en') {
								remove.textContent = 'Remove';
								viewResults.textContent = 'Results';
							} else {
								remove.textContent = 'Entfernen';
								viewResults.textContent = 'Ergebnisse';
							}

							update.classList.add('button');
							viewResults.classList.add('button');
							remove.classList.add('delete-assignment');
							remove.classList.add('button');

							description.style.marginTop = '1%';
							update.style.fontSize = '1.1vw';
							update.style.marginTop = '1%';
							viewResults.style.fontSize = '1.1vw';
							viewResults.style.marginTop = '1%';
							viewResults.style.marginLeft = '2%';

							remove.addEventListener('click', () => {
								store.set('assignment', assignment.title);

								remove_assignment_win.style.display = 'block';
								background.style.display = 'block';
							});

							update.addEventListener('click', () => {
								const students = assignment.students;

								openUpdateAssignmentWin(assignment.title, description.textContent, dueDate.textContent, students, subject.textContent);
							});

							viewResults.addEventListener('click', () => {
								openResultsViewer(assignment.title);
							});

							assignmentElement.appendChild(description);
							assignmentElement.appendChild(subject);
							assignmentElement.appendChild(assignedStudents);
							assignmentElement.appendChild(dueDate);
							assignmentElement.appendChild(update);
							assignmentElement.appendChild(viewResults);
							assignmentElement.appendChild(remove);
						}
					});

					assignment_container.appendChild(assignmentElement);
				});
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	}

	getAssignments();

	// * Add Assignment:
	open_add_assignment.addEventListener('click', () => {
		add_assignment_win.style.display = 'flex';
		background.style.display = 'block';
		student_display.innerHTML = '';
	});

	close_add_assignment.addEventListener('click', () => {
		// * Clear inputs:
		const title_assignment = document.getElementById('input_title');
		const desc_assignment = document.getElementById('input_description');
		const search_student = document.getElementById('search_students_assignment');
		const due_date_assignment = document.getElementById('due_date_assignment');

		title_assignment.value = '';
		desc_assignment.value = '';
		search_student.value = '';
		due_date_assignment.value = '';
		student_display.innerHTML = '';

		search_student.style.borderRadius = '6px';
		search_student_output.innerHTML = '';
		search_student_output.style.display = 'none';
		add_assignment_win.style.height = '60%';
		search_student_output.style.bottom = '2%';
		student_display.style.display = 'none';
		add_assignment_win.style.height = '70%',

			// * Hide popup:
			add_assignment_win.style.display = 'none';
		background.style.display = 'none';
	});

	search_student.addEventListener('keypress', (event) => {
		search_student.style.borderRadius = '6px';
		search_student_output.innerHTML = '';
		search_student_output.style.display = 'none';

		if (event.key == 'Enter') {
			const search_content = search_student.value;

			if (search_content.length != 0) {
				timeOutId = null;

				// * Prepare data for Request
				const school = store.get('school');

				const searchData = ({school: school, search: search_content});

				fetch(`${config.apiUrl}/teacher/assignment/search-student`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(searchData)
				})
					.then(response => response.json())
					.then(data => {
						const search_output = data.searchResults;
						search_student.style.borderRadius = '6px 6px 0px 0px';
						search_student_output.style.display = 'block';

						search_output.forEach((output) => {
							const name = output.name;

							const chip = document.createElement('button');

							const chipProfilePic = document.createElement('img');
							const chipName = document.createElement('p');

							chip.classList.add('chip-select');
							chipProfilePic.classList.add('chip-img');
							chipName.classList.add('chip-name');

							chipName.textContent = name;

							getProfilePic(name)
								.then((profilePic) => {
									chipProfilePic.src = profilePic;
									chip.appendChild(chipProfilePic);
									chip.appendChild(chipName);

									chip.addEventListener('click', () => {
										search_student.style.borderRadius = '6px';
										search_student_output.innerHTML = '';
										search_student_output.style.display = 'none';
										add_assignment_win.style.height = '78%';
										search_student_output.style.bottom = '10%';
										assignmentAddStudent(name, profilePic);
									});

									search_student_output.appendChild(chip);
								});
						});
					})
					.catch(err => {
						console.error('Fetch error: ', err);
					});
			}
		}
	});

	/**
	 * Displays a student in the assignment editor and adds them to the list of assigned students.
	 *
	 * @param {string} name - The name of the student to be displayed and added.
	 * @param {string} profilePic - The URL of the profile picture of the student.
	 */
	function assignmentAddStudent(name, profilePic) {
		student_display.style.display = 'inline-flex';

		if (assignedStudentsArray.indexOf(name) == -1) {
			assignedStudentsArray.push(name);

			const chip = document.createElement('button');
			const chipProfilePic = document.createElement('img');
			const chipName = document.createElement('p');
			const chipRemove = document.createElement('span');

			chip.classList.add('chip-account');
			chipProfilePic.classList.add('chip-img');
			chipName.classList.add('chip-name');
			chipRemove.classList.add('material-symbols-rounded');
			chipRemove.classList.add('chip-span');

			chipProfilePic.src = profilePic;
			chipName.textContent = name;
			chipRemove.textContent = 'close';

			chip.appendChild(chipProfilePic);
			chip.appendChild(chipName);
			chip.appendChild(chipRemove);

			chip.addEventListener('click', () => {
				const name = chip.querySelector('.chip-name').textContent;
				assignedStudentsArray = assignedStudentsArray.filter(item => item !== name);
				chip.remove();
			});

			student_display.appendChild(chip);
		}
	}

	create_assignment.addEventListener('click', () => {
		// * Get Request Data
		const title_assignment = document.getElementById('input_title').value;
		const desc_assignment = document.getElementById('input_description').value;
		const due_date_assignment = document.getElementById('due_date_assignment').value;
		let assignment_select = document.getElementById('add_assignment_select').value;

		store.set('studentsTemp', assignedStudentsArray)

		const assignmentData = ({
			school: store.get('school'),
			name: title_assignment,
			desc: desc_assignment,
			dueDate: due_date_assignment,
			students: assignedStudentsArray,
			subject: assignment_select
		});

		// * Send Request to API:
		fetch(`${config.apiUrl}/teacher/add-assignment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(assignmentData)
		})
			.then(response => {
				if (response.status == 409) {
					error_assignment_duplicate.style.opacity = '1';
				}

				return response.json();
			})
			.then(data => {
				const added = data.added;

				if (added) {
					// * Create Assignment Element for Assignment List
					const assignmentElement = document.createElement('button');

					const title_assignment_added = document.getElementById('input_title').value;
					const desc_assignmentAdded = document.getElementById('input_description').value;
					const due_date_assignmentAdded = document.getElementById('due_date_assignment').value;

					assignmentElement.classList.add('assignment');
					assignmentElement.textContent = title_assignment_added;

					assignmentElement.addEventListener('click', () => {
						if (assignmentElement.classList.contains('expanded')) {
							assignmentElement.classList.remove('expanded');
							assignmentElement.style.background = 'transparent';

							const p_elements = assignmentElement.querySelectorAll('p');
							const buttons = assignmentElement.querySelectorAll('button');

							p_elements.forEach(element => {
								element.remove();
							});

							buttons.forEach(element => {
								element.remove();
							});
						} else {
							assignmentElement.classList.add('expanded');
							assignmentElement.style.background = 'var(--selected-primary)';

							const description = document.createElement('p');
							const subject = document.createElement('p');
							const assignedStudents = document.createElement('p');
							const dueDate = document.createElement('p');
							const update = document.createElement('button');
							const viewResults = document.createElement('button');
							const remove = document.createElement('button');

							const students = store.get('studentsTemp');

							if (assignment_select.includes('_')) {
								assignment_select = assignment_select.replace(/_/g, ' ');

								let wordsArray = assignment_select.split(' ');

								for (let i = 0; i < wordsArray.length; i++) {
									if (wordsArray[i] !== 'and') {
										wordsArray[i] = wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1);
									}
								}

								assignment_select = wordsArray.join(' ');
							} else {
								assignment_select.charAt(0).toUpperCase() + assignment_select.slice(1)
							}

							description.textContent = desc_assignmentAdded;
							subject.textContent = assignment_select;
							assignedStudents.textContent = students.join(', ');
							dueDate.textContent = due_date_assignmentAdded;
							update.textContent = 'Update';

							if (lang == 'en') {
								remove.textContent = 'Remove';
								viewResults.textContent = 'Results';
							} else {
								remove.textContent = 'Entfernen';
								viewResults.textContent = 'Ergebnisse';
							}

							update.classList.add('button');
							viewResults.classList.add('button');
							remove.classList.add('delete-assignment');
							remove.classList.add('button');

							description.style.marginTop = '1%';
							update.style.fontSize = '1.1vw';
							update.style.marginTop = '1%';
							viewResults.style.fontSize = '1.1vw';
							viewResults.style.marginTop = '1%';
							viewResults.style.marginLeft = '2%';

							remove.addEventListener('click', () => {
								store.set('assignment', title_assignment_added);

								remove_assignment_win.style.display = 'block';
								background.style.display = 'block';
							});

							update.addEventListener('click', () => {
								openUpdateAssignmentWin(title_assignment_added, desc_assignmentAdded, due_date_assignmentAdded, students, assignment_select)
							});

							viewResults.addEventListener('click', () => {
								openResultsViewer(title_assignment_added);
							});

							assignmentElement.appendChild(description);
							assignmentElement.appendChild(subject);
							assignmentElement.appendChild(assignedStudents);
							assignmentElement.appendChild(dueDate);
							assignmentElement.appendChild(update);
							assignmentElement.appendChild(viewResults);
							assignmentElement.appendChild(remove);
						}
					});

					assignment_container.appendChild(assignmentElement);

					// * Clear inputs:
					const title_assignment = document.getElementById('input_title');
					const desc_assignment = document.getElementById('input_description');
					const search_student = document.getElementById('search_students_assignment');
					const due_date_assignment = document.getElementById('due_date_assignment');

					title_assignment.value = '';
					desc_assignment.value = '';
					search_student.value = '';
					due_date_assignment.value = '';
					assignedStudentsArray.length = 0;

					// * Hide popup:
					add_assignment_win.style.display = 'none';
					background.style.display = 'none';
				}
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	});

	close_error_message.addEventListener('click', () => {
		error_assignment_duplicate.style.opacity = '0';
	});

	// * Delete Assignment:
	cancel_delete_assignment.addEventListener('click', () => {
		remove_assignment_win.style.display = 'none';
		background.style.display = 'none';
	});

	confirm_delete_assignment.addEventListener('click', () => {
		// * Prepare data for request
		const school = store.get('school');
		const assignment = store.get('assignment');

		const deleteAssignmentData = ({school: school, title: assignment});

		fetch(`${config.apiUrl}/teacher/delete-assignment`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(deleteAssignmentData)
		})
			.then(response => response.json())
			.then(data => {
				const deleted = data.deleted;

				if (deleted) {
					store.delete('assignment');
					const childElements = assignment_container.children;

					for (let i = 0; i < childElements.length; i++) {
						const child = childElements[i];

						if (child.textContent.trim() === assignment.trim()) {
							assignment_container.removeChild(child);
						}
					}

					remove_assignment_win.style.display = 'none';
					background.style.display = 'none';
				}
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	});

	// * Update Assignment
	/**
	 * Opens the window for updating an assignment and pre-fills it with existing data.
	 *
	 * @param {string} title - The title of the assignment to be updated.
	 * @param {string} desc - The description of the assignment.
	 * @param {string} dueDate - The due date of the assignment.
	 * @param {Array<string>} students - An array containing the names of students assigned to the assignment.
	 * @param {string} subject - The subject of the assignment.
	 */
	function openUpdateAssignmentWin(title, desc, dueDate, students, subject) {
		update_assigment_win.style.height = '70%';
		store.set('selectedAssignment', title);
		update_assignment_win.style.display = 'flex';
		background.style.display = 'block';

		// * Load data:
		const title_assignment = document.getElementById('input_title_update');
		const desc_assignment = document.getElementById('input_description_update');
		const subject_assignment = document.getElementById('update_assignment_select');
		const due_date_assignment = document.getElementById('due_date_assignment_update');
		const student_display = document.getElementById('student_display_update');

		if (subject.includes(' ')) {
			subject = subject.replace(/ /g, '_');
		}

		for (let i = 0; i < subject_assignment.options.length; i++) {
			if (subject_assignment.options[i].value == subject.toLowerCase()) {
				subject_assignment.value = subject_assignment.options[i].value;
				break;
			}
		}

		student_display.style.display = 'inline-flex';

		title_assignment.value = title;
		desc_assignment.value = desc;
		due_date_assignment.value = dueDate;

		students.forEach(student => {
			const chip = document.createElement('button');
			const chipProfilePic = document.createElement('img');
			const chipName = document.createElement('p');
			const chipRemove = document.createElement('span');

			chip.classList.add('chip-account');
			chipProfilePic.classList.add('chip-img');
			chipName.classList.add('chip-name');
			chipRemove.classList.add('material-symbols-rounded');
			chipRemove.classList.add('chip-span');

			getProfilePic(student)
				.then((profilePic) => {
					chipProfilePic.src = profilePic;
					chipName.textContent = student;
					chipRemove.textContent = 'close';

					chip.appendChild(chipProfilePic);
					chip.appendChild(chipName);
					chip.appendChild(chipRemove);

					chip.addEventListener('click', () => {
						chip.remove();
					});

					student_display.appendChild(chip);
				});
		});
	}

	search_student_update.addEventListener('keypress', (event) => {
		search_student_update.style.borderRadius = '6px';
		search_student_output_update.innerHTML = '';
		search_student_output_update.style.display = 'none';

		if (event.key == 'Enter') {
			const search_content = search_student_update.value;

			if (search_content.length != 0) {
				timeOutId = null;

				// * Prepare data for Request
				const school = store.get('school');

				const searchData = ({school: school, search: search_content});

				fetch(`${config.apiUrl}/teacher/assignment/search-student`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(searchData)
				})
					.then(response => response.json())
					.then(data => {
						const search_output = data.searchResults;
						search_student_update.style.borderRadius = '6px 6px 0px 0px';
						search_student_output_update.style.display = 'block';
						search_student_output_update.style.bottom = '6%';

						search_output.forEach((output) => {
							const name = output.name;

							const chip = document.createElement('button');

							const chipProfilePic = document.createElement('img');
							const chipName = document.createElement('p');

							chip.classList.add('chip-select');
							chipProfilePic.classList.add('chip-img');
							chipName.classList.add('chip-name');

							chipName.textContent = name;

							getProfilePic(name)
								.then((profilePic) => {
									chipProfilePic.src = profilePic;
									chip.appendChild(chipProfilePic);
									chip.appendChild(chipName);

									chip.addEventListener('click', () => {
										search_student_update.style.borderRadius = '6px';
										search_student_output_update.innerHTML = '';
										search_student_output_update.style.display = 'none';
										assignmentAddStudent(name, profilePic);
									});

									search_student_output_update.appendChild(chip);
								});
						});

						console.log(data);
					})
					.catch(err => {
						console.error('Fetch error: ', err);
					});
			}
		}
	});

	update_assignment.addEventListener('click', () => {
		let title = document.getElementById('input_title_update').value;
		let desc = document.getElementById('input_description_update').value;
		let dueDate = document.getElementById('due_date_assignment_update').value;
		let student_display = document.getElementById('student_display_update');

		const chips = student_display.children;

		const students = [];

		for (let i = 0; i < chips.length; i++) {
			const chip = chips[i];
			const name = chip.children[1].textContent;
			students.push(name);
		}

		const oldTitle = store.get('selectedAssignment');

		// * Prepare data for request
		const school = store.get('school');
		const updatedAssignmentData = ({
			school: school,
			title: title,
			description: desc,
			dueDate: dueDate,
			students: students,
			oldTitle: oldTitle
		})

		fetch(`${config.apiUrl}/teacher/update-assignment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updatedAssignmentData)
		})
			.then(response => response.json())
			.then(data => {
				const updated = data.updated;

				if (updated) {
					title = '';
					desc = '';
					dueDate = '';
					student_display.innerHTML = '';
					students.lenght = 0;

					assignment_container.innerHTML = '';

					update_assigment_win.style.display = 'none';
					background.style.display = 'none';

					getAssignments();
				}
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	});

	close_update_assignment.addEventListener('click', () => {
		update_assignment_win.style.display = 'none';
		background.style.display = 'none';

		// * Unload data
		const title_assignment = document.getElementById('input_title_update');
		const desc_assignment = document.getElementById('input_description_update');
		const due_date_assignment = document.getElementById('due_date_assignment_update');
		const student_display = document.getElementById('student_display_update');

		title_assignment.value = '';
		desc_assignment.value = '';
		due_date_assignment.value = '';
		student_display.innerHTML = '';
	});

	// * View Results:
	const results_assignment_win = document.getElementById('results_assignment_win');
	const close_results_assignment_win = document.getElementById('close_results_assignment_win');
	const results_display = document.getElementById('results_display');
	const document_tabs = document.getElementById('document_tabs');
	const document_viewer = document.getElementById('document_viewer');

	/**
	 * Opens the window for viewing assignment results and loads student data.
	 *
	 * @param {string} assignment - The title of the assignment for which results are to be viewed.
	 */
	function openResultsViewer(assignment) {
		results_assignment_win.style.display = 'flex';
		background.style.display = 'block';

		// * Load data:
		const assignmentData = ({school: store.get('school'), assignment: assignment});

		fetch(`${config.apiUrl}/teacher/view-results`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(assignmentData)
		})
			.then(response => response.json())
			.then(data => {
				const students = data.students;

				students.forEach(async student => {
					const rootButton = document.createElement('button');
					const rootButtonName = document.createElement('p');

					rootButton.classList.add('student-result');
					rootButtonName.textContent = student;

					rootButton.addEventListener('click', async () => {
						await loadStudentFiles(student, assignment);
					});

					rootButton.appendChild(rootButtonName);
					results_display.appendChild(rootButton);
				})
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	}

	close_results_assignment_win.addEventListener('click', () => {
		results_assignment_win.style.display = 'none';
		background.style.display = 'none';

		// * Unload data:
		results_display.innerHTML = '';
		document_tabs.innerHTML = '';
		document_viewer.innerHTML = '';
	});

	/**
	 * Loads files submitted by a student for review.
	 *
	 * @param {string} student - The name of the student whose files are to be loaded.
	 * @param {string} assignment - The title of the assignment for which files are to be loaded.
	 */
	async function loadStudentFiles(student, assignment) {
		const studentFilesData = ({school: store.get('school'), student: student, assignment: assignment});

		fetch(`${config.apiUrl}/teacher/review/get-files`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(studentFilesData)
		})
			.then(response => response.json())
			.then(data => {
				const files = data.files;

				for (const file of files) {
					const tab = document.createElement('button');
					tab.classList.add('document-tab');
					tab.textContent = file.name;
					tab.addEventListener('click', async () => {
						document_viewer.innerHTML = '';
						tab.classList.add('tab-selected');
						await loadFile(file.content, file.name)
					});
					document_tabs.appendChild(tab);
				}
			})
			.catch(err => {
				console.error('Fetch error: ', err);
			});
	}

	/**
	 * Loads and displays a file for viewing.
	 *
	 * @param {string} fileContentRaw - The raw content of the file.
	 * @param {string} fileName - The name of the file.
	 */
	async function loadFile(fileContentRaw, fileName) {
		const noInAppSupport = ['.doc', '.docx', '.odt', '.rtf', '.mp3', '.wav', '.ogg', '.flac', '.ppt', '.pptx'];
		const fileExtension = fileName.split('.').pop();

		document_viewer.innerHTML = '';

		const documentViewer = document.createElement('fileContentDiv');

		if (fileName.includes('.txt')) {
			const fileContent = await Buffer.from(fileContentRaw).toString('base64');

			const iframe = document.createElement('iframe');
			iframe.src = `data:text/plain;base64,${fileContent}`;
			iframe.style.width = '100%';
			iframe.style.height = '99%';
			iframe.style.border = 'none';
			iframe.style.outline = 'none';
			iframe.style.borderRadius = '0px 0px 5px 0px';
			iframe.style.background = 'transparent';

			document_viewer.appendChild(iframe);

			iframe.onload = function () {
				const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

				const body = iframeDocument.querySelector('body');
				const bodyStyle = body.style;

				bodyStyle.background = '#1c1c1c';
				bodyStyle.border = 'none';
				bodyStyle.outline = 'none';

				const pre = iframeDocument.querySelector('pre');

				pre.style.fontFamily = 'Quicksand, sans-serif';
				pre.style.fontSize = '1.8vw';
			}
		} else if (noInAppSupport.includes(fileExtension)) {
			const data = Buffer.from(fileContentRaw);

			// * Download file
			ipcRenderer.send('download-file', data, fileName);

			ipcRenderer.on('download-ready', (event, filename, filePath) => {
				const message = document.createElement('p');
				const openDocx = document.createElement('button');

				message.style.fontSize = '1.5vw';
				message.style.position = 'absolute';
				message.style.marginLeft = '36%';
				message.style.marginTop = '10%';
				message.style.textAlign = 'center';
				message.style.transform = 'translate(-50%, -50%)';

				openDocx.classList.add('button');
				openDocx.style.padding = '1%';
				openDocx.style.marginLeft = '50%';
				openDocx.style.marginTop = '20%';
				openDocx.style.fontSize = '1vw';
				openDocx.style.transform = 'translateX(-46%)';

				if (lang == 'de') {
					message.textContent = `${filename} wurde heruntergeladen!`;
					openDocx.textContent = `${filename} öffnen`;
				} else if (lang == 'en') {
					message.textContent = `${filename} downloaded successfully`;
					openDocx.textContent = `Open ${filename}`;
				}

				openDocx.addEventListener('click', () => {
					shell.openPath(filePath)
				});

				documentViewer.appendChild(message);
				documentViewer.appendChild(openDocx);
			});
		} else if (fileName.includes('.pdf')) {
			const pdfData = Buffer.from(fileContentRaw).toString('base64');
			const iframeSrc = `data:application/pdf;base64,${pdfData}`;

			const iframe = document.createElement('iframe');
			iframe.src = iframeSrc;
			iframe.style.width = '100%';
			iframe.style.height = '99%';
			iframe.style.border = 'none';
			iframe.style.outline = 'none';
			iframe.style.borderRadius = '0px 0px 5px 0px';
			iframe.style.background = 'transparent';

			document_viewer.appendChild(iframe);
		} else {
			const data = Buffer.from(fileContentRaw);

			// * Download file
			ipcRenderer.send('download-file', data, fileName);

			ipcRenderer.on('download-ready', (event, filename, filePath) => {
				const message = document.createElement('p');
				const openDocx = document.createElement('button');

				message.style.fontSize = '1.5vw';
				message.style.position = 'absolute';
				message.style.marginLeft = '36%';
				message.style.marginTop = '10%';
				message.style.textAlign = 'center';
				message.style.transform = 'translate(-50%, -50%)';

				openDocx.classList.add('button');
				openDocx.style.padding = '1%';
				openDocx.style.marginLeft = '50%';
				openDocx.style.marginTop = '20%';
				openDocx.style.fontSize = '1vw';
				openDocx.style.transform = 'translateX(-46%)';

				if (lang == 'de') {
					message.textContent = `${filename} wurde heruntergeladen!`;
					openDocx.textContent = `${filename} öffnen`;
				} else if (lang == 'en') {
					message.textContent = `${filename} downloaded successfully`;
					openDocx.textContent = `Open ${filename}`;
				}

				openDocx.addEventListener('click', () => {
					shell.openPath(filePath)
				});

				documentViewer.appendChild(message);
				documentViewer.appendChild(openDocx);
			});
		}

		document_viewer.appendChild(documentViewer);
	}


	// * --------------------------------------------------------------------------
	// * School Chat:
	const toggle_school_chat = document.getElementById('toggle_school_chat');
	const school_chat_win = document.getElementById('school_chat_win');
	const close_school_chat = document.getElementById('close_school_chat');
	const switch_role_student = document.getElementById('switch_role_student');
	const switch_role_teacher = document.getElementById('switch_role_teacher');
	const search_contacts = document.getElementById('search_contacts');
	const start_search_contacts = document.getElementById('start_search_contacts');

	let selectedContactRole = 'student';

	toggle_school_chat.addEventListener('click', () => {
		school_chat_win.style.display = 'flex';
		background.style.display = 'block';

		// * Load data:

	});

	close_school_chat.addEventListener('click', () => {
		school_chat_win.style.display = 'none';
		background.style.display = 'none';

		// * Unload data:

	});

	search_contacts.addEventListener('focus', () => {
		search_contacts.style.borderTopLeftRadius = '50px';
		search_contacts.style.borderBottomLeftRadius = '50px';
		search_contacts.style.width = '60%';
		search_contacts.style.transform = 'translateX(-10%)';

		setTimeout(() => {
			if (search_contacts.style.borderTopLeftRadius == '50px' && search_contacts.style.borderBottomLeftRadius == '50px' && search_contacts.style.transform == 'translateX(-10%)') {
				start_search_contacts.style.opacity = '1';
			}
		}, 300);
	});

	search_contacts.addEventListener('blur', () => {
		start_search_contacts.style.opacity = '0';

		setTimeout(() => {
			if (start_search_contacts.style.opacity == '0') {
				search_contacts.style.borderTopLeftRadius = '6px';
				search_contacts.style.borderBottomLeftRadius = '6px';
				search_contacts.style.width = '80%';
				search_contacts.style.transform = 'translateX(0%)';
			}
		}, 300);
	});

	switch_role_student.addEventListener('click', () => {
		if (selectedContactRole != 'student') {
			// * Update styling
			switch_role_teacher.classList.remove('selected-role');
			switch_role_student.classList.add('selected-role');
			selectedContactRole = 'student';

			// * Load student contacts
			console.log('student contacts');
		}
	});

	switch_role_teacher.addEventListener('click', () => {
		if (selectedContactRole != 'teacher') {
			// * Update styling
			switch_role_student.classList.remove('selected-role');
			switch_role_teacher.classList.add('selected-role');
			selectedContactRole = 'teacher';

			// * Load teacher contacts
			console.log('teacher contacts');
		}
	});


	// * --------------------------------------------------------------------------
	// * Gradebook:
	const studentsListGradebook = document.getElementById('grade_book_list');
	const gradebookWin = document.getElementById('grade_book_win');
	const closeGradebookWin = document.getElementById('close_gradebook_win');
	const gradebookMainView = document.getElementById('gradebook_main_view');

	let selectedSubject = 'german';

	// * Get Students
	const getStudentData = ({school: store.get('school')});

	// ! REPLACE WITH FUNCTION
	fetch(`${config.apiUrl}/teacher/get-students`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(getStudentData)
	})
		.then(response => response.json())
		.then(data => {
			const students = data.students;


		})
		.catch(err => {
			console.error('Fetch error: ', err);
		});

	async function openGradebook(name) {
		gradebookWin.style.display = 'flex';
		background.style.display = 'block';

		const title = document.getElementById('gradebook_title');
		title.textContent = `Gradebook of ${name}`;

		const getData = ({school: store.get('school'), student: name});

		fetch(`${config.apiUrl}/teacher/get-gradebook`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(getData)
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
			})
			.catch(err => {
				console.error('Fetch err: ', err);
			});
	}

	closeGradebookWin.addEventListener('click', () => {
		gradebookWin.style.display = 'none';
		background.style.display = 'none';
		gradebookMainView.innerHTML = '';
	});

	// * --------------------------------------------------------------------------
	// ! Developer:

	// * Add School:
	const open_add_school = document.getElementById('add-school');
	const add_school_win = document.getElementById('add-school-win');
	const load_school_data = document.getElementById('load_school_data');
	const submit_data = document.getElementById('submit_data');
	const cancel_adding_school = document.getElementById('cancel_adding_school');

	let schoolDataFile = '';

	open_add_school.addEventListener('click', () => {
		background.style.display = 'block';
		add_school_win.style.display = 'flex';
	});

	cancel_adding_school.addEventListener('click', () => {
		background.style.display = 'none';
		add_school_win.style.display = 'none';
	});

	load_school_data.addEventListener('click', () => {
		ipcRenderer.send('open-file-dialog');

		ipcRenderer.on('selected-file', (event, filePath) => {
			schoolDataFile = filePath;
		});

		ipcRenderer.on('file-dialog-canceled', (event) => {
			schoolDataFile = '';
			background.style.display = 'none';
			add_school_win.style.display = 'none';
		});
	});

	submit_data.addEventListener('click', () => {
		if (schoolDataFile.length != 0) {
			load_school_data.style.border = 'none';

			fs.readFile(schoolDataFile, 'utf-8', (err, fileData) => {
				if (err) {
					console.error('Error reading file: ', err);
				} else {
					try {
						const jsonData = JSON.parse(fileData);

						fetch(`${config.apiUrl}/dev/add-school`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify(jsonData)
						})
							.then(response => response.json())
							.then(data => {
								console.log(data);
								const schoolAdded = data != null ? data.schoolAdded : null;

								if (schoolAdded) {
									const schoolListItem = document.createElement('p');
									schoolListItem.classList.add('school-list-item');

									schoolListItem.textContent = jsonData.schoolName;

									schools_list.appendChild(schoolListItem);

									background.style.display = 'none';
									add_school_win.style.display = 'none';
								} else {
									console.error('Unable to add school!');
									devConsole.error('Unable to add school!');
								}
							})
							.catch(error => {
								console.error('Fetch error: ', error);
								devConsole.error('Fetch error');
							});
					} catch (parseError) {
						console.error('Error parsing JSON: ', parseError);
						devConsole.error(`Error parsing JSON: ${parseError}`);
					}
				}
			});
		} else {
			load_school_data.style.border = '2px solid #ab0000';
		}
	});

	// * Delete school:

	const deleteSchoolWin = document.getElementById('delete_school_win');
	const deleteSchoolOpen = document.getElementById('delete-school');
	const closeDeleteSchool = document.getElementById('cancel_delete_school');
	const deleteSchool = document.getElementById('delete_school');

	deleteSchoolOpen.addEventListener('click', () => {
		background.style.display = 'block';
		deleteSchoolWin.style.display = 'flex';
	});

	closeDeleteSchool.addEventListener('click', () => {
		background.style.display = 'none';
		deleteSchoolWin.style.display = 'none';
	});

	deleteSchool.addEventListener('click', () => {
		const school = document.getElementById('school_name').value
		const schoolData = ({school: school});

		if (school.length != 0) {
			fetch(`${config.apiUrl}/delete/school`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(schoolData)
			})
				.then(response => response.json())
				.then(data => {
					const deleted = data.deleted;

					if (deleted) {
						const children = schools_list.children;

						for (let i = 0; i < children.length; i++) {
							const child = children[i];

							if (child.textContent.trim() == school) {
								schools_list.removeChild(child);
								background.style.display = 'none';
								deleteSchoolWin.style.display = 'none';
								break;
							}
						}
					}
				})
				.catch(error => {
					console.error('Fetch error: ', error);
				});
		}
	});


	// * --------------------------------------------------------------------------
	// * Dev Console:
	const toggle_console = document.getElementById('toggle_console');

	const toggle_console_student = document.getElementById('toggle_console_student');
	const console_student = document.getElementById('dev-console-student');

	const toggle_console_teacher = document.getElementById('toggle_console_teacher');
	const console_teacher = document.getElementById('dev-console-teacher');

	const dev_console = document.getElementById('dev-console');

	const user_card = document.getElementById('user');
	const user_options = document.getElementById('user_options');

	toggle_console.addEventListener('click', () => {
		dev_console.style.display = dev_console.style.display === 'flex' ? 'none' : 'flex';

		if (dev_console.style.display == 'flex') {
			user_card.style.marginRight = '46%';
			user_options.style.marginRight = '46%';
			toggle_console.style.zIndex = '6';

			// * Load data:
			devConsole.openConsole();
			devConsole.loadMessages();
		} else if (dev_console.style.display == 'none') {
			user_card.style.marginRight = '7%';
			user_options.style.marginRight = '7%';
			toggle_console.style.zIndex = '1';

			// * Unload data:
			devConsole.closeConsole();
			document.getElementById('console_output');
			console_output.innerHTML = '';
		}
	});

	// * Toggle Console Student
	toggle_console_student.addEventListener('click', () => {
		console_student.style.display = console_student.style.display === 'flex' ? 'none' : 'flex';

		if (console_student.style.display == 'flex') {
			user_card.style.marginRight = '46%';
			user_options.style.marginRight = '46%';
			toggle_console_student.style.zIndex = '6';

			// * Load data:
			devConsole.openConsole();
			devConsole.loadMessages();
		} else if (console_student.style.display == 'none') {
			user_card.style.marginRight = '7%';
			user_options.style.marginRight = '7%';
			toggle_console_student.style.zIndex = '1';

			// * Unload data:
			devConsole.closeConsole();
			document.getElementById('console_output');
			console_output.innerHTML = '';
		}
	});

	// * Toggle Console Teacher
	toggle_console_teacher.addEventListener('click', () => {
		console_teacher.style.display = console_teacher.style.display === 'flex' ? 'none' : 'flex';

		if (console_teacher.style.display == 'flex') {
			user_card.style.marginRight = '46%';
			user_options.style.marginRight = '46%';
			toggle_console_teacher.style.zIndex = '6';

			// * Load data:
			devConsole.openConsole();
			devConsole.loadMessages();
		} else if (console_teacher.style.display == 'none') {
			user_card.style.marginRight = '7%';
			user_options.style.marginRight = '7%';
			toggle_console_teacher.style.zIndex = '1';

			// * Unload data:
			devConsole.closeConsole();
			document.getElementById('console_output');
			console_output.innerHTML = '';
		}
	});

	command_input.addEventListener('keydown', (event) => {
		if (event.key == 'Enter') {
			const command = command_input.value;

			if (command == 'clear') {
				devConsole.clear();
				command_input.value = '';
			} else if (command == 'getDOM') {
				devConsole.getDOM();
				command_input.value = '';
			} else if (command == 'displayNetwork') {
				devConsole.displayNetwork();
				command_input.value = '';
			} else if (command.startsWith('switchRole')) {
				const match = command.match(/switchRole\(([^)]+)\)/);
				if (match) {
					const role = match[1].trim();

					if (['student', 'teacher', 'dev'].includes(role)) {
						devConsole.switchRole(role);
						command_input.value = '';
						dev_console.style.display = 'none';
						user_card.style.marginRight = '7%';
						user_options.style.marginRight = '7%';
						toggle_console.style.zIndex = '1';
					} else {
						devConsole.error(`Invalid role: ${role}`);
					}
				}
			}
		}
	});

	command_input_student.addEventListener('keydown', (event) => {
		if (event.key == 'Enter') {
			const command = command_input_student.value;

			if (command == 'clear') {
				devConsole.clear();
				command_input_student.value = '';
			} else if (command == 'getDOM') {
				devConsole.getDOM();
				command_input_student.value = '';
			} else if (command == 'displayNetwork') {
				devConsole.displayNetwork();
				command_input_student.value = '';
			} else if (command.startsWith('switchRole')) {
				const match = command.match(/switchRole\(([^)]+)\)/);
				if (match) {
					const role = match[1].trim();

					if (['student', 'teacher', 'dev'].includes(role)) {
						devConsole.switchRole(role);
						command_input_student.value = '';
						console_student.style.display = 'none';
						user_card.style.marginRight = '7%';
						user_options.style.marginRight = '7%';
						toggle_console_student.style.zIndex = '1';
					} else {
						devConsole.error(`Invalid role: ${role}`);
					}
				}
			}
		}
	});

	command_input_teacher.addEventListener('keydown', (event) => {
		if (event.key == 'Enter') {
			const command = command_input_teacher.value;

			if (command == 'clear') {
				devConsole.clear();
				command_input_teacher.value = '';
			} else if (command == 'getDOM') {
				devConsole.getDOM();
				command_input_teacher.value = '';
			} else if (command == 'displayNetwork') {
				devConsole.displayNetwork();
				command_input_teacher.value = '';
			} else if (command.startsWith('switchRole')) {
				const match = command.match(/switchRole\(([^)]+)\)/);
				if (match) {
					const role = match[1].trim();

					if (['student', 'teacher', 'dev'].includes(role)) {
						devConsole.switchRole(role);
						command_input_teacher.value = '';
						console_teacher.style.display = 'none';
						user_card.style.marginRight = '7%';
						user_options.style.marginRight = '7%';
						toggle_console_teacher.style.zIndex = '1';
					} else {
						devConsole.error(`Invalid role: ${role}`);
					}
				}
			}
		}
	});


	// * --------------------------------------------------------------------------
	// * Monitoring
	const ctxUptime = document.getElementById('serverUptimeChart').getContext('2d');
	const ctxActiveUsers = document.getElementById('activeUsersChart').getContext('2d');
	const ctxResources = document.getElementById('serverResourceChart').getContext('2d');
	const ctxAPI = document.getElementById('apiUsageChart').getContext('2d');
	const ctxDB = document.getElementById('dbUsageChart').getContext('2d');

	const refresh_charts = document.getElementById('refresh_charts');

	// * Active Users
	let labelsUsers = [];
	getLastNFullHours(7, 'activeUsers');
	let dataUsers = [];

	const chartUsers = new Chart(ctxActiveUsers, {
		type: 'line',
		data: {
			labels: labelsUsers,
			datasets: [{
				label: 'Active Users',
				data: dataUsers,
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						max: 1000
					}
				}]
			}
		}
	})

	// * Uptime
	let labelsUptime = [];
	getLastNFullHours(5, 'serverUptime');
	let dataUptime = [];

	const chartUptime = new Chart(ctxUptime, {
		type: 'line',
		data: {
			labels: labelsUptime,
			datasets: [{
				label: 'Server Uptime',
				data: dataUptime,
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						max: 100,
						min: 0,
						suggestedMin: 0
					}
				}]
			}
		}
	});

	// * Resources
	let dataResources = [];
	const labels = ['CPU', 'RAM', 'Storage'];
	const chartResources = new Chart(ctxResources, {
		type: 'doughnut',
		data: {
			labels: labels,
			datasets: [{
				label: 'Resource Usage',
				data: dataResources,
				backgroundColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)'
				],
			}]
		}
	});

	// * API
	let dataAPI = [];
	const chartAPI = new Chart(ctxAPI, {
		type: 'bar',
		data: {
			labels: ['Total Requests', 'Requests by Hour'],
			datasets: [{
				label: 'API Usage',
				data: dataAPI,
				backgroundColor: [
					'rgba(54, 162, 235, 1)',
					'rgba(255, 99, 132, 1)'
				],
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});

	let dataDB = [];
	const chartDB = new Chart(ctxDB, {
		type: 'bar',
		data: {
			labels: ['Total Requests', 'Requests by Hour'],
			datasets: [{
				label: 'DB Usage',
				data: dataDB,
				backgroundColor: [
					'rgba(54, 162, 235, 1)',
					'rgba(255, 99, 132, 1)'
				],
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});

	// * Get data
	/**
	 * Retrieves labels for the last N full hours based on the current time.
	 *
	 * @param {number} numHours - The number of hours to retrieve labels for.
	 * @param {string} chart - The type of chart ('activeUsers' or 'serverUptime').
	 */
	function getLastNFullHours(numHours, chart) {
		const now = new Date();
		const currentHour = now.getHours();

		if (chart == 'activeUsers') {
			labelsUsers = [];
		} else if (chart == 'serverUptime') {
			labelsUptime.length = 0;
		}

		for (let i = 0; i < numHours; i++) {
			const hour = (currentHour - i + 24) % 24;
			if (chart == 'activeUsers') {
				labelsUsers.unshift(`${hour}:00`);
			} else if (chart == 'serverUptime') {
				labelsUptime.unshift(`${hour}:00`);
			}
		}
	}

	/**
	 * Retrieves chart data from the server and updates the charts accordingly.
	 *
	 * This function sends a request to the server to fetch chart data for the current hour.
	 * It then updates various charts with the retrieved data, including active users, server uptime,
	 * server resources, API usage, and database usage.
	 */
	function getChartData() {
		const now = new Date();
		const currentHour = `${now.getHours()} ${now.getDate()} ${now.getMonth() + 1}`;
		const getChartData = ({currentHour: currentHour});

		fetch(`${config.apiUrl}/dev/get-chart-data`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(getChartData)
		})
			.then(response => response.json())
			.then(data => {
				const usersData = data.usersData;
				const uptimeData = data.uptimeData;
				const serverUsage = data.serverUsage;
				const apiUsage = data.apiUsage;
				const dbUsage = data.dbUsage;

				const apiUsageArray = [apiUsage.totalRequests, apiUsage.requestsByHour];
				const dbUsageArray = [dbUsage.totalQueries, dbUsage.queriesByHour];

				dataUsers.splice(0, dataUsers.length, ...usersData);
				dataUptime.splice(0, dataUptime.length, ...uptimeData);
				dataResources.splice(0, serverUsage.length, ...serverUsage);
				dataAPI.splice(0, apiUsageArray.length, ...apiUsageArray);
				dataDB.splice(0, dbUsageArray.length, ...dbUsageArray);

				getLastNFullHours(7, 'activeUsers');
				getLastNFullHours(5, 'serverUptime');

				chartUsers.update();
				chartUptime.update();
				chartResources.update();
				chartAPI.update();
				chartDB.update();
			})
			.catch(error => {
				devConsole.error('Fetch error');
			});
	}

	// * Update data hourly
	/**
	 * Updates chart data at the next full hour.
	 *
	 * This function calculates the time until the next full hour from the current time,
	 * then schedules the retrieval of chart data using getChartData() function when the next full hour is reached.
	 * It recursively calls itself to keep updating data at each full hour.
	 */
	function updateDataAtNextFullHour() {
		const now = new Date();
		const minutesUntilNextHour = 60 - now.getMinutes();
		const millisecondsUntilNextHour = minutesUntilNextHour * 60 * 1000;

		setTimeout(() => {
			getChartData();

			updateDataAtNextFullHour();
		}, millisecondsUntilNextHour);
	}

	getChartData();
	updateDataAtNextFullHour();

	refresh_charts.addEventListener('click', () => {
		// getLastNFullHours(7, 'activeUsers');
		// getLastNFullHours(5, 'serverUptime');
		getChartData();
	});

	window.addEventListener('resize', () => {
		chartUsers.resize();
		chartUptime.resize();
		chartResources.resize();
		chartAPI.resize();
		chartDB.resize();
	});


	// * --------------------------------------------------------------------------
	// * Developer Management
	const open_add_dev = document.getElementById('open_add_dev');
	const add_dev_win = document.getElementById('add_dev_win');
	const close_dev_win = document.getElementById('close_dev_win');
	const add_dev = document.getElementById('add_dev');

	open_add_dev.addEventListener('click', () => {
		add_dev_win.style.display = 'flex';
		background.style.display = 'block';
	});

	close_dev_win.addEventListener('click', () => {
		add_dev_win.style.display = 'none';
		background.style.display = 'none';

		// * Unload inputs
		const usernameInput = document.getElementById('dev_username');
		const emailInput = document.getElementById('dev_email');

		usernameInput.value = '';
		emailInput.value = '';
	});

	add_dev.addEventListener('click', () => {
		const usernameInput = document.getElementById('dev_username').value;
		const emailInput = document.getElementById('dev_email').value;

		if (usernameInput.length != 0 && emailInput.length != 0) ;
		{
			const requestData = ({username: usernameInput, email: emailInput});

			fetch(`${config.apiUrl}/dev/add-dev`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestData)
			})
				.then(response => response.json())
				.then(data => {
					const added = data.added;

					add_dev_win.style.display = 'none';
					background.style.display = 'none';

					if (added) {
						const developer = document.createElement('p');
						const remove_dev = document.createElement('button');

						developer.classList.add('developer-list-item');
						remove_dev.classList.add('remove-dev');

						developer.textContent = usernameInput;
						remove_dev.textContent = 'Remove';

						developer.appendChild(remove_dev);
						dev_list.appendChild(developer);

						const username = usernameInput;

						remove_dev.addEventListener('click', () => {
							const requestDataRemove = ({username: username});

							fetch(`${config.apiUrl}/dev/remove-dev`, {
								method: 'DELETE',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify(requestDataRemove)
							})
								.then(response => response.json())
								.then(data => {
									const removed = data.removed;

									if (removed) {
										const pElements = dev_list.querySelectorAll('p');

										pElements.forEach(element => {
											if (element.textContent.trim() === `${username}Remove`) {
												element.remove();
											}
										});
									}
								})
								.catch(err => {
									devConsole.error('Fetch error');
									console.error('Fetch error', err);
								});
						});
					}

					// * Unload inputs
					const usernameInput = document.getElementById('dev_username');
					const emailInput = document.getElementById('dev_email');

					usernameInput.value = '';
					emailInput.value = '';
				})
				.catch(err => {
					devConsole.error('Fetch error');
					console.error('Fetch error', err);
				});
		}
	});


	// * --------------------------------------------------------------------------
	// * Dev Chat
	const toggle_dev_chat = document.getElementById('toggle_dev_chat');
	const dev_chat_win = document.getElementById('dev_chat_win');
	const close_dev_chat = document.getElementById('close_dev_chat');
	const contacts_container = document.getElementById('contacts');
	const message_container = document.getElementById('message_container');
	const message_input = document.getElementById('message_input');
	const send_message = document.getElementById('send_message');

	let contactUsername = '';

	toggle_dev_chat.addEventListener('click', () => {
		dev_chat_win.style.display = 'flex';
		background.style.display = 'block';

		// * Load contacts
		fetch(`${config.apiUrl}/dev/load-contacts`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => response.json())
			.then(data => {
				const devs = data.devs;

				devs.forEach(dev => {
					const contact = document.createElement('button');
					const profilePic = document.createElement('img');
					const username = document.createElement('p');

					contact.classList.add('contact');
					profilePic.classList.add('contact-img');
					username.classList.add('contact-p');

					profilePic.src = loadedProfilePic;
					username.textContent = `${dev.username} ${dev.devID}`;

					contact.appendChild(profilePic);
					contact.appendChild(username);

					contact.addEventListener('click', () => {
						const contactTextContent = contact.querySelector('p').textContent;
						const regex = /^(.*?)(?=\s\d{8})/;

						const match = contactTextContent.match(regex);

						if (match) {
							const selectedContact = match[1].trim();
							contactUsername = selectedContact;
							loadChat();
						}
					});

					contacts_container.appendChild(contact);
				})
			})
	});

	close_dev_chat.addEventListener('click', () => {
		contacts_container.innerHTML = '';
		message_container.innerHTML = '';
		message_input.value = '';
		message_input.style.display = 'none';
		send_message.style.display = 'none';
		dev_chat_win.style.display = 'none';
		background.style.display = 'none';
	});

	/**
	 * Loads chat messages between the current user and a contact.
	 *
	 * This function sends a request to the server to fetch chat messages between the current user
	 * (retrieved from store.get('username')) and the contact (contactUsername).
	 * It then displays the fetched messages in the message container, with messages from the current user
	 * styled differently from messages from the contact.
	 */
	function loadChat() {
		const contactData = ({username: store.get('username'), contactUsername: contactUsername});

		fetch(`${config.apiUrl}/dev/load-chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(contactData)
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				const messages = data.messages;

				message_input.style.display = 'block';
				send_message.style.display = 'block';

				if (messages.length != 0) {
					messages.forEach(message => {
						const username = message.username;
						const messageText = message.message;

						if (username == store.get('username')) {
							const message_you = document.createElement('p');
							message_you.classList.add('message-you');

							message_you.textContent = messageText;

							message_container.appendChild(message_you);
							message_container.scrollTop = message_container.scrollHeight;
						} else {
							const message_other = document.createElement('p');
							message_other.classList.add('message-contact');

							message_other.textContent = messageText;

							message_container.appendChild(message_container);
							message_container.scrollTop = message_container.scrollHeight;
						}
					});
				}
			})
			.catch(err => {
				devConsole.error('Fetch error');
				console.error('Fetch error: ', err);
			});
	}

	message_input.addEventListener('keydown', (event) => {
		if (event.key == 'Enter') {
			const message = message_input.value;
			const username = store.get('username');

			const messageData = ({message: message, sender: username, contactUsername: contactUsername});

			fetch(`${config.apiUrl}/dev/send-message`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(messageData)
			})
				.then(response => response.json())
				.then(data => {
					// const message_you = document.createElement('p');
					// message_you.classList.add('message-you');

					// message_you.textContent = message;

					// message_container.appendChild(message_you);
				})
				.catch(err => {
					console.error('Fetch error: ', err);
					devConsole.error('Fetch error');
				});
		}
	});

	send_message.addEventListener('click', () => {
		const message = message_input.value;
		const username = store.get('username');

		const messageData = ({message: message, sender: username, contactUsername: contactUsername});

		fetch(`${config.apiUrl}/dev/send-message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(messageData)
		})
			.then(response => response.json())
			.then(data => {
				// const message_you = document.createElement('p');
				// message_you.classList.add('message-you');

				// message_you.textContent = message;

				// message_container.appendChild(message_you);
			})
			.catch(err => {
				console.error('Fetch error: ', err);
				devConsole.error('Fetch error');
			});
	});

	ws.addEventListener('message', (event) => {
		const data = JSON.parse(event.data);
		if (data.type == 'message') {
			const username = data.sender;
			const messageText = data.message;

			if (username == store.get('username')) {
				const message_you = document.createElement('p');
				message_you.classList.add('message-you');

				message_you.textContent = messageText;

				message_container.appendChild(message_you);
				message_container.scrollTop = message_container.scrollHeight;
			} else {
				const message_other = document.createElement('p');
				message_other.classList.add('message-contact');

				message_other.textContent = messageText;

				message_container.appendChild(message_other);
				message_container.scrollTop = message_container.scrollHeight;
			}
		}
	});
});