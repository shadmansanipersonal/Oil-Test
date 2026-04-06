// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || localStorage.getItem('currentUserId');
    
    if (!userId) {
        alert('Please register first!');
        window.location.href = 'register.html';
        return;
    }
    
    localStorage.setItem('currentUserId', userId);
    loadUserDashboard(userId);
    
    // Auto-check every 30 seconds
    setInterval(() => loadUserDashboard(userId), 30000);
});

function loadUserDashboard(userId) {
    const userData = JSON.parse(localStorage.getItem('ishwarUser_' + userId));
    
    if (!userData) {
        alert('User not found! Please register.');
        window.location.href = 'register.html';
        return;
    }
    
    // Fill user info
    document.getElementById('dashName').textContent = userData.name;
    document.getElementById('dashPhone').textContent = userData.phone;
    document.getElementById('dashVehicle').textContent = userData.vehicle;
    document.getElementById('dashUserId').textContent = userData.id;
    
    document.getElementById('userInfo').classList.remove('hidden');
    
    // Generate QR
    const qrCodeDash = document.getElementById('qrCodeDash');
    QRCode.toCanvas(qrCodeDash, userData.id, { width: 150 }, function (error) {
        if (error) console.error(error);
    });
    
    checkEligibility(userData);
    renderHistory(userData);
    renderReceipts(userData);
}

function checkEligibility(userData) {
    const statusDiv = document.getElementById('status');
    const countdownDiv = document.getElementById('countdown');
    const lastFuelP = document.getElementById('lastFuel');
    
    if (!userData.lastFuel) {
        statusDiv.textContent = '🟢 আপনি তেল নেওয়ার উপযুক্ত';
        statusDiv.className = 'status eligible';
        return;
    }
    
    const lastFuelDate = new Date(userData.lastFuel);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    if (lastFuelDate > threeDaysAgo) {
        statusDiv.textContent = '🔴 এই ব্যক্তি গত ৩ দিনের মধ্যে তেল সংগ্রহ করেছেন';
        statusDiv.className = 'status ineligible';
        
        // Countdown
        const timeLeft = threeDaysAgo - lastFuelDate + 3 * 24 * 60 * 60 * 1000;
        const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
        countdownDiv.textContent = `${daysLeft} দিন বাকি`;
        countdownDiv.classList.remove('hidden');
        
        lastFuelP.textContent = `Last fuel: ${lastFuelDate.toLocaleString('bn-BD')}`;
    } else {
        statusDiv.textContent = '🟢 আপনি তেল নেওয়ার উপযুক্ত';
        statusDiv.className = 'status eligible';
        lastFuelP.textContent = `Last fuel: ${lastFuelDate.toLocaleString('bn-BD')}`;
    }
}

function renderHistory(userData) {
    const historyDiv = document.getElementById('fuelHistory');
    // Dummy history + real data
    const dummyHistory = [
        { date: '2024-01-15', amount: '20L', eligible: true },
        { date: '2024-01-18', amount: '15L', eligible: false },
        { date: '2024-01-20', amount: '25L', eligible: true }
    ];
    
    let html = '';
    [...dummyHistory, ...userData.fuelHistory].slice(-7).forEach(item => {
        const ineligible = !item.eligible;
        html += `
            <div class="history-item ${ineligible ? 'ineligible' : ''}">
                ${item.date}: ${item.amount} Petrol ${ineligible ? '🚫' : '✅'}
            </div>
        `;
    });
    historyDiv.innerHTML = html || '<p>No history yet</p>';
}

function renderReceipts(userData) {
    const receiptsDiv = document.getElementById('receipts');
    // Dummy receipts + real
    const dummyReceipts = [
        {
            date: '2024-01-20',
            amount: '25L',
            pump: 'Ishwar Ganjo Pump #1'
        }
    ];
    
    let html = '';
    [...dummyReceipts, ...userData.receipts].forEach(receipt => {
        html += `
            <div class="receipt">
                <h4>Receipt #${Math.floor(Math.random()*1000)}</h4>
                <p><strong>${userData.name}</strong></p>
                <p>Vehicle: ${userData.vehicle}</p>
                <p>Date: ${receipt.date}</p>
                <p>Fuel: ${receipt.amount}</p>
                <p>Pump: ${receipt.pump}</p>
            </div>
        `;
    });
    receiptsDiv.innerHTML = html || '<p>No receipts yet</p>';
}
