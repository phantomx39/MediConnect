document.addEventListener('DOMContentLoaded', () => {
    // Set date input constraints (min 2026, max +10 years)
    const minYear = Math.max(2026, new Date().getFullYear());
    const maxYear = minYear + 10;
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('min', `${minYear}-01-01`);
        input.setAttribute('max', `${maxYear}-12-31`);
    });

    // ---- 1. Check Authentication ----
    const currentUser = JSON.parse(localStorage.getItem('hospital_current_user'));
    
    const API_BASE = 'http://127.0.0.1:8000';

    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.content-section');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active from all links and sections
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            sections.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });
            
            // Add active to clicked link
            link.parentElement.classList.add('active');
            
            // Show target section
            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if(targetEl) {
                targetEl.classList.add('active');
                targetEl.style.display = 'block';
            }
            
            // On mobile, close sidebar after clicking
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
            
            // If switching to Dashboard, re-render counts
            if(targetId === 'dashboard-section') {
                updateDashboardCounts();
            }
        });
    });
    
    // Mobile Sidebar Toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // ---- 3. Dropdown Logic ----
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = trigger.getAttribute('data-dropdown');
            const menu = document.getElementById(targetId);
            
            // Close other menus
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m.id !== targetId) m.classList.remove('active');
            });
            
            menu.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
    });
    
    // ---- 4. Logout Logic ----
    const handleLogout = () => {
        localStorage.removeItem('hospital_current_user');
        window.location.href = 'index.html';
    };
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('headerLogoutBtn').addEventListener('click', handleLogout);
    
    // ---- 5. Admin Data Management ----
    const usersTableBody = document.querySelector('#usersTable tbody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const totalPatientsCount = document.getElementById('totalPatientsCount');
    const newRegsCount = document.getElementById('newRegsCount');
    
    // Fetch users
    function getUsers() {
        return JSON.parse(localStorage.getItem('hospital_users')) || [];
    }
    
    function saveUsers(users) {
        localStorage.setItem('hospital_users', JSON.stringify(users));
        renderUsersTable();
        updateDashboardCounts();
    }
    
    function updateDashboardCounts() {
        const users = getUsers();
        const patients = users.filter(u => u.role === 'patient');
        
        // Update Total Patients
        totalPatientsCount.textContent = patients.length;
        
        // Calculate new registrations today
        const today = new Date().toDateString();
        const newRegs = patients.filter(u => {
            if(!u.registeredAt) return false;
            return new Date(u.registeredAt).toDateString() === today;
        });
        
        newRegsCount.textContent = newRegs.length;
    }
    
    function renderUsersTable() {
        const users = getUsers();
        usersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            document.querySelector('.table-responsive').style.display = 'none';
            noUsersMessage.style.display = 'block';
            return;
        }
        
        document.querySelector('.table-responsive').style.display = 'block';
        noUsersMessage.style.display = 'none';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            
            // Format date if exists
            let regDate = 'N/A';
            if(user.registeredAt) {
                const d = new Date(user.registeredAt);
                regDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            
            const roleClass = user.role === 'admin' ? 'role-admin' : 'role-patient';
            const roleLabel = user.role === 'admin' ? 'Admin' : 'Patient';
            const fullName = `${user.firstName} ${user.lastName}`;
            
            tr.innerHTML = `
                <td style="font-weight: 500;">${user.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=32&rounded=true" alt="${fullName}" style="width:32px; height:32px; border-radius:50%;">
                        <span>${fullName}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge ${roleClass}">${roleLabel}</span></td>
                <td>${regDate}</td>
                <td>
                    <button class="action-btn edit" data-id="${user.id}" title="Edit User">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <!-- Do not allow deleting admins to prevent lockouts, demo purpose only -->
                    ${user.role === 'patient' ? `<button class="action-btn delete" data-id="${user.id}" data-name="${fullName}" title="Delete User"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            `;
            usersTableBody.appendChild(tr);
        });
        
        // Attach Event Listeners for Edit & Delete buttons
        document.querySelectorAll('#usersTable .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                openEditModal(id);
            });
        });
        
        document.querySelectorAll('#usersTable .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                openDeleteModal(id, name, 'user');
            });
        });
    }
    
    // ---- 6. Modal Logic ----
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    
    // Form Elements
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const editUserId = document.getElementById('editUserId');
    const editUserRegisteredAt = document.getElementById('editUserRegisteredAt');
    const modalFirstName = document.getElementById('modalFirstName');
    const modalLastName = document.getElementById('modalLastName');
    const modalEmail = document.getElementById('modalEmail');
    const modalPassword = document.getElementById('modalPassword');
    const modalRole = document.getElementById('modalRole');
    const passwordHint = document.getElementById('passwordHint');
    
    // Delete Elements
    let entityToDeleteId = null;
    let entityToDeleteType = null;
    const deleteUserName = document.getElementById('deleteUserName');
    
    // Open Add User Modal
    document.getElementById('addUserBtn').addEventListener('click', () => {
        userForm.reset();
        editUserId.value = '';
        editUserRegisteredAt.value = '';
        modalTitle.textContent = 'Add New User';
        modalPassword.required = true;
        passwordHint.style.display = 'none';
        userModal.classList.add('active');
    });
    
    // Open Edit User Modal
    function openEditModal(id) {
        const users = getUsers();
        const user = users.find(u => u.id === id);
        if(!user) return;
        
        userForm.reset();
        editUserId.value = user.id;
        editUserRegisteredAt.value = user.registeredAt || '';
        modalFirstName.value = user.firstName;
        modalLastName.value = user.lastName;
        modalEmail.value = user.email;
        modalRole.value = user.role;
        
        modalTitle.textContent = 'Edit User';
        modalPassword.required = false; // Not required on edit
        passwordHint.style.display = 'block';
        
        userModal.classList.add('active');
    }
    
    // Open Delete Modal Placeholder function (used by all types)
    function openDeleteModal(id, name, type='user') {
        entityToDeleteId = id;
        entityToDeleteType = type;
        deleteUserName.textContent = name;
        deleteModal.classList.add('active');
    }
    
    // Close All Modals
    document.querySelectorAll('.close-modal, #cancelModalBtn, #cancelDeleteBtn, #cancelAptBtn, #cancelPrescBtn, #cancelBillBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        });
    });
    
    // Handle Save User (Add or Edit)
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const isEdit = editUserId.value !== '';
        const users = getUsers();
        
        if (isEdit) {
            // Update existing
            const index = users.findIndex(u => u.id === editUserId.value);
            if(index !== -1) {
                users[index].firstName = modalFirstName.value.trim();
                users[index].lastName = modalLastName.value.trim();
                users[index].email = modalEmail.value.trim();
                users[index].role = modalRole.value;
                
                // If password was entered, update it
                if (modalPassword.value) {
                    users[index].password = modalPassword.value;
                }
                
                window.showToast('User updated successfully');
            }
        } else {
            // Add new user
            const newId = 'PT-' + Math.floor(100000 + Math.random() * 900000);
            const newUser = {
                id: newId,
                firstName: modalFirstName.value.trim(),
                lastName: modalLastName.value.trim(),
                email: modalEmail.value.trim(),
                password: modalPassword.value,
                role: modalRole.value,
                registeredAt: new Date().toISOString()
            };
            users.push(newUser);
            window.showToast(`User added successfully. Patient ID is ${newId}`);
        }
        
        saveUsers(users);
        userModal.classList.remove('active');
    });
    
    // Handle Delete Check
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if(entityToDeleteId) {
            try {
                if(entityToDeleteType === 'user') {
                    let users = getUsers();
                    users = users.filter(u => u.id !== entityToDeleteId);
                    localStorage.setItem('hospital_users', JSON.stringify(users));
                    renderUsersTable();
                } else if(entityToDeleteType === 'apt') {
                    await fetch(`${API_BASE}/appointments/${entityToDeleteId}`, { method: 'DELETE' });
                    await renderApptsTable();
                } else if(entityToDeleteType === 'presc') {
                    await fetch(`${API_BASE}/prescriptions/${entityToDeleteId}`, { method: 'DELETE' });
                    await renderPrescsTable();
                } else if(entityToDeleteType === 'bill') {
                    await fetch(`${API_BASE}/billing/${entityToDeleteId}`, { method: 'DELETE' });
                    await renderBillsTable();
                }
                window.showToast('Record deleted successfully', 'success');
            } catch(e) { window.showToast('Failed to delete', 'error'); }
            
            deleteModal.classList.remove('active');
            entityToDeleteId = null;
            entityToDeleteType = null;
        }
    });
    
    // ---- 7. Global Toast UI Helper ----
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

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); 
        }, 3000);
    };
    // ---- 8. Appointments CRUD ----
    const aptForm = document.getElementById('aptForm');
    const aptModal = document.getElementById('aptModal');
    async function getAppts() { 
        try {
            const res = await fetch(`${API_BASE}/appointments`);
            if (res.ok) return await res.json();
            return [];
        } catch(e) { return []; } 
    }
    
    async function renderApptsTable() {
        const items = await getAppts();
        const tbody = document.querySelector('#adminAptTable tbody');
        tbody.innerHTML = '';
        if(items.length===0) {
            document.getElementById('noAptMessage').style.display = 'block';
            document.querySelector('#adminAptTable').parentElement.style.display = 'none';
            return;
        }
        document.getElementById('noAptMessage').style.display = 'none';
        document.querySelector('#adminAptTable').parentElement.style.display = 'block';
        
        items.forEach(item => {
            const tr = document.createElement('tr');
            
            let bTimeStr = "N/A";
            if (item.booking_time) {
                const bTime = new Date(item.booking_time);
                bTimeStr = bTime.toLocaleDateString() + ' ' + bTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.serial_number || 'N/A'}</td>
                <td>${item.patient_id || item.patientId}</td>
                <td>${item.doctor}</td>
                <td>${item.date} ${item.time}</td>
                <td>${item.dept}</td>
                <td><span class="badge ${getStatusBadge(item.status)}">${item.status}</span></td>
                <td><span style="font-size: 13px; color: var(--text-muted);">${bTimeStr}</span></td>
                <td>
                    <button class="action-btn edit" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" data-id="${item.id}" data-name="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('#adminAptTable .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditAptModal(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('#adminAptTable .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id'), `Appointment ${btn.getAttribute('data-id')}`, 'apt'));
        });
    }

    document.getElementById('addAptBtn').addEventListener('click', () => {
        aptForm.reset();
        document.getElementById('editAptId').value = '';
        document.getElementById('modalAptTitle').textContent = 'Add Appointment';
        aptModal.classList.add('active');
    });

    async function openEditAptModal(id) {
        const items = await getAppts();
        const item = items.find(i => i.id === id);
        if(!item) return;
        aptForm.reset();
        document.getElementById('editAptId').value = item.id;
        document.getElementById('modalAptPatient').value = item.patient_id || item.patientId;
        document.getElementById('modalAptDoctor').value = item.doctor;
        document.getElementById('modalAptDept').value = item.dept;
        document.getElementById('modalAptStatus').value = item.status;
        document.getElementById('modalAptDate').value = item.date;
        document.getElementById('modalAptTime').value = item.time;
        document.getElementById('modalAptReason').value = item.reason;
        document.getElementById('modalAptTitle').textContent = 'Edit Appointment';
        aptModal.classList.add('active');
    }

    aptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const items = await getAppts();
        const id = document.getElementById('editAptId').value;

        const doc = document.getElementById('modalAptDoctor').value;
        const date = document.getElementById('modalAptDate').value;
        const time = document.getElementById('modalAptTime').value;

        const isBooked = items.some(apt => 
            apt.id !== id && 
            apt.doctor === doc && 
            apt.date === date && 
            apt.time === time
        );
        
        if (isBooked) {
            window.showToast('This doctor is already booked for this particular date and time slot.', 'error');
            return;
        }

        const aptData = {
            id: id ? id : 'APT-' + Math.floor(1000 + Math.random() * 9000),
            patient_id: document.getElementById('modalAptPatient').value,
            doctor: document.getElementById('modalAptDoctor').value,
            dept: document.getElementById('modalAptDept').value,
            status: document.getElementById('modalAptStatus').value,
            date: document.getElementById('modalAptDate').value,
            time: document.getElementById('modalAptTime').value,
            reason: document.getElementById('modalAptReason').value
        };

        try {
            if(id) {
                await fetch(`${API_BASE}/appointments/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aptData)
                });
            } else {
                await fetch(`${API_BASE}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aptData)
                });
            }
            await renderApptsTable();
            aptModal.classList.remove('active');
            window.showToast('Appointment saved successfully');
        } catch(e) { console.error(e); window.showToast('Failed to save appointment', 'error'); }
    });

    // ---- 9. Prescriptions CRUD ----
    const prescForm = document.getElementById('prescForm');
    const prescModal = document.getElementById('prescModal');
    async function getPrescs() { 
        try {
            const res = await fetch(`${API_BASE}/prescriptions`);
            if (res.ok) return await res.json();
            return [];
        } catch(e) { return []; } 
    }
    
    async function renderPrescsTable() {
        const items = await getPrescs();
        const tbody = document.querySelector('#adminPrescTable tbody');
        tbody.innerHTML = '';
        if(items.length===0) {
            document.getElementById('noPrescMessage').style.display = 'block';
            document.querySelector('#adminPrescTable').parentElement.style.display = 'none';
            return;
        }
        document.getElementById('noPrescMessage').style.display = 'none';
        document.querySelector('#adminPrescTable').parentElement.style.display = 'block';
        
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.patient_id || item.patientId}</td>
                <td>${item.medication}</td>
                <td>${item.doctor}</td>
                <td>${item.date}</td>
                <td><span class="badge ${getStatusBadge(item.status)}">${item.status}</span></td>
                <td>
                    <button class="action-btn edit" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" data-id="${item.id}" data-name="${item.medication}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('#adminPrescTable .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditPrescModal(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('#adminPrescTable .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'), 'presc'));
        });
    }

    document.getElementById('addPrescBtn').addEventListener('click', () => {
        prescForm.reset();
        document.getElementById('editPrescId').value = '';
        document.getElementById('modalPrescTitle').textContent = 'Add Prescription';
        prescModal.classList.add('active');
    });

    async function openEditPrescModal(id) {
        const items = await getPrescs();
        const item = items.find(i => i.id === id);
        if(!item) return;
        prescForm.reset();
        document.getElementById('editPrescId').value = item.id;
        document.getElementById('modalPrescPatient').value = item.patient_id || item.patientId;
        document.getElementById('modalPrescDoctor').value = item.doctor;
        document.getElementById('modalPrescMed').value = item.medication;
        document.getElementById('modalPrescDosage').value = item.dosage;
        document.getElementById('modalPrescStatus').value = item.status;
        document.getElementById('modalPrescRefills').value = item.refills;
        document.getElementById('modalPrescDate').value = item.date;
        document.getElementById('modalPrescTitle').textContent = 'Edit Prescription';
        prescModal.classList.add('active');
    }

    prescForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPrescId').value;
        const prescData = {
            id: id ? id : 'RX-' + Math.floor(1000 + Math.random() * 9000),
            patient_id: document.getElementById('modalPrescPatient').value,
            doctor: document.getElementById('modalPrescDoctor').value,
            medication: document.getElementById('modalPrescMed').value,
            dosage: document.getElementById('modalPrescDosage').value,
            status: document.getElementById('modalPrescStatus').value,
            refills: document.getElementById('modalPrescRefills').value,
            date: document.getElementById('modalPrescDate').value
        };

        try {
            if(id) {
                await fetch(`${API_BASE}/prescriptions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prescData)
                });
            } else {
                await fetch(`${API_BASE}/prescriptions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prescData)
                });
            }
            await renderPrescsTable();
            prescModal.classList.remove('active');
            window.showToast('Prescription saved successfully');
        } catch(e) { console.error(e); window.showToast('Failed to save prescription', 'error'); }
    });

    // ---- 10. Billing CRUD ----
    const billForm = document.getElementById('billForm');
    const billModal = document.getElementById('billModal');
    async function getBills() { 
        try {
            const res = await fetch(`${API_BASE}/billing`);
            if (res.ok) return await res.json();
            return [];
        } catch(e) { return []; } 
    }
    
    async function renderBillsTable() {
        const items = await getBills();
        const tbody = document.querySelector('#adminBillTable tbody');
        tbody.innerHTML = '';
        if(items.length===0) {
            document.getElementById('noBillMessage').style.display = 'block';
            document.querySelector('#adminBillTable').parentElement.style.display = 'none';
            return;
        }
        document.getElementById('noBillMessage').style.display = 'none';
        document.querySelector('#adminBillTable').parentElement.style.display = 'block';
        
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.patient_id || item.patientId}</td>
                <td>${item.description}</td>
                <td>$${parseFloat(item.amount).toFixed(2)}</td>
                <td>${item.date}</td>
                <td><span class="badge ${getStatusBadge(item.status)}">${item.status}</span></td>
                <td>
                    <button class="action-btn edit" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" data-id="${item.id}" data-name="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('#adminBillTable .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditBillModal(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('#adminBillTable .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id'), `Invoice ${btn.getAttribute('data-id')}`, 'bill'));
        });
    }

    document.getElementById('addBillBtn').addEventListener('click', () => {
        billForm.reset();
        document.getElementById('editBillId').value = '';
        document.getElementById('modalBillTitle').textContent = 'Add Invoice';
        billModal.classList.add('active');
    });

    async function openEditBillModal(id) {
        const items = await getBills();
        const item = items.find(i => i.id === id);
        if(!item) return;
        billForm.reset();
        document.getElementById('editBillId').value = item.id;
        document.getElementById('modalBillPatient').value = item.patient_id || item.patientId;
        document.getElementById('modalBillDesc').value = item.description;
        document.getElementById('modalBillAmt').value = parseFloat(item.amount).toFixed(2);
        document.getElementById('modalBillStatus').value = item.status;
        document.getElementById('modalBillDate').value = item.date;
        document.getElementById('modalBillTitle').textContent = 'Edit Invoice';
        billModal.classList.add('active');
    }

    billForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editBillId').value;
        const billData = {
            id: id ? id : 'INV-' + Math.floor(1000 + Math.random() * 9000),
            patient_id: document.getElementById('modalBillPatient').value,
            description: document.getElementById('modalBillDesc').value,
            amount: document.getElementById('modalBillAmt').value,
            status: document.getElementById('modalBillStatus').value,
            date: document.getElementById('modalBillDate').value
        };

        try {
            if(id) {
                await fetch(`${API_BASE}/billing/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(billData)
                });
            } else {
                await fetch(`${API_BASE}/billing`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(billData)
                });
            }
            await renderBillsTable();
            billModal.classList.remove('active');
            window.showToast('Invoice saved successfully');
        } catch(e) { console.error(e); window.showToast('Failed to save invoice', 'error'); }
    });

    function getStatusBadge(status) {
        const s = status.toLowerCase();
        if(s === 'confirmed' || s === 'paid' || s === 'active' || s === 'completed') return 'role-admin'; // reusing green badge
        if(s === 'pending' || s === 'unpaid') return 'role-patient'; // reusing orange badge
        if(s === 'scheduled') return 'role-admin'; // primary color
        return '';
    }

    // Initialization
    renderUsersTable();
    renderApptsTable();
    renderPrescsTable();
    renderBillsTable();
    updateDashboardCounts();
});
