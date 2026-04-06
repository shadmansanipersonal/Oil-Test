// register.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const qrContainer = document.getElementById('qrContainer');
    const qrCode = document.getElementById('qrCode');
    const userIdSpan = document.getElementById('userId');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const vehicle = document.getElementById('vehicle').value;
        
        // Generate unique user ID
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // User data
        const userData = {
            id: userId,
            name: name,
            phone: phone,
            vehicle: vehicle,
            registeredAt: new Date().toISOString(),
            lastFuel: null, // First time, eligible
            fuelHistory: [],
            receipts: []
        };
        
        // Save to localStorage
        localStorage.setItem('ishwarUser_' + userId, JSON.stringify(userData));
        
        // Generate QR Code
        QRCode.toCanvas(qrCode, userId, { width: 200 }, function (error) {
            if (error) console.error(error);
        });
        
        // Show result
        userIdSpan.textContent = userId;
        qrContainer.classList.remove('hidden');
        form.classList.add('hidden');
        
        // Scroll to QR
        qrContainer.scrollIntoView({ behavior: 'smooth' });
    });
});
