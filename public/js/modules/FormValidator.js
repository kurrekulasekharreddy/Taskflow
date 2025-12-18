export class FormValidator {
    constructor() {
        this.rules = new Map();
        this.errors = new Map();
        this.customMessages = new Map();
        this.isValid = true;
    }

    addRule(fieldName, rules) {
        this.rules.set(fieldName, rules);
        return this;
    }

    removeRule(fieldName) {
        this.rules.delete(fieldName);
        return this;
    }

    clearRules() {
        this.rules.clear();
        return this;
    }

    setCustomMessage(fieldName, ruleName, message) {
        const key = `${fieldName}:${ruleName}`;
        this.customMessages.set(key, message);
        return this;
    }

    getErrors() {
        return Object.fromEntries(this.errors);
    }

    getFieldError(fieldName) {
        return this.errors.get(fieldName) || null;
    }

    clearErrors() {
        this.errors.clear();
        this.isValid = true;
        return this;
    }

    validate(data) {
        this.clearErrors();
        this.isValid = true;

        for (const [fieldName, rules] of this.rules) {
            const value = data[fieldName];

            for (const rule of rules) {
                const result = this.validateRule(fieldName, value, rule);
                if (!result.valid) {
                    this.errors.set(fieldName, result.message);
                    this.isValid = false;
                    break;
                }
            }
        }

        return this.isValid;
    }

    validateRule(fieldName, value, rule) {
        const ruleName = typeof rule === 'string' ? rule : rule.name;
        const ruleParams = typeof rule === 'object' ? rule.params : [];

        switch (ruleName) {
            case 'required':
                if (!value || (typeof value === 'string' && !value.trim())) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, 'This field is required')
                    };
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, 'Invalid email format')
                    };
                }
                break;

            case 'minLength':
                const minLen = ruleParams[0] || 0;
                if (value && value.length < minLen) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, `Minimum ${minLen} characters required`)
                    };
                }
                break;

            case 'maxLength':
                const maxLen = ruleParams[0] || 255;
                if (value && value.length > maxLen) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, `Maximum ${maxLen} characters allowed`)
                    };
                }
                break;

            case 'pattern':
                const pattern = ruleParams[0];
                if (value && pattern && !pattern.test(value)) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, 'Invalid format')
                    };
                }
                break;

            case 'numeric':
                if (value && isNaN(Number(value))) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, 'Must be a number')
                    };
                }
                break;

            case 'date':
                if (value && isNaN(Date.parse(value))) {
                    return {
                        valid: false,
                        message: this.getMessage(fieldName, ruleName, 'Invalid date')
                    };
                }
                break;

            case 'futureDate':
                if (value) {
                    const inputDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (inputDate < today) {
                        return {
                            valid: false,
                            message: this.getMessage(fieldName, ruleName, 'Date must be in the future')
                        };
                    }
                }
                break;
        }

        return { valid: true };
    }

    getMessage(fieldName, ruleName, defaultMessage) {
        const key = `${fieldName}:${ruleName}`;
        return this.customMessages.get(key) || defaultMessage;
    }

    validateField(fieldName, value) {
        const rules = this.rules.get(fieldName);
        if (!rules) return true;

        for (const rule of rules) {
            const result = this.validateRule(fieldName, value, rule);
            if (!result.valid) {
                this.errors.set(fieldName, result.message);
                return false;
            }
        }

        this.errors.delete(fieldName);
        return true;
    }

    showFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return this;

        let errorEl = formGroup.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            errorEl.style.cssText = 'color: var(--danger-color); font-size: 0.75rem; margin-top: 0.25rem; display: block;';
            formGroup.appendChild(errorEl);
        }
        errorEl.textContent = message;
        input.style.borderColor = 'var(--danger-color)';

        return this;
    }

    clearFieldError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return this;

        const errorEl = formGroup.querySelector('.field-error');
        if (errorEl) errorEl.remove();
        input.style.borderColor = '';

        return this;
    }

    attachToForm(form, onSubmit) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            form.querySelectorAll('.field-error').forEach(el => el.remove());
            form.querySelectorAll('input, textarea, select').forEach(el => {
                el.style.borderColor = '';
            });

            if (this.validate(data)) {
                onSubmit(data);
            } else {
                for (const [fieldName, message] of this.errors) {
                    const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
                    if (input) this.showFieldError(input, message);
                }
            }
        });

        return this;
    }
}

export default new FormValidator();
