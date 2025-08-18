document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('new-ticket-form');
  if (!form) return; // Not on the new ticket page

  const successEl = document.getElementById('ticket-success');
  const errorEl = document.getElementById('ticket-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(form);
      const ticketData = {
        subject: (formData.get('subject') || '').trim(),
        description: (formData.get('description') || '').trim(),
        priority: formData.get('priority') || 'בינוני',
        status: 'פתוח',
        createdAt: new Date().toISOString(),
      };

      // Basic client-side validation
      if (!ticketData.subject) {
        throw new Error('יש להזין נושא תקלה');
      }
      if (!ticketData.description) {
        throw new Error('יש להזין תיאור תקלה');
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        credentials: 'include', // send session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!res.ok) {
        // Try to surface server error message if provided
        let serverMsg = '';
        try {
          const errJson = await res.json();
          serverMsg = errJson?.message || errJson?.error || '';
        } catch (_) {}
        throw new Error(serverMsg || 'שגיאה בבקשה לשרת');
      }

      const data = await res.json();

      // UI feedback
      if (successEl) {
        successEl.textContent = 'התקלה נוצרה בהצלחה';
        successEl.style.display = 'block';
      }
      if (errorEl) errorEl.style.display = 'none';

      // Reset form
      form.reset();

      // Optional: if server returns the ticket ID, you can navigate directly to it
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      console.error('Error creating ticket:', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'שגיאה ביצירת התקלה. נסה שוב.';
        errorEl.style.display = 'block';
      }
      if (successEl) successEl.style.display = 'none';
    }
  });
});
