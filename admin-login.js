document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminIdInput = document.getElementById('adminId');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const idError = document.getElementById('idError');
    const passwordError = document.getElementById('passwordError');

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle icon
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Form Submission Handler
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Reset errors
        clearErrors();

        // Validate inputs
        let isValid = true;

        if (!adminIdInput.value.trim()) {
            showError(adminIdInput, idError, 'Please enter the Admin ID');
            isValid = false;
        }

        if (!passwordInput.value) {
            showError(passwordInput, passwordError, 'Please enter the password');
            isValid = false;
        }

        if (isValid) {
            // Check credentials
            const enteredId = adminIdInput.value.trim();
            const enteredPass = passwordInput.value;

            if (enteredId === 'admin' && enteredPass === '123') {
                // Determine user session details
                const adminUser = { id: 'admin', firstName: 'Admin', lastName: 'User', role: 'admin' };
                localStorage.setItem('hospital_current_user', JSON.stringify(adminUser));
                
                const btn = adminLoginForm.querySelector('.login-btn');
                const originalText = btn.innerHTML;

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                btn.disabled = true;
                btn.style.opacity = '0.7';

                setTimeout(() => {
                    window.showToast(`Login Successful! Welcome to Admin Panel.`);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1000);
                }, 1500);
            } else {
                // Show errors for incorrect credentials
                showError(adminIdInput, idError, 'Invalid Admin ID or Password');
                showError(passwordInput, passwordError, 'Invalid Admin ID or Password');
            }
        }
    });

    // Input Focus Handlers to clear errors
    adminIdInput.addEventListener('input', () => clearInputError(adminIdInput, idError));
    passwordInput.addEventListener('input', () => clearInputError(passwordInput, passwordError));

    function showError(input, errorElement, message) {
        const group = input.closest('.input-group');
        group.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('visible');

        // Shake animation
        group.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            group.style.animation = '';
        }, 500);
    }

    function clearInputError(input, errorElement) {
        const group = input.closest('.input-group');
        group.classList.remove('error');
        errorElement.classList.remove('visible');
        setTimeout(() => {
            errorElement.textContent = '';
        }, 300); // Wait for transition
    }

    function clearErrors() {
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.classList.remove('visible');
            msg.textContent = '';
        });
    }

    // Add keyframe for shake animation dynamically
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(styleSheet);

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
