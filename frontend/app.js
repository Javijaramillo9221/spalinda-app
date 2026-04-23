
const API_URL = '/api';

function formatCurrency(value) {
    return '$' + Number(value).toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

const app = {
    clients: [],

    init() {

        if (localStorage.getItem('auth') !== 'ok') {

            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

            document.getElementById('view-login').classList.add('active');

            document.querySelector('.bottom-nav').style.display = 'none';
            document.querySelector('.app-header').style.display = 'none';

            return;
        }

        // 🔥 mostrar app
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        document.getElementById('view-dashboard').classList.add('active');

        document.querySelector('.app-header').style.display = 'flex';
        document.querySelector('.bottom-nav').style.display = 'flex';

        this.setupNavigation();
        this.loadDashboard();

        document.getElementById('card-today').addEventListener('click', () => {
            this.goToAppointments('today');
        });

        document.getElementById('card-upcoming').addEventListener('click', () => {
            this.goToAppointments('upcoming');
        });

        const priceInput = document.getElementById('appointment-price');
        const financeInput = document.getElementById('finance-amount');

        if (financeInput) {
            financeInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                e.target.value = formatCurrency(value);
            });
        }

        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                e.target.value = formatCurrency(value);
            });
        }

        this.initCalendar();

        window.app = this;
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                const btn = e.currentTarget;
                btn.classList.add('active');

                const target = btn.dataset.target;
                document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
                document.getElementById(`view-${target}`).classList.add('active');

                const titleMap = {
                    dashboard: 'SpaencasaLindaMuñoz',
                    clients: 'Mis Clientes',
                    appointments: 'Agenda',
                    finances: 'Contabilidad',
                    calendar: 'Calendario'
                };

                document.getElementById('header-title').innerText = titleMap[target];

                if (target === 'dashboard') this.loadDashboard();
                if (target === 'clients') this.loadClients();
                if (target === 'appointments') this.loadAppointments();
                if (target === 'finances') this.loadFinances();
                if (target === 'calendar' && this.calendar) {
                    this.calendar.render();
                    this.calendar.refetchEvents();
                }
            });
        });
    },

    goToAppointments(filter) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById('view-appointments').classList.add('active');

        document.getElementById('header-title').innerText =
            filter === 'today' ? 'Citas de Hoy' : 'Próximas Citas';

        this.loadAppointments(filter);
    },

    showModal(id) {
        document.getElementById(id).classList.add('show');
    },

    hideModal(id) {
        document.getElementById(id).classList.remove('show');
        const form = document.querySelector(`#${id} form`);
        if (form) form.reset();
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    editAppointment(id) {
        const appointment = this.lastAppointments.find(a => a.id === id);

        document.getElementById('appointment-client').value = appointment.client_id;
        document.getElementById('appointment-service').value = appointment.service;
        document.getElementById('appointment-date').value = appointment.date;
        document.getElementById('appointment-time').value = appointment.time;
        document.getElementById('appointment-price').value = formatCurrency(appointment.price);

        this.editingAppointmentId = id;

        this.showModal('modal-appointment');
    },

    async completeAppointment(id) {
        try {
            await fetch(`${API_URL}/appointments/${id}/complete`, {
                method: 'PUT'
            });

            this.loadAppointments();
            this.loadDashboard();
            this.showToast('Cita marcada como cumplida');

        } catch (error) {
            this.showToast('Error al completar cita');
        }
    },

    async loadDashboard() {
        try {
            const res = await fetch(`${API_URL}/dashboard`);
            const data = await res.json();

            document.getElementById('stat-clients').innerText = data.total_clients;
            document.getElementById('stat-appointments').innerText = data.appointments_today;

            // 🔥 calcular próximas citas correctamente
            const resAppointments = await fetch(`${API_URL}/appointments`);
            const appointments = await resAppointments.json();

            const now = new Date();
            const today = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            const upcoming = appointments.filter(a => a.date >= today);

            document.getElementById('stat-upcoming').innerText = upcoming.length;

            document.getElementById('stat-income').innerText = formatCurrency(data.income_this_month);
            document.getElementById('stat-expenses').innerText = formatCurrency(data.expenses_this_month);
            document.getElementById('stat-profit').innerText = formatCurrency(data.profit);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    initCalendar() {
        const calendarEl = document.getElementById('calendar');

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridDay',
            slotMinTime: "06:00:00",
            slotMaxTime: "20:00:00",
            slotDuration: "00:15:00",
            slotLabelInterval: "00:30:00",
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            snapDuration: "00:15:00",
            expandRows: true,
            allDaySlot: false,
            locale: 'es',
            height: 'auto',

            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek'
            },

            views: {
                timeGridWeek: {
                    dayHeaderFormat: { weekday: 'short', day: 'numeric' }
                }
            },

            eventContent: function (arg) {

                const isWeek = arg.view.type === 'timeGridWeek';

                // 🔥 SEMANA → solo bloque (sin texto)
                if (isWeek) {
                    return {
                        html: `
                <div style="
                    width:100%;
                    height:100%;
                    border-radius:8px;
                "></div>
            `
                    };
                }

                // 🔥 DÍA → detalle completo
                return {
                    html: `
            <div style="
                display:flex;
                flex-direction:column;
                justify-content:center;
                align-items:flex-start;
                height:100%;
                width:100%;
                padding-left:10px;
            ">
                <div style="font-size:14px; font-weight:700;">
                    🐶 ${arg.event.title}
                </div>
                <div style="font-size:12px; margin-top:4px;">
                    ⏰ ${arg.event.extendedProps.time}
                </div>
            </div>
        `
                };
            },

            events: async (fetchInfo, successCallback) => {
                const res = await fetch(`${API_URL}/appointments`);
                const data = await res.json();

                const filtered = data.filter(a => !a.was_rescheduled);

                const events = filtered.map(a => ({
                    title: `${a.pet_name}`,
                    extendedProps: {
                        time: a.time
                    },
                    start: `${a.date}T${a.time}`,
                    end: new Date(new Date(`${a.date}T${a.time}`).getTime() + 60 * 60 * 1000), // 1 hora
                    color: a.was_rescheduled ? '#ff9800' : '#4caf50'
                }));

                successCallback(events);
            },

            dateClick: (info) => {
                // abrir modal con fecha ya seleccionada
                document.getElementById('appointment-date').value = info.dateStr.split('T')[0];
                document.getElementById('appointment-time').value = info.dateStr.split('T')[1]?.substring(0, 5) || '';

                this.showModal('modal-appointment');
            }
        });

        this.calendar.render();
    },


    async loadClients() {
        try {
            const res = await fetch(`${API_URL}/clients`);
            this.clients = await res.json();

            const container = document.getElementById('clients-list');

            if (this.clients.length === 0) {
                container.innerHTML = `<div class="empty-state">No hay clientes</div>`;
                return;
            }

            container.innerHTML = this.clients.map(c => `
                <div class="card">
                    <div class="card-content">
                        <div>${c.name}</div>
                        <div>${c.pet_name}</div>
                        <a href="https://wa.me/${c.phone.replace(/\D/g, '')}" 
                            target="_blank" 
                            class="btn-icon whatsapp">
                                <i class="ph ph-whatsapp-logo"></i>
                        </a>
                    </div>
                        <button class="btn-icon delete" onclick="app.deleteClient(${c.id})">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
            `).join('');

            const select = document.getElementById('appointment-client');
            select.innerHTML = '<option value="">Seleccionar Cliente...</option>' +
                this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        } catch (error) {
            this.showToast('Error clientes');
        }
    },

    async loadAppointments(filter = 'all') {
        try {
            if (this.clients.length === 0) await this.loadClients();

            const res = await fetch(`${API_URL}/appointments`);
            let data = await res.json();
            const container = document.getElementById('appointments-list');

            const now = new Date();
            const today = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            if (filter === 'today') {
                data = data.filter(a => a.date === today);
            }

            if (filter === 'upcoming') {
                data = data.filter(a => a.date >= today);
            }

            this.lastAppointments = data;

            if (data.length === 0) {
                container.innerHTML = `<div class="empty-state">No hay citas</div>`;
                return;
            }

            container.innerHTML = data.map(a => {
                const isRescheduled = a.was_rescheduled;

                const msg = encodeURIComponent(
                    a.is_reschedule_new
                        ? `Hola ${a.client_name}, tu cita fue reagendada para el ${a.date} a las ${a.time} para ${a.pet_name}. Atte: SpaencasaLindaMuñoz.`
                        : `Hola ${a.client_name}, tu cita quedó agendada para el ${a.date} a las ${a.time} para ${a.pet_name}. Atte: SpaencasaLindaMuñoz.`
                );
                return `
                <div class="card ${isRescheduled ? 'rescheduled' : ''}">
                    <div style="text-decoration: ${a.status === 'cumplida' ? 'line-through' : 'none'}">
                        ${a.pet_name}
                    </div>
                    <div>
                        ${a.date} ${a.time}
                        ${isRescheduled ? '<div class="badge-rescheduled">🔁 Reagendada</div>' : ''}
                    </div>
                    <div class="actions">

    <a href="https://wa.me/${a.client_phone.replace(/\D/g, '')}?text=${msg}" target="_blank" class="btn-icon whatsapp">
        <i class="ph ph-whatsapp-logo"></i>
    </a>

    <button class="btn-icon complete" onclick="app.completeAppointment(${a.id})">
        <i class="ph ph-check"></i>
    </button>

    <button class="btn-icon reschedule" onclick="app.editAppointment(${a.id})">
        <i class="ph ph-arrow-clockwise"></i>
    </button>
    </div>
    </div>
                `;
            }).join('');

        } catch (error) {
            this.showToast('Error citas');
        }
    },

    async submitAppointment(event) {
        event.preventDefault();

        const clientId = document.getElementById('appointment-client').value;
        const service = document.getElementById('appointment-service').value;
        const date = document.getElementById('appointment-date').value;
        const time = document.getElementById('appointment-time').value;

        const [hourStr, minuteStr] = time.split(':');
        let hour = parseInt(hourStr, 10);
        let minutes = parseInt(minuteStr, 10);

        minutes = Math.round(minutes / 15) * 15;

        if (minutes === 60) {
            hour += 1;
            minutes = 0;
        }

        const formattedTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        const price = parseFloat(
            document.getElementById('appointment-price').value.replace(/\D/g, '')
        );

        try {

            const isEdit = this.editingAppointmentId;
            let res;

            if (isEdit) {

                // 🔁 marcar como reagendada
                const resOld = await fetch(`${API_URL}/appointments/${this.editingAppointmentId}/reschedule`, {
                    method: 'PUT'
                });

                if (!resOld.ok) {
                    this.showToast('Error al reagendar cita');
                    return;
                }

                // 🆕 crear nueva
                res = await fetch(`${API_URL}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        is_reschedule_new: true,
                        client_id: clientId,
                        service,
                        date,
                        time: formattedTime,
                        price
                    })
                });

            } else {

                res = await fetch(`${API_URL}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        is_reschedule_new: false,
                        client_id: clientId,
                        service,
                        date,
                        time: formattedTime,
                        price
                    })
                });
            }

            if (!res.ok) {
                this.showToast('Error al guardar cita');
                return;
            }

            // ✅ TODO OK
            this.hideModal('modal-appointment');
            this.loadAppointments();
            this.loadDashboard();
            this.calendar.refetchEvents();
            this.editingAppointmentId = null;

            this.showToast(isEdit ? 'Cita reagendada correctamente' : 'Cita creada correctamente');

        } catch (error) {
            console.error(error);
            this.showToast('Error al guardar cita');
        }
    },

    async submitClient(event) {
        event.preventDefault();

        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        const pet_name = document.getElementById('client-pet-name').value;
        const pet_type = document.getElementById('client-pet-type').value;
        const pet_details = document.getElementById('client-pet-details').value;

        try {
            const res = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    phone,
                    pet_name,
                    pet_type,
                    pet_details
                })
            });

            const result = await res.json();

            if (!res.ok) {
                this.showToast(result.error || 'Error al crear cliente');
                return;
            }

            this.hideModal('modal-client');
            this.loadClients();
            this.loadDashboard();
            this.showToast('Cliente creado correctamente');

        } catch (error) {
            this.showToast('Error al crear cliente');
        }
    },
    async loadFinances() {
        const res = await fetch(`${API_URL}/finances`);
        const data = await res.json();

        const container = document.getElementById('finances-list');

        if (data.length === 0) {
            container.innerHTML = `<div>No hay datos</div>`;
            return;
        }

        container.innerHTML = data.map(f => `
        <div class="card">
            <div>${f.description}</div>
            <div>${formatCurrency(f.amount)}</div>
        </div>
    `).join('');
    },

    async login() {
        const username = document.getElementById('login-user').value;
        const password = document.getElementById('login-pass').value;

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            console.error('Login error:', error);

            this.showToast('Credenciales incorrectas');
            document.getElementById('login-pass').value = '';
            return;
        }

        const data = await res.json();
        console.log('Login success:', data);

        // 🔐 guardar sesión
        localStorage.setItem('auth', 'ok');

        location.reload();
    },

    logout() {
        localStorage.removeItem('auth');
        location.reload();
    },

    async submitFinance(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('finance-amount').value.replace(/\D/g, ''));

        await fetch(`${API_URL}/finances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: document.getElementById('finance-type').value,
                amount,
                description: document.getElementById('finance-description').value
            })
        });

        this.hideModal('modal-finance');
        this.loadFinances();
        this.loadDashboard();
    }

};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
