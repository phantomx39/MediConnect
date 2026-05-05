document.addEventListener('DOMContentLoaded', () => {
    // Set date input constraints (min 2026, max +10 years)
    const minYear = Math.max(2026, new Date().getFullYear());
    const maxYear = minYear + 10;
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('min', `${minYear}-01-01`);
        input.setAttribute('max', `${maxYear}-12-31`);
    });

    // ---- 0. Authentication & Initial Data Setup ----
    let currentUser = JSON.parse(localStorage.getItem('hospital_current_user'));
    
    // Redirect if not logged in (basic check)
    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        // Mute this for dev purposes, but usually: window.location.href = 'index.html';
        currentUser = { id: 'PT-000000', firstName: 'Guest', lastName: 'User' };
    }

    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        currentUser = { id: 'PT-000000', firstName: 'Guest', lastName: 'User' };
    }

    if (currentUser) {
        const welcomeTitles = document.querySelectorAll('.welcome-section h1');
        if(welcomeTitles.length > 0) {
            welcomeTitles[0].innerHTML = `Welcome back, ${currentUser.firstName}!`;
        }
        const profileNames = document.querySelectorAll('.user-name');
        if(profileNames.length > 0) {
            profileNames[0].textContent = currentUser.firstName;
        }
    }

    const API_BASE = 'http://127.0.0.1:8000';

    // ---- Sidebar Toggle for Mobile ----
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (sidebar.classList.contains('active')) {
                mainContent.style.marginLeft = '260px'; // Adjust margin to show sidebar
            } else {
                mainContent.style.marginLeft = '0'; // Hide sidebar
            }
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                mainContent.style.marginLeft = '0';
            }
        }
    });

    // Resize handler to reset styles
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            mainContent.style.marginLeft = '260px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    
    const doLogout = () => {
        // In a real app, clear session/tokens here
        window.location.href = 'index.html';
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            doLogout();
        });
    }
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            doLogout();
        });
    }

    // SPA Navigation Logic
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');

            // Only handle links with data-target
            if (targetId) {
                e.preventDefault();

                // 1. Update active state in sidebar
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');

                // 2. Hide all sections and show the target section
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none';
                });

                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    // Add a small fade-in effect
                    targetSection.style.opacity = 0;
                    targetSection.style.display = 'block';
                    setTimeout(() => {
                        targetSection.style.transition = 'opacity 0.3s ease';
                        targetSection.style.opacity = 1;
                    }, 10);
                }

                // 3. Close sidebar on mobile after clicking
                if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    mainContent.style.marginLeft = '0';
                }
            }
        });
    });

    // --- NEW: Dashboard Micro-Interactions ---

    // 1. Cross-Section Links (e.g. "Book Visit" button on doctor card)
    const bookVisitBtns = document.querySelectorAll('.doctor-card .btn-primary');
    bookVisitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Find the Book Appointment sidebar link and simulate a click
            const bookLink = document.querySelector('.sidebar-nav a[data-target="book-appointment-section"]');
            if (bookLink) {
                bookLink.click();

                // Optionally pre-fill the doctor name (Bonus feature)
                const doctorName = btn.closest('.doctor-card').querySelector('h3').textContent;
                const doctorSelect = document.querySelector('.book-form select:nth-of-type(2)');
                if (doctorSelect) {
                    for (let i = 0; i < doctorSelect.options.length; i++) {
                        if (doctorSelect.options[i].text === doctorName) {
                            doctorSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        });
    });

    // 2. Interactive Tabs (My Appointments)
    const tabBtns = document.querySelectorAll('.page-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            btn.classList.add('active');

            // Note: In a real app this would filter the table data.
        });
    });

    // 3. Form Submission Feedback & Logic
    
    // Booking Form Setup
    const bookForm = document.querySelector('.book-form');
    if (bookForm) {
        const docSelect = bookForm.querySelectorAll('select')[1];
        const timeSelect = bookForm.querySelectorAll('select')[2];
        const dateInput = bookForm.querySelector('input[type="date"]');

        function updateTimeSlots() {
            const doc = docSelect.value;
            const date = dateInput.value;
            for (let i = 1; i < timeSelect.options.length; i++) {
                let opt = timeSelect.options[i];
                if (!opt.hasAttribute('value')) {
                    opt.setAttribute('value', opt.text);
                }
                opt.text = opt.value;
                opt.disabled = false;
            }
        }

        docSelect.addEventListener('change', updateTimeSlots);
        dateInput.addEventListener('change', updateTimeSlots);

        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = bookForm.querySelector('.btn-primary');
            const originalText = btn.innerHTML;

            const selects = bookForm.querySelectorAll('select');
            const dept = selects[0].value;
            const doc = selects[1].value;
            const time = selects[2].value;
            const date = bookForm.querySelector('input[type="date"]').value;
            const reason = document.getElementById('bookReason').value;

            if (dept === 'Select Department' || doc === 'Select Doctor' || !date || time === 'Select Time Slot') {
                window.showToast('Please fill all required booking fields.', 'info');
                return;
            }

            // Loading state
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            const newApt = {
                id: 'APT-' + Math.floor(1000 + Math.random() * 9000),
                patient_id: currentUser.id,
                doctor: doc,
                dept: dept,
                date: date,
                time: time,
                status: 'Pending',
                reason: reason
            };

            fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newApt)
            })
            .then(res => res.json())
            .then(data => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Appointment Confirmed!';
                btn.style.backgroundColor = '#198754';
                btn.style.color = 'white';

                // Re-render tables
                renderDashData();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                    btn.disabled = false;
                    bookForm.reset();
                    
                    // Navigate back to appointments list
                    document.querySelector('.sidebar-nav a[data-target="appointments-section"]').click();
                    window.showToast('Appointment Request Sent!');
                }, 2000);
            })
            .catch(err => {
                console.error(err);
                btn.innerHTML = originalText;
                btn.disabled = false;
                window.showToast('Error booking appointment', 'error');
            });
        });
    }

    const otherForms = [
        { selector: '.profile-form .btn-primary', message: 'Profile Updated!' },
        { selector: '.billing-card .btn-primary', message: 'Payment Processed!' },
        { selector: '.contact-form .btn-primary', message: 'Message Sent!' }
    ];

    otherForms.forEach(form => {
        const btn = document.querySelector(form.selector);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const originalText = btn.innerHTML;
                
                // If it\'s the pay button, mock paying the bill
                if (form.selector.includes('billing-card')) {
                    try {
                        fetch(`${API_BASE}/billing/pay/${currentUser.id}`, { method: 'PUT' })
                        .then(() => renderDashData());
                    } catch (err) {
                        console.error(err);
                    }
                }

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btn.disabled = true;

                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + form.message;
                    btn.style.backgroundColor = '#198754';
                    btn.style.color = 'white';

                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.disabled = false;
                    }, 3000);
                }, 1000);
            });
        }
    });

    // 4. Header Dropdowns
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');

    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent document click listener from firing immediately
            const targetId = trigger.getAttribute('data-dropdown');
            const targetMenu = document.getElementById(targetId);

            // Close all other menus first
            dropdownMenus.forEach(menu => {
                if (menu.id !== targetId) {
                    menu.classList.remove('active');
                }
            });

            // Toggle the clicked menu
            if (targetMenu) {
                targetMenu.classList.toggle('active');
                trigger.classList.toggle('active');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            dropdownMenus.forEach(menu => menu.classList.remove('active'));
            dropdownTriggers.forEach(trigger => trigger.classList.remove('active'));
        }
    });

    // Header Logout handler
    const headerLogout = document.getElementById('headerLogoutBtn');
    if (headerLogout) {
        headerLogout.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                window.location.href = 'index.html';
            }
        });
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

    // --- Accordions (FAQ) ---
    const faqHeaders = document.querySelectorAll('.faq-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            const isActive = header.classList.contains('active');

            // Close all other accordions
            document.querySelectorAll('.faq-body').forEach(b => b.style.maxHeight = null);
            document.querySelectorAll('.faq-header').forEach(h => h.classList.remove('active'));

            // Toggle current
            if (!isActive) {
                header.classList.add('active');
                body.style.maxHeight = body.scrollHeight + "px";
            }
        });
    });

    // --- Data Rendering ---
    function getStatusClass(status) {
        status = status.toLowerCase();
        if (status === 'confirmed' || status === 'paid' || status === 'active' || status === 'completed') return status;
        if (status === 'pending' || status === 'unpaid') return 'pending';
        return 'scheduled';
    }

    async function renderDashData() {
        try {
            const upRes = await fetch(`${API_BASE}/appointments?patient_id=${currentUser.id}`);
            const myAppts = await upRes.json();
            
            const prRes = await fetch(`${API_BASE}/prescriptions?patient_id=${currentUser.id}`);
            let myPresc = [];
            if (prRes.ok) myPresc = await prRes.json();
            
            const blRes = await fetch(`${API_BASE}/billing?patient_id=${currentUser.id}`);
            let myBills = [];
            if (blRes.ok) myBills = await blRes.json();

        // 1. Render Dashboard Overview Summary Numbers
        document.querySelector('.summary-card:nth-child(1) .count').textContent = myAppts.length;
        document.querySelector('.summary-card:nth-child(3) .count').textContent = myPresc.filter(p => p.status === 'Active').length;

        // Populate Table lists
        const upApptsList = document.getElementById('upcomingApptsList');
        const allApptsList = document.getElementById('allApptsList');
        
        let apptHtml = '';
        myAppts.forEach(apt => {
            const sc = getStatusClass(apt.status);
            const docName = apt.doctor.replace('Dr. ', '');
            
            let bTimeStr = "N/A";
            if (apt.booking_time) {
                const bTime = new Date(apt.booking_time);
                bTimeStr = bTime.toLocaleDateString() + ' ' + bTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            apptHtml += `
                <tr>
                    <td>${apt.serial_number || 'N/A'}</td>
                    <td>
                        <div class="doctor-info">
                            <img src="https://ui-avatars.com/api/?name=${docName.replace(' ','+')}&background=random" alt="${apt.doctor}">
                            <span>${apt.doctor}</span>
                        </div>
                    </td>
                    <td>${apt.date}</td>
                    <td>${apt.time}</td>
                    <td>${apt.dept}</td>
                    <td><span class="status ${sc}">${apt.status}</span></td>
                    <td><span style="font-size: 13px; color: var(--text-muted);">${bTimeStr}</span></td>
                </tr>
            `;
        });
        
        if(upApptsList) upApptsList.innerHTML = apptHtml || '<tr><td colspan="5" class="text-center text-muted">No appointments found.</td></tr>';
        if(allApptsList) {
            let allAptHtml = '';
            myAppts.forEach(apt => {
                const sc = getStatusClass(apt.status);
                const docName = apt.doctor.replace('Dr. ', '');
                
                let bTimeStr = "N/A";
                if (apt.booking_time) {
                    const bTime = new Date(apt.booking_time);
                    bTimeStr = bTime.toLocaleDateString() + ' ' + bTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                allAptHtml += `
                    <tr>
                        <td>${apt.serial_number || 'N/A'}</td>
                        <td>
                            <div class="doctor-info">
                                <img src="https://ui-avatars.com/api/?name=${docName.replace(' ','+')}&background=random" alt="${apt.doctor}">
                                <span>${apt.doctor}</span>
                            </div>
                        </td>
                        <td>${apt.date}</td>
                        <td>${apt.time}</td>
                        <td>${apt.dept}</td>
                        <td><span class="status ${sc}">${apt.status}</span></td>
                        <td><span style="font-size: 13px; color: var(--text-muted);">${bTimeStr}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="window.showToast('Please call the clinic to reschedule.', 'info')">Reschedule</button>
                            ${(apt.status.toLowerCase() === 'confirmed' || apt.status.toLowerCase() === 'completed') ? `<button class="btn btn-sm btn-primary" style="margin-left:5px;" onclick="window.openContactModal('${apt.doctor}')">Contact</button>` : ''}
                        </td>
                    </tr>
                `;
            });
            allApptsList.innerHTML = allAptHtml || '<tr><td colspan="8" class="text-center text-muted">No appointments found.</td></tr>';
        }

        // 2. Render Prescriptions
        const recentPrescList = document.getElementById('recentPrescList');
        const fullPrescList = document.getElementById('fullPrescList');
        
        const renderPresc = (list, isCard = false) => {
            if(!list) return;
            let phtml = '';
            if (myPresc.length === 0) {
                list.innerHTML = `<p class="text-muted" style="padding: 20px;">No prescriptions available.</p>`;
                return;
            }
            myPresc.forEach(p => {
                const icon = p.medication.toLowerCase().includes('capsule') ? 'fa-capsules' : (p.medication.toLowerCase().includes('liquid') ? 'fa-prescription-bottle' : 'fa-tablets');
                const bclass = p.status.toLowerCase() === 'active' ? 'active' : 'completed';
                
                if (isCard) {
                    phtml += `
                        <div class="card presc-card">
                            <div class="presc-header">
                                <i class="fa-solid ${icon}" style="color: var(--primary-color);"></i>
                                <span class="badge ${bclass}">${p.status}</span>
                            </div>
                            <h3>${p.medication}</h3>
                            <p class="dosage">${p.dosage}</p>
                            <div class="presc-meta">
                                <p><span>Prescribed by:</span> ${p.doctor}</p>
                                <p><span>Date:</span> ${p.date}</p>
                                <p><span>Refills left:</span> ${p.refills}</p>
                            </div>
                            <button class="btn ${p.refills > 0 ? 'btn-primary' : 'btn-outline'} btn-sm mt-3" ${p.refills === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Request Refill</button>
                        </div>
                    `;
                } else {
                    phtml += `
                        <div class="prescription-item">
                            <div class="presc-icon"><i class="fa-solid ${icon}"></i></div>
                            <div class="presc-details">
                                <h4>${p.medication}</h4>
                                <p>${p.dosage}</p>
                                <span class="date">Prescribed: ${p.date}</span>
                            </div>
                            <span class="badge ${bclass}">${p.status}</span>
                        </div>
                    `;
                }
            });
            list.innerHTML = phtml;
        };

        renderPresc(recentPrescList, false);
        renderPresc(fullPrescList, true);

        // 3. Render Billing
        const billingList = document.getElementById('billingList');
        if (billingList) {
            let bhtml = '';
            let totalDue = 0;
            myBills.forEach(b => {
                if(b.status === 'Unpaid') totalDue += parseFloat(b.amount);
                const sc = getStatusClass(b.status);
                bhtml += `
                    <tr>
                        <td style="font-weight: 500;">${b.id}</td>
                        <td>${b.date}</td>
                        <td>${b.description}</td>
                        <td style="font-weight: 600;">$${b.amount}</td>
                        <td><span class="status ${sc}" ${sc==='pending'? 'style="background: rgba(220,53,69,0.1); color: var(--danger-color);"' : ''}>${b.status}</span></td>
                        <td><button class="btn btn-sm btn-outline">View</button></td>
                    </tr>
                `;
            });
            billingList.innerHTML = bhtml || '<tr><td colspan="6" class="text-center text-muted">No invoices found.</td></tr>';
            
            const balNode = document.querySelector('.balance-amount');
            if(balNode) balNode.textContent = `$${totalDue.toFixed(2)}`;
            const payBtnNode = document.querySelector('.billing-card .btn-primary');
            if(payBtnNode) {
                if (totalDue > 0) {
                    payBtnNode.disabled = false;
                    payBtnNode.style.opacity = '1';
                } else {
                    payBtnNode.disabled = true;
                    payBtnNode.style.opacity = '0.5';
                    payBtnNode.textContent = 'No Balance Due';
                }
            }
        }
        
        } catch (e) {
            console.error("Failed to load dashboard data", e);
            document.querySelector('.summary-card:nth-child(1) .count').textContent = 'Error';
            if(document.getElementById('upcomingApptsList')) document.getElementById('upcomingApptsList').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load API data. Make sure backend is running.</td></tr>';
        }
    }

    // Call render once on load
    renderDashData();

    // --- Inactive "Coming Soon" Buttons ---
    // Make sure we re-evaluate after rendering
    setTimeout(() => {
        const inactiveButtons = document.querySelectorAll('.btn-outline, .prescriptions-grid .btn-outline');
        inactiveButtons.forEach(btn => {
            if (btn.closest('.profile-pic-area') === null && !btn.hasAttribute('disabled') && !btn.hasAttribute('onclick')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.showToast('This action is currently unavailable in the prototype.', 'info');
                });
            }
        });
    }, 500);

    // --- Doctor Search Logic ---
    const doctorSearchInput = document.getElementById('doctorSearchInput');
    if (doctorSearchInput) {
        doctorSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const doctorCards = document.querySelectorAll('.doctor-card');
            
            doctorCards.forEach(card => {
                const textContent = card.textContent.toLowerCase();
                if (textContent.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Optionally, handle "no results" state for sections
            const popularGrid = document.querySelector('.popular-doctors-grid');
            const allGrid = document.querySelector('.all-doctors-grid');
            
            if (popularGrid) {
                const hasVisiblePopular = Array.from(popularGrid.children).some(c => c.style.display !== 'none');
                const popHeader = popularGrid.previousElementSibling;
                if (popHeader && popHeader.classList.contains('section-header')) {
                    popHeader.style.display = hasVisiblePopular ? 'block' : 'none';
                }
            }
            
            if (allGrid) {
                const hasVisibleAll = Array.from(allGrid.children).some(c => c.style.display !== 'none');
                const allHeader = allGrid.previousElementSibling;
                if (allHeader && allHeader.classList.contains('section-header')) {
                    allHeader.style.display = hasVisibleAll ? 'block' : 'none';
                }
            }
        });
    }

    // --- Contact Doctor Logic ---
    let currentContactDoctor = '';
    const contactModal = document.getElementById('contactModal');
    const closeContactModalBtn = document.getElementById('closeContactModal');
    const cancelContactBtn = document.getElementById('cancelContactBtn');
    
    const btnChat = document.getElementById('btnChatContact');
    const btnVoice = document.getElementById('btnVoiceContact');
    const btnVideo = document.getElementById('btnVideoContact');
    
    window.openContactModal = async function(doctorName) {
        currentContactDoctor = doctorName;
        document.getElementById('contactDoctorName').textContent = doctorName;
        
        // Check usage
        let callCount = 0;
        try {
            const res = await fetch(`${API_BASE}/doctor-calls/${currentUser.id}/${doctorName}`);
            if(res.ok) {
                const data = await res.json();
                callCount = data.call_count || 0;
            }
        } catch(e) {}
        
        const alertEl = document.getElementById('contactPricingAlert');
        
        if (callCount >= 3) {
            alertEl.style.display = 'block';
        } else {
            alertEl.style.display = 'none';
        }
        
        contactModal.classList.add('active');
    };
    
    function closeContactModal() {
        contactModal.classList.remove('active');
    }
    
    if(closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeContactModal);
    if(cancelContactBtn) cancelContactBtn.addEventListener('click', closeContactModal);
    
    if(btnChat) {
        btnChat.addEventListener('click', () => {
            window.showToast(`Opening secure chat with ${currentContactDoctor}...`, 'success');
            closeContactModal();
        });
    }
    
    async function handleCall(type) {
        let callCount = 0;
        try {
            const res = await fetch(`${API_BASE}/doctor-calls/${currentUser.id}/${currentContactDoctor}`);
            if(res.ok) {
                const data = await res.json();
                callCount = data.call_count || 0;
            }
        } catch(e) {}
        
        if (callCount < 3) {
            // Free call
            try {
                const res = await fetch(`${API_BASE}/doctor-calls/${currentUser.id}/${currentContactDoctor}/increment`, { method: 'POST' });
                if(res.ok) {
                    const data = await res.json();
                    callCount = data.call_count;
                }
            } catch(e) {}
            
            window.showToast(`Initiating ${type} Call. (${3 - callCount} free calls remaining)`, 'success');
            closeContactModal();
        } else {
            // Charge $5
            window.showToast(`Free calls exhausted. Generating $5 invoice for ${type} Call...`, 'info');
            
            setTimeout(async () => {
                const newBill = {
                    id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
                    patient_id: currentUser.id,
                    description: `${type} Call Consultation - ${currentContactDoctor}`,
                    amount: 5.00,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Unpaid'
                };
                
                try {
                    await fetch(`${API_BASE}/billing`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newBill)
                    });
                    
                    renderDashData();
                    window.showToast(`A $5 invoice has been added to your Billing. Please pay to continue.`, 'error');
                } catch(e) {
                    console.error("Failed to add charge:", e);
                }
                closeContactModal();
            }, 1000);
        }
    }
    
    if(btnVoice) {
        btnVoice.addEventListener('click', () => handleCall('Voice'));
    }
    
    if(btnVideo) {
        btnVideo.addEventListener('click', () => handleCall('Video'));
    }


});
