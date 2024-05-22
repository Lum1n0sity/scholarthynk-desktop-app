/**
 * A utility class for logging messages and managing the developer console.
 */
class devConsole {
	/**
	 * Creates a new devConsole instance.
	 * @param {string} [elementId=null] - The ID of the HTML element where messages will be displayed.
	 */
	constructor(elementId = null) {
		this.messages = [];
		this.elementId = elementId;
		this.isOpen = false;
	}

	/**
	 * Logs a message to the developer console.
	 * @param {string} message - The message to log.
	 */
	log(message) {
		const line = this.getCurrentLine();
		const id = this.generateUniqueID();
		this.messages.push({type: 'log', message: `${message}; Line ${line}`, id});
		if (this.isOpen) {
			this.addMessage('log', message, id);
		}
	}

	/**
	 * Logs a warning message to the developer console.
	 * @param {string} message - The warning message to log.
	 */
	warn(message) {
		const line = this.getCurrentLine();
		const id = this.generateUniqueID();
		this.messages.push({type: 'warn', message: `${message}; Line ${line}`, id});
		if (this.isOpen) {
			this.addMessage('warn', message, id);
		}
	}

	/**
	 * Logs an error message to the developer console.
	 * @param {string} message - The error message to log.
	 */
	error(message) {
		const line = this.getCurrentLine();
		const id = this.generateUniqueID();
		this.messages.push({type: 'error', message: `${message}; Line ${line}`, id});
		if (this.isOpen) {
			this.addMessage('error', message, id);
		}
	}

	/**
	 * Clears the messages array and removes all messages from the console element.
	 */
	clear() {
		this.messages = [];
		this.clearMessages();
	}

	/**
	 * Retrieves the HTML content of the current document, removes script and style elements,
	 * and adds the clean HTML content to the console element.
	 */
	getDOM() {
		const html = document.documentElement.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		const scripts = doc.querySelectorAll('script');
		scripts.forEach(script => script.parentNode.removeChild(script));
		const styles = doc.querySelectorAll('style');
		styles.forEach(style => style.parentNode.removeChild(style));

		const cleanHTML = doc.documentElement.outerHTML;

		const element = document.getElementById(this.elementId);
		const messageElement = document.createElement('p');
		messageElement.textContent = cleanHTML;
		messageElement.classList.add('console_element');
		messageElement.classList.add('log');
		element.appendChild(messageElement);
	}

	/**
	 * Retrieves network performance entries and displays resource-related entries in the console.
	 */
	displayNetwork() {
		const element = document.getElementById(this.elementId);
		const entries = window.performance.getEntries();

		const resourceEntries = entries.filter(entry => entry.entryType === 'resource');

		resourceEntries.forEach(entry => {
			const request = `${entry.name}<br>${entry.initiatorType}<br>${entry.duration}`
			this.addMessage('log', request, 'resourceEntries');
		});
	}

	/**
	 * Switches the role displayed in the console based on the provided role.
	 * @param {string} role - The role to display ('student', 'teacher', or 'dev').
	 */
	switchRole(role) {
		const student = document.getElementById('student');
		const teacher = document.getElementById('teacher');
		const dev = document.getElementById('dev');

		if (role == 'student') {
			student.style.display = 'block';
			teacher.style.display = 'none';
			dev.style.display = 'none';
			const toggle_console_student = document.getElementById('toggle_console_student');
			toggle_console_student.style.display = 'block';
		} else if (role == 'teacher') {
			student.style.display = 'none';
			teacher.style.display = 'block';
			dev.style.display = 'none';
			const toggle_console_teacher = document.getElementById('toggle_console_teacher');
			toggle_console_teacher.style.display = 'block';
		} else if (role == 'dev') {
			student.style.display = 'none';
			teacher.style.display = 'none';
			dev.style.display = 'block';
		}
	}

	/**
	 * Adds a message to the console element based on the provided type and content.
	 * @param {string} type - The type of message ('log', 'warn', or 'error').
	 * @param {string} message - The content of the message.
	 * @param {string} id - The ID of the message.
	 */
	addMessage(type, message, id) {
		if (!id == 'resourceEntries') {
			const element = document.getElementById(this.elementId);
			const messageElement = document.createElement('p');
			messageElement.textContent = message;
			messageElement.classList.add('console_element');
			messageElement.classList.add(type);
			element.appendChild(messageElement);
		} else {
			const element = document.getElementById(this.elementId);
			const messageElement = document.createElement('p');
			messageElement.innerHTML = message;
			messageElement.classList.add('console_element');
			messageElement.classList.add(type);
			element.appendChild(messageElement);
		}
	}

	/**
	 * Loads messages from the messages array and adds them to the console element.
	 */
	loadMessages() {
		const elementId = this.elementId;
		this.messages.forEach(message => {
			this.addMessage(message.type, message.message, message.id);
		});
	}

	/**
	 * Clears all messages from the console element.
	 */
	clearMessages() {
		const element = document.getElementById(this.elementId);
		element.innerHTML = '';
	}

	/**
	 * Opens the developer console.
	 */
	openConsole() {
		this.isOpen = true;
	}

	/**
	 * Closes the developer console.
	 */
	closeConsole() {
		this.isOpen = false;
	}

	/**
	 * Generates a unique ID composed of a timestamp and a random string.
	 * @returns {string} The generated unique ID.
	 */
	generateUniqueID() {
		const timestamp = Date.now().toString();
		const randomPart = Math.random().toString(36).substr(2, 5);
		return `${timestamp}-${randomPart}`;
	}

	/**
	 * Retrieves the current line number where the method is called.
	 * @returns {string} The current line number.
	 */
	getCurrentLine() {
		let stackTrace = new Error().stack;

		let lineNumber = stackTrace.split('\n')[3];

		return lineNumber.match(/:(\d+):\d+/)[1];
	}
}

module.exports = devConsole;
