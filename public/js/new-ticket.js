document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission
    document.getElementById('new-ticket-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add debugging
        console.log('=== CREATE TICKET DEBUG ===');
        console.log('API_BASE_URL:', API_BASE_URL);
        
        const formData = new FormData(this);
        const ticketData = {
            subject: formData.get('subject'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: 'פתוח', // Default status
            createdAt: new Date().toISOString()
        };
        
        console.log('Ticket data:', ticketData);
        console.log('Request URL:', `${API_BASE_URL}/tickets`);
        
        // Submit ticket - FIXED URL
        fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            credentials: 'include', // IMPORTANT: send session cookie
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response URL:', response.url);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success response:', data);
            
            // Show success message
            document.getElementById('ticket-success').style.display = 'block';
            document.getElementById('ticket-error').style.display = 'none';
            
            // Clear form
            document.getElementById('new-ticket-form').reset();
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        })
        .catch(error => {
            console.error('Error creating ticket:', error);
            document.getElementById('ticket-error').textContent = 'שגיאה ביצירת התקלה. נסה שוב.';
            document.getElementById('ticket-error').style.display = 'block';
            document.getElementById('ticket-success').style.display = 'none';
        });
    });
});
