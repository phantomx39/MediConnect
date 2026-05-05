document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const globalError = document.getElementById('globalError');

    // Toggle Password Visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);

                // Toggle icon
                const icon = btn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    });

    // Form Submission Handler
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Reset errors
        clearErrors();

        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        let isValid = true;

        if (!firstName.value.trim()) { showError(firstName); isValid = false; }
        if (!lastName.value.trim()) { showError(lastName); isValid = false; }
        if (!email.value.trim() || !email.value.includes('@')) { showError(email); isValid = false; }

        if (!password.value || password.value.length < 6) {
            showError(password);
            isValid = false;
            showGlobalError('Password must be at least 6 characters');
        } else if (password.value !== confirmPassword.value) {
            showError(confirmPassword);
            isValid = false;
            showGlobalError('Passwords do not match');
        }

        if (isValid) {
            const btn = registerForm.querySelector('.register-btn');
            const originalText = btn.innerHTML;

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // Simulate API Call & Save to localStorage
            setTimeout(() => {
                // Generate Patient ID
                const patientId = 'PT-' + Math.floor(100000 + Math.random() * 900000);
                
                // Save to localStorage
                const newUser = {
                    id: patientId,
                    firstName: firstName.value.trim(),
                    lastName: lastName.value.trim(),
                    email: email.value.trim(),
                    password: password.value,
                    role: 'patient',
                    registeredAt: new Date().toISOString()
                };

                let users = JSON.parse(localStorage.getItem('hospital_users')) || [];
                users.push(newUser);
                localStorage.setItem('hospital_users', JSON.stringify(users));

                window.showToast(`Registration successful! Your Patient ID is ${patientId}. Please login.`);
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                
                // Simulate redirect
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }, 1000);
        }
    });

    // Input Focus Handlers to clear errors
    document.querySelectorAll('.input-wrapper input').forEach(input => {
        input.addEventListener('input', () => {
            clearInputError(input);
            globalError.classList.remove('visible');
            globalError.textContent = '';
        });
    });

    function showError(input) {
        const group = input.closest('.input-group');
        group.classList.add('error');
        // Shake animation
        group.style.animation = 'shake 0.5s ease';
        setTimeout(() => { group.style.animation = ''; }, 500);
    }

    function showGlobalError(msg) {
        globalError.textContent = msg;
        globalError.classList.add('visible');
    }

    function clearInputError(input) {
        const group = input.closest('.input-group');
        group.classList.remove('error');
    }

    function clearErrors() {
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('error'));
        globalError.classList.remove('visible');
        globalError.textContent = '';
    }

    // Add keyframe for shake animation dynamically
    if (!document.getElementById('shakeKeyframe')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'shakeKeyframe';
        styleSheet.innerText = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // --- Global Toast Function ---
    window.showToast = function (message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `ui-toast ${type}`;

        const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span class="ui-toast-content">${message}</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 3000);
    };
});
