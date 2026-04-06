// script.js - Ishwarganjoil Fuel Management System

// Global state
let currentUserId = localStorage.getItem('currentUser') || null;
let scanLogs = JSON.parse(localStorage.getItem('scanLogs')) || [];
let liveTimer;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initData();
    showPage('home');
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Generate demo QR on home
    setTimeout(() => {
        QRCode.toCanvas(document.getElementById('home-qr'), 'Scan to Register at Ishwarganjoil!', {
            width: 200,
            margin: 1,
            color: {
                dark: '#2E7D32',
                light: '#FFFFFF'
            }
        }, function(error) {
            if (error) console.error(error);
        });
    }, 500);
});

// Show specific page
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    document.getElementById(pageId).classList.add('active');
    
    // Page specific logic
    if (pageId === 'user') {
        loadCurrentUser();
        if (currentUserId) loadUserDashboard();
    }
}

function loadCurrentUser() {
    currentUserId = localStorage.getItem('currentUser') || null;
    if (currentUserId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.id === currentUserId);
        if (user) {
            generateUserQR(user);
        }
    }
}

// Initialize dummy data
function initData() {
    if (!localStorage.getItem('users')) {
        const dummyUsers = [
            {
                id: 'user001',
                name: 'Rahim Khan',
                phone: '01712345678',
                vehicle: 'DHK-AB-1234',
                lastFuelDate: null,
                history: []
            },
            {
                id: 'user002',
                name: 'Karim Ahmed',
                phone: '01987654321',
                vehicle: 'CTG-MN-5678',
                lastFuelDate: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0],
                history: []
            }
        ];
        dummyUsers.forEach(generateFakeHistory);
        localStorage.setItem('users', JSON.stringify(dummyUsers));
    } else {
        // Generate history for existing users if empty
        const users = JSON.parse(localStorage.getItem('users'));
        users.forEach(user => {
            if (user.history.length === 0) generateFakeHistory(user);
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    if (!localStorage.getItem('receipts')) {
        localStorage.setItem('receipts', JSON.stringify([]));
    }
    if (!localStorage.getItem('scanLogs')) {
        localStorage.setItem('scanLogs', JSON.stringify([]));
    }
}

function generateFakeHistory(user) {
    const pumps = ['Pump-1', 'Pump-2', 'Pump-3'];
    const amounts = ['5L', '8L', '12L', '15L', '20L'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i*24*60*60*1000);
        user.history.push({
            date: date.toISOString().split('T')[0],
            time: date.toLocaleTimeString('bn-BD', {hour: '2-digit', minute: '2-digit'}),
            amount: amounts[Math.floor(Math.random()*amounts.length)],
            pump: pumps[Math.floor(Math.random()*pumps.length)]
        });
    }
    
    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex > -1) users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));
}

// Handle registration
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const vehicle = document.getElementById('reg-vehicle').value;
    
    const newUser = {
        id: 'user' + Date.now().toString().slice(-6),
        name,
        phone,
        vehicle,
        lastFuelDate: null,
        history: []
    };
    
    // Save user
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUserId = newUser.id;
    localStorage.setItem('currentUser', currentUserId);
    
    // Generate QR
    generateUserQR(newUser);
    
    // Clear form
    e.target.reset();
}

// Generate QR for user
function generateUserQR(user) {
    const canvas = document.getElementById('user-qr-canvas');
    const userData = JSON.stringify({
        id: user.id,
        name: user.name,
        phone: user.phone,
        vehicle: user.vehicle
    });
    
    QRCode.toCanvas(canvas, userData, {
        width: 250,
        margin: 1,
        color: {
            dark: '#2E7D32',
            light: '#FFFFFF'
        }
    }, function(error) {
        if (error) console.error(error);
        else {
            document.getElementById('user-qr-card').style.display = 'block';
            document.getElementById('user-id-display').textContent = `ID: ${user.id}`;
        }
    });
    
    showPage('user');
}

// Load user dashboard
function loadUserDashboard() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUserId);
    
    if (!user || !currentUserId) {
        document.getElementById('user-qr-card').style.display = 'none';
        document.getElementById('eligibility-status').innerHTML = '<h3>স্ট্যাটাস</h3><p>দয়া করে প্রথমে রেজিস্ট্রেশন করুন</p>';
        return;
    }
    
    // Show user info
    document.getElementById('user-qr-card').querySelector('h3').insertAdjacentHTML('afterend', `
        <div style="margin: 15px 0; padding: 15px; background: #f0f8f0; border-radius: 10px;">
            <p><strong>নাম:</strong> ${user.name}</p>
            <p><strong>ফোন:</strong> ${user.phone}</p>
            <p><strong>গাড়ি:</strong> ${user.vehicle}</p>
        </div>
    `);
    
    // Status
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3*24*60*60*1000);
    
    let statusMsg, statusClass, countdown = '';
    
    if (user.lastFuelDate) {
        const lastFuel = new Date(user.lastFuelDate);
        if (lastFuel > threeDaysAgo) {
            statusMsg = '🔴 এই ব্যক্তি গত ৩ দিনের মধ্যে তেল সংগ্রহ করেছেন';
            statusClass = 'status-ineligible';
            
            const remainingMs = threeDaysAgo.getTime() - lastFuel.getTime() + 3*24*60*60*1000;
            if (remainingMs > 0) {
                const daysLeft = Math.ceil(remainingMs / (24*60*60*1000));
                countdown = `⏳ বাকি ${daysLeft} দিন`;
            }
        } else {
            statusMsg = '🟢 আপনি তেল নেওয়ার উপযুক্ত';
            statusClass = 'status-eligible';
        }
    } else {
        statusMsg = '🟢 প্রথমবার তেল নিতে পারবেন';
        statusClass = 'status-eligible';
    }
    
    document.getElementById('status-message').innerHTML = statusMsg;
    document.getElementById('status-message').parentElement.className = `status-card ${statusClass}`;
    document.getElementById('countdown').textContent = countdown;
    
// Live countdown every second
    updateLiveCountdown();
    liveTimer = setInterval(updateLiveCountdown, 1000);
    
    // Fuel history
    renderFuelHistory(user.history);
    
    // Receipts
    renderReceipts(user.id);
}

// Update countdown timer
let liveTimer;

function updateLiveCountdown() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUserId);
    if (!user?.lastFuelDate) return;
    
    const now = new Date();
    const lastFuel = new Date(user.lastFuelDate);
    const threeDaysFromFuel = new Date(lastFuel.getTime() + 3*24*60*60*1000);
    
    if (threeDaysFromFuel > now) {
        const remainingMs = threeDaysFromFuel - now;
        const days = Math.floor(remainingMs / (24*60*60*1000));
        const hours = Math.floor((remainingMs % (24*60*60*1000)) / (60*60*1000));
        const mins = Math.floor((remainingMs % (60*60*1000)) / (60*1000));
        document.getElementById('countdown').textContent = `⏳ বাকি ${days}দ ${hours}ঘ ${mins}মিন`;
    }
}

// Render fuel history
function renderFuelHistory(history) {
    const container = document.getElementById('fuel-history');
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">কোনো হিস্ট্রি নেই</p>';
        return;
    }
    
    let html = '<table class="history-table"><thead><tr><th>তারিখ</th><th>সময়</th><th>পরিমাণ</th><th>পাম্প</th></tr></thead><tbody>';
    
    // Last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
    history.filter(h => new Date(h.date) >= sevenDaysAgo)
           .forEach(item => {
        const itemDate = new Date(item.date);
        const isRecent = itemDate > new Date(Date.now() - 3*24*60*60*1000);
        html += `<tr class="${isRecent ? 'recent-fuel' : ''}">
                    <td>${item.date}</td>
                    <td>${item.time}</td>
                    <td>${item.amount}</td>
                    <td>${item.pump}</td>
                 </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Render receipts
function renderReceipts(userId) {
    const receipts = JSON.parse(localStorage.getItem('receipts')) || [];
    const userReceipts = receipts.filter(r => r.userId === userId);
    
    const container = document.getElementById('receipts');
    if (userReceipts.length === 0) {
        container.innerHTML = '<div class="receipt-item" style="text-align:center; color:#666;">কোনো রসিদ নেই</div>';
        return;
    }
    
    let html = '';
    userReceipts.slice(-5).forEach(receipt => { // Last 5
        html += `
            <div class="receipt-item" style="border-left: 5px solid #4CAF50; padding: 20px; margin: 10px 0; background: #f9f9f9; border-radius: 8px;">
                <div><strong>নাম:</strong> ${receipt.name}</div>
                <div><strong>গাড়ি:</strong> ${receipt.vehicle}</div>
                <div><strong>তারিখ/সময়:</strong> ${receipt.date} ${receipt.time}</div>
                <div><strong>তেল:</strong> ${receipt.amount}</div>
                <div><strong>পাম্প:</strong> ${receipt.pump}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Admin scan
function adminScan() {
    const userId = document.getElementById('admin-userid').value.trim();
    if (!userId) {
        alert('User ID দিন!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        document.getElementById('admin-user-info').style.display = 'block';
        document.getElementById('admin-status').innerHTML = '<div class="status-card status-ineligible">❌ User ID পাওয়া যায়নি!</div>';
        return;
    }
    
    // Status check
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3*24*60*60*1000);
    
    let statusHtml, showMarkBtn = false;
    
    if (user.lastFuelDate && new Date(user.lastFuelDate) > threeDaysAgo) {
        statusHtml = `
            <h4>🚫 বড় রেড অ্যালার্ট</h4>
            <div style="font-size: 1.8rem; color: #d32f2f; font-weight: bold; padding: 20px; background: #ffebee; border-radius: 10px; border: 3px solid #f44336;">
                এই ব্যক্তি ইতিমধ্যে তেল সংগ্রহ করেছেন!
            </div>
            <p><strong>নাম:</strong> ${user.name}</p>
            <p><strong>ফোন:</strong> ${user.phone}</p>
            <p><strong>গাড়ি:</strong> ${user.vehicle}</p>
            <p><strong>শেষ তেলের তারিখ:</strong> ${user.lastFuelDate || 'নেই'}</p>
        `;
    } else {
        statusHtml = `
            <div class="status-card status-eligible">
                <h4>✅ এই ব্যক্তি তেল নেওয়ার উপযুক্ত</h4>
                <p><strong>নাম:</strong> ${user.name}</p>
                <p><strong>ফোন:</strong> ${user.phone}</p>
                <p><strong>গাড়ি:</strong> ${user.vehicle}</p>
                <p><strong>শেষ তেলের তারিখ:</strong> ${user.lastFuelDate || 'নেই'}</p>
            </div>
        `;
        showMarkBtn = true;
    }
    
    // History
    renderAdminHistory(user.history);
    
    document.getElementById('admin-status').innerHTML = statusHtml;
    document.getElementById('mark-fuel-btn').style.display = showMarkBtn ? 'block' : 'none';
    document.getElementById('admin-user-info').style.display = 'block';
    
    // Add to scan log
    scanLogs.unshift({
        name: user.name,
        vehicle: user.vehicle,
        time: new Date().toLocaleString('bn-BD')
    });
    localStorage.setItem('scanLogs', JSON.stringify(scanLogs.slice(0, 50))); // Keep last 50
    renderScanLog();
}

// Admin history
function renderAdminHistory(history) {
    const container = document.getElementById('admin-history');
    if (history.length === 0) {
        container.innerHTML = '<p>কোনো হিস্ট্রি নেই</p>';
        return;
    }
    
    let html = '<div class="history-section"><h4>হিস্ট্রি:</h4>';
    history.slice(-7).forEach(item => {
        const isRecent = new Date(item.date) > new Date(Date.now() - 3*24*60*60*1000);
        html += `<p class="${isRecent ? 'recent-fuel' : ''}">${item.date} ${item.time} - ${item.amount} (${item.pump})</p>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Mark fuel given
function markFuelGiven() {
    const userId = document.getElementById('admin-userid').value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    // Update last fuel date
    users[userIndex].lastFuelDate = new Date().toISOString().split('T')[0];
    
    // Add to history (dummy)
    const pumps = ['Pump-1', 'Pump-2', 'Pump-3'];
    users[userIndex].history.unshift({
        date: users[userIndex].lastFuelDate,
        time: new Date().toLocaleTimeString('bn-BD'),
        amount: '25L',
        pump: pumps[Math.floor(Math.random() * pumps.length)]
    });
    
    // Add receipt
    const receipts = JSON.parse(localStorage.getItem('receipts')) || [];
    receipts.push({
        userId,
        name: users[userIndex].name,
        vehicle: users[userIndex].vehicle,
        date: users[userIndex].lastFuelDate,
        time: new Date().toLocaleTimeString('bn-BD'),
        amount: '25L',
        pump: users[userIndex].history[0].pump
    });
    localStorage.setItem('receipts', JSON.stringify(receipts));
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Refresh admin view
    adminScan();
    
    alert('✅ তেল দেওয়া হয়েছে চিহ্নিত!');
}

// Render scan log
function renderScanLog() {
    const container = document.getElementById('scan-log');
    if (scanLogs.length === 0) {
        container.innerHTML = '<p>কোনো স্ক্যান লগ নেই</p>';
        return;
    }
    
    let html = '<table class="history-table"><thead><tr><th>নাম</th><th>গাড়ি</th><th>স্ক্যান সময়</th></tr></thead><tbody>';
    scanLogs.slice(0, 10).forEach(log => {
        html += `<tr><td>${log.name}</td><td>${log.vehicle}</td><td>${log.time}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

