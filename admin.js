// admin.js
let currentScannedUser = null;

function simulateScan() {
    const input = document.getElementById('scanInput');
    const userId = input.value.trim();
    
    if (!userId) {
        alert('Please enter User ID');
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('ishwarUser_' + userId));
    
    if (!userData) {
        document.getElementById('scanResult').innerHTML = '<p class="status ineligible">User not found!</p>';
        document.getElementById('scanResult').classList.remove('hidden');
        return;
    }
    
    currentScannedUser = userData;
    
    // Show user info
    const userInfoDiv = document.getElementById('adminUserInfo');
    userInfoDiv.innerHTML = `
        <p><strong>Name:</strong> ${userData.name}</p>
        <p><strong>Phone:</strong> ${userData.phone}</p>
        <p><strong>Vehicle:</strong> ${userData.vehicle}</p>
        <p><strong>ID:</strong> ${userData.id}</p>
    `;
    
    // Check eligibility
    const statusDiv = document.getElementById('adminStatus');
    const markBtn = document.getElementById('markFuel');
    
    if (!userData.lastFuel) {
        statusDiv.innerHTML = '<p class="status eligible">🟢 এই ব্যক্তি তেল নেওয়ার উপযুক্ত</p>';
        markBtn.classList.remove('hidden');
    } else {
        const lastFuelDate = new Date(userData.lastFuel);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        
        if (lastFuelDate > threeDaysAgo) {
statusDiv.innerHTML = '<div class="status ineligible">' +
                '🚫 এই ব্যক্তি ইতিমধ্যে তেল সংগ্রহ করেছেন! ' +
                '<br><small>' + lastFuelDate.toLocaleString('bn-BD') + '</small>' +
                '</div>';
            markBtn.classList.add('hidden');
        } else {
            statusDiv.innerHTML = '<p class="status eligible">🟢 এই ব্যক্তি তেল নেওয়ার উপযুক্ত</p>';
            markBtn.classList.remove('hidden');
        }
    }
    
    document.getElementById('scanResult').classList.remove('hidden');
    
    // Add to scan log
    addToScanLog(userData);
}

function markFuelGiven() {
    if (!currentScannedUser) return;
    
    // Update last fuel time
    currentScannedUser.lastFuel = new Date().toISOString();
    
    // Add to history
    currentScannedUser.fuelHistory.unshift({
        date: new Date().toLocaleDateString('bn-BD'),
        amount: '25L', // Dummy
        eligible: true
    });
    
    // Add receipt
    currentScannedUser.receipts.unshift({
        date: new Date().toLocaleDateString('bn-BD'),
        amount: '25L',
        pump: 'Ishwar Ganjo Pump #1'
    });
    
    // Save back
    localStorage.setItem('ishwarUser_' + currentScannedUser.id, JSON.stringify(currentScannedUser));
    
    alert('✅ Fuel marked as given! 3-day cooldown started.');
    simulateScan(); // Refresh
}

function addToScanLog(userData) {
    const scanLog = document.getElementById('scanLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'history-item';
    logEntry.innerHTML = `
        ${new Date().toLocaleString('bn-BD')} - ${userData.name} (${userData.vehicle})
    `;
    scanLog.insertBefore(logEntry, scanLog.firstChild);
    
    // Keep only last 10
    while (scanLog.children.length > 10) {
        scanLog.removeChild(scanLog.lastChild);
    }
}
