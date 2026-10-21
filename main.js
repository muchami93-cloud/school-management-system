import './style.css'
import { renderAdmin } from './admin.js'
import { renderPortal } from './portals.js'

function renderHome() {
const HERO_IMG = 'https://images.pexels.com/photos/34211747/pexels-photo-34211747.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
const ABOUT_IMG = 'https://images.pexels.com/photos/31763369/pexels-photo-31763369.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'

const GALLERY_IMAGES = [
  { url: 'https://images.pexels.com/photos/39523812/pexels-photo-39523812.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Children holding school supplies in class' },
  { url: 'https://images.pexels.com/photos/34162714/pexels-photo-34162714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students concentrating on their studies' },
  { url: 'https://images.pexels.com/photos/11025019/pexels-photo-11025019.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Two students using a laptop' },
  { url: 'https://images.pexels.com/photos/39523813/pexels-photo-39523813.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students in a classroom session' },
  { url: 'https://images.pexels.com/photos/34526411/pexels-photo-34526411.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Diverse classroom of engaged students' },
  { url: 'https://images.pexels.com/photos/34162713/pexels-photo-34162713.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students focused on their lessons' },
]

const ACADEMIC_LEVELS = [
  {
    icon: '🌱',
    name: 'Early Years',
    grades: 'Pre-Primary 1 & 2',
    description: 'A nurturing start for our youngest learners, focused on play-based learning, social skills, and foundational literacy.',
  },
  {
    icon: '📚',
    name: 'Lower Primary',
    grades: 'Grade 1 – 3',
    description: 'Building core competencies in literacy, numeracy, and creativity through the CBC curriculum.',
  },
  {
    icon: '🔬',
    name: 'Upper Primary',
    grades: 'Grade 4 – 6',
    description: 'Deepening knowledge across sciences, mathematics, languages, and social studies with practical, hands-on learning.',
  },
  {
    icon: '🎓',
    name: 'Junior School',
    grades: 'Grade 7 – 9',
    description: 'Preparing students for the future with specialised subjects, digital skills, and career pathway guidance.',
  },
]

const PORTALS = [
  {
    title: 'Teachers Portal',
    icon: '👨‍🏫',
    description: 'Access lesson plans, submit grades, manage attendance, and communicate with students and parents.',
    accent: 'var(--color-primary)',
    links: ['Lesson Planner', 'Gradebook', 'Attendance', 'Class Reports'],
  },
  {
    title: 'Student Portal',
    icon: '🎓',
    description: 'View your timetable, check assignments and results, access learning resources, and track your progress.',
    accent: 'var(--color-accent)',
    links: ['My Timetable', 'Assignments', 'Exam Results', 'E-Library'],
  },
  {
    title: 'Parents Portal',
    icon: '👨‍👩‍👧',
    description: 'Monitor your child\u2019s attendance and performance, pay fees, and stay connected with teachers and school events.',
    accent: 'var(--color-secondary)',
    links: ['Fee Statement', 'Report Cards', 'School Calendar', 'Contact Teacher'],
  },
]

const app = document.querySelector('#app')
app.innerHTML = `
  <header class="site-header" id="top">
    <div class="header-inner">
      <a href="#top" class="logo">
        <span class="logo-badge">TCBS</span>
        <span class="logo-text">
          <strong>Tiga Community Boarding School</strong>
          <small>Tiga, Nakuru County, Kenya</small>
        </span>
      </a>
      <nav class="main-nav" id="mainNav">
        <a href="#about">About Us</a>
        <a href="#academics">Academics</a>
        <a href="#gallery">Gallery</a>
        <a href="#portals">Portals</a>
        <a href="#contact" class="nav-cta">Contact</a>
      </nav>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <section class="hero" style="background-image: linear-gradient(rgba(20,60,40,0.72), rgba(20,60,40,0.55)), url('${HERO_IMG}')">
    <div class="hero-content">
      <p class="hero-tagline">Empowering minds, building futures</p>
      <h1>Tiga Community Boarding School</h1>
      <p class="hero-subtitle">A centre of excellence in Tiga, Kenya — nurturing confident, creative, and responsible learners through the Competency-Based Curriculum.</p>
      <div class="hero-actions">
        <a href="#academics" class="btn btn-primary">Explore Academics</a>
        <a href="#portals" class="btn btn-outline">Portal Login</a>
      </div>
    </div>
  </section>

  <section class="quick-stats">
    <div class="stat">
      <strong>500+</strong>
      <span>Students</span>
    </div>
    <div class="stat">
      <strong>45</strong>
      <span>Qualified Teachers</span>
    </div>
    <div class="stat">
      <strong>15</strong>
      <span>Years of Service</span>
    </div>
    <div class="stat">
      <strong>98%</strong>
      <span>Transition Rate</span>
    </div>
  </section>

  <section class="section about" id="about">
    <div class="container about-grid">
      <div class="about-image">
        <img src="${ABOUT_IMG}" alt="Community learning activities at TCBS" />
        <div class="about-image-badge">
          <strong>Est. 2011</strong>
          <span>Serving Tiga community</span>
        </div>
      </div>
      <div class="about-text">
        <span class="section-label">About Us</span>
        <h2>Rooted in community, growing towards excellence</h2>
        <p>Tiga Community Boarding School (TCBS) was founded in 2011 to bring quality education to the children of Tiga and surrounding areas in Nakuru County. We believe every child deserves the opportunity to learn in a safe, supportive, and inspiring environment.</p>
        <p>Our dedicated teachers deliver the Kenyan Competency-Based Curriculum (CBC) with a focus on practical skills, critical thinking, and values that prepare learners for a changing world. As a boarding school, we provide a home away from home where students build lifelong friendships and develop independence.</p>
        <div class="values-list">
          <div class="value-item">
            <span class="value-icon">🎯</span>
            <div>
              <strong>Our Mission</strong>
              <p>To provide holistic, quality education that empowers learners to excel academically and become responsible citizens.</p>
            </div>
          </div>
          <div class="value-item">
            <span class="value-icon">👁️</span>
            <div>
              <strong>Our Vision</strong>
              <p>To be a leading centre of academic excellence and character formation in Nakuru County and beyond.</p>
            </div>
          </div>
          <div class="value-item">
            <span class="value-icon">❤️</span>
            <div>
              <strong>Our Values</strong>
              <p>Integrity, excellence, inclusivity, community service, and respect for diversity guide everything we do.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section academics" id="academics">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Academics</span>
        <h2>Learning that grows with your child</h2>
        <p>From early years to junior school, we follow the Kenyan Competency-Based Curriculum, tailored to meet the needs of every learner at each stage of their journey.</p>
      </div>
      <div class="academic-grid">
        ${ACADEMIC_LEVELS.map((level) => `
          <div class="academic-card">
            <div class="academic-icon">${level.icon}</div>
            <h3>${level.name}</h3>
            <span class="academic-grades">${level.grades}</span>
            <p>${level.description}</p>
          </div>
        `).join('')}
      </div>
      <div class="subjects-band">
        <span class="section-label">Core Subjects Offered</span>
        <div class="subject-tags">
          ${['Mathematics', 'English', 'Kiswahili', 'Science & Technology', 'Social Studies', 'Creative Arts', 'Religious Education', 'Computer Studies', 'Agriculture', 'Physical Education'].map((s) => `<span class="subject-tag">${s}</span>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section gallery" id="gallery">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Gallery</span>
        <h2>A glimpse into life at TCBS</h2>
        <p>From classroom learning to community activities, see our students in action.</p>
      </div>
      <div class="gallery-grid">
        ${GALLERY_IMAGES.map((img, i) => `
          <div class="gallery-item ${i === 0 ? 'gallery-item-large' : ''}">
            <img src="${img.url}" alt="${img.alt}" loading="lazy" />
            <div class="gallery-overlay"><span>${img.alt}</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="section portals" id="portals">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Portals</span>
        <h2>Online portals for our school community</h2>
        <p>Access tools and resources tailored for teachers, students, and parents. Sign in to stay connected and informed.</p>
      </div>
      <div class="portal-grid">
        ${PORTALS.map((portal) => `
          <div class="portal-card" style="--portal-accent: ${portal.accent}">
            <div class="portal-icon">${portal.icon}</div>
            <h3>${portal.title}</h3>
            <p>${portal.description}</p>
            <ul class="portal-links">
              ${portal.links.map((link) => `<li>${link}</li>`).join('')}
            </ul>
            <button class="btn btn-portal" data-portal="${portal.title}">Sign In</button>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="section contact" id="contact">
    <div class="container contact-grid">
      <div class="contact-info">
        <span class="section-label">Contact</span>
        <h2>Get in touch with us</h2>
        <p>We welcome enquiries from prospective parents, community members, and partners. Reach out and we will respond promptly.</p>
        <ul class="contact-details">
          <li><span>📍</span> Tiga Trading Centre, Nakuru County, Kenya</li>
          <li><span>📞</span> +254 712 345 678</li>
          <li><span>✉️</span> info@tcbs-tiga.ac.ke</li>
          <li><span>🕘</span> Mon – Fri, 8:00 AM – 4:00 PM</li>
        </ul>
      </div>
      <form class="contact-form" id="contactForm">
        <h3>Send us a message</h3>
        <div class="form-row">
          <input type="text" placeholder="Your name" required />
          <input type="email" placeholder="Email address" required />
        </div>
        <input type="text" placeholder="Subject" required />
        <textarea placeholder="Your message" rows="4" required></textarea>
        <button type="submit" class="btn btn-primary">Send Message</button>
        <p class="form-success" id="formSuccess">Thank you! Your message has been sent. We will get back to you soon.</p>
      </form>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <span class="logo-badge">TCBS</span>
        <p>Tiga Community Boarding School — empowering the children of Tiga through quality education since 2011.</p>
      </div>
      <div class="footer-links">
        <strong>Quick Links</strong>
        <a href="#about">About Us</a>
        <a href="#academics">Academics</a>
        <a href="#gallery">Gallery</a>
        <a href="#portals">Portals</a>
      </div>
      <div class="footer-links">
        <strong>Portals</strong>
        <a href="#portals">Teachers Portal</a>
        <a href="#portals">Student Portal</a>
        <a href="#portals">Parents Portal</a>
      </div>
      <div class="footer-links">
        <strong>Contact</strong>
        <a href="tel:+254712345678">+254 712 345 678</a>
        <a href="mailto:info@tcbs-tiga.ac.ke">info@tcbs-tiga.ac.ke</a>
        <span>Tiga, Nakuru County, Kenya</span>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} Tiga Community Boarding School. All rights reserved.</p>
    </div>
  </footer>
`

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle')
const mainNav = document.getElementById('mainNav')
menuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('nav-open')
  menuToggle.classList.toggle('menu-open')
})
mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('nav-open')
    menuToggle.classList.remove('menu-open')
  })
})

// Header scroll effect
const header = document.querySelector('.site-header')
window.addEventListener('scroll', () => {
  header.classList.toggle('header-scrolled', window.scrollY > 40)
})

// Contact form
const contactForm = document.getElementById('contactForm')
const formSuccess = document.getElementById('formSuccess')
contactForm.addEventListener('submit', (e) => {
  e.preventDefault()
  contactForm.reset()
  formSuccess.classList.add('visible')
  setTimeout(() => formSuccess.classList.remove('visible'), 5000)
})

// Portal sign-in buttons
document.querySelectorAll('.btn-portal').forEach((btn) => {
  btn.addEventListener('click', () => {
    const portal = btn.getAttribute('data-portal')
    if (portal === 'Teachers Portal') window.location.hash = '#login-teacher'
    else if (portal === 'Student Portal') window.location.hash = '#login-student'
    else if (portal === 'Parents Portal') window.location.hash = '#login-parent'
  })
})
}

// Routing
function handleRoute() {
  const hash = window.location.hash
  if (hash === '#admin') {
    renderAdmin()
  } else if (hash === '#login-teacher') {
    renderPortal('teacher')
  } else if (hash === '#login-student') {
    renderPortal('student')
  } else if (hash === '#login-parent') {
    renderPortal('parent')
  } else {
    renderHome()
  }
}

window.addEventListener('hashchange', handleRoute)
handleRoute()
