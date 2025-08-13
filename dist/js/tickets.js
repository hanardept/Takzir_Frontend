// Tickets page functionality
let currentTickets = [];
let currentFilters = {};
let currentPage = 1;
let pageSize = 20;

// Initialize tickets page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/tickets') {
    initializeTicketsPage();
  }
});

async function initializeTicketsPage() {
  try {
    await loadCommands();
    await loadTickets();
    setupTicketEventListeners();
    setupFilters();
  } catch (error) {
    console.error('Tickets page initialization error:', error);
    showError('שגיאה בטעינת דף התקלות');
  }
}

// Load tickets from API
async function loadTickets(page = 1, filters = {}) {
  try {
    showLoading('טוען תקלות...');
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...filters
    });
    
    const result = await apiCall(`/tickets?${queryParams}`);
    
    currentTickets = result.data.tickets;
    displayTickets(currentTickets);
    displayPagination(result.data.pagination);
    
  } catch (error) {
    console.error('Load tickets error:', error);
    showError('שגיאה בטעינת התקלות');
  } finally {
    hideLoading();
  }
}

// Display tickets in table
function displayTickets(tickets) {
  const ticketsTableBody = document.getElementById('tickets-table-body');
  if (!ticketsTableBody) return;
  
  if (tickets.length === 0) {
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">לא נמצאו תקלות</td>
      </tr>
    `;
    return;
  }
  
  ticketsTableBody.innerHTML = tickets.map(ticket => `
    <tr onclick="viewTicket('${ticket._id}')" class="cursor-pointer">
      <td>${ticket.ticketNumber}</td>
      <td>${ticket.command}</td>
      <td>${ticket.unit}</td>
      <td>
        <span class="status-badge priority-${getPriorityClass(ticket.priority)}">
          ${ticket.priority}
        </span>
      </td>
      <td>
        <span class="status-badge status-${getStatusClass(ticket.status)}">
          ${ticket.status}
        </span>
      </td>
      <td>${ticket.isRecurring ? 'כן' : 'לא'}</td>
      <td class="ticket-description">${truncateText(ticket.description, 50)}</td>
      <td>${formatDate(ticket.openDate)}</td>
      <td class="ticket-actions">
        ${canEditTicket(ticket) ? `
          <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); editTicket('${ticket._id}')">
            עריכה
          </button>
        ` : ''}
        ${canDeleteTicket(ticket) ? `
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteTicket('${ticket._id}')">
            מחיקה
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

// View ticket details
async function viewTicket(ticketId) {
  try {
    showLoading('טוען פרטי תקלה...');
    
    const result = await apiCall(`/tickets/${ticketId}`);
    const ticket = result.data;
    
    displayTicketModal(ticket);
    
  } catch (error) {
    console.error('View ticket error:', error);
    showError('שגיאה בטעינת פרטי התקלה');
  } finally {
    hideLoading();
  }
}

// Display ticket in modal
function displayTicketModal(ticket) {
  const modal = document.getElementById('ticket-modal');
  if (!modal) return;
  
  const modalContent = modal.querySelector('.modal-content');
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">תקלה מספר ${ticket.ticketNumber}</h2>
      <span class="close" onclick="hideModal('ticket-modal')">&times;</span>
    </div>
    <div class="modal-body">
      <div class="ticket-details">
        <div class="detail-row">
          <label>פיקוד:</label>
          <span>${ticket.command}</span>
        </div>
        <div class="detail-row">
          <label>יחידה:</label>
          <span>${ticket.unit}</span>
        </div>
        <div class="detail-row">
          <label>עדיפות:</label>
          <span class="status-badge priority-${getPriorityClass(ticket.priority)}">
            ${ticket.priority}
          </span>
        </div>
        <div class="detail-row">
          <label>סטטוס:</label>
          <span class="status-badge status-${getStatusClass(ticket.status)}">
            ${ticket.status}
          </span>
        </div>
        <div class="detail-row">
          <label>תקלה חוזרת:</label>
          <span>${ticket.isRecurring ? 'כן' : 'לא'}</span>
        </div>
        <div class="detail-row">
          <label>תאריך פתיחה:</label>
          <span>${formatDate(ticket.openDate)}</span>
        </div>
        ${ticket.closeDate ? `
          <div class="detail-row">
            <label>תאריך סגירה:</label>
            <span>${formatDate(ticket.closeDate)}</span>
          </div>
        ` : ''}
        <div class="detail-row">
          <label>נוצר על ידי:</label>
          <span>${ticket.createdBy}</span>
        </div>
        ${ticket.assignedTechnician ? `
          <div class="detail-row">
            <label>טכנאי מטפל:</label>
            <span>${ticket.assignedTechnician}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="ticket-description-full">
        <h3>תיאור התקלה:</h3>
        <p>${ticket.description}</p>
      </div>
      
      ${ticket.comments && ticket.comments.length > 0 ? `
        <div class="ticket-comments">
          <h3>הערות והערות:</h3>
          <div class="comments-list">
            ${ticket.comments.map(comment => `
              <div class="comment">
                <div class="comment-header">
                  <strong>${comment.author}</strong>
                  <span class="comment-date">${formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${canEditTicket(ticket) ? `
        <div class="ticket-actions-modal">
          <button class="btn btn-primary" onclick="showEditTicketForm('${ticket._id}')">
            עריכת תקלה
          </button>
          <button class="btn btn-success" onclick="showAddCommentForm('${ticket._id}')">
            הוספת הערה
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  showModal('ticket-modal');
}

// Create new ticket
function showCreateTicketForm() {
  const modal = document.getElementById('create-ticket-modal');
  if (!modal) {
    createCreateTicketModal();
  } else {
    showModal('create-ticket-modal');
  }
}

function createCreateTicketModal() {
  const modal = document.createElement('div');
  modal.id = 'create-ticket-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">יצירת תקלה חדשה</h2>
        <span class="close" onclick="hideModal('create-ticket-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="create-ticket-form" onsubmit="handleCreateTicket(event)">
          <div class="form-group">
            <label for="ticket-command">פיקוד *</label>
            <select id="ticket-command" name="command" class="form-control" required 
                    onchange="loadUnitsForCommand(this.value, 'ticket-unit')">
              <option value="">בחר פיקוד</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="ticket-unit">יחידה *</label>
            <select id="ticket-unit" name="unit" class="form-control" required>
              <option value="">בחר יחידה</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="ticket-priority">עדיפות *</label>
            <select id="ticket-priority" name="priority" class="form-control" required>
              <option value="רגילה">רגילה</option>
              <option value="דחופה">דחופה</option>
              <option value="מבצעית">מבצעית</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="ticket-description">תיאור התקלה *</label>
            <textarea id="ticket-description" name="description" class="form-control" 
                     rows="4" required placeholder="תאר את התקלה בפירוט..."></textarea>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="ticket-recurring" name="isRecurring">
              תקלה חוזרת
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">יצירת תקלה</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('create-ticket-modal')">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  loadCommandsIntoSelect('ticket-command');
  showModal('create-ticket-modal');
}

// Handle create ticket form submission
async function handleCreateTicket(event) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const ticketData = {
      command: formData.get('command'),
      unit: formData.get('unit'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      isRecurring: formData.get('isRecurring') === 'on'
    };
    
    showLoading('יוצר תקלה...');
    
    const result = await apiCall('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
    
    showSuccess(result.message);
    hideModal('create-ticket-modal');
    await loadTickets(currentPage, currentFilters);
    
  } catch (error) {
    console.error('Create ticket error:', error);
    showError(error.message || 'שגיאה ביצירת התקלה');
  } finally {
    hideLoading();
  }
}

// Edit ticket
async function editTicket(ticketId) {
  try {
    showLoading('טוען נתוני תקלה...');
    
    const result = await apiCall(`/tickets/${ticketId}`);
    const ticket = result.data;
    
    showEditTicketForm(ticket);
    
  } catch (error) {
    console.error('Edit ticket error:', error);
    showError('שגיאה בטעינת נתוני התקלה');
  } finally {
    hideLoading();
  }
}

function showEditTicketForm(ticket) {
  const modal = document.getElementById('edit-ticket-modal');
  if (modal) {
    modal.remove();
  }
  
  const editModal = document.createElement('div');
  editModal.id = 'edit-ticket-modal';
  editModal.className = 'modal';
  editModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">עריכת תקלה ${ticket.ticketNumber}</h2>
        <span class="close" onclick="hideModal('edit-ticket-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="edit-ticket-form" onsubmit="handleEditTicket(event, '${ticket._id}')">
          <div class="form-group">
            <label for="edit-ticket-priority">עדיפות *</label>
            <select id="edit-ticket-priority" name="priority" class="form-control" required>
              <option value="רגילה" ${ticket.priority === 'רגילה' ? 'selected' : ''}>רגילה</option>
              <option value="דחופה" ${ticket.priority === 'דחופה' ? 'selected' : ''}>דחופה</option>
              <option value="מבצעית" ${ticket.priority === 'מבצעית' ? 'selected' : ''}>מבצעית</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-status">סטטוס *</label>
            <select id="edit-ticket-status" name="status" class="form-control" required>
              <option value="פתוח" ${ticket.status === 'פתוח' ? 'selected' : ''}>פתוח</option>
              <option value="בטיפול" ${ticket.status === 'בטיפול' ? 'selected' : ''}>בטיפול</option>
              <option value="תוקן" ${ticket.status === 'תוקן' ? 'selected' : ''}>תוקן</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-description">תיאור התקלה *</label>
            <textarea id="edit-ticket-description" name="description" class="form-control" 
                     rows="4" required>${ticket.description}</textarea>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-ticket-recurring" name="isRecurring" 
                     ${ticket.isRecurring ? 'checked' : ''}>
              תקלה חוזרת
            </label>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-technician">טכנאי מטפל</label>
            <input type="text" id="edit-ticket-technician" name="assignedTechnician" 
                   class="form-control" value="${ticket.assignedTechnician || ''}">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">עדכון תקלה</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('edit-ticket-modal')">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(editModal);
  showModal('edit-ticket-modal');
}

// Handle edit ticket form submission
async function handleEditTicket(event, ticketId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const ticketData = {
      priority: formData.get('priority'),
      status: formData.get('status'),
      description: formData.get('description'),
      isRecurring: formData.get('isRecurring') === 'on',
      assignedTechnician: formData.get('assignedTechnician')
    };
    
    showLoading('מעדכן תקלה...');
    
    const result = await apiCall(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData)
    });
    
    showSuccess(result.message);
    hideModal('edit-ticket-modal');
    hideModal('ticket-modal');
    await loadTickets(currentPage, currentFilters);
    
  } catch (error) {
    console.error('Edit ticket error:', error);
    showError(error.message || 'שגיאה בעדכון התקלה');
  } finally {
    hideLoading();
  }
}

// Add comment to ticket
function showAddCommentForm(ticketId) {
  const modal = document.createElement('div');
  modal.id = 'add-comment-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">הוספת הערה</h2>
        <span class="close" onclick="hideModal('add-comment-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="add-comment-form" onsubmit="handleAddComment(event, '${ticketId}')">
          <div class="form-group">
            <label for="comment-content">תוכן ההערה *</label>
            <textarea id="comment-content" name="content" class="form-control" 
                     rows="3" required placeholder="כתוב את ההערה כאן..."></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">הוספת הערה</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('add-comment-modal')">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  showModal('add-comment-modal');
}

// Handle add comment form submission
async function handleAddComment(event, ticketId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const commentData = {
      content: formData.get('content')
    };
    
    showLoading('מוסיף הערה...');
    
    const result = await apiCall(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
    
    showSuccess(result.message);
    hideModal('add-comment-modal');
    // Refresh ticket view
    await viewTicket(ticketId);
    
  } catch (error) {
    console.error('Add comment error:', error);
    showError(error.message || 'שגיאה בהוספת ההערה');
  } finally {
    hideLoading();
  }
}

// Delete ticket
async function deleteTicket(ticketId) {
  if (!confirm('האם אתה בטוח שברצונך למחוק תקלה זו?')) {
    return;
  }
  
  try {
    showLoading('מוחק תקלה...');
    
    const result = await apiCall(`/tickets/${ticketId}`, {
      method: 'DELETE'
    });
    
    showSuccess(result.message);
    await loadTickets(currentPage, currentFilters);
    
  } catch (error) {
    console.error('Delete ticket error:', error);
    showError(error.message || 'שגיאה במחיקת התקלה');
  } finally {
    hideLoading();
  }
}

// Utility functions
function canEditTicket(ticket) {
  if (!currentUser) return false;
  
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'technician' && currentUser.command === ticket.command) return true;
  
  return false;
}

function canDeleteTicket(ticket) {
  return currentUser && currentUser.role === 'admin';
}

function getPriorityClass(priority) {
  const classes = {
    'רגילה': 'low',
    'דחופה': 'urgent',
    'מבצעית': 'critical'
  };
  return classes[priority] || 'low';
}

function getStatusClass(status) {
  const classes = {
    'פתוח': 'open',
    'בטיפול': 'in-progress',
    'תוקן': 'closed'
  };
  return classes[status] || 'open';
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Load commands and units
async function loadCommands() {
  try {
    const result = await apiCall('/commands');
    window.commands = result.data;
  } catch (error) {
    console.error('Load commands error:', error);
  }
}

function loadCommandsIntoSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select || !window.commands) return;
  
  select.innerHTML = '<option value="">בחר פיקוד</option>';
  window.commands.forEach(command => {
    const option = document.createElement('option');
    option.value = command.name;
    option.textContent = command.name;
    select.appendChild(option);
  });
}

async function loadUnitsForCommand(commandName, unitSelectId) {
  try {
    const command = window.commands.find(c => c.name === commandName);
    if (!command) return;
    
    const result = await apiCall(`/commands/${command._id}/units`);
    const units = result.data;
    
    const unitSelect = document.getElementById(unitSelectId);
    if (!unitSelect) return;
    
    unitSelect.innerHTML = '<option value="">בחר יחידה</option>';
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.name;
      option.textContent = unit.name;
      unitSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Load units error:', error);
  }
}

// Setup filters
function setupFilters() {
  const filtersContainer = document.getElementById('filters-container');
  if (!filtersContainer) return;
  
  filtersContainer.innerHTML = `
    <div class="filters">
      <div class="filters-row">
        <div class="form-group">
          <label for="filter-command">פיקוד</label>
          <select id="filter-command" class="form-control" onchange="handleFilterChange()">
            <option value="">כל הפיקודים</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filter-unit">יחידה</label>
          <select id="filter-unit" class="form-control" onchange="handleFilterChange()">
            <option value="">כל היחידות</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filter-status">סטטוס</label>
          <select id="filter-status" class="form-control" onchange="handleFilterChange()">
            <option value="">כל הסטטוסים</option>
            <option value="פתוח">פתוח</option>
            <option value="בטיפול">בטיפול</option>
            <option value="תוקן">תוקן</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filter-priority">עדיפות</label>
          <select id="filter-priority" class="form-control" onchange="handleFilterChange()">
            <option value="">כל העדיפויות</option>
            <option value="רגילה">רגילה</option>
            <option value="דחופה">דחופה</option>
            <option value="מבצעית">מבצעית</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filter-search">חיפוש חופשי</label>
          <input type="text" id="filter-search" class="form-control" 
                 placeholder="חפש בתיאור..." onkeyup="handleSearchChange()">
        </div>
      </div>
      
      <div class="filters-actions">
        <button class="btn btn-primary" onclick="handleFilterChange()">סנן</button>
        <button class="btn btn-secondary" onclick="clearFilters()">נקה מסננים</button>
        <button class="btn btn-success" onclick="exportTickets()">ייצא לאקסל</button>
      </div>
    </div>
  `;
  
  loadCommandsIntoSelect('filter-command');
}

function handleFilterChange() {
  const filters = {
    command: document.getElementById('filter-command')?.value || '',
    unit: document.getElementById('filter-unit')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
    priority: document.getElementById('filter-priority')?.value || '',
    search: document.getElementById('filter-search')?.value || ''
  };
  
  // Remove empty filters
  Object.keys(filters).forEach(key => {
    if (!filters[key]) {
      delete filters[key];
    }
  });
  
  currentFilters = filters;
  currentPage = 1;
  loadTickets(currentPage, currentFilters);
}

const handleSearchChange = debounce(() => {
  handleFilterChange();
}, 500);

function clearFilters() {
  document.getElementById('filter-command').value = '';
  document.getElementById('filter-unit').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-priority').value = '';
  document.getElementById('filter-search').value = '';
  
  currentFilters = {};
  currentPage = 1;
  loadTickets(currentPage, currentFilters);
}

function exportTickets() {
  const queryParams = new URLSearchParams(currentFilters);
  exportToExcel(`/tickets/export/excel?${queryParams}`, `tickets_${formatDateOnly(new Date())}.xlsx`);
}

// Setup event listeners
function setupTicketEventListeners() {
  // Create ticket button
  const createTicketBtn = document.getElementById('create-ticket-btn');
  if (createTicketBtn && (currentUser.role === 'admin' || currentUser.role === 'technician')) {
    createTicketBtn.onclick = showCreateTicketForm;
  }
}

// Display pagination
function displayPagination(pagination) {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = '';
  
  const paginationElement = createPagination(pagination, (page) => {
    currentPage = page;
    loadTickets(currentPage, currentFilters);
  });
  
  paginationContainer.appendChild(paginationElement);
}
