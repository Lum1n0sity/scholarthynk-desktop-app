class devConsole {
    constructor(elementId = null) {
        this.messages = [];
        this.elementId = elementId;
        this.isOpen = false;
    }
  
    log(message) {
        const line = this.getCurrentLine();
        const id = this.generateUniqueID();
        this.messages.push({ type: 'log', message: `${message}; Line ${line}`, id });
        if (this.isOpen)
        {
            this.addMessage('log', message, id);
        }
    }
  
    warn(message) {
        const line = this.getCurrentLine();
        const id = this.generateUniqueID();
        this.messages.push({ type: 'warn', message: `${message}; Line ${line}`, id });
        if (this.isOpen)
        {
            this.addMessage('warn', message, id);
        }
    }
  
    error(message) {
        const line = this.getCurrentLine();
        const id = this.generateUniqueID();
        this.messages.push({ type: 'error', message: `${message}; Line ${line}`, id });
        if (this.isOpen)
        {
            this.addMessage('error', message, id);
        }
    }
  
    clear() {
        this.messages = [];
        this.clearMessages();
    }

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
     
    displayNetwork() {
        const element = document.getElementById(this.elementId);
        const entries = window.performance.getEntries();

        const resourceEntries = entries.filter(entry => entry.entryType === 'resource');

        resourceEntries.forEach(entry => {
            const request = `${entry.name}<br>${entry.initiatorType}<br>${entry.duration}`
            this.addMessage('log', request, 'resourceEntries');
        });
    }

    switchRole(role) {
        const student = document.getElementById('student');
        const teacher = document.getElementById('teacher');
        const dev = document.getElementById('dev');

        if (role == 'student')
        {
            student.style.display = 'block';
            teacher.style.display = 'none';
            dev.style.display = 'none';
            const toggle_console_student = document.getElementById('toggle_console_student');
            toggle_console_student.style.display = 'block';
        }
        else if (role == 'teacher')
        {
            student.style.display = 'none';
            teacher.style.display = 'block';
            dev.style.display = 'none';
            const toggle_console_teacher = document.getElementById('toggle_console_teacher');
            toggle_console_teacher.style.display = 'block';
        }
        else if (role == 'dev')
        {
            student.style.display = 'none';
            teacher.style.display = 'none';
            dev.style.display = 'block';
        }
    }
  
    addMessage(type, message, id) {
        if (!id == 'resourceEntries')
        {
            const element = document.getElementById(this.elementId);
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messageElement.classList.add('console_element');
            messageElement.classList.add(type);
            element.appendChild(messageElement);
        }
        else
        {
            const element = document.getElementById(this.elementId);
            const messageElement = document.createElement('p');
            messageElement.innerHTML = message;
            messageElement.classList.add('console_element');
            messageElement.classList.add(type);
            element.appendChild(messageElement);
        }
    }

    loadMessages() {
        const elementId = this.elementId;
        this.messages.forEach(message => {
            this.addMessage(message.type, message.message, message.id);
        });
    }

    clearMessages() {
        const element = document.getElementById(this.elementId);
        element.innerHTML = '';
    }
    
    openConsole() {
        this.isOpen = true;
    }

    closeConsole() {
        this.isOpen = false;
    }
  
    generateUniqueID() {
        const timestamp = Date.now().toString();
        const randomPart = Math.random().toString(36).substr(2, 5);
        return `${timestamp}-${randomPart}`;
    }

    getCurrentLine() {
        let stackTrace = new Error().stack;

        let lineNumber = stackTrace.split("\n")[3];

        return lineNumber.match(/:(\d+):\d+/)[1];
    }
}
  
module.exports = devConsole;
