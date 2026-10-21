import { supabase } from './supabase-client.js'

export async function renderPortal(portalType) {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    if (profile) {
      renderPortalDashboard(profile)
      return
    }
  }
  renderPortalLogin(portalType)
}

function portalConfig(portalType) {
  const configs = {
    teacher: { title: 'Teachers Portal', icon: '👨\u200d🏫', accent: 'var(--color-primary)' },
    student: { title: 'Student Portal', icon: '🎓', accent: 'var(--color-accent)' },
    parent: { title: 'Parents Portal', icon: '👨\u200d👩\u200d👧', accent: 'var(--color-secondary)' },
  }
  return configs[portalType] || configs.student
}

function renderPortalLogin(portalType) {
  const cfg = portalConfig(portalType)
  document.querySelector('#app').innerHTML = `
    <div class="portal-login-page">
      <div class="portal-login-card">
        <div class="portal-login-header">
          <span class="logo-badge">TCBS</span>
          <div class="portal-login-icon">${cfg.icon}</div>
          <h1>${cfg.title}</h1>
          <p class="portal-login-subtitle">Sign in to access your dashboard</p>
        </div>
        <form id="portalLoginForm">
          <input type="email" id="portalEmail" placeholder="Your email address" required autocomplete="email" />
          <input type="password" id="portalPassword" placeholder="Password" required autocomplete="current-password" />
          <button type="submit" class="btn btn-primary btn-full">Sign In</button>
          <p class="portal-error" id="portalError"></p>
        </form>
        <div style="margin-top:12px;display:flex;justify-content:space-between;font-size:13px">
          <a href="#" id="portalForgotLink" style="color:#2563eb;text-decoration:underline">Forgot password?</a>
          <a href="./register.html" style="color:#2563eb;text-decoration:underline">No account? Sign up</a>
        </div>
        <div id="portalForgotBox" style="display:none;margin-top:12px;border-top:1px solid #ddd;padding-top:12px">
          <input id="portalResetEmail" type="email" placeholder="Enter your email" style="width:100%;border:1px solid #ccc;padding:8px;border-radius:6px;margin-bottom:8px">
          <button id="portalResetBtn" type="button" style="width:100%;background:#1f2937;color:white;padding:8px;border-radius:6px">Send Reset Link</button>
          <p id="portalResetMsg" style="font-size:12px;margin-top:6px"></p>
        </div>
        <a href="#top" class="portal-back-link">&larr; Back to website</a>
      </div>
    </div>
  `

  document.getElementById('portalLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('portalEmail').value
    const password = document.getElementById('portalPassword').value
    const errorEl = document.getElementById('portalError')
    errorEl.textContent = ''

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      errorEl.textContent = 'Invalid email or password. If you do not have an account, please contact the school office.'
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) {
      errorEl.textContent = 'Your account is not linked to a school profile. Please contact the school office.'
      await supabase.auth.signOut()
      return
    }

    renderPortalDashboard(profile)
  })
}
setTimeout(()=>{
  document.getElementById('portalForgotLink')?.addEventListener('click', (e)=>{
    e.preventDefault()
    const box = document.getElementById('portalForgotBox')
    box.style.display = box.style.display==='none' ? 'block' : 'none'
  })
  document.getElementById('portalResetBtn')?.addEventListener('click', async ()=>{
    const email = document.getElementById('portalResetEmail').value
    if(!email) return alert('Enter email')
    const {error} = await supabase.auth.resetPasswordForEmail(email, {redirectTo: location.origin + '/update-password.html'})
    document.getElementById('portalResetMsg').textContent = error ? error.message : 'Check your email!'
    document.getElementById('portalResetMsg').style.color = error ? 'red' : 'green'
  })
}, 500)
async function renderPortalDashboard(profile) {
  const cfg = portalConfig(profile.role)
  document.querySelector('#app').innerHTML = `
    <div class="portal-dashboard">
      <header class="portal-dash-header">
        <div class="portal-dash-brand">
          <span class="logo-badge">TCBS</span>
          <span>${cfg.title}</span>
        </div>
        <div class="portal-dash-user">
          <span>${escapeHtml(profile.full_name || 'User')}</span>
          <button class="btn btn-outline-dark btn-sm" id="portalSignOut">Sign Out</button>
        </div>
      </header>
      <main class="portal-dash-content" id="portalDashContent">
        <div class="admin-loading">Loading your dashboard...</div>
      </main>
    </div>
  `

  document.getElementById('portalSignOut').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.hash = '#top'
    location.reload()
  })

  if (profile.role === 'admin') {
    window.location.hash = '#admin'
    return
  }

  if (profile.role === 'teacher') {
    await renderTeacherDashboard(profile)
  } else if (profile.role === 'student') {
    await renderStudentDashboard(profile)
  } else if (profile.role === 'parent') {
    await renderParentDashboard(profile)
  }
}

async function renderTeacherDashboard(profile) {
  const content = document.getElementById('portalDashContent')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', profile.teacher_id)
    .maybeSingle()

  const { data: classes } = await supabase
    .from('academic_classes')
    .select('*')
    .eq('teacher_id', profile.teacher_id)
    .order('name')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_date', { ascending: false })
    .limit(5)

  content.innerHTML = `
    <div class="portal-section">
      <h2>Welcome, ${escapeHtml(teacher?.full_name || profile.full_name || 'Teacher')}</h2>
      ${teacher ? `
        <div class="portal-info-card">
          <div class="portal-info-row"><span>Subject:</span><strong>${escapeHtml(teacher.subject || 'Not set')}</strong></div>
          <div class="portal-info-row"><span>Grade Level:</span><strong>${escapeHtml(teacher.grade_level || 'Not set')}</strong></div>
          <div class="portal-info-row"><span>Email:</span><strong>${escapeHtml(teacher.email || 'Not set')}</strong></div>
          <div class="portal-info-row"><span>Phone:</span><strong>${escapeHtml(teacher.phone || 'Not set')}</strong></div>
        </div>
      ` : ''}
    </div>

    <div class="portal-section">
      <h3>My Classes</h3>
      ${classes && classes.length > 0 ? `
        <div class="portal-cards">
          ${classes.map((c) => `
            <div class="portal-card-item">
              <h4>${escapeHtml(c.name)}</h4>
              <p>Grade: ${escapeHtml(c.grade_level || 'N/A')}</p>
              <p>Capacity: ${c.capacity || 40}</p>
            </div>
          `).join('')}
        </div>
      ` : '<p class="portal-empty">No classes assigned yet.</p>'}
    </div>

    <div class="portal-section">
      <h3>Recent Announcements</h3>
      ${announcements && announcements.length > 0 ? `
        <div class="portal-announcements">
          ${announcements.map((a) => `
            <div class="portal-announcement-item">
              <strong>${escapeHtml(a.title)}</strong>
              <span class="portal-announcement-date">${new Date(a.published_date).toLocaleDateString()}</span>
              <p>${escapeHtml(a.content)}</p>
            </div>
          `).join('')}
        </div>
      ` : '<p class="portal-empty">No announcements yet.</p>'}
    </div>
  `
}

async function renderStudentDashboard(profile) {
  const content = document.getElementById('portalDashContent')

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', profile.student_id)
    .maybeSingle()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_date', { ascending: false })
    .limit(5)

  content.innerHTML = `
    <div class="portal-section">
      <h2>Welcome, ${escapeHtml(student?.full_name || profile.full_name || 'Student')}</h2>
      ${student ? `
        <div class="portal-info-card">
          <div class="portal-info-row"><span>Admission No:</span><strong>${escapeHtml(student.admission_number)}</strong></div>
          <div class="portal-info-row"><span>Status:</span><strong>${escapeHtml(student.status)}</strong></div>
          <div class="portal-info-row"><span>Guardian:</span><strong>${escapeHtml(student.guardian_name || 'N/A')}</strong></div>
        </div>
      ` : ''}
    </div>

    <div class="portal-section">
      <h3>Recent Announcements</h3>
      ${announcements && announcements.length > 0 ? `
        <div class="portal-announcements">
          ${announcements.map((a) => `
            <div class="portal-announcement-item">
              <strong>${escapeHtml(a.title)}</strong>
              <span class="portal-announcement-date">${new Date(a.published_date).toLocaleDateString()}</span>
              <p>${escapeHtml(a.content)}</p>
            </div>
          `).join('')}
        </div>
      ` : '<p class="portal-empty">No announcements yet.</p>'}
    </div>
  `
}

async function renderParentDashboard(profile) {
  const content = document.getElementById('portalDashContent')

  const { data: parent } = await supabase
    .from('parents')
    .select('*')
    .eq('id', profile.parent_id)
    .maybeSingle()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_date', { ascending: false })
    .limit(5)

  let childInfo = null
  if (parent?.student_id) {
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', parent.student_id)
      .maybeSingle()
    childInfo = student
  }

  content.innerHTML = `
    <div class="portal-section">
      <h2>Welcome, ${escapeHtml(parent?.full_name || profile.full_name || 'Parent')}</h2>
      ${parent ? `
        <div class="portal-info-card">
          <div class="portal-info-row"><span>Email:</span><strong>${escapeHtml(parent.email || 'N/A')}</strong></div>
          <div class="portal-info-row"><span>Phone:</span><strong>${escapeHtml(parent.phone || 'N/A')}</strong></div>
          <div class="portal-info-row"><span>Relationship:</span><strong>${escapeHtml(parent.relationship || 'N/A')}</strong></div>
        </div>
      ` : ''}
    </div>

    <div class="portal-section">
      <h3>My Child</h3>
      ${childInfo ? `
        <div class="portal-info-card">
          <div class="portal-info-row"><span>Name:</span><strong>${escapeHtml(childInfo.full_name)}</strong></div>
          <div class="portal-info-row"><span>Admission No:</span><strong>${escapeHtml(childInfo.admission_number)}</strong></div>
          <div class="portal-info-row"><span>Status:</span><strong>${escapeHtml(childInfo.status)}</strong></div>
        </div>
      ` : '<p class="portal-empty">No child linked to your account yet. Please contact the school office.</p>'}
    </div>

    <div class="portal-section">
      <h3>Recent Announcements</h3>
      ${announcements && announcements.length > 0 ? `
        <div class="portal-announcements">
          ${announcements.map((a) => `
            <div class="portal-announcement-item">
              <strong>${escapeHtml(a.title)}</strong>
              <span class="portal-announcement-date">${new Date(a.published_date).toLocaleDateString()}</span>
              <p>${escapeHtml(a.content)}</p>
            </div>
          `).join('')}
        </div>
      ` : '<p class="portal-empty">No announcements yet.</p>'}
    </div>
  `
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
