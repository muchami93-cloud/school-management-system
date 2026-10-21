import { supabase } from './supabase-client.js'

const DEFAULT_PASSWORD = 'tcbs2026'


const TABLES = [
  { name: 'user_profiles', label: 'Pending Approvals', icon: '⏳', columns: ['full_name', 'email', 'role', 'status'], fkFields: [] },
  { name: 'teachers', label: 'Teachers', icon: '👨‍🏫', columns: ['full_name', 'email', 'phone'], fkFields: [] },
  { name: 'students', label: 'Students', icon: '🎓', columns: ['admission_number', 'full_name'], fkFields: [] },
  { name: 'parents', label: 'Parents', icon: '👪', columns: ['full_name', 'email'], fkFields: [] },
  { name: 'academic_classes', label: 'Classes', icon: '🏫', columns: ['name', 'grade_level'], fkFields: [] },
  { name: 'enrollments', label: 'Enrollments', icon: '📝', columns: ['student_id', 'class_id'], fkFields: [] },
  { name: 'announcements', label: 'Announcements', icon: '📢', columns: ['title', 'content'], fkFields: [] },
  { name: 'gallery_items', label: 'Gallery', icon: '🖼️', columns: ['title', 'description'], fkFields: [] },
  { name: 'contact_messages', label: 'Messages', icon: '✉️', columns: ['name', 'email', 'subject'], fkFields: [] },
]


let currentTable = 'teachers'
let currentData = []
let editingId = null
let fkCache = {}

export async function renderAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    renderDashboard(session.user)
  } else {
    renderLogin()
  }
}

function renderLogin() {
  document.querySelector('#app').innerHTML = `
    <div class="admin-login-page">
      <div class="admin-login-card">
        <div class="admin-login-logo">
          <span class="logo-badge">TCBS</span>
        </div>
        <h1>Admin Dashboard</h1>
        <p class="admin-login-subtitle">Sign in to manage school data</p>
        <form id="adminLoginForm">
          <input type="email" id="adminEmail" placeholder="Admin email" required autocomplete="email" />
          <input type="password" id="adminPassword" placeholder="Password" required autocomplete="current-password" />
          <button type="submit" class="btn btn-primary btn-full">Sign In</button>
          <p class="admin-error" id="adminError"></p>
        </form>
            <div style="margin-top:12px;display:flex;justify-content:space-between;font-size:13px">
               <a href="#" id="adminForgotLink" style="color:#2563eb;text-decoration:underline">Forgot password?</a>
              <a href="./register.html" style="color:#2563eb;text-decoration:underline">No account? Sign up</a>
            </div>
             <div id="adminForgotBox" style="display:none;margin-top:12px;border-top:1px solid #ddd;padding-top:12px">
              <input id="adminResetEmail" type="email" placeholder="Enter your email" style="width:100%;border:1px solid #ccc;padding:8px;border-radius:6px;margin-bottom:8px">
              <button id="adminResetBtn" type="button" style="width:100%;background:#1f2937;color:white;padding:8px;border-radius:6px">Send Reset Link</button>
              <p id="adminResetMsg" style="font-size:12px;margin-top:6px"></p>
            </div>
           <a href="#top" class="admin-back-link">&larr; Back to website</a>
      </div>
    </div>
  `

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('adminEmail').value
    const password = document.getElementById('adminPassword').value
    const errorEl = document.getElementById('adminError')
    errorEl.textContent = ''

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      errorEl.textContent = error.message
    } else {
      renderDashboard(null)
      await loadTable(currentTable)
    }
  })
}
// Show/hide forgot box + send reset link
setTimeout(()=>{
  document.getElementById('adminForgotLink')?.addEventListener('click', (e)=>{
    e.preventDefault()
    const box = document.getElementById('adminForgotBox')
    box.style.display = box.style.display==='none' ? 'block' : 'none'
  })
  document.getElementById('adminResetBtn')?.addEventListener('click', async ()=>{
    const email = document.getElementById('adminResetEmail').value
    if(!email) return alert('Enter email')
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + '/update-password.html'
    })
    document.getElementById('adminResetMsg').textContent = error ? error.message : 'Check your email for reset link!'
    document.getElementById('adminResetMsg').style.color = error ? 'red' : 'green'
  })
}, 500)

function renderDashboard(user) {
  document.querySelector('#app').innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar" id="adminSidebar">
        <div class="admin-sidebar-header">
          <span class="logo-badge">TCBS</span>
          <span class="admin-sidebar-title">Admin Panel</span>
        </div>
        <nav class="admin-nav" id="adminNav">
          ${TABLES.map((t) => `
            <button class="admin-nav-item ${t.name === currentTable ? 'active' : ''}" data-table="${t.name}">
              <span class="admin-nav-icon">${t.icon}</span>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </nav>
        <div class="admin-sidebar-footer">
          <button class="admin-nav-item" id="adminSignOut">
            <span class="admin-nav-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <button class="admin-menu-btn" id="adminMenuBtn">☰</button>
          <h2 id="adminTableTitle">Teachers</h2>
          <div class="admin-topbar-actions">
            <a href="#top" class="admin-view-site">View Site &rarr;</a>
          </div>
        </header>
        <div class="admin-content" id="adminContent">
          <div class="admin-loading">Loading...</div>
        </div>
      </main>
    </div>
  `

  document.getElementById('adminSignOut').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.hash = '#top'
    location.reload()
  })

  document.getElementById('adminMenuBtn').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('sidebar-open')
  })

  document.querySelectorAll('.admin-nav-item[data-table]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTable = btn.getAttribute('data-table')
      document.querySelectorAll('.admin-nav-item[data-table]').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById('adminSidebar').classList.remove('sidebar-open')
      loadTable(currentTable)
    })
  })

  loadTable(currentTable)
}

async function loadFKOptions(tableConfig) {
  if (!tableConfig.fkFields || tableConfig.fkFields.length === 0) return;
  for (const fk of tableConfig.fkFields) {
    try {
      const { data } = await supabase.from(fk.table).select('id, name, full_name, title').limit(100);
      fk.options = data || [];
    } catch(e) {}
  }
}

async function loadTable(tableName) {
  const tableConfig = TABLES.find((t) => t.name === tableName)
  document.getElementById('adminTableTitle').textContent = tableConfig.label
  const content = document.getElementById('adminContent')
  content.innerHTML = '<div class="admin-loading">Loading...</div>'

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    content.innerHTML = `<div class="admin-error-banner">Error loading data: ${error.message}</div>`
    return
  }

  currentData = data || []
  editingId = null
  renderTableContent(tableName, tableConfig, currentData)
}

function renderTableContent(tableName, tableConfig, data) {
  const content = document.getElementById('adminContent')

  if (tableName === 'contact_messages') {
    content.innerHTML = renderMessagesView(data)
    attachMessageHandlers(data)
    return
  }

  content.innerHTML = `
    <div class="admin-table-header">
      <div class="admin-table-count">${data.length} record${data.length !== 1 ? 's' : ''}</div>
      <button class="btn btn-primary btn-sm" id="adminAddBtn">+ Add New</button>
    </div>
    <div id="adminFormContainer"></div>
    <div class="admin-table-wrap">
      ${data.length === 0
        ? '<div class="admin-empty">No records yet. Click "Add New" to create one.</div>'
        : `<table class="admin-table">
            <thead>
              <tr>
                ${tableConfig.columns.map((c) => `<th>${formatLabel(c)}</th>`).join('')}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((row) => `
                <tr>
                  ${tableConfig.columns.map((c) => `<td>${formatValue(row[c], c)}</td>`).join('')}
                 <td class="admin-row-actions">${tableName === 'user_profiles' ? (row.status === 'pending' ? '<button onclick="updateStatus(\''+row.id+'\', \'approved\')" style="background:#16a34a;color:white;padding:5px 10px;border:none;border-radius:5px;cursor:pointer;margin-right:5px">Approve</button><button onclick="updateStatus(\''+row.id+'\', \'rejected\')" style="background:#dc2626;color:white;padding:5px 10px;border:none;border-radius:5px;cursor:pointer">Reject</button>' : '<span style="color:'+(row.status === 'approved' ? 'green' : 'red')+';font-weight:bold">'+row.status+'</span>') : '<button class="admin-action-btn admin-edit-btn" data-id="'+row.id+'">Edit</button><button class="admin-action-btn admin-delete-btn" data-id="'+row.id+'">Delete</button>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
      }
    </div>
  `

  document.getElementById('adminAddBtn').addEventListener('click', () => {
    editingId = null
    renderForm(tableName, tableConfig)
  })

  document.querySelectorAll('.admin-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingId = btn.getAttribute('data-id')
      const row = data.find((r) => r.id === editingId)
      renderForm(tableName, tableConfig, row)
    })
  })

  document.querySelectorAll('.admin-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!confirm('Are you sure you want to delete this record?')) return
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) {
        alert('Delete failed: ' + error.message)
      } else {
        loadTable(tableName)
      }
    })
  })
}

function renderForm(tableName, tableConfig, existing = null) {
  const container = document.getElementById('adminFormContainer')
  const isEditing = !!existing

  container.innerHTML = `
    <div class="admin-form-card">
      <h3>${isEditing ? 'Edit' : 'Add'} ${tableConfig.label.slice(0, -1)}</h3>
      <form id="adminCrudForm" class="admin-crud-form">
        ${tableConfig.columns.map((col) => renderField(col, existing, tableConfig)).join('')}
        <div class="admin-form-actions">
          <button type="submit" class="btn btn-primary btn-sm">${isEditing ? 'Update' : 'Create'}</button>
          <button type="button" class="btn btn-outline-dark btn-sm" id="adminCancelForm">Cancel</button>
        </div>
      </form>
    </div>
  `

  container.scrollIntoView({ behavior: 'smooth', block: 'start' })

  document.getElementById('adminCancelForm').addEventListener('click', () => {
    container.innerHTML = ''
  })

  document.getElementById('adminCrudForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = {}
    tableConfig.columns.forEach((col) => {
      const el = document.getElementById(`field_${col}`)
      if (!el) return
      if (el.type === 'checkbox') {
        formData[col] = el.checked
      } else if (el.type === 'number') {
        formData[col] = el.value ? parseInt(el.value, 10) : null
      } else if (el.tagName === 'SELECT') {
        formData[col] = el.value || null
      } else if (el.type === 'date') {
        formData[col] = el.value || null
      } else {
        formData[col] = el.value.trim() || null
      }
    })

    if (isEditing) {
      const { error } = await supabase.from(tableName).update(formData).eq('id', editingId)
      if (error) { alert('Update failed: ' + error.message); return }
    } else {
      const { data: inserted, error } = await supabase.from(tableName).insert(formData).select()
      if (error) { alert('Create failed: ' + error.message); return }

      if (tableConfig.createsAccount && formData.email) {
        const accountResult = await createAuthAccount(tableConfig, formData, inserted[0])
        if (accountResult.error) {
          alert(`Record created, but login account could not be created: ${accountResult.error}`)
        } else {
          alert(`Record created. Login account created with email "${formData.email}" and default password "${DEFAULT_PASSWORD}". The user can change their password after signing in.`)
        }
      }
    }

    container.innerHTML = ''
    loadTable(tableName)
  })
}

async function createAuthAccount(tableConfig, formData, insertedRow) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No admin session' }

  const body = {
    email: formData.email,
    password: DEFAULT_PASSWORD,
    role: tableConfig.accountRole,
    full_name: formData[tableConfig.accountNameCol] || '',
  }

  if (tableConfig.name === 'teachers') body.teacher_id = insertedRow.id
  if (tableConfig.name === 'students') body.student_id = insertedRow.id
  if (tableConfig.name === 'parents') body.parent_id = insertedRow.id

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/create-user-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    })
    const result = await resp.json()
    if (!resp.ok) return { error: result.error || 'Unknown error' }
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

function renderField(col, existing, tableConfig) {
  const value = existing ? (existing[col] ?? '') : ''
  const label = formatLabel(col)

const fkDef = tableConfig.fkFields ? tableConfig.fkFields.find((f) => f.column === col) : null;
  if (fkDef) {
    const options = fkCache[col] || [];
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="">Select...</option>
          ${options.map((opt) => `<option value="${opt.id}" ${value === opt.id ? 'selected' : ''}>${escapeHtml(opt.name || opt.full_name || opt.title || opt.id)}</option>`).join('')}
        </select>
      </div>`;
  }

  if (col === 'is_published' || col === 'is_read') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <label class="admin-checkbox">
          <input type="checkbox" id="field_${col}" ${value ? 'checked' : ''} />
          <span>Yes</span>
        </label>
      </div>
    `
  }

  if (col === 'gender') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="">Select...</option>
          <option value="male" ${value === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${value === 'female' ? 'selected' : ''}>Female</option>
          <option value="other" ${value === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    `
  }

  if (col === 'status' && currentTable === 'students') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="active" ${value === 'active' ? 'selected' : ''}>Active</option>
          <option value="graduated" ${value === 'graduated' ? 'selected' : ''}>Graduated</option>
          <option value="transferred" ${value === 'transferred' ? 'selected' : ''}>Transferred</option>
        </select>
      </div>
    `
  }

  if (col === 'status' && currentTable === 'enrollments') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="enrolled" ${value === 'enrolled' ? 'selected' : ''}>Enrolled</option>
          <option value="completed" ${value === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="withdrawn" ${value === 'withdrawn' ? 'selected' : ''}>Withdrawn</option>
        </select>
      </div>
    `
  }

  if (col === 'term') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="">Select...</option>
          <option value="Term 1" ${value === 'Term 1' ? 'selected' : ''}>Term 1</option>
          <option value="Term 2" ${value === 'Term 2' ? 'selected' : ''}>Term 2</option>
          <option value="Term 3" ${value === 'Term 3' ? 'selected' : ''}>Term 3</option>
        </select>
      </div>
    `
  }

  if (col === 'category' && currentTable === 'announcements') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="general" ${value === 'general' ? 'selected' : ''}>General</option>
          <option value="academic" ${value === 'academic' ? 'selected' : ''}>Academic</option>
          <option value="event" ${value === 'event' ? 'selected' : ''}>Event</option>
          <option value="urgent" ${value === 'urgent' ? 'selected' : ''}>Urgent</option>
        </select>
      </div>
    `
  }

  if (col === 'category' && currentTable === 'gallery_items') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <select id="field_${col}">
          <option value="classroom" ${value === 'classroom' ? 'selected' : ''}>Classroom</option>
          <option value="sports" ${value === 'sports' ? 'selected' : ''}>Sports</option>
          <option value="events" ${value === 'events' ? 'selected' : ''}>Events</option>
          <option value="community" ${value === 'community' ? 'selected' : ''}>Community</option>
          <option value="facilities" ${value === 'facilities' ? 'selected' : ''}>Facilities</option>
        </select>
      </div>
    `
  }

  if (col === 'capacity' || col === 'display_order') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <input type="number" id="field_${col}" value="${value}" />
      </div>
    `
  }

  if (col === 'date_of_birth' || col === 'enrollment_date') {
    return `
      <div class="admin-field">
        <label>${label}</label>
        <input type="date" id="field_${col}" value="${value ? String(value).split('T')[0] : ''}" />
      </div>
    `
  }

  if (col === 'bio' || col === 'message' || col === 'content' || col === 'description') {
    return `
      <div class="admin-field admin-field-full">
        <label>${label}</label>
        <textarea id="field_${col}" rows="3">${escapeHtml(value)}</textarea>
      </div>
    `
  }

  if (col === 'image_url') {
    return `
      <div class="admin-field admin-field-full">
        <label>${label}</label>
        <input type="url" id="field_${col}" value="${escapeAttr(value)}" placeholder="https://..." />
      </div>
    `
  }

  return `
    <div class="admin-field">
      <label>${label}</label>
      <input type="text" id="field_${col}" value="${escapeAttr(value)}" />
    </div>
  `
}

function renderMessagesView(data) {
  if (data.length === 0) {
    return '<div class="admin-empty">No messages yet.</div>'
  }
  return `
    <div class="admin-table-header">
      <div class="admin-table-count">${data.length} message${data.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="admin-messages">
      ${data.map((msg) => `
        <div class="admin-message-card ${msg.is_read ? '' : 'admin-message-unread'}">
          <div class="admin-message-header">
            <div>
              <strong>${escapeHtml(msg.name)}</strong>
              <span class="admin-message-email">${escapeHtml(msg.email)}</span>
            </div>
            <span class="admin-message-date">${new Date(msg.created_at).toLocaleDateString()}</span>
          </div>
          <div class="admin-message-subject">${escapeHtml(msg.subject)}</div>
          <p class="admin-message-body">${escapeHtml(msg.message)}</p>
          <div class="admin-message-actions">
            ${msg.is_read ? '<span class="admin-read-tag">Read</span>' : `<button class="admin-action-btn admin-mark-read" data-id="${msg.id}">Mark as Read</button>`}
            <button class="admin-action-btn admin-delete-btn" data-id="${msg.id}">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function attachMessageHandlers(data) {
  document.querySelectorAll('.admin-mark-read').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      await supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
      loadTable('contact_messages')
    })
  })

  document.querySelectorAll('.admin-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!confirm('Delete this message?')) return
      await supabase.from('contact_messages').delete().eq('id', id)
      loadTable('contact_messages')
    })
  })
}

function formatLabel(col) {
  if (col === 'current_class_id') return 'Current Class'
  if (col === 'student_id') return 'Student'
  if (col === 'class_id') return 'Class'
  if (col === 'teacher_id') return 'Class Teacher'
  return col
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatValue(value, col) {
  if (value === null || value === undefined) return '<span class="admin-null">—</span>'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (col && (col.endsWith('_id')) && typeof value === 'string') {
    const fkDef = TABLES.find((t) => t.name === currentTable)?.fkFields?.find((f) => f.column === col)
    if (fkDef && fkCache[col]) {
      const matched = fkCache[col].find((r) => r.id === value)
      if (matched) return escapeHtml(matched[fkDef.refLabel])
    }
    return `<span class="admin-null">${value.substring(0, 8)}...</span>`
  }
  if (typeof value === 'string' && value.length > 60) return escapeHtml(value.substring(0, 60) + '...')
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleDateString()
  }
  return escapeHtml(String(value))
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
// --- PENDING APPROVALS - ADD AT BOTTOM ---
async function loadPendingApprovals() {
  const container = document.getElementById('adminContent') || document.querySelector('.admin-content') || document.getElementById('app')
  if (!container) return
  const { data: pendings } = await supabase.from('user_profiles').select("*").eq('status', 'pending')
  if (!pendings || pendings.length === 0) return
  
  const html = `
    <div style="background:#fef9c3;border:1px solid #facc15;padding:16px;border-radius:8px;margin-bottom:20px">
      <h3 style="font-weight:bold;font-size:18px;margin-bottom:12px">⏳ Pending Approvals (${pendings.length})</h3>
      ${pendings.map(u=>`
        <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:12px;margin-bottom:8px;border-radius:6px">
          <span><b>${u.full_name}</b> (${u.email}) - wants ${u.role.replace('pending_','')}</span>
          <div>
            <button onclick="approveUser('${u.id}','${u.role}')" style="background:#16a34a;color:white;padding:4px 12px;border-radius:4px;margin-right:8px">Approve</button>
            <button onclick="rejectUser('${u.id}')" style="background:#dc2626;color:white;padding:4px 12px;border-radius:4px">Reject</button>
          </div>
        </div>
      `).join('')}
    </div>
  `
  container.insertAdjacentHTML('afterbegin', html)
}

window.approveUser = async function(id, pendingRole) {
  const newRole = pendingRole // it's already teacher or student
  await supabase.from('user_profiles').update({ status: 'approved' }).eq('id', id)
  if(newRole === 'teacher') await supabase.from('teachers').update({status:'approved'}).eq('user_id', id)
  else await supabase.from('students').update({status:'approved'}).eq('user_id', id)
  alert('Approved as '+newRole); location.reload()
}

window.rejectUser = async function(id) {
  await supabase.from('user_profiles').delete().eq('id', id)
  await supabase.from('teachers').delete().eq('user_id', id)
  await supabase.from('students').delete().eq('user_id', id)
  alert('Rejected'); location.reload()
}

// Auto load after 1 sec
setTimeout(loadPendingApprovals, 1000)
// NEW: Approve / Reject users
async function updateStatus(id, newStatus) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ status: newStatus })
    .eq('id', id)
  
  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('User ' + newStatus + ' successfully!')
    location.reload()
  }
}
window.updateStatus = updateStatus