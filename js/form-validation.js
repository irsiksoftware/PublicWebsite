/**
 * Form Validation with Real-Time Feedback
 * Join Initiative Contact Form
 */

(function() {
  'use strict';

  // Get form and elements
  const form = document.getElementById('initiativeForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const abilitiesInput = document.getElementById('abilities');
  const clearanceLevelInput = document.getElementById('clearanceLevel');
  const successMessage = document.getElementById('successMessage');

  // Error message elements
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const abilitiesError = document.getElementById('abilitiesError');
  const clearanceLevelError = document.getElementById('clearanceLevelError');

  // Validation rules
  const validators = {
    name: {
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Name must be less than 100 characters';
        }
        return '';
      },
      errorElement: nameError,
      inputElement: nameInput
    },
    email: {
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Email is required';
        }
        // Email pattern validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      },
      errorElement: emailError,
      inputElement: emailInput
    },
    abilities: {
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Special abilities description is required';
        }
        if (value.trim().length < 50) {
          return `Please provide at least 50 characters (${value.trim().length}/50)`;
        }
        if (value.trim().length > 1000) {
          return 'Description must be less than 1000 characters';
        }
        return '';
      },
      errorElement: abilitiesError,
      inputElement: abilitiesInput
    },
    clearanceLevel: {
      validate: (value) => {
        if (!value || value === '') {
          return 'Please select a clearance level';
        }
        return '';
      },
      errorElement: clearanceLevelError,
      inputElement: clearanceLevelInput
    }
  };

  /**
   * Validate a single field
   */
  function validateField(fieldName) {
    const validator = validators[fieldName];
    if (!validator) return true;

    const value = validator.inputElement.value;
    const errorMessage = validator.validate(value);

    // Update UI
    if (errorMessage) {
      validator.errorElement.textContent = errorMessage;
      validator.inputElement.classList.add('error');
      return false;
    } else {
      validator.errorElement.textContent = '';
      validator.inputElement.classList.remove('error');
      return true;
    }
  }

  /**
   * Validate all fields
   */
  function validateForm() {
    let isValid = true;

    for (const fieldName in validators) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Reset form and hide success message
   */
  function resetForm() {
    form.reset();

    // Clear all error messages and styles
    for (const fieldName in validators) {
      const validator = validators[fieldName];
      validator.errorElement.textContent = '';
      validator.inputElement.classList.remove('error');
    }

    // Hide success message
    successMessage.style.display = 'none';
    form.style.display = 'flex';
  }

  /**
   * Show success message and hide form
   */
  function showSuccess() {
    form.style.display = 'none';
    successMessage.style.display = 'block';

    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Reset form after 5 seconds
    setTimeout(resetForm, 5000);
  }

  // Attach blur event listeners for real-time validation
  nameInput.addEventListener('blur', () => validateField('name'));
  emailInput.addEventListener('blur', () => validateField('email'));
  abilitiesInput.addEventListener('blur', () => validateField('abilities'));
  clearanceLevelInput.addEventListener('blur', () => validateField('clearanceLevel'));

  // Optional: Add input event listeners for immediate feedback after first blur
  let hasBlurred = {
    name: false,
    email: false,
    abilities: false,
    clearanceLevel: false
  };

  nameInput.addEventListener('blur', () => { hasBlurred.name = true; }, { once: true });
  emailInput.addEventListener('blur', () => { hasBlurred.email = true; }, { once: true });
  abilitiesInput.addEventListener('blur', () => { hasBlurred.abilities = true; }, { once: true });
  clearanceLevelInput.addEventListener('blur', () => { hasBlurred.clearanceLevel = true; }, { once: true });

  nameInput.addEventListener('input', () => {
    if (hasBlurred.name) validateField('name');
  });

  emailInput.addEventListener('input', () => {
    if (hasBlurred.email) validateField('email');
  });

  abilitiesInput.addEventListener('input', () => {
    if (hasBlurred.abilities) validateField('abilities');
  });

  clearanceLevelInput.addEventListener('change', () => {
    if (hasBlurred.clearanceLevel) validateField('clearanceLevel');
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
      // Focus on first error field
      for (const fieldName in validators) {
        if (!validateField(fieldName)) {
          validators[fieldName].inputElement.focus();
          break;
        }
      }
      return;
    }

    // If validation passes, show success message
    showSuccess();
  });

})();
