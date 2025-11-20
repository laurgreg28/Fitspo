class SignupManager {
  constructor() {
    this.form = document.getElementById('signupForm');
    this.passwordInput = document.getElementById('password');
    this.confirmPasswordInput = document.getElementById('confirmPassword');
    this.passwordMatchHint = document.getElementById('passwordMatch');
    this.signupBtn = document.getElementById('signupBtn');
    this.termsCheckbox = document.getElementById('termsAccepted');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkFormValidity();
  }

  setupEventListeners() {
    // Real-time password matching
    this.confirmPasswordInput.addEventListener('input', () => {
      this.checkPasswordMatch();
    });

    this.passwordInput.addEventListener('input', () => {
      this.checkPasswordMatch();
    });

    // Form validation on input change
    this.form.addEventListener('input', () => {
      this.checkFormValidity();
    });

    this.form.addEventListener('change', () => {
      this.checkFormValidity();
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      this.handleSubmit(e);
    });

    // Age validation for date of birth    const dobEl = document.getElementById('dateOfBirth');
    if (dobEl) {
      // validate on both input (typing) and change (picker/blur)
      dobEl.addEventListener('input', () => {
        this.checkFormValidity();
      });
      dobEl.addEventListener('change', () => {
        this.checkFormValidity();
      });
      // some browsers only finalize date input on blur/focusout
      dobEl.addEventListener('blur', () => {
        this.checkFormValidity();
      });
      dobEl.addEventListener('focusout', () => {
        this.checkFormValidity();
      });
    }

    // Email format validation
    document.getElementById('email').addEventListener('blur', () => {
      this.validateEmail();
    });

    // Username format validation
    document.getElementById('username').addEventListener('blur', () => {
      this.validateUsername();
    });

    // Terms checkbox: listen directly so clicks always re-run validation
    if (this.termsCheckbox) {
      this.termsCheckbox.addEventListener('change', () => {
        this.checkFormValidity();
      });
      this.termsCheckbox.addEventListener('click', () => {
        // ensure immediate re-check for some browsers
        this.checkFormValidity();
      });
    }

    // Ensure password input triggers validity re-check as well
    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        this.checkFormValidity();
      });
    }
  }

  checkPasswordMatch() {
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
      this.passwordMatchHint.textContent = '';
      this.passwordMatchHint.className = 'form-hint';
      return;
    }

    if (password === confirmPassword) {
      this.passwordMatchHint.textContent = 'Passwords match';
      this.passwordMatchHint.className = 'form-hint success';
    } else {
      this.passwordMatchHint.textContent = 'Passwords do not match';
      this.passwordMatchHint.className = 'form-hint error';
    }
  }

  validateAge() {
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const dobInput = document.getElementById('dateOfBirth');
    if (!dateOfBirth) {
      // clear any previous styling and return false so missing DOB is handled by form validity
      if (dobInput) dobInput.style.borderColor = '';
      return false;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      dobInput.style.borderColor = '#e74c3c';
      // Do not create a global overlay here — use inline summary instead
      return false;
    } else {
      dobInput.style.borderColor = '#27ae60';
      return true;
    }
  }

  validateEmail() {
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailInput = document.getElementById('email');
    
    if (email && !emailRegex.test(email)) {
      emailInput.style.borderColor = '#e74c3c';
      return false;
    } else if (email) {
      emailInput.style.borderColor = '#27ae60';
      return true;
    }
    return false;
  }

  validateUsername() {
    const username = document.getElementById('username').value;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const usernameInput = document.getElementById('username');
    
    if (username && !usernameRegex.test(username)) {
      usernameInput.style.borderColor = '#e74c3c';
      return false;
    } else if (username && username.length >= 3) {
      usernameInput.style.borderColor = '#27ae60';
      return true;
    }
    return false;
  }

  checkFormValidity() {
    const requiredFields = [
      'firstName', 'lastName', 'username', 'email', 'dateOfBirth', 
      'gender', 'password', 'confirmPassword'
    ];
    
    // Start with native HTML5 validation for required fields and basic constraints
    let isValid = true;
    let missingFields = [];

    try {
      isValid = this.form.checkValidity();
    } catch (e) {
      // If form isn't available for some reason, fall back to manual checks
      isValid = true;
      requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field || !field.value || !field.value.toString().trim()) {
          isValid = false;
          missingFields.push(fieldName);
        }
      });
    }

    // Custom checks: password match & length, terms accepted, email/username formats, age
  const password = this.passwordInput ? this.passwordInput.value : '';
  const confirmPassword = this.confirmPasswordInput ? this.confirmPasswordInput.value : '';

  // Use HTML constraint validation for password (minlength) where possible
  const passwordValid = this.passwordInput ? this.passwordInput.checkValidity() : false;
  const passwordMatch = password === confirmPassword && confirmPassword.length > 0;
  const termsChecked = this.termsCheckbox ? this.termsCheckbox.checked : false;

  if (!passwordMatch) isValid = false;
  if (!passwordValid) isValid = false;
  if (!termsChecked) isValid = false;
    // Validate email/username/age using the existing helpers (they also provide UI feedback)
  const emailValid = this.validateEmail();
  const usernameValid = this.validateUsername();
  // Only validate age when date is present; validateAge() returns boolean
  const ageValid = this.validateAge();
    if (!emailValid || !usernameValid || !ageValid) isValid = false;

    this.signupBtn.disabled = !isValid;

    // Update inline validation summary for user visibility
    let summary = document.getElementById('signupValidationSummary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'signupValidationSummary';
      summary.style.marginTop = '12px';
      summary.style.color = '#a0522d';
      summary.style.fontWeight = '600';
      this.form.appendChild(summary);
    }

    if (!isValid) {
      const issues = [];
      const uniqueMissing = Array.from(new Set(missingFields));
      if (uniqueMissing.length) issues.push('Missing required: ' + uniqueMissing.join(', '));
  if (!passwordMatch) issues.push('Passwords do not match');
  if (!passwordValid) issues.push('Password must be at least 8 characters');
  if (!termsChecked) issues.push('You must accept Terms & Conditions');
      if (!emailValid) issues.push('Please enter a valid email address');
      if (!usernameValid) issues.push('Username must be 3-20 characters: letters, numbers, or underscore');
      if (!ageValid) issues.push('You must be at least 13 years old');

      summary.innerHTML = issues.map(i => `<div>• ${i}</div>`).join('');
      summary.style.display = 'block';
    } else {
      summary.style.display = 'none';
    }

    // Debug logging when invalid to help tracing
    if (!isValid) {
      const debug = {};
      requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        debug[fieldName] = field ? field.value : null;
        if (!field || !field.value || !field.value.toString().trim()) missingFields.push(fieldName);
      });
      console.log('Form validation failed:', {
        missingFields: Array.from(new Set(missingFields)),
        passwordMatch: passwordMatch,
        passwordLengthOK: passwordValid,
        termsAccepted: termsChecked,
        emailValid,
        usernameValid,
        ageValid,
        values: debug
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    if (this.signupBtn.disabled) {
      this.showError('Please fill in all required fields correctly.');
      return;
    }

    // Collect form data
    const formData = new FormData(this.form);
    const userData = {
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      lastName: formData.get('lastName'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      dateOfBirth: formData.get('dateOfBirth'),
      gender: formData.get('gender'),
      emailNotifications: formData.get('emailNotifications') === 'on',
      termsAccepted: formData.get('termsAccepted') === 'on',
      signupDate: new Date().toISOString()
    };

    // Load existing users from localStorage (simulation)
    const existingUsers = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');

    // Check for duplicate email or username
    const emailExists = existingUsers.some(user => user.email === userData.email);
    if (emailExists) {
      this.showError('An account with this email already exists. Please use a different email or log in.');
      return;
    }

    const usernameExists = existingUsers.some(user => user.username === userData.username);
    if (usernameExists) {
      this.showError('This username is already taken. Please choose a different username.');
      return;
    }

    // Assign a local userId and save
    userData.userId = this.generateUserId();
    existingUsers.push(userData);
    localStorage.setItem('styleAssistUsers', JSON.stringify(existingUsers));

    // Mark as logged in locally
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(userData));

    // Update navigation immediately
    if (typeof updateNavigation === 'function') {
      updateNavigation();
    }

    // Handle pending quiz answers saved in sessionStorage
    const pendingQuizAnswers = sessionStorage.getItem('pendingQuizAnswers');
    if (pendingQuizAnswers) {
      if (typeof processPendingQuiz === 'function') {
        processPendingQuiz(JSON.parse(pendingQuizAnswers), userData);
      }
      sessionStorage.removeItem('pendingQuizAnswers');
      this.showSuccess('Account created! Redirecting to your personalized style results...');
      setTimeout(() => {
        window.location.href = 'quiz.html?showResults=true';
      }, 2000);
    } else {
      this.showSuccess('Account created successfully! Welcome to Fashionly!');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 2000);
    }
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showMessage(message, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ${type === 'error' ? 'background-color: #e74c3c;' : 'background-color: #27ae60;'}
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }
}

// Initialize signup manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new SignupManager();
});

// Update navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  // This page doesn't need dynamic navigation since it's always public
  // But we should include the main script functionality for consistency
});