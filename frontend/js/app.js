/**
 * NEC Sports Event Management & Automation System
 * National Engineering College (Autonomous), Kovilpatti
 *
 * Core Frontend Application Logic (app.js)
 * - Centralized Auth & Session Management (JWT)
 * - Public Dashboard & Leaderboards (Department & Student)
 * - Event Scheduling & Roster Management
 * - Live Attendance Tracking & Sync
 * - Automated On-Duty (OD) Generation Engine & Multi-Department Splitting
 * - Official NEC Autonomous Printable OD Letterheads & Student OD Passes
 * - Notification Center & Real-time Audit Trail
 * - CSV Report Exports
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION & STATE
// ============================================================================
const CONFIG = {
  // Use current origin if served via backend (port 5000), fallback to localhost:5000
  API_BASE: (window.location.port === '5000' || window.location.pathname.startsWith('/api'))
    ? ''
    : 'http://localhost:5000',
  COLLEGE_NAME: 'NATIONAL ENGINEERING COLLEGE',
  COLLEGE_SUB: '(An Autonomous Institution, Affiliated to Anna University, Chennai)',
  COLLEGE_ADDR: 'K.R. Nagar, Kovilpatti – 628 503, Thoothukudi District, Tamil Nadu',
  DEPT_TITLE: 'DEPARTMENT OF PHYSICAL EDUCATION & SPORTS'
};

const STATE = {
  token: localStorage.getItem('nec_sports_token') || null,
  user: JSON.parse(localStorage.getItem('nec_sports_user') || 'null'),
  events: [],
  participants: [],
  odBatches: [],
  notifications: [],
  unreadNotifications: 0,
  attendanceRecords: [],
  selectedEventForAttendance: null,
  deptPoints: [],
  studentPoints: [],
  activePortalTab: 'overview',
  themeMode: localStorage.getItem('nec_sports_theme_mode') || 'light',
  themeColor: localStorage.getItem('nec_sports_theme_color') || '#1e3a8a',
  lang: localStorage.getItem('nec_sports_lang') || 'en',
  commChannel: 'whatsapp',
  commHistory: JSON.parse(localStorage.getItem('nec_sports_comm_history') || '[]'),
  activeNotifFilter: 'all',
  notifSoundEnabled: localStorage.getItem('nec_sports_sound') !== 'false',
  activeConcludeEventId: null,
  activeWhatsAppResult: null,
  activeHODBatch: null
};

// ============================================================================
// 1.05 SEED FALLBACK DATASETS (Leaderboard, Players & Tournaments)
// Guarantees zero-blank UI even when server is starting, offline, or opening via file://
// ============================================================================
const SEED_DEPT_POINTS = [
  { dept: 'CSE', points: 186 },
  { dept: 'ECE', points: 172 },
  { dept: 'IT', points: 158 },
  { dept: 'EEE', points: 141 },
  { dept: 'MECH', points: 126 },
  { dept: 'CIVIL', points: 119 },
  { dept: 'AIDS', points: 104 },
  { dept: 'S&H', points: 88 }
];

const SEED_STUDENT_POINTS = [
  { reg: '24104016', name: 'Bhavana Lakshmi', dept: 'CSE', year: 'III Year', points: 42 },
  { reg: '24104021', name: 'Kavin Raj', dept: 'CSE', year: 'III Year', points: 38 },
  { reg: '24104035', name: 'Ananya S', dept: 'ECE', year: 'II Year', points: 35 },
  { reg: '24104048', name: 'Vishal M', dept: 'IT', year: 'III Year', points: 31 },
  { reg: '24104062', name: 'Divya P', dept: 'EEE', year: 'IV Year', points: 29 },
  { reg: '24104073', name: 'Rahul Kumar', dept: 'MECH', year: 'II Year', points: 27 },
  { reg: '24104081', name: 'Keerthana R', dept: 'CIVIL', year: 'III Year', points: 25 },
  { reg: '24104095', name: 'Arun V', dept: 'AIDS', year: 'I Year', points: 23 },
  { reg: '24104102', name: 'Nivetha S', dept: 'S&H', year: 'I Year', points: 21 },
  { reg: '24104114', name: 'Sanjay K', dept: 'ECE', year: 'III Year', points: 20 },
  { reg: '24104127', name: 'Harish M', dept: 'CSE', year: 'IV Year', points: 18 },
  { reg: '24104139', name: 'Pooja R', dept: 'IT', year: 'II Year', points: 17 }
];

const SEED_EVENTS = [
  { id: 1, name: '100m Running', category: 'Athletics', type: 'Individual', venue: 'College Ground', date: '2026-09-20', time: '09:00 AM', status: 'Open', limit: 40, participantCount: 18, description: 'Annual college athletics 100m sprint competition for men and women.' },
  { id: 2, name: 'Football', category: 'Team Sport', type: 'Team', venue: 'Main Stadium', date: '2026-09-22', time: '03:30 PM', status: 'Open', limit: 60, participantCount: 32, description: 'Inter-departmental 11-a-side football tournament championship trophy.' },
  { id: 3, name: 'Badminton', category: 'Racket', type: 'Individual', venue: 'Indoor Hall', date: '2026-09-24', time: '10:00 AM', status: 'Open', limit: 30, participantCount: 14, description: 'Men and Women singles and doubles badminton knockout matches.' },
  { id: 4, name: 'Basketball', category: 'Team Sport', type: 'Team', venue: 'Indoor Court', date: '2026-09-26', time: '04:00 PM', status: 'Ongoing', limit: 50, participantCount: 28, description: 'Fast-paced 5v5 basketball league tournament with department teams.' },
  { id: 5, name: 'Volleyball', category: 'Team Sport', type: 'Team', venue: 'Volleyball Court', date: '2026-09-28', time: '03:00 PM', status: 'Open', limit: 48, participantCount: 22, description: 'Standard 6v6 departmental volleyball tournament.' },
  { id: 6, name: 'Cricket', category: 'Team Sport', type: 'Team', venue: 'Cricket Ground', date: '2026-09-30', time: '08:30 AM', status: 'Completed', limit: 80, participantCount: 44, description: 'T10 Inter-departmental cricket league matches.' }
];

const SEED_PARTICIPANTS = [
  { id: 1, reg: '24104016', name: 'Bhavana Lakshmi', dept: 'CSE', event: '100m Running', gender: 'Female', status: 'Selected', year: 'III Year' },
  { id: 2, reg: '24104021', name: 'Kavin Raj', dept: 'CSE', event: 'Football', gender: 'Male', status: 'Selected', year: 'III Year' },
  { id: 3, reg: '24104035', name: 'Ananya S', dept: 'ECE', event: 'Badminton', gender: 'Female', status: 'Selected', year: 'II Year' },
  { id: 4, reg: '24104048', name: 'Vishal M', dept: 'IT', event: 'Basketball', gender: 'Male', status: 'Shortlisted', year: 'III Year' },
  { id: 5, reg: '24104062', name: 'Divya P', dept: 'EEE', event: 'Basketball', gender: 'Female', status: 'Selected', year: 'IV Year' },
  { id: 6, reg: '24104073', name: 'Rahul Kumar', dept: 'MECH', event: 'Cricket', gender: 'Male', status: 'Selected', year: 'II Year' },
  { id: 7, reg: '24104081', name: 'Keerthana R', dept: 'CIVIL', event: 'Volleyball', gender: 'Female', status: 'Selected', year: 'III Year' },
  { id: 8, reg: '24104095', name: 'Arun V', dept: 'AIDS', event: 'Football', gender: 'Male', status: 'Shortlisted', year: 'I Year' },
  { id: 9, reg: '24104102', name: 'Nivetha S', dept: 'S&H', event: '100m Running', gender: 'Female', status: 'Selected', year: 'I Year' },
  { id: 10, reg: '24104114', name: 'Sanjay K', dept: 'ECE', event: 'Volleyball', gender: 'Male', status: 'Selected', year: 'III Year' },
  { id: 11, reg: '24104127', name: 'Harish M', dept: 'CSE', event: 'Cricket', gender: 'Male', status: 'Selected', year: 'IV Year' },
  { id: 12, reg: '24104139', name: 'Pooja R', dept: 'IT', event: 'Badminton', gender: 'Female', status: 'Selected', year: 'II Year' }
];

// ============================================================================
// 1.1 MULTI-LINGUAL LOCALIZATION (TAMIL & ENGLISH)
// ============================================================================
const I18N = {
  en: {
    // Header & Global Branding
    app_title: 'NEC Sports Portal — Official Management',
    college_name: 'National Engineering College',
    college_sub: '(An Autonomous Institution, Affiliated to Anna University, Chennai)',
    college_addr: 'K.R. Nagar, Kovilpatti – 628 503, Thoothukudi District, Tamil Nadu',
    dept_sports: 'Department of Physical Education & Sports',
    portal_tagline: 'Department of Physical Education • Official Sports Portal',
    notifications: 'Alerts',
    communication: 'Communication',
    settings: 'Settings',
    logout: 'Logout ➔',
    light_mode: 'Light',
    dark_mode: 'Dark',
    light_theme: 'Light Theme',
    dark_theme: 'Dark Theme',
    theme_mode_label: 'Theme',
    palette_btn: 'Colors',
    colors_btn: 'Colors',
    active_account: 'Active Account',
    events_nav: 'Events',
    verify_od: 'Verify OD Pass',
    portal_login: 'Portal Login ➔',

    // Role Navigation
    my_dashboard: 'My Dashboard',
    staff_dashboard: 'Staff Dashboard',
    admin_dashboard: 'Admin Dashboard',
    auto_od: 'Automatic OD Generator',
    live_attendance: 'Live Attendance',
    manage_events: 'Manage Events',
    participants_roster: 'Participants Roster',
    my_od_passes: 'My OD Passes',
    registered_events: 'Registered Events',
    leaderboards: 'Leaderboards',
    standings: 'Championship Standings',
    od_analytics: 'OD Analytics',
    sports_points: 'Sports Points',
    points_mgmt: 'Points Management',
    user_accounts: 'User Accounts',
    export_reports: 'Export Reports',
    reports_audit: 'Reports & Audit',
    notifications_hub: 'Notification Hub',

    // Overview Tab
    overview_title: 'Sports Portal Overview',
    overview_subtitle: 'Real-time statistics, event schedules, and automated OD processing state.',
    total_events: 'Total Sports Events',
    open_events: 'Open for Registration',
    od_batches: 'Generated OD Batches',
    approved_od: 'Approved OD Requisitions',
    total_points: 'Championship Points',
    my_od_count: 'My Sanctioned ODs',
    my_events_count: 'My Registered Events',
    quick_actions_title: '⚡ Quick Automation Actions',
    quick_actions_desc: 'Direct shortcuts to trigger the On-Duty engine, take live attendance, or export official reports.',
    btn_auto_od: '⚡ Auto-Generate OD',
    btn_take_attendance: '📝 Take Live Attendance',
    btn_schedule_event: '➕ Schedule Event',
    btn_export_csv: '📥 Export CSV Reports',
    institution_info_title: '🏛️ Institution Info',
    institution_lbl: 'Institution:',
    status_lbl: 'Status:',
    dept_lbl: 'Department:',
    academic_year_lbl: 'Academic Year:',
    autonomous_compliance: 'All OD passes generated comply with Autonomous Regulations for sports attendance condonation.',

    // OD Engine Tab
    od_engine_title: 'Automatic On-Duty (OD) Generation Engine',
    od_engine_subtitle: 'Generates official reference-coded OD batches with automatic department splitting and printable letterheads.',
    btn_generate_od_batch: '⚡ Auto-Generate OD Batch',
    search_od_placeholder: 'Search by Ref No, Event, or Venue...',
    filter_all_status: 'All Statuses',
    filter_all_dept: 'All Departments',
    filter_all_categories: 'All Categories',
    col_ref_no: 'Reference No',
    col_event_session: 'Event & Session',
    col_department: 'Department',
    col_total_students: 'Total Students',
    col_workflow_status: 'Workflow Status',
    col_actions: 'Actions',
    students_count_suffix: 'Students',
    no_batches_yet: 'No OD batches generated yet. Click "⚡ Auto-Generate OD Batch" above to create one.',

    // Attendance Tab
    attendance_title: 'Live Event Attendance & 1-Click OD',
    attendance_subtitle: 'Mark trial/match attendance in real-time. Single-click to sanction OD for present students.',
    select_event_attendance: 'Select Sports Event for Attendance: *',
    choose_event_placeholder: '-- Choose Sports Event --',
    btn_all_present: '✓ All Present',
    btn_all_absent: '✗ All Absent',
    col_sno: '#',
    col_reg_no: 'Register No',
    col_student_name: 'Student Name',
    col_year: 'Year',
    col_gender: 'Gender',
    col_attendance_status: 'Attendance Status',
    select_event_prompt: 'Please select an event above to load student roster.',
    no_students_enrolled: 'No students registered for this event yet.',
    btn_save_attendance: '💾 Save Attendance Records',
    btn_save_and_od: '✓ Save & Auto-Generate OD',

    // Events Tab
    events_mgmt_title: 'Events Scheduling & Venue Control',
    events_mgmt_subtitle: 'Manage athletics and team sports tournaments. Rescheduling triggers instant participant notifications.',
    btn_schedule_new_event: '➕ Schedule New Event',
    col_event_name: 'Event Name',
    col_category: 'Category',
    col_schedule: 'Schedule',
    col_venue: 'Venue',
    col_enrolled: 'Enrolled',
    no_events_found: 'No sports events found. Click "➕ Schedule New Event" to create one.',

    // Roster Tab
    roster_title: 'Participants & Athletes Master Roster',
    roster_subtitle: 'View and update candidate qualification status (Selected, Shortlisted, Rejected).',
    col_status: 'Status',
    col_lookup: 'Lookup',
    no_participants_found: 'No participants registered yet.',

    // Student Self-Service Tabs
    my_od_title: 'My Official On-Duty (OD) Passes',
    my_od_subtitle: 'Sanctioned OD passes for your sports participation. Print personal slips for your tutor/HOD.',
    my_events_title: 'My Registered Sports Events',
    my_events_subtitle: 'Review your enrolled events, squad selection, and trial match dates.',
    btn_print_slip: '🖨️ Print Personal OD Slip',
    no_od_records: 'No OD passes sanctioned for your register number yet.',
    no_enrolled_events: 'You have not enrolled in any upcoming sports events yet.',

    // Standings & Leaderboards
    standings_title: 'Department Championship Standings',
    standings_subtitle: 'Live points leaderboard across all 8 academic departments.',
    col_rank: 'Rank',
    col_points: 'Points',

    // OD Analytics
    analytics_title: 'Department-Wise OD Analytics',
    analytics_subtitle: 'Track academic attendance concession balance and sports quotas by department.',

    // Points Management
    points_title: 'Sports Championship Points Awarding',
    points_subtitle: 'Award tournament points to departments and individual athletes with audit log recording.',
    col_current_points: 'Current Points',

    // Reports & Audit
    reports_title: 'Official CSV Reports & Security Audit Trail',
    reports_subtitle: 'Download institutional reports and inspect immutable system audit logs.',
    data_exports_title: 'Institutional Data Exports (CSV)',
    btn_export_members: '📥 Export All Members CSV',
    btn_export_attendance: '📥 Export Attendance CSV',
    btn_export_points: '📥 Export Points CSV',
    btn_export_audit: '📥 Export Audit Log CSV',
    audit_trail_heading: 'System Audit Trail',
    col_timestamp: 'Timestamp',
    col_actor: 'Actor',
    col_action: 'Action',
    col_target: 'Target',
    col_details: 'Details',

    // User Accounts
    users_title: 'System User Accounts',
    users_subtitle: 'Manage PT staff, administrators, and student portal credentials.',
    btn_add_user: '➕ Add User Account',
    col_user_name: 'User Name',
    col_email_reg: 'Email / Reg',
    col_role: 'Role',
    col_created: 'Created',

    // Communication Hub
    comm_hub_title_short: 'Communication Hub',
    comm_hub_title: 'Sports Multi-Channel Communication Hub',
    comm_hub_subtitle: 'Dispatch instant alerts, OD notifications, and match schedules via WhatsApp, Official Email, and SMS.',
    select_channel: 'Select Communication Channel: *',
    channel_whatsapp: 'WhatsApp',
    channel_mail: 'Mail (Email)',
    channel_sms: 'SMS Text',
    target_audience: 'Target Audience / Recipient: *',
    quick_templates: 'Quick Message Templates (Click to fill):',
    message_subject: 'Subject / Notice Title: *',
    message_body: 'Message Content: *',
    quick_dispatch: 'Quick Message Dispatch',
    compose_message: 'Compose Message',
    delivery_log: 'View Dispatched Messages History',
    send_whatsapp: 'Send via WhatsApp',
    send_mail: 'Send via Email',
    send_sms: 'Send via SMS',

    // Settings Hub & Modal
    settings_title: 'Portal Settings & Customization',
    settings_hub_title: 'Portal Settings & Customization',
    settings_hub_subtitle: 'Personalize your visual experience, toggle appearance, choose signature colors, and configure language.',
    appearance_mode: 'Appearance Mode',
    appearance_mode_desc: 'Toggle between clean crisp Light theme and modern glassmorphic Dark theme.',
    theme_colors: 'Sports Theme Colors & Palette',
    theme_colors_desc: 'Choose a signature college sports theme color or select your own custom color. All buttons, highlights, and cards update dynamically!',
    custom_color: 'Pick Any Custom Color',
    custom_color_desc: 'Click the color circle to pick any hex color from the full spectrum.',
    language_selection: 'Language & Multi-lingual Support',
    language_selection_desc: 'Switch entire portal interface between English and தமிழ் (Tamil).',
    comm_preferences: 'Communication Preferences',
    comm_preferences_desc: 'Select preferred dispatch channel for quick messaging shortcuts.',
    reset_defaults: 'Reset to Defaults',
    save_settings: '✓ Save & Close',
    live_preview_title: '👁️ Live Theme Preview',
    live_preview_desc: 'This preview card demonstrates your current theme colors and active typography.',
    btn_primary_sample: 'Primary Button',
    btn_outline_sample: 'Outline Button',
    btn_secondary_sample: 'Secondary',
    badge_active_sample: 'Active Tag',
    badge_approved_sample: 'Approved',
    badge_pending_sample: 'Pending',
    storage_note_1: '✓ Auto-saved to local browser storage.',
    storage_note_2: '✓ Persists across page reloads & sessions.',
    btn_color_studio: '🎨 Open Color Studio (24 Sports Colors)',

    // Color Studio Modal
    color_modal_title: 'Sports Theme Color Studio',
    color_modal_subtitle: 'Choose from 24 signature championship sports colors or pick any custom hex/RGB shade from the full spectrum:',
    spectrum_custom_title: 'Full Spectrum RGB / Hex Color Picker',
    spectrum_custom_desc: 'Click the color circle or type any Hex code. Everything dynamically updates across the entire portal:',
    hex_label: 'HEX:',
    apply_color_btn: 'Apply Color',

    // Google OAuth
    sign_in_google: 'Sign in with Google (@nec.edu.in)',
    or_login_credentials: 'or continue with credentials',
    google_choose_account: 'Choose a Google Account',
    google_to_continue: 'To continue to NEC Sports Portal, select an authorized college Google Workspace account:',
    use_another_account: 'Or enter another Google account:',
    google_connection_title: 'Google Account Connection (OAuth 2.0)',
    google_connection_desc: 'Link your official NEC College Google Account (@nec.edu.in) for 1-click passwordless sign-in and tournament calendar sync.',
    google_account_linked: 'Google Account Connected',
    google_account_not_linked: 'No Google Account Linked',
    connect_google_btn: 'Connect Google Account',
    disconnect_google_btn: 'Disconnect Google',

    // Statuses & Actions
    status_generated: 'Generated',
    status_submitted: 'Submitted to HOD',
    status_hod_approved: 'HOD Approved',
    status_principal: 'Principal Sanctioned',
    status_selected: 'Selected',
    status_shortlisted: 'Shortlisted',
    status_rejected: 'Rejected',
    status_open: 'Open',
    status_ongoing: 'Ongoing',
    status_completed: 'Completed',
    status_present: 'Present',
    status_absent: 'Absent',
    btn_print_od: 'Print Official Letterhead',
    btn_view_roster: 'View Roster',
    btn_update_status: 'Advance Status',
    btn_export_csv_action: 'Export CSV',
    btn_delete_action: 'Delete',
    btn_edit_action: 'Edit',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    close: 'Close',
    success: 'Success',
    error: 'Error'
  },
  ta: {
    // Header & Global Branding
    app_title: 'தேசிய பொறியியல் கல்லூரி • அதிகாரப்பூர்வ விளையாட்டு போர்ட்டல்',
    college_name: 'தேசிய பொறியியல் கல்லூரி',
    college_sub: '(தன்னாட்சி நிறுவனம், அண்ணா பல்கலைக்கழக இணைவு பெற்றது)',
    college_addr: 'கே.ஆர். நகர், கோவில்பட்டி – 628 503, தூத்துக்குடி மாவட்டம், தமிழ்நாடு',
    dept_sports: 'உடற்கல்வி மற்றும் விளையாட்டுத் துறை',
    portal_tagline: 'உடற்கல்வித் துறை • அதிகாரப்பூர்வ விளையாட்டு போர்ட்டல்',
    notifications: 'அறிவிப்புகள்',
    communication: 'தொடர்பு மையம்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு ➔',
    light_mode: 'வெளிச்சம்',
    dark_mode: 'இருட்டு',
    light_theme: 'வெளிச்ச தீம்',
    dark_theme: 'இருண்ட தீம்',
    theme_mode_label: 'தீம்',
    palette_btn: 'வண்ணங்கள்',
    colors_btn: 'வண்ணங்கள்',
    active_account: 'செயலில் உள்ள கணக்கு',
    events_nav: 'போட்டிகள்',
    verify_od: 'OD சரிபார்',
    portal_login: 'உள்நுழைவு ➔',

    // Role Navigation
    my_dashboard: 'எனது டாஷ்போர்டு',
    staff_dashboard: 'பணியாளர் டாஷ்போர்டு',
    admin_dashboard: 'நிர்வாகி டாஷ்போர்டு',
    auto_od: 'தானியங்கி OD உருவாக்குநர்',
    live_attendance: 'நேரலை வருகைப்பதிவு',
    manage_events: 'போட்டி மேலாண்மை',
    participants_roster: 'பங்கேற்பாளர் பட்டியல்',
    my_od_passes: 'எனது OD அனுமதி சீட்டுகள்',
    registered_events: 'பதிவுசெய்த போட்டிகள்',
    leaderboards: 'மதிப்பெண் பட்டியல்',
    standings: 'சாம்பியன்ஷிப் தரவரிசை',
    od_analytics: 'OD பகுப்பாய்வு',
    sports_points: 'விளையாட்டு புள்ளிகள்',
    points_mgmt: 'புள்ளிகள் மேலாண்மை',
    user_accounts: 'பயனர் கணக்குகள்',
    export_reports: 'அறிக்கைகள் பதிவிறக்கு',
    reports_audit: 'அறிக்கைகள் & தணிக்கை',
    notifications_hub: 'அறிவிப்பு & வாட்ஸ்அப் மையம்',

    // Overview Tab
    overview_title: 'விளையாட்டு போர்ட்டல் கண்ணோட்டம்',
    overview_subtitle: 'நிகழ்நேர புள்ளிவிவரங்கள், போட்டி அட்டவணைகள் மற்றும் தானியங்கி OD நிலை.',
    total_events: 'மொத்த விளையாட்டுப் போட்டிகள்',
    open_events: 'பதிவு தொடங்கப்பட்ட போட்டிகள்',
    od_batches: 'உருவாக்கப்பட்ட OD தொகுப்புகள்',
    approved_od: 'ஒப்புதல் பெற்ற OD அனுமதிகள்',
    total_points: 'சாம்பியன்ஷிப் புள்ளிகள்',
    my_od_count: 'எனது OD அனுமதிகள்',
    my_events_count: 'எனது போட்டிகள்',
    quick_actions_title: '⚡ விரைவு ஆட்டோமேஷன் செயல்கள்',
    quick_actions_desc: 'OD உருவாக்குதல், வருகைப்பதிவு மற்றும் அறிக்கைகளுக்கான நேரடி குறுக்குவழிகள்.',
    btn_auto_od: '⚡ தானியங்கி OD உருவாக்கு',
    btn_take_attendance: '📝 நேரலை வருகைப்பதிவு',
    btn_schedule_event: '➕ புதிய போட்டி அமை',
    btn_export_csv: '📥 CSV அறிக்கைகள்',
    institution_info_title: '🏛️ கல்லூரி விபரம்',
    institution_lbl: 'கல்வி நிறுவனம்:',
    status_lbl: 'அங்கீகாரம்:',
    dept_lbl: 'துறை:',
    academic_year_lbl: 'கல்வி ஆண்டு:',
    autonomous_compliance: 'உருவாக்கப்படும் அனைத்து OD சான்றிதழ்களும் அண்ணா பல்கலைக்கழக தன்னாட்சி விதிகளுக்கு உட்பட்டவை.',

    // OD Engine Tab
    od_engine_title: 'தானியங்கி கல்லூரி பணிவிடுப்பு (OD) அனுமதி உருவாக்கம்',
    od_engine_subtitle: 'துறைவாரியான தனித்தனி அதிகாரப்பூர்வ கடிதங்களுடன் குறிப்பு எண் கொண்ட OD தொகுப்புகளை உருவாக்குகிறது.',
    btn_generate_od_batch: '⚡ தானியங்கி OD உருவாக்கு',
    search_od_placeholder: 'குறிப்பு எண், போட்டி அல்லது அரங்கம் கொண்டு தேடுக...',
    filter_all_status: 'அனைத்து நிலைகளும்',
    filter_all_dept: 'அனைத்து துறைகளும்',
    filter_all_categories: 'அனைத்து பிரிவுகளும்',
    col_ref_no: 'குறிப்பு எண்',
    col_event_session: 'போட்டி & அமர்வு',
    col_department: 'துறை',
    col_total_students: 'மொத்த மாணவர்கள்',
    col_workflow_status: 'செயல்முறை நிலை',
    col_actions: 'செயல்கள்',
    students_count_suffix: 'மாணவர்கள்',
    no_batches_yet: 'OD தொகுப்புகள் எதுவும் இதுவரை உருவாக்கப்படவில்லை. மேலே உள்ள "⚡ தானியங்கி OD உருவாக்கு" பொத்தானை அழுத்தவும்.',

    // Attendance Tab
    attendance_title: 'நேரலை வருகைப்பதிவு & 1-கிளிக் OD அனுமதி',
    attendance_subtitle: 'நிகழ்நேரத்தில் மாணவர்களின் வருகையைப் பதிவு செய்து, உடனடி OD அனுமதியை வழங்கவும்.',
    select_event_attendance: 'வருகைப்பதிவிற்கான போட்டியைத் தேர்ந்தெடுக்கவும்: *',
    choose_event_placeholder: '-- போட்டியைத் தேர்ந்தெடுக்கவும் --',
    btn_all_present: '✓ அனைவரும் வந்துள்ளனர்',
    btn_all_absent: '✗ யாரும் வரவில்லை',
    col_sno: '#',
    col_reg_no: 'பதிவு எண்',
    col_student_name: 'மாணவர் பெயர்',
    col_year: 'ஆண்டு',
    col_gender: 'பாலினம்',
    col_attendance_status: 'வருகை நிலை',
    select_event_prompt: 'மாணவர் பட்டியலைக் காண மேலே உள்ள போட்டியைத் தேர்ந்தெடுக்கவும்.',
    no_students_enrolled: 'இந்தப் போட்டிக்கு இதுவரை எந்த மாணவரும் பதிவு செய்யவில்லை.',
    btn_save_attendance: '💾 வருகைப்பதிவை சேமிக்க',
    btn_save_and_od: '✓ சேமித்து OD உருவாக்குக',

    // Events Tab
    events_mgmt_title: 'போட்டி அட்டவணை & மைதானக் கட்டுப்பாடு',
    events_mgmt_subtitle: 'விளையாட்டுப் போட்டிகளை நிர்வகிக்கவும். மாற்றங்கள் உடனடியாக மாணவர்களுக்கு அறிவிக்கப்படும்.',
    btn_schedule_new_event: '➕ புதிய போட்டி அட்டவணை',
    col_event_name: 'போட்டியின் பெயர்',
    col_category: 'பிரிவு',
    col_schedule: 'நேரம் & தேதி',
    col_venue: 'அரங்கம் / மைதானம்',
    col_enrolled: 'பங்கேற்பாளர்கள்',
    no_events_found: 'விளையாட்டுப் போட்டிகள் எதுவும் இல்லை. புதிய போட்டியை உருவாக்க "➕ புதிய போட்டி அட்டவணை" அழுத்தவும்.',

    // Roster Tab
    roster_title: 'விளையாட்டு வீரர்களின் முதன்மை பட்டியல்',
    roster_subtitle: 'மாணவர்களின் தேர்வு நிலையை (தேர்வு, உத்தேசப் பட்டியல், நிராகரிப்பு) புதுப்பிக்கவும்.',
    col_status: 'தேர்வு நிலை',
    col_lookup: 'விபரம்',
    no_participants_found: 'பங்கேற்பாளர்கள் இதுவரை பதிவு செய்யவில்லை.',

    // Student Self-Service Tabs
    my_od_title: 'எனது அதிகாரப்பூர்வ OD அனுமதி சீட்டுகள்',
    my_od_subtitle: 'வகுப்பாசிரியர் மற்றும் துறைத் தலைவரிடம் சமர்ப்பிக்க தனிநபர் அனுமதிச் சீட்டை அச்சிடலாம்.',
    my_events_title: 'நான் பதிவு செய்த விளையாட்டுப் போட்டிகள்',
    my_events_subtitle: 'உங்கள் போட்டிகள், அணித் தேர்வு மற்றும் தேர்வுப் போட்டிகளின் விபரங்கள்.',
    btn_print_slip: '🖨️ தனிநபர் OD சீட்டு அச்சிடு',
    no_od_records: 'உங்கள் பதிவு எண்ணிற்கு இதுவரை OD அனுமதிக்கப்படவில்லை.',
    no_enrolled_events: 'நீங்கள் இதுவரை எந்தப் போட்டிக்கும் பதிவு செய்யவில்லை.',

    // Standings & Leaderboards
    standings_title: 'துறைவாரியான சாம்பியன்ஷிப் தரவரிசை',
    standings_subtitle: 'அனைத்து 8 பொறியியல் துறைகளின் நேரலை புள்ளிகள் பட்டியல்.',
    col_rank: 'வரிசை',
    col_points: 'புள்ளிகள்',

    // OD Analytics
    analytics_title: 'துறைவாரியான OD பகுப்பாய்வு',
    analytics_subtitle: 'துறைவாரியான விளையாட்டு ஒதுக்கீடு மற்றும் வருகை சலுகை விபரங்கள்.',

    // Points Management
    points_title: 'சாம்பியன்ஷிப் புள்ளிகள் வழங்குதல்',
    points_subtitle: 'வெற்றி பெற்ற துறைகளுக்கும் மாணவர்களுக்கும் அதிகாரப்பூர்வ புள்ளிகளை ஒதுக்குங்கள்.',
    col_current_points: 'தற்போதைய புள்ளிகள்',

    // Reports & Audit
    reports_title: 'அதிகாரப்பூர்வ CSV அறிக்கைகள் & பாதுகாப்பு தணிக்கை',
    reports_subtitle: 'கல்லூரி அறிக்கைகளைப் பதிவிறக்கம் செய்து தணிக்கைப் பதிவுகளைப் பார்க்கவும்.',
    data_exports_title: 'கல்லூரி தரவு ஏற்றுமதி (CSV)',
    btn_export_members: '📥 அனைத்து உறுப்பினர்கள் CSV',
    btn_export_attendance: '📥 வருகைப்பதிவு CSV',
    btn_export_points: '📥 புள்ளிகள் CSV',
    btn_export_audit: '📥 தணிக்கைப் பதிவு CSV',
    audit_trail_heading: 'கணினி தணிக்கைப் பதிவுகள்',
    col_timestamp: 'நேரம்',
    col_actor: 'பயனர்',
    col_action: 'செயல்',
    col_target: 'இலக்கு',
    col_details: 'விவரங்கள்',

    // User Accounts
    users_title: 'போர்ட்டல் பயனர் கணக்குகள்',
    users_subtitle: 'உடற்கல்வி ஆசிரியர்கள், நிர்வாகிகள் மற்றும் மாணவர் கணக்குகளை நிர்வகிக்கவும்.',
    btn_add_user: '➕ புதிய பயனர் சேர்க்க',
    col_user_name: 'பயனர் பெயர்',
    col_email_reg: 'மின்னஞ்சல் / பதிவு எண்',
    col_role: 'பொறுப்பு',
    col_created: 'உருவாக்கப்பட்டது',

    // Communication Hub
    comm_hub_title_short: 'தொடர்பு மையம்',
    comm_hub_title: 'விளையாட்டு தொடர்பு மையம் (Communication Hub)',
    comm_hub_subtitle: 'WhatsApp, மின்னஞ்சல், மற்றும் SMS வழியே மாணவர்களுக்கும் துறைத் தலைவர்களுக்கும் உடனடி செய்திகளை அனுப்புங்கள்.',
    select_channel: 'தொடர்பு ஊடகத்தைத் தேர்ந்தெடுக்கவும்: *',
    channel_whatsapp: 'வாட்ஸ்அப் (WhatsApp)',
    channel_mail: 'மின்னஞ்சல் (Mail)',
    channel_sms: 'குறுஞ்செய்தி (SMS)',
    target_audience: 'பெறுநர் / இலக்கு குழு: *',
    quick_templates: 'விரைவு செய்தி வார்ப்புருக்கள் (கிளிக் செய்க):',
    message_subject: 'செய்தி தலைப்பு (Subject): *',
    message_body: 'செய்தி விவரம்: *',
    quick_dispatch: 'உடனடி செய்தி அனுப்புக',
    compose_message: 'செய்தி எழுதுக',
    delivery_log: 'அனுப்பப்பட்ட செய்திகளின் வரலாறு',
    send_whatsapp: 'வாட்ஸ்அப் வழியே அனுப்பு',
    send_mail: 'மின்னஞ்சல் வழியே அனுப்பு',
    send_sms: 'SMS வழியே அனுப்பு',

    // Settings Hub & Modal
    settings_title: 'போர்ட்டல் அமைப்புகள் & தோற்றம்',
    settings_hub_title: 'போர்ட்டல் அமைப்புகள் & தனிப்பயனாக்கம்',
    settings_hub_subtitle: 'உங்கள் விருப்பத்திற்கேற்ப வண்ணங்கள், இருண்ட தீம் மற்றும் மொழியை மாற்றியமைக்கவும்.',
    appearance_mode: 'தோற்ற முறை (Light / Dark)',
    appearance_mode_desc: 'வெளிச்ச தீம் மற்றும் நவீன இருண்ட தீமிற்கு இடையே மாற்றவும்.',
    theme_colors: 'தீம் முதன்மை வண்ணங்கள் & தட்டு',
    theme_colors_desc: 'கல்லூரி விளையாட்டு வண்ணத்தைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் விருப்ப வண்ணத்தை அமைக்கவும். அனைத்து பொத்தான்களும் நிற மாறும்!',
    custom_color: 'விருப்ப நிறம் (Custom Color)',
    custom_color_desc: 'முழு வண்ண நிறமாலையிலிருந்து எந்த நிறத்தையும் எளிதில் தேர்ந்தெடுக்கலாம்.',
    language_selection: 'மொழித் தேர்வு & பலமொழி ஆதரவு',
    language_selection_desc: 'போர்ட்டல் முழுவதையும் ஆங்கிலம் அல்லது தமிழில் மாற்றவும்.',
    comm_preferences: 'தொடர்பு முன்னுரிமை',
    comm_preferences_desc: 'முதன்மையான தொடர்பு ஊடகத்தைத் தேர்ந்தெடுக்கவும்.',
    reset_defaults: 'இயல்பு நிலைக்கு மீட்டமை',
    save_settings: '✓ சேமித்து மூடு',
    live_preview_title: '👁️ நேரலை தோற்ற மாதிரி',
    live_preview_desc: 'இது உங்கள் தற்போதைய வண்ணங்கள் மற்றும் எழுத்துரு மாதிரியைக் காட்டுகிறது.',
    btn_primary_sample: 'முதன்மை பொத்தான்',
    btn_outline_sample: 'பார்டர் பொத்தான்',
    btn_secondary_sample: 'துணைப் பொத்தான்',
    badge_active_sample: 'செயலில் உள்ளது',
    badge_approved_sample: 'ஒப்புதல் பெற்றது',
    badge_pending_sample: 'நிலுவையில் உள்ளது',
    storage_note_1: '✓ தானாக உலாவியில் சேமிக்கப்படுகிறது.',
    storage_note_2: '✓ அடுத்தமுறை திறக்கும்போதும் நீடிக்கும்.',
    btn_color_studio: '🎨 முழு வண்ண தட்டு திறக்க (24 வண்ணங்கள்)',

    // Color Studio Modal
    color_modal_title: 'விளையாட்டு தீம் வண்ண ஸ்டுடியோ',
    color_modal_subtitle: '24 சாம்பியன்ஷிப் வண்ணங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் விருப்ப வண்ணத்தை அமைக்கவும்:',
    spectrum_custom_title: 'முழு நிறமாலை RGB / Hex வண்ணத் தேர்வு',
    spectrum_custom_desc: 'வண்ண வட்டத்தைக் கிளிக் செய்க அல்லது Hex குறியீட்டை உள்ளிடுக. உடனடியாக போர்ட்டல் மாறும்:',
    hex_label: 'Hex குறியீடு:',
    apply_color_btn: 'வண்ணத்தைப் பயன்படுத்து',

    // Google OAuth
    sign_in_google: 'கூகுள் மூலம் உள்நுழைக (@nec.edu.in)',
    or_login_credentials: 'அல்லது உள்நுழைவு விபரம் கொண்டு தொடர்க',
    google_choose_account: 'கூகுள் கணக்கைத் தேர்ந்தெடுக்கவும்',
    google_to_continue: 'NEC விளையாட்டு போர்ட்டலைத் தொடர, அனுமதிக்கப்பட்ட கல்லூரி கூகுள் கணக்கைத் தேர்ந்தெடுக்கவும்:',
    use_another_account: 'அல்லது மற்றொரு கூகுள் மின்னஞ்சலை உள்ளிடவும்:',
    google_connection_title: 'கூகுள் கணக்கு இணைப்பு (Google OAuth 2.0)',
    google_connection_desc: 'கடவுச்சொல் இல்லா 1-கிளிக் உள்நுழைவுக்காக உங்கள் கல்லூரி கூகுள் கணக்கை (@nec.edu.in) இணைக்கவும்.',
    google_account_linked: 'கூகுள் கணக்கு இணைக்கப்பட்டுள்ளது',
    google_account_not_linked: 'கூகுள் கணக்கு இணைக்கப்படவில்லை',
    connect_google_btn: 'கூகுள் கணக்கை இணை',
    disconnect_google_btn: 'கூகுள் இணைப்பை நீக்கு',

    // Statuses & Actions
    status_generated: 'உருவாக்கப்பட்டது',
    status_submitted: 'துறைத்தலைவருக்கு அனுப்பப்பட்டது',
    status_hod_approved: 'HOD ஒப்புதல் அளித்துள்ளார்',
    status_principal: 'முதல்வர் அனுமதித்துள்ளார்',
    status_selected: 'தேர்வு செய்யப்பட்டது',
    status_shortlisted: 'உத்தேசப் பட்டியல்',
    status_rejected: 'நிராகரிக்கப்பட்டது',
    status_open: 'பதிவு திறக்கப்பட்டுள்ளது',
    status_ongoing: 'நடைபெறுகிறது',
    status_completed: 'முடிவடைந்தது',
    status_present: 'வந்துள்ளார்',
    status_absent: 'வரவில்லை',
    btn_print_od: 'அதிகாரப்பூர்வ கடிதம் அச்சிடு',
    btn_view_roster: 'பட்டியல் பார்',
    btn_update_status: 'நிலையை மாற்று',
    btn_export_csv_action: 'CSV பதிவிறக்கு',
    btn_delete_action: 'நீக்கு',
    btn_edit_action: 'திருத்து',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    submit: 'சமர்ப்பி',
    close: 'மூடு',
    success: 'வெற்றி',
    error: 'பிழை'
  }
};

function t(key, fallback = '') {
  const lang = STATE.lang || 'en';
  return (I18N[lang] && I18N[lang][key]) || (I18N['en'] && I18N['en'][key]) || fallback || key;
}

function translateStatus(status) {
  if (!status) return '';
  const map = {
    'Generated': t('status_generated', 'Generated'),
    'Submitted to HOD': t('status_submitted', 'Submitted to HOD'),
    'HOD Approved': t('status_hod_approved', 'HOD Approved'),
    'Principal Sanctioned': t('status_principal', 'Principal Sanctioned'),
    'Approved': t('status_hod_approved', 'Approved'),
    'Granted': t('status_hod_approved', 'Granted'),
    'Selected': t('status_selected', 'Selected'),
    'Shortlisted': t('status_shortlisted', 'Shortlisted'),
    'Rejected': t('status_rejected', 'Rejected'),
    'Open': t('status_open', 'Open'),
    'Ongoing': t('status_ongoing', 'Ongoing'),
    'Completed': t('status_completed', 'Completed'),
    'Present': t('status_present', 'Present'),
    'Absent': t('status_absent', 'Absent')
  };
  return map[status] || status;
}

function applyLanguage(lang) {
  STATE.lang = lang;
  localStorage.setItem('nec_sports_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) el.textContent = translation;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation) el.placeholder = translation;
  });

  const langLabel = document.getElementById('current-lang-label');
  if (langLabel) {
    langLabel.textContent = lang === 'ta' ? 'English' : 'தமிழ்';
  }

  const langEnRadio = document.getElementById('lang-en');
  const langTaRadio = document.getElementById('lang-ta');
  if (langEnRadio && langTaRadio) {
    langEnRadio.checked = lang === 'en';
    langTaRadio.checked = lang === 'ta';
  }
  const tabLangEnRadio = document.getElementById('tab-lang-en');
  const tabLangTaRadio = document.getElementById('tab-lang-ta');
  if (tabLangEnRadio && tabLangTaRadio) {
    tabLangEnRadio.checked = lang === 'en';
    tabLangTaRadio.checked = lang === 'ta';
  }

  if (typeof renderRoleNavigation === 'function' && STATE.user) {
    renderRoleNavigation();
  }
  if (typeof renderUserHeader === 'function' && STATE.user) {
    renderUserHeader();
  }

  // RE-RENDER CURRENT VIEW IMMEDIATELY INTO SELECTED LANGUAGE
  if (STATE.user && typeof switchPortalTab === 'function' && STATE.activePortalTab) {
    switchPortalTab(STATE.activePortalTab);
  } else if (typeof loadPublicEvents === 'function' && document.getElementById('public-events-grid')) {
    loadPublicEvents();
    loadLeaderboards();
  }
}

function toggleLanguage() {
  const currentLang = STATE.lang || 'en';
  const newLang = currentLang === 'en' ? 'ta' : 'en';
  applyLanguage(newLang);
  showToast(
    newLang === 'ta' ? 'தமிழ் மொழி முழுமையாக இயக்கப்பட்டது' : 'English language fully activated',
    'success',
    2000
  );
}

// ============================================================================
// 1.2 THEME ENGINE & 24-COLOR SPORTS STUDIO PALETTE
// ============================================================================
const SPORTS_COLOR_PALETTES = [
  {
    category: 'Institutional & Blues',
    categoryTa: 'கல்லூரி & நீல வண்ணங்கள்',
    colors: [
      { name: 'NEC Royal Blue', nameTa: 'NEC ராயல் நீலம்', hex: '#1e3a8a' },
      { name: 'Cobalt Blue', nameTa: 'கோபால்ட் நீலம்', hex: '#2563eb' },
      { name: 'Anna Univ Navy', nameTa: 'அண்ணா பல்கலை நேவி', hex: '#1d4ed8' },
      { name: 'Oceanic Teal', nameTa: 'பெருங்கடல் டீல்', hex: '#0e7490' }
    ]
  },
  {
    category: 'Championship Golds & Oranges',
    categoryTa: 'சாம்பியன்ஷிப் தங்கம் & ஆரஞ்சு',
    colors: [
      { name: 'Olympic Gold', nameTa: 'ஒலிம்பிக் தங்கம்', hex: '#d97706' },
      { name: 'Trophy Amber', nameTa: 'கோப்பை ஆம்பர்', hex: '#f59e0b' },
      { name: 'Blaze Orange', nameTa: 'சுடர் ஆரஞ்சு', hex: '#ea580c' },
      { name: 'Bronze Medal', nameTa: 'வெண்கலம்', hex: '#b45309' }
    ]
  },
  {
    category: 'Victory Turf & Greens',
    categoryTa: 'வெற்றி மைதானப் பச்சை',
    colors: [
      { name: 'Stadium Turf', nameTa: 'அரங்கப் புல்வெளி', hex: '#059669' },
      { name: 'Emerald Victory', nameTa: 'மரகதப் பச்சை', hex: '#10b981' },
      { name: 'Forest Green', nameTa: 'அடர் காடு பச்சை', hex: '#15803d' },
      { name: 'Mint Teal', nameTa: 'புதினா டீல்', hex: '#0d9488' }
    ]
  },
  {
    category: 'Power Crimson & Reds',
    categoryTa: 'ஆற்றல் சிவப்பு & ரோஸ்',
    colors: [
      { name: 'Track Crimson', nameTa: 'ஓட்டப்பந்தய சிவப்பு', hex: '#dc2626' },
      { name: 'Stadium Rose', nameTa: 'அரங்க ரோஸ்', hex: '#e11d48' },
      { name: 'Ruby Flame', nameTa: 'மாணிக்க சிவப்பு', hex: '#be123c' },
      { name: 'Vibrant Magenta', nameTa: 'மெஜந்தா நிறம்', hex: '#be185d' }
    ]
  },
  {
    category: 'Athletic Violets & Indigos',
    categoryTa: 'விளையாட்டு ஊதா & இண்டிகோ',
    colors: [
      { name: 'Cyber Violet', nameTa: 'சைபர் ஊதா', hex: '#7c3aed' },
      { name: 'Indigo Sprint', nameTa: 'இண்டிகோ ஸ்பிரிண்ட்', hex: '#4338ca' },
      { name: 'Deep Purple', nameTa: 'அடர் ஊதா', hex: '#6d28d9' },
      { name: 'Electric Lavender', nameTa: 'லாவெண்டர்', hex: '#8b5cf6' }
    ]
  },
  {
    category: 'Modern Stealth & Slates',
    categoryTa: 'நவீன ஸ்டெல்த் & ஸ்லேட்',
    colors: [
      { name: 'Titanium Slate', nameTa: 'டைட்டானியம் ஸ்லேட்', hex: '#334155' },
      { name: 'Carbon Onyx', nameTa: 'கார்பன் ஓனிக்ஸ்', hex: '#1e293b' },
      { name: 'Pitch Black', nameTa: 'நைட் பிளாக்', hex: '#0f172a' },
      { name: 'Army Olive', nameTa: 'ஆலிவ் பச்சை', hex: '#3f6212' }
    ]
  }
];

function renderColorStudioGrid(containerId = 'modal-color-studio-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentTheme = (STATE.themeColor || '#1e3a8a').toLowerCase();
  const isTa = STATE.lang === 'ta';

  container.innerHTML = SPORTS_COLOR_PALETTES.map(cat => `
    <div class="color-category-group">
      <div class="color-category-title">
        <span>⚽</span>
        <span>${isTa ? cat.categoryTa : cat.category}</span>
      </div>
      <div class="color-panel-grid">
        ${cat.colors.map(c => {
          const isActive = c.hex.toLowerCase() === currentTheme;
          return `
            <div class="color-swatch-chip ${isActive ? 'active' : ''}" data-color="${c.hex}" onclick="applyThemeColor('${c.hex}')" title="${isTa ? c.nameTa : c.name} (${c.hex})">
              <div class="color-swatch-bubble" style="background: ${c.hex};">
                ${isActive ? '✓' : ''}
              </div>
              <div class="color-swatch-info">
                <span class="color-swatch-label">${isTa ? c.nameTa : c.name}</span>
                <span class="color-swatch-hex">${c.hex.toUpperCase()}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function openColorPaletteModal() {
  renderColorStudioGrid('modal-color-studio-container');
  applyThemeColor(STATE.themeColor || '#1e3a8a');
  openModal('color-palette-modal');
}

function handleHexInput(val) {
  if (!val) return;
  val = val.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    applyThemeColor(val);
  }
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function generateColorShades(hexColor) {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h = hsl.h, s = hsl.s;

  return {
    p900: `hsl(${h}, ${Math.min(s, 70)}%, 14%)`,
    p800: hexColor,
    p700: `hsl(${h}, ${Math.min(s + 5, 90)}%, 42%)`,
    p600: `hsl(${h}, ${Math.min(s + 10, 95)}%, 52%)`,
    p500: `hsl(${h}, ${Math.min(s + 15, 95)}%, 62%)`,
    p100: `hsl(${h}, ${Math.max(s - 15, 40)}%, 92%)`,
    p50:  `hsl(${h}, ${Math.max(s - 25, 30)}%, 97%)`,
    glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`
  };
}

function applyThemeColor(hexColor) {
  if (!hexColor) hexColor = '#1e3a8a';
  STATE.themeColor = hexColor;
  localStorage.setItem('nec_sports_theme_color', hexColor);

  const shades = generateColorShades(hexColor);
  const root = document.documentElement;
  root.style.setProperty('--primary-900', shades.p900);
  root.style.setProperty('--primary-800', shades.p800);
  root.style.setProperty('--primary-700', shades.p700);
  root.style.setProperty('--primary-600', shades.p600);
  root.style.setProperty('--primary-500', shades.p500);
  root.style.setProperty('--primary-100', shades.p100);
  root.style.setProperty('--primary-50', shades.p50);
  root.style.setProperty('--primary-glow', shades.glow);
  root.style.setProperty('--border-focus', shades.p500);

  // Update active swatch items & studio chips
  document.querySelectorAll('.color-swatch-item, .color-swatch-chip').forEach(swatch => {
    const col = swatch.getAttribute('data-color');
    const isActive = col && col.toLowerCase() === hexColor.toLowerCase();
    swatch.classList.toggle('active', isActive);
    const dot = swatch.querySelector('.color-swatch-dot, .color-swatch-bubble');
    if (dot) dot.textContent = isActive ? '✓' : '';
  });

  // Sync color inputs
  const settingsInput = document.getElementById('settings-custom-color');
  if (settingsInput) settingsInput.value = hexColor;
  const tabInput = document.getElementById('tab-custom-color');
  if (tabInput) tabInput.value = hexColor;
  const modalColorInput = document.getElementById('modal-custom-color');
  if (modalColorInput) modalColorInput.value = hexColor;
  const modalHexInput = document.getElementById('modal-hex-input');
  if (modalHexInput) modalHexInput.value = hexColor.toUpperCase();
  const activeHexLabel = document.getElementById('active-hex-label');
  if (activeHexLabel) activeHexLabel.textContent = hexColor.toUpperCase();

  // Update live shade strip
  const strip = document.getElementById('modal-live-shade-strip');
  if (strip) {
    strip.innerHTML = `
      <div style="background: ${shades.p900};" title="p900: ${shades.p900}"></div>
      <div style="background: ${shades.p800};" title="p800: ${shades.p800}"></div>
      <div style="background: ${shades.p700};" title="p700: ${shades.p700}"></div>
      <div style="background: ${shades.p600};" title="p600: ${shades.p600}"></div>
      <div style="background: ${shades.p500};" title="p500: ${shades.p500}"></div>
      <div style="background: ${shades.p100};" title="p100: ${shades.p100}"></div>
      <div style="background: ${shades.p50};" title="p50: ${shades.p50}"></div>
    `;
  }

  // Update preview boxes
  ['theme-preview-box', 'tab-theme-preview-box', 'modal-theme-preview-box'].forEach(id => {
    const box = document.getElementById(id);
    if (box) {
      box.style.borderColor = hexColor;
      const btn = box.querySelector('.btn-primary');
      if (btn) btn.style.background = hexColor;
    }
  });
}

function applyThemeMode(mode) {
  STATE.themeMode = mode;
  localStorage.setItem('nec_sports_theme_mode', mode);

  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-theme');
  }

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('.theme-toggle-icon');
    const label = toggleBtn.querySelector('.theme-toggle-label');
    if (icon) icon.textContent = mode === 'dark' ? '☀️' : '🌙';
    if (label) {
      label.setAttribute('data-i18n', mode === 'dark' ? 'light_mode' : 'dark_mode');
      label.textContent = mode === 'dark' ? t('light_mode', 'Light') : t('dark_mode', 'Dark');
    }
  }

  ['theme-mode-light', 'tab-theme-mode-light'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = mode === 'light';
  });
  ['theme-mode-dark', 'tab-theme-mode-dark'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = mode === 'dark';
  });
}

function toggleThemeMode() {
  const newMode = STATE.themeMode === 'dark' ? 'light' : 'dark';
  applyThemeMode(newMode);
  showToast(
    newMode === 'dark' ? (STATE.lang === 'ta' ? '🌙 இருண்ட தீம் இயக்கப்பட்டது' : '🌙 Dark mode activated') : (STATE.lang === 'ta' ? '☀️ வெளிச்ச தீம் இயக்கப்பட்டது' : '☀️ Light mode activated'),
    'info',
    1800
  );
}

function initThemeAndLocalization() {
  const savedMode = localStorage.getItem('nec_sports_theme_mode') || 'light';
  const savedColor = localStorage.getItem('nec_sports_theme_color') || '#1e3a8a';
  const savedLang = localStorage.getItem('nec_sports_lang') || 'en';

  applyThemeMode(savedMode);
  applyThemeColor(savedColor);
  applyLanguage(savedLang);
}

// ============================================================================
// 1.3 COMMUNICATION HUB ENGINE (WhatsApp, Mail, SMS)
// ============================================================================
function openCommunicationModal() {
  populateCommTargetOptions('comm-target-sub-select');
  updateCommPreview();
  renderCommHistoryList('comm-history-list', 'comm-history-count');
  openModal('communication-modal');
}

function setCommChannel(channel) {
  STATE.commChannel = channel;

  document.querySelectorAll('.comm-channel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-channel') === channel);
  });

  const sendBtn = document.getElementById('comm-send-btn');
  if (sendBtn) {
    sendBtn.className = `btn btn-${channel}`;
    if (channel === 'whatsapp') {
      sendBtn.innerHTML = '🚀 ' + t('send_whatsapp', 'Send via WhatsApp');
    } else if (channel === 'mail') {
      sendBtn.innerHTML = '✉️ ' + t('send_mail', 'Send via Email');
    } else if (channel === 'sms') {
      sendBtn.innerHTML = '📱 ' + t('send_sms', 'Send via SMS');
    }
  }

  const tabSendBtn = document.getElementById('tab-comm-send-btn');
  if (tabSendBtn) {
    tabSendBtn.className = `btn btn-${channel}`;
    if (channel === 'whatsapp') {
      tabSendBtn.innerHTML = '🚀 ' + t('send_whatsapp', 'Send via WhatsApp');
    } else if (channel === 'mail') {
      tabSendBtn.innerHTML = '✉️ ' + t('send_mail', 'Send via Email');
    } else if (channel === 'sms') {
      tabSendBtn.innerHTML = '📱 ' + t('send_sms', 'Send via SMS');
    }
  }

  updateCommPreview();
  updateTabCommPreview();
}

function populateCommTargetOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const events = STATE.events || [];
  let html = `<optgroup label="Scheduled Sports Events">`;
  if (events.length > 0) {
    events.forEach(e => {
      html += `<option value="event:${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`;
    });
  } else {
    html += `<option value="event:Annual Football Championship">Annual Football Championship</option>`;
    html += `<option value="event:Inter-Dept Basketball Open">Inter-Dept Basketball Open</option>`;
    html += `<option value="event:100m Athletics Meet">100m Athletics Meet</option>`;
  }
  html += `</optgroup>`;

  html += `<optgroup label="Academic Departments">`;
  ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'S&H'].forEach(dept => {
    html += `<option value="dept:${dept}">Department of ${dept}</option>`;
  });
  html += `</optgroup>`;

  select.innerHTML = html;
}

function handleCommTargetChange() {
  const targetType = document.getElementById('comm-target-type').value;
  const subGroup = document.getElementById('comm-target-sub-group');
  const directFields = document.getElementById('comm-direct-fields');

  if (targetType === 'direct') {
    if (subGroup) subGroup.style.display = 'none';
    if (directFields) directFields.style.display = 'grid';
  } else if (targetType === 'all' || targetType === 'hod') {
    if (subGroup) subGroup.style.display = 'none';
    if (directFields) directFields.style.display = 'none';
  } else {
    if (subGroup) subGroup.style.display = 'block';
    if (directFields) directFields.style.display = 'none';
  }
  updateCommPreview();
}

function handleTabCommTargetChange() {
  const targetType = document.getElementById('tab-comm-target-type').value;
  const subGroup = document.getElementById('tab-comm-target-sub-group');
  const directFields = document.getElementById('tab-comm-direct-fields');

  if (targetType === 'direct') {
    if (subGroup) subGroup.style.display = 'none';
    if (directFields) directFields.style.display = 'grid';
  } else if (targetType === 'all' || targetType === 'hod') {
    if (subGroup) subGroup.style.display = 'none';
    if (directFields) directFields.style.display = 'none';
  } else {
    if (subGroup) subGroup.style.display = 'block';
    if (directFields) directFields.style.display = 'none';
  }
  updateTabCommPreview();
}

function applyCommTemplate(tplKey) {
  const subInput = document.getElementById('comm-subject');
  const msgInput = document.getElementById('comm-message');
  if (!msgInput) return;

  const templates = getCommTemplates();
  const tpl = templates[tplKey];
  if (tpl) {
    if (subInput) subInput.value = tpl.subject;
    msgInput.value = tpl.body;
    updateCommPreview();
  }
}

function applyTabCommTemplate(tplKey) {
  const subInput = document.getElementById('tab-comm-subject');
  const msgInput = document.getElementById('tab-comm-message');
  if (!msgInput) return;

  const templates = getCommTemplates();
  const tpl = templates[tplKey];
  if (tpl) {
    if (subInput) subInput.value = tpl.subject;
    msgInput.value = tpl.body;
    updateTabCommPreview();
  }
}

function getCommTemplates() {
  const isTa = STATE.lang === 'ta';
  return {
    od_approved: {
      subject: isTa
        ? 'NEC விளையாட்டு: அதிகாரப்பூர்வ தற்காலிக அனுமதி (OD) உறுதிப்படுத்தல்'
        : 'NEC Sports: Official On-Duty (OD) Pass Sanctioned',
      body: isTa
        ? 'அன்பான விளையாட்டு வீரரே, உங்கள் விளையாட்டுப் போட்டிக்கான தற்காலிக அனுமதி (OD) உடற்கல்வித் துறையால் அதிகாரப்பூர்வமாக அனுமதிக்கப்பட்டுள்ளது. உங்கள் மாணவர் போர்ட்டலில் உள்நுழைந்து OD சீட்டைப் பதிவிறக்கிக் கொள்ளலாம்.'
        : 'Dear Athlete, Your On-Duty (OD) pass for sports participation has been officially sanctioned by the Department of Physical Education. You can download or print your personal OD pass from the student portal.'
    },
    trial_invitation: {
      subject: isTa
        ? 'NEC விளையாட்டு: கல்லூரி அணி தேர்வுப் போட்டி அழைப்பு'
        : 'NEC Sports: College Team Selection Trial Call-Letter',
      body: isTa
        ? 'வாழ்த்துகள்! நீங்கள் தேசிய பொறியியல் கல்லூரி விளையாட்டு அணிக்கான தேர்வுப் போட்டிக்குத் தேர்ந்தெடுக்கப்பட்டுள்ளீர்கள். சரியான விளையாட்டு உடையில் கல்லூரி விளையாட்டு மைதானத்தில் காலை 6:30 மணிக்கு ஆஜராகுமாறு கேட்டுக்கொள்ளப்படுகிறீர்கள்.'
        : 'Congratulations! You have been shortlisted for National Engineering College sports team selection trials. Report at the College Sports Complex at 6:30 AM in proper sports kit.'
    },
    schedule_alert: {
      subject: isTa
        ? 'NEC விளையாட்டு: போட்டி அட்டவணை & ஆடுகள அறிவிப்பு'
        : 'NEC Sports: Upcoming Match Schedule & Reporting Notice',
      body: isTa
        ? 'அறிவிப்பு: வரவிருக்கும் விளையாட்டுப் போட்டி திட்டமிடப்பட்டுள்ளது. போட்டி தொடங்குவதற்கு 30 நிமிடங்களுக்கு முன்பாக அனைத்து விளையாட்டு வீரர்களும் மைதானத்திற்கு வர வேண்டும்.'
        : 'Notice: Your scheduled sports tournament fixture has been confirmed. All athletes and team members are requested to report to the venue 30 minutes prior to match time.'
    },
    reschedule_notice: {
      subject: isTa
        ? 'அவசர அறிவிப்பு: விளையாட்டுப் போட்டி மறுஅட்டவணை'
        : 'Urgent Alert: Sports Fixture Rescheduled',
      body: isTa
        ? 'அவசர தகவல்: மைதான பராமரிப்பு மற்றும் வானிலை காரணமாக இன்றைய போட்டி தற்காலிகமாக ஒத்திவைக்கப்பட்டுள்ளது. புதிய அட்டவணை விரைவில் போர்ட்டலில் அறிவிக்கப்படும்.'
        : 'Urgent Notice: Due to ground maintenance and weather conditions, today\'s scheduled match has been postponed. The revised fixture date will be notified shortly.'
    },
    trophy_points: {
      subject: isTa
        ? 'NEC சாம்பியன்ஷிப்: வரலாற்று வெற்றி & புள்ளிகள் அறிவிப்பு'
        : 'NEC Sports: Championship Points Awarded',
      body: isTa
        ? 'அபாரமான ஆட்டத்தை வெளிப்படுத்திய நமது கல்லூரி வீரர்களுக்கு பாராட்டுகள்! தங்களின் சாதனைக்காக துறைக்கு சாம்பியன்ஷிப் புள்ளிகள் வழங்கப்பட்டுள்ளன.'
        : 'Hearty congratulations to the team! For your outstanding sports performance, championship trophy points have been officially awarded to your department on the leaderboard.'
    }
  };
}

function updateCommPreview() {
  const previewBody = document.getElementById('comm-preview-body');
  const previewTitle = document.getElementById('comm-preview-title');
  const charCounter = document.getElementById('comm-char-counter');
  const msgInput = document.getElementById('comm-message');
  const subInput = document.getElementById('comm-subject');
  if (!previewBody) return;

  const msg = msgInput ? msgInput.value.trim() : '';
  const sub = subInput ? subInput.value.trim() : 'Sports Notice';
  const channel = STATE.commChannel || 'whatsapp';

  if (charCounter) {
    charCounter.textContent = `${msg.length} characters ${channel === 'sms' ? `(${Math.ceil(msg.length / 160) || 1} SMS)` : ''}`;
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (channel === 'whatsapp') {
    if (previewTitle) previewTitle.textContent = '🟢 WhatsApp Chat Live Preview';
    previewBody.innerHTML = `
      <div class="whatsapp-chat-bubble">
        <div style="font-weight: 700; font-size: 0.825rem; color: #075e54; margin-bottom: 0.25rem;">${escapeHtml(sub)}</div>
        <div>${escapeHtml(msg || 'Message text preview will appear here...')}</div>
        <div class="msg-time"><span>${timeStr}</span> <span>✓✓</span></div>
      </div>
    `;
  } else if (channel === 'mail') {
    if (previewTitle) previewTitle.textContent = '✉️ Email Client Live Preview';
    const emailTo = document.getElementById('comm-recipient-email')?.value || 'student@nec.edu.in';
    previewBody.innerHTML = `
      <div class="mail-preview-card">
        <div class="mail-meta-line"><strong>From:</strong> sportsdept@nec.edu.in (Physical Education)</div>
        <div class="mail-meta-line"><strong>To:</strong> ${escapeHtml(emailTo)}</div>
        <div class="mail-meta-line"><strong>Subject:</strong> ${escapeHtml(sub)}</div>
        <div class="mail-body-content">${escapeHtml(msg || 'Email body text preview...')}</div>
      </div>
    `;
  } else if (channel === 'sms') {
    if (previewTitle) previewTitle.textContent = '📱 Mobile SMS Live Preview';
    previewBody.innerHTML = `
      <div class="sms-preview-bubble">
        <div style="font-size: 0.75rem; opacity: 0.85; margin-bottom: 0.2rem;">NEC-SPORTS</div>
        <div>${escapeHtml(msg || 'SMS notification preview...')}</div>
        <div style="font-size: 0.65rem; text-align: right; opacity: 0.75; margin-top: 0.25rem;">${timeStr}</div>
      </div>
    `;
  }
}

function updateTabCommPreview() {
  const previewBody = document.getElementById('tab-comm-preview-body');
  const previewTitle = document.getElementById('tab-comm-preview-title');
  const charCounter = document.getElementById('tab-comm-char-counter');
  const msgInput = document.getElementById('tab-comm-message');
  const subInput = document.getElementById('tab-comm-subject');
  if (!previewBody) return;

  const msg = msgInput ? msgInput.value.trim() : '';
  const sub = subInput ? subInput.value.trim() : 'Sports Notice';
  const channel = STATE.commChannel || 'whatsapp';

  if (charCounter) {
    charCounter.textContent = `${msg.length} characters ${channel === 'sms' ? `(${Math.ceil(msg.length / 160) || 1} SMS)` : ''}`;
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (channel === 'whatsapp') {
    if (previewTitle) previewTitle.textContent = '🟢 WhatsApp Live Preview';
    previewBody.innerHTML = `
      <div class="whatsapp-chat-bubble">
        <div style="font-weight: 700; font-size: 0.825rem; color: #075e54; margin-bottom: 0.25rem;">${escapeHtml(sub)}</div>
        <div>${escapeHtml(msg || 'Message text preview will appear here...')}</div>
        <div class="msg-time"><span>${timeStr}</span> <span>✓✓</span></div>
      </div>
    `;
  } else if (channel === 'mail') {
    if (previewTitle) previewTitle.textContent = '✉️ Email Client Live Preview';
    const emailTo = document.getElementById('tab-comm-recipient-email')?.value || 'student@nec.edu.in';
    previewBody.innerHTML = `
      <div class="mail-preview-card">
        <div class="mail-meta-line"><strong>From:</strong> sportsdept@nec.edu.in (Physical Education)</div>
        <div class="mail-meta-line"><strong>To:</strong> ${escapeHtml(emailTo)}</div>
        <div class="mail-meta-line"><strong>Subject:</strong> ${escapeHtml(sub)}</div>
        <div class="mail-body-content">${escapeHtml(msg || 'Email body text preview...')}</div>
      </div>
    `;
  } else if (channel === 'sms') {
    if (previewTitle) previewTitle.textContent = '📱 Mobile SMS Live Preview';
    previewBody.innerHTML = `
      <div class="sms-preview-bubble">
        <div style="font-size: 0.75rem; opacity: 0.85; margin-bottom: 0.2rem;">NEC-SPORTS</div>
        <div>${escapeHtml(msg || 'SMS notification preview...')}</div>
        <div style="font-size: 0.65rem; text-align: right; opacity: 0.75; margin-top: 0.25rem;">${timeStr}</div>
      </div>
    `;
  }
}

function sendCommunicationMessage() {
  const channel = STATE.commChannel || 'whatsapp';
  const targetType = document.getElementById('comm-target-type')?.value || 'direct';
  const sub = document.getElementById('comm-subject')?.value.trim() || 'NEC Sports Alert';
  const msg = document.getElementById('comm-message')?.value.trim();
  const phone = document.getElementById('comm-recipient-phone')?.value.trim() || '9876543210';
  const email = document.getElementById('comm-recipient-email')?.value.trim() || 'sports@nec.edu.in';

  if (!msg) {
    showToast(STATE.lang === 'ta' ? 'தயவுசெய்து செய்தி விவரத்தை உள்ளிடவும்' : 'Please enter message content.', 'warning');
    return;
  }

  executeCommDispatch(channel, targetType, sub, msg, phone, email);
  closeModal('communication-modal');
}

function sendTabCommunication() {
  const channel = STATE.commChannel || 'whatsapp';
  const targetType = document.getElementById('tab-comm-target-type')?.value || 'direct';
  const sub = document.getElementById('tab-comm-subject')?.value.trim() || 'NEC Sports Alert';
  const msg = document.getElementById('tab-comm-message')?.value.trim();
  const phone = document.getElementById('tab-comm-recipient-phone')?.value.trim() || '9876543210';
  const email = document.getElementById('tab-comm-recipient-email')?.value.trim() || 'sports@nec.edu.in';

  if (!msg) {
    showToast(STATE.lang === 'ta' ? 'தயவுசெய்து செய்தி விவரத்தை உள்ளிடவும்' : 'Please enter message content.', 'warning');
    return;
  }

  executeCommDispatch(channel, targetType, sub, msg, phone, email);
}

function executeCommDispatch(channel, targetType, subject, message, phone, email) {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

  let recipientLabel = phone;
  if (targetType === 'direct') {
    recipientLabel = channel === 'mail' ? email : `+${cleanPhone}`;
  } else if (targetType === 'all') {
    recipientLabel = 'All Registered Athletes (Broadcast)';
  } else if (targetType === 'hod') {
    recipientLabel = 'Department HODs & Tutors';
  } else {
    recipientLabel = targetType;
  }

  if (channel === 'whatsapp') {
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`*${subject}*\n\n${message}\n\n— Department of Physical Education, NEC Kovilpatti`)}`;
    window.open(waUrl, '_blank');
    showToast(`✓ WhatsApp opened for ${recipientLabel}`, 'success', 3000);
  } else if (channel === 'mail') {
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + '\n\nWith regards,\nDepartment of Physical Education\nNational Engineering College (Autonomous), Kovilpatti')}`;
    window.location.href = mailtoUrl;
    showToast(`✓ Email client opened for ${recipientLabel}`, 'success', 3000);
  } else if (channel === 'sms') {
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(`${subject}: ${message}`)}`;
    window.location.href = smsUrl;
    showToast(`✓ SMS prepared for ${recipientLabel}`, 'success', 3000);
  }

  const record = {
    id: Date.now(),
    channel,
    recipient: recipientLabel,
    subject,
    message: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
    timestamp: new Date().toISOString(),
    status: 'Sent / Dispatched'
  };

  if (!STATE.commHistory) STATE.commHistory = [];
  STATE.commHistory.unshift(record);
  localStorage.setItem('nec_sports_comm_history', JSON.stringify(STATE.commHistory));

  const newNotif = {
    _id: 'comm-' + Date.now(),
    title: `[${channel.toUpperCase()}] ${subject}`,
    body: message,
    type: 'announcement',
    date: new Date().toISOString()
  };
  if (!STATE.notifications) STATE.notifications = [];
  STATE.notifications.unshift(newNotif);
  STATE.unreadNotifications = (STATE.unreadNotifications || 0) + 1;
  updateNotificationBell();

  api('/api/notifications', {
    method: 'POST',
    body: {
      title: `[${channel.toUpperCase()}] ${subject}`,
      body: message,
      type: 'announcement',
      target: targetType
    }
  }).catch(() => {});

  renderCommHistoryList('comm-history-list', 'comm-history-count');
  renderCommHistoryList('tab-comm-history-container', null);
}

function renderCommHistoryList(containerId, countId) {
  const container = document.getElementById(containerId);
  const countEl = countId ? document.getElementById(countId) : null;
  const history = STATE.commHistory || [];

  if (countEl) countEl.textContent = history.length;
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No messages dispatched yet in this session.</p>`;
    return;
  }

  const icons = { whatsapp: '🟢', mail: '✉️', sms: '📱' };

  container.innerHTML = `
    <table class="data-table" style="font-size: 0.8rem;">
      <thead>
        <tr>
          <th>Time</th>
          <th>Channel</th>
          <th>Recipient</th>
          <th>Snippet</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${history.slice(0, 8).map(h => `
          <tr>
            <td>${formatDateTime(h.timestamp)}</td>
            <td><span class="badge ${h.channel === 'whatsapp' ? 'badge-success' : (h.channel === 'mail' ? 'badge-primary' : 'badge-warning')}">${icons[h.channel] || ''} ${h.channel.toUpperCase()}</span></td>
            <td><strong>${escapeHtml(h.recipient)}</strong></td>
            <td>${escapeHtml(h.message)}</td>
            <td><span class="badge badge-success">✓ Sent</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function copyCommMessageText() {
  const msgInput = document.getElementById('comm-message');
  if (!msgInput || !msgInput.value.trim()) return;
  navigator.clipboard.writeText(msgInput.value.trim()).then(() => {
    showToast('✓ Message text copied to clipboard!', 'info', 2000);
  });
}

function copyTabCommText() {
  const msgInput = document.getElementById('tab-comm-message');
  if (!msgInput || !msgInput.value.trim()) return;
  navigator.clipboard.writeText(msgInput.value.trim()).then(() => {
    showToast('✓ Message text copied to clipboard!', 'info', 2000);
  });
}

function loadCommunicationTab() {
  populateCommTargetOptions('tab-comm-target-sub-select');
  updateTabCommPreview();
  renderCommHistoryList('tab-comm-history-container', null);
}

// ============================================================================
// 1.4 SETTINGS MODAL & TAB ENGINE
// ============================================================================
function openSettingsModal() {
  const mode = STATE.themeMode || 'light';
  const lightRadio = document.getElementById('theme-mode-light');
  const darkRadio = document.getElementById('theme-mode-dark');
  if (lightRadio && darkRadio) {
    lightRadio.checked = mode === 'light';
    darkRadio.checked = mode === 'dark';
  }

  const lang = STATE.lang || 'en';
  const langEn = document.getElementById('lang-en');
  const langTa = document.getElementById('lang-ta');
  if (langEn && langTa) {
    langEn.checked = lang === 'en';
    langTa.checked = lang === 'ta';
  }

  const customColorInput = document.getElementById('settings-custom-color');
  if (customColorInput && STATE.themeColor) {
    customColorInput.value = STATE.themeColor;
  }

  applyThemeColor(STATE.themeColor || '#1e3a8a');
  updateGoogleConnectionUI();
  openModal('settings-modal');
}

function loadSettingsTab() {
  const mode = STATE.themeMode || 'light';
  const lightRadio = document.getElementById('tab-theme-mode-light');
  const darkRadio = document.getElementById('tab-theme-mode-dark');
  if (lightRadio && darkRadio) {
    lightRadio.checked = mode === 'light';
    darkRadio.checked = mode === 'dark';
  }

  const lang = STATE.lang || 'en';
  const langEn = document.getElementById('tab-lang-en');
  const langTa = document.getElementById('tab-lang-ta');
  if (langEn && langTa) {
    langEn.checked = lang === 'en';
    langTa.checked = lang === 'ta';
  }

  const customColorInput = document.getElementById('tab-custom-color');
  if (customColorInput && STATE.themeColor) {
    customColorInput.value = STATE.themeColor;
  }

  applyThemeColor(STATE.themeColor || '#1e3a8a');
  updateGoogleConnectionUI();
}

function setDefaultCommChannel(ch) {
  STATE.commChannel = ch;
  showToast(`Default communication channel set to ${ch.toUpperCase()}`, 'info', 1500);
}

function resetPortalSettings() {
  applyThemeMode('light');
  applyThemeColor('#1e3a8a');
  applyLanguage('en');
  showToast('Settings reset to college defaults (Royal Blue & English).', 'info', 2500);
}

// ============================================================================
// 1.5 GOOGLE OAUTH 2.0 CLIENT ENGINE
// ============================================================================
let GOOGLE_CLIENT_ID = 'your-nec-sports-client-id.apps.googleusercontent.com';

async function fetchGoogleAuthConfig() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/auth/config`);
    if (res.ok) {
      const data = await res.json();
      if (data.googleClientId && data.googleClientId !== 'your-nec-sports-client-id.apps.googleusercontent.com') {
        GOOGLE_CLIENT_ID = data.googleClientId;
      }
    }
  } catch (e) {
    // Offline or direct mode
  }
}

function initGoogleAuth() {
  fetchGoogleAuthConfig().then(() => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const targetDiv = document.getElementById('g_id_onload');
        if (targetDiv) {
          window.google.accounts.id.renderButton(targetDiv, {
            theme: STATE.themeMode === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%'
          });
        }
      } catch (err) {
        console.warn('Google Identity Services init fallback:', err);
      }
    }
  });
}

function initiateGoogleSignIn() {
  // If GIS is active with real client ID, try prompt
  if (window.google && window.google.accounts && window.google.accounts.id && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('your-')) {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        openModal('google-oauth-modal');
      }
    });
  } else {
    // Seamless fallback modal with official college accounts + custom input
    openModal('google-oauth-modal');
  }
}

async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) return;
  try {
    showToast('Authenticating with Google...', 'info', 2000);
    const data = await api('/api/auth/google', {
      method: 'POST',
      body: { credential: response.credential }
    });

    if (data.success && data.token) {
      STATE.token = data.token;
      STATE.user = data.user;
      localStorage.setItem('nec_sports_token', data.token);
      localStorage.setItem('nec_sports_user', JSON.stringify(data.user));
      showToast(`✓ Welcome, ${data.user.name}! Redirecting...`, 'success', 2000);
      setTimeout(() => { window.location.href = 'portal.html'; }, 800);
    }
  } catch (err) {
    showToast(err.message || 'Google sign-in failed. Please try again.', 'danger');
  }
}

async function selectGoogleAccount(email, name, role, picture) {
  closeModal('google-oauth-modal');
  await loginWithGooglePayload({
    email,
    name,
    role,
    picture,
    googleId: 'g_' + email.replace(/[^a-zA-Z0-9]/g, '_')
  });
}

async function submitCustomGoogleAccount() {
  const input = document.getElementById('custom-google-email');
  const email = input ? input.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid Google email address.', 'warning');
    return;
  }
  closeModal('google-oauth-modal');
  const namePart = email.split('@')[0];
  const role = email.includes('admin') ? 'admin' : (email.includes('staff') ? 'staff' : 'student');
  await loginWithGooglePayload({
    email,
    name: namePart.toUpperCase(),
    role,
    picture: null,
    googleId: 'g_' + namePart
  });
}

async function loginWithGooglePayload(payload) {
  try {
    showToast('Connecting via Google OAuth 2.0...', 'info', 1500);
    const data = await api('/api/auth/google', {
      method: 'POST',
      body: payload
    });

    if (data.success && data.token) {
      STATE.token = data.token;
      STATE.user = data.user;
      localStorage.setItem('nec_sports_token', data.token);
      localStorage.setItem('nec_sports_user', JSON.stringify(data.user));
      showToast(`✓ Google Sign-In verified for ${data.user.name}!`, 'success', 2000);
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 700);
    } else {
      throw new Error(data.message || 'Authentication failed');
    }
  } catch (err) {
    if (payload && payload.email) {
      const user = {
        id: Date.now(),
        email: payload.email,
        name: payload.name || 'Student Athlete',
        role: payload.role || 'student',
        reg: payload.email.replace(/@.*/, ''),
        dept: 'CSE',
        year: 'III Year'
      };
      const mockToken = 'google-demo-token-' + Date.now();
      STATE.token = mockToken;
      STATE.user = user;
      localStorage.setItem('nec_sports_token', mockToken);
      localStorage.setItem('nec_sports_user', JSON.stringify(user));
      showToast(`✓ Google Sign-In verified for ${user.name}! (Demo Mode)`, 'success', 2000);
      setTimeout(() => { window.location.href = 'portal.html'; }, 700);
      return;
    }
    showToast(err.message || 'Google Sign-in failed. Please verify credentials.', 'danger');
  }
}

function updateGoogleConnectionUI() {
  const isLinked = STATE.user && (STATE.user.authProvider === 'google' || STATE.user.googleId);
  const statusEl = document.getElementById('google-conn-status');
  const emailEl = document.getElementById('google-conn-email');
  const btnText = document.getElementById('google-link-btn-text');
  const tabStatusEl = document.getElementById('tab-google-conn-status');
  const tabEmailEl = document.getElementById('tab-google-conn-email');
  const tabBtnText = document.getElementById('tab-google-link-btn-text');

  const emailText = (STATE.user && STATE.user.email) ? STATE.user.email : 'Not connected';
  const linkedText = t('google_account_linked', 'Google Account Connected');
  const notLinkedText = t('google_account_not_linked', 'No Google Account Linked');
  const disconnectText = t('disconnect_google_btn', 'Disconnect Google');
  const connectText = t('connect_google_btn', 'Connect Google Account');

  [statusEl, tabStatusEl].forEach(el => {
    if (el) el.innerHTML = isLinked ? `🟢 ${linkedText}` : `⚪ ${notLinkedText}`;
  });
  [emailEl, tabEmailEl].forEach(el => {
    if (el) el.textContent = isLinked ? emailText : 'Sign in or link your college Google Workspace account.';
  });
  [btnText, tabBtnText].forEach(el => {
    if (el) el.textContent = isLinked ? disconnectText : connectText;
  });
}

function toggleGoogleConnection() {
  const isLinked = STATE.user && (STATE.user.authProvider === 'google' || STATE.user.googleId);
  if (isLinked) {
    if (STATE.user) {
      STATE.user.authProvider = 'local';
      delete STATE.user.googleId;
      localStorage.setItem('nec_sports_user', JSON.stringify(STATE.user));
    }
    showToast('Google account unlinked.', 'info', 2000);
    updateGoogleConnectionUI();
  } else {
    initiateGoogleSignIn();
  }
}

// ============================================================================
// 2. HTTP API CLIENT WRAPPER
// ============================================================================
async function api(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // Add Auth Token if available
  if (STATE.token) {
    headers['Authorization'] = `Bearer ${STATE.token}`;
  }

  // Handle JSON payload
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });

    // Handle Blob/CSV download
    if (options.isBlob) {
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      return await response.blob();
    }

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = { success: false, message: `Server error (${response.status})` };
      }
    } else {
      const text = await response.text().catch(() => '');
      data = {
        success: response.ok,
        message: text || `Server returned status ${response.status}`
      };
    }

    if (!response.ok) {
      // Handle expired/invalid token
      if (response.status === 401 && STATE.token) {
        showToast('Session expired. Please log in again.', 'warning');
        logoutUser(false);
      }
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// ============================================================================
// 3. TOAST NOTIFICATIONS & UI HELPERS
// ============================================================================
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('modal-active');
    document.body.classList.add('modal-open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('modal-active');
    document.body.classList.remove('modal-open');
  }
}

// Setup universal modal close listeners (ESC and backdrop click)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.modal-active').forEach(m => m.classList.remove('modal-active'));
    document.body.classList.remove('modal-open');
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal') && e.target.classList.contains('modal-active')) {
    e.target.classList.remove('modal-active');
    document.body.classList.remove('modal-open');
  }
});

// ============================================================================
// 4. AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================
async function loginUser(email, password, role) {
  try {
    showToast('Authenticating with NEC secure server...', 'info', 2000);
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password, role }
    });

    if (data.success && data.token) {
      STATE.token = data.token;
      STATE.user = data.user;
      localStorage.setItem('nec_sports_token', data.token);
      localStorage.setItem('nec_sports_user', JSON.stringify(data.user));

      showToast(`Welcome back, ${data.user.name}! Redirecting to portal...`, 'success', 2000);
      
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 700);
      return true;
    } else {
      showToast(data.message || 'Login failed. Please verify credentials.', 'error');
      return false;
    }
  } catch (err) {
    // Seamless fallback for demo/offline accounts if backend unreachable
    const demoAccounts = {
      'sportsstaff@nec.edu.in': { id: 1, email: 'sportsstaff@nec.edu.in', name: 'Sports Coordinator', role: 'staff', dept: 'Physical Education' },
      'sportsadmin@nec.edu.in': { id: 2, email: 'sportsadmin@nec.edu.in', name: 'Sports Administrator', role: 'admin', dept: 'Administration' },
      '24104016': { id: 3, email: '24104016@nec.edu.in', name: 'Bhavana Lakshmi', role: 'student', reg: '24104016', dept: 'CSE', year: 'III Year' },
      '24104016@nec.edu.in': { id: 3, email: '24104016@nec.edu.in', name: 'Bhavana Lakshmi', role: 'student', reg: '24104016', dept: 'CSE', year: 'III Year' },
      '24104021': { id: 4, email: '24104021@nec.edu.in', name: 'Kavin Raj', role: 'student', reg: '24104021', dept: 'CSE', year: 'III Year' },
      '24104021@nec.edu.in': { id: 4, email: '24104021@nec.edu.in', name: 'Kavin Raj', role: 'student', reg: '24104021', dept: 'CSE', year: 'III Year' }
    };
    const key = (email || '').trim().toLowerCase();
    const demoUser = demoAccounts[key];
    if (demoUser && (demoUser.role === role || role === 'student')) {
      const mockToken = 'nec-demo-token-' + Date.now();
      STATE.token = mockToken;
      STATE.user = demoUser;
      localStorage.setItem('nec_sports_token', mockToken);
      localStorage.setItem('nec_sports_user', JSON.stringify(demoUser));
      showToast(`Welcome back, ${demoUser.name}! (Demo Mode)`, 'success', 2000);
      setTimeout(() => { window.location.href = 'portal.html'; }, 700);
      return true;
    }
    showToast(err.message || 'Login failed. Ensure the backend server is running.', 'error');
    return false;
  }
}

function logoutUser(redirect = true) {
  STATE.token = null;
  STATE.user = null;
  localStorage.removeItem('nec_sports_token');
  localStorage.removeItem('nec_sports_user');
  if (redirect) {
    showToast('Logged out successfully.', 'info', 1500);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  }
}

async function verifyAuth(requiredRoles = []) {
  if (!STATE.token || !STATE.user) {
    window.location.href = 'login.html';
    return false;
  }

  try {
    const res = await api('/api/auth/me');
    if (res.success && res.user) {
      STATE.user = res.user;
      localStorage.setItem('nec_sports_user', JSON.stringify(res.user));
    }
  } catch {
    // If token is invalid, redirect
    logoutUser(true);
    return false;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(STATE.user.role)) {
    showToast(`Access restricted for ${STATE.user.role} role.`, 'error');
    return false;
  }

  return true;
}

// Fast demo login autofill helper
function fillDemo(role) {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const roleSelect = document.getElementById('login-role');

  if (!emailInput || !passwordInput || !roleSelect) return;

  if (role === 'student') {
    emailInput.value = '24104016@nec.edu.in';
    passwordInput.value = 'Student@2026';
    roleSelect.value = 'student';
  } else if (role === 'staff') {
    emailInput.value = 'sportsstaff@nec.edu.in';
    passwordInput.value = 'NECStaff@2026';
    roleSelect.value = 'staff';
  } else if (role === 'admin') {
    emailInput.value = 'sportsadmin@nec.edu.in';
    passwordInput.value = 'NECAdmin@2026';
    roleSelect.value = 'admin';
  }

  // Highlight input fields
  [emailInput, passwordInput, roleSelect].forEach(el => {
    el.classList.add('input-highlight');
    setTimeout(() => el.classList.remove('input-highlight'), 600);
  });

  showToast(`Autofilled demo credentials for ${role.toUpperCase()}`, 'info', 2000);
}

// ============================================================================
// 5. PUBLIC DASHBOARD LOGIC (index.html)
// ============================================================================
async function initPublicDashboard() {
  loadPublicEvents();
  loadLeaderboards();
  loadPublicNotifications();
  setupPublicEventListeners();
}

function renderEventsGridHtml(events) {
  const container = document.getElementById('public-events-grid');
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏅</div>
        <h3>No Sports Events Found</h3>
        <p>Try adjusting your search filter or category selection.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map(event => {
    const isFull = event.participantCount >= (event.limit || 40);
    const isOpen = event.status === 'Open';
    const statusClass = event.status === 'Open' ? 'badge-success' : (event.status === 'Ongoing' ? 'badge-warning' : 'badge-secondary');

    return `
      <div class="event-card ${isFull ? 'event-card-full' : ''}">
        <div class="event-card-header">
          <span class="badge ${statusClass}">${escapeHtml(event.status)}</span>
          <span class="badge badge-outline">${escapeHtml(event.category || 'Sports')}</span>
          <span class="badge badge-accent">${escapeHtml(event.type || 'Individual')}</span>
        </div>
        <div class="event-card-body">
          <h3 class="event-title">${escapeHtml(event.name)}</h3>
          <p class="event-description">${escapeHtml(event.description || 'Annual inter-department sports championship tournament.')}</p>
          <div class="event-meta-grid">
            <div class="meta-item">
              <span class="meta-label">📅 Date</span>
              <span class="meta-value">${formatDate(event.date)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">⏰ Time</span>
              <span class="meta-value">${escapeHtml(event.time || '09:00 AM')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">📍 Venue</span>
              <span class="meta-value">${escapeHtml(event.venue)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">👥 Capacity</span>
              <span class="meta-value">${event.participantCount || 0} / ${event.limit || 40} (${isFull ? 'Full' : 'Available'})</span>
            </div>
          </div>
        </div>
        <div class="event-card-footer">
          ${isOpen && !isFull ? `
            <button class="btn btn-primary btn-sm btn-block" onclick="openRegistrationModal('${escapeHtml(event.name)}')">
              Register for Event
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm btn-block" disabled>
              ${isFull ? 'Registration Full' : (event.status === 'Ongoing' ? 'Event Ongoing' : 'Completed')}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Update stats counters on public home
  const totalEventsEl = document.getElementById('stat-total-events');
  if (totalEventsEl) totalEventsEl.textContent = events.length;

  const openEventsEl = document.getElementById('stat-open-events');
  if (openEventsEl) openEventsEl.textContent = events.filter(e => e.status === 'Open').length;
}

async function loadPublicEvents(filters = {}) {
  const container = document.getElementById('public-events-grid');
  if (!container) return;

  // Immediately render from state or seed events so user sees events instantly
  let currentList = (STATE.events && STATE.events.length > 0) ? STATE.events : SEED_EVENTS;
  let filtered = currentList;
  if (filters.category && filters.category !== 'All') {
    filtered = filtered.filter(e => (e.category || '').toLowerCase() === filters.category.toLowerCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(e => (e.name || '').toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q));
  }
  renderEventsGridHtml(filtered);

  try {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'All') query.append('category', filters.category);
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.search) query.append('search', filters.search);

    const res = await api(`/api/events?${query.toString()}`);
    if (res && res.data && res.data.length > 0) {
      STATE.events = res.data;
      renderEventsGridHtml(res.data);
    }
  } catch (err) {
    console.warn('Live events sync fallback:', err.message);
    if (!STATE.events || STATE.events.length === 0) {
      STATE.events = SEED_EVENTS;
      renderEventsGridHtml(filtered);
    }
  }
}

function renderDeptLeaderboard(deptPoints, totalPoints) {
  const deptContainer = document.getElementById('dept-leaderboard-container');
  if (!deptContainer) return;
  const list = (deptPoints && deptPoints.length > 0) ? deptPoints : SEED_DEPT_POINTS;
  const maxPoints = Math.max(...list.map(d => d.points || 0), 200);

  deptContainer.innerHTML = list.map((item, idx) => {
    const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
    const percentage = Math.round(((item.points || 0) / maxPoints) * 100);

    return `
      <div class="leaderboard-item">
        <div class="rank-badge ${idx < 3 ? 'rank-top' : ''}">${medal}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-header-row">
            <span class="dept-name">Department of ${escapeHtml(item.dept)}</span>
            <span class="dept-score"><strong>${item.points}</strong> pts</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill dept-${escapeHtml(item.dept).toLowerCase()}" style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const totalPointsEl = document.getElementById('stat-total-points');
  if (totalPointsEl) {
    totalPointsEl.textContent = totalPoints || list.reduce((sum, d) => sum + (d.points || 0), 0);
  }
}

function renderStudentLeaderboard(studentPoints) {
  const studentContainer = document.getElementById('student-leaderboard-container');
  if (!studentContainer) return;
  const list = (studentPoints && studentPoints.length > 0) ? studentPoints.slice(0, 5) : SEED_STUDENT_POINTS.slice(0, 5);

  studentContainer.innerHTML = list.map((s, idx) => {
    const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}`));
    return `
      <div class="student-rank-card">
        <div class="student-rank-badge">${medal}</div>
        <div class="student-rank-details">
          <strong>${escapeHtml(s.name)}</strong>
          <div class="student-subtext">${escapeHtml(s.reg)} • ${escapeHtml(s.dept)} (${escapeHtml(s.year || 'III Year')})</div>
        </div>
        <div class="student-rank-points">
          <span>${s.points}</span>
          <small>PTS</small>
        </div>
      </div>
    `;
  }).join('');
}

async function loadLeaderboards() {
  const deptContainer = document.getElementById('dept-leaderboard-container');
  const studentContainer = document.getElementById('student-leaderboard-container');

  // Immediately render so user NEVER sees blank or "sync pending" screens
  if (deptContainer) {
    renderDeptLeaderboard(STATE.deptPoints.length > 0 ? STATE.deptPoints : SEED_DEPT_POINTS, 1094);
  }
  if (studentContainer) {
    renderStudentLeaderboard(STATE.studentPoints.length > 0 ? STATE.studentPoints : SEED_STUDENT_POINTS);
  }

  // Live background update from API
  if (deptContainer) {
    try {
      const res = await api('/api/points/departments');
      if (res && res.data && res.data.length > 0) {
        STATE.deptPoints = res.data;
        renderDeptLeaderboard(STATE.deptPoints, res.totalPoints);
      }
    } catch (err) {
      console.warn('Dept points API fallback:', err.message);
    }
  }

  if (studentContainer) {
    try {
      const res = await api('/api/points/students');
      if (res && res.data && res.data.length > 0) {
        STATE.studentPoints = res.data.slice(0, 5);
        renderStudentLeaderboard(STATE.studentPoints);
      }
    } catch (err) {
      console.warn('Student points API fallback:', err.message);
    }
  }
}

async function loadPublicNotifications() {
  const container = document.getElementById('public-notifications-list');
  if (!container) return;

  try {
    const res = await api('/api/notifications');
    const items = (res.data || []).slice(0, 4);

    if (items.length === 0) {
      container.innerHTML = `<p class="text-muted">No recent sports announcements.</p>`;
      return;
    }

    container.innerHTML = items.map(n => `
      <div class="notification-card notification-type-${escapeHtml(n.type || 'general')}">
        <div class="notification-title-row">
          <strong>${escapeHtml(n.title)}</strong>
          <span class="notification-time">${formatDateTime(n.date)}</span>
        </div>
        <p class="notification-body">${escapeHtml(n.body)}</p>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `<p class="text-muted">Announcements unavailable.</p>`;
  }
}

// Student Quick OD Pass Lookup (Public Self-Service)
async function lookupStudentOD() {
  const input = document.getElementById('student-lookup-reg');
  const resultContainer = document.getElementById('student-lookup-results');
  if (!input || !resultContainer) return;

  const reg = input.value.trim();
  if (!reg) {
    showToast('Please enter your Register Number (e.g. 24104016)', 'warning');
    return;
  }

  resultContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Searching On-Duty records for ${escapeHtml(reg)}...</p></div>`;

  try {
    const res = await api(`/api/od/student/${encodeURIComponent(reg)}`);
    const records = res.data || [];

    if (records.length === 0) {
      resultContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h4>No Official OD Passes Found</h4>
          <p>No On-Duty sanction has been recorded for Register No: <strong>${escapeHtml(reg)}</strong> yet.</p>
        </div>
      `;
      return;
    }

    resultContainer.innerHTML = `
      <div class="student-od-records-list">
        <div class="od-results-header">
          <h4>Found ${records.length} Official OD Sanction(s) for ${escapeHtml(records[0].studentName)} (${escapeHtml(records[0].studentDept)})</h4>
        </div>
        ${records.map(r => `
          <div class="od-pass-card">
            <div class="od-pass-header">
              <span class="ref-pill">Ref: ${escapeHtml(r.refNo)}</span>
              <span class="badge ${r.odStatus === 'HOD Approved' || r.odStatus === 'Approved' ? 'badge-success' : 'badge-warning'}">
                ${escapeHtml(r.odStatus || r.batchStatus)}
              </span>
            </div>
            <div class="od-pass-body">
              <div class="od-detail-row">
                <span class="label">Event:</span>
                <span class="value"><strong>${escapeHtml(r.eventName)}</strong></span>
              </div>
              <div class="od-detail-row">
                <span class="label">Date & Session:</span>
                <span class="value">${formatDate(r.eventDate)} (${escapeHtml(r.session || 'Full Day')})</span>
              </div>
              <div class="od-detail-row">
                <span class="label">Venue:</span>
                <span class="value">${escapeHtml(r.venue)}</span>
              </div>
            </div>
            <div class="od-pass-actions">
              <button class="btn btn-outline btn-sm" onclick="printSingleStudentODSlip(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                🖨️ Print Personal OD Slip
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    resultContainer.innerHTML = `
      <div class="error-state">
        <p>⚠️ Failed to fetch OD status: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function openRegistrationModal(eventName = '') {
  const modal = document.getElementById('registration-modal');
  if (!modal) return;

  const eventSelects = [
    document.getElementById('reg-event-select'),
    document.getElementById('portal-reg-event-select')
  ].filter(Boolean);

  const openEvents = (STATE.events || []).filter(e => e.status === 'Open');
  const optionsHtml = openEvents.length > 0
    ? openEvents.map(e => `<option value="${escapeHtml(e.name)}" ${e.name === eventName ? 'selected' : ''}>${escapeHtml(e.name)} • ${escapeHtml(e.category)} (${formatDate(e.date)} - ${escapeHtml(e.venue)})</option>`).join('')
    : '<option value="">-- No Open Events Currently --</option>';

  eventSelects.forEach(sel => {
    sel.innerHTML = optionsHtml;
  });

  // Autofill user details if logged in
  if (STATE.user && STATE.user.role === 'student') {
    const regInputs = [document.getElementById('reg-regno'), document.getElementById('portal-reg-regno')].filter(Boolean);
    const nameInputs = [document.getElementById('reg-name'), document.getElementById('portal-reg-name')].filter(Boolean);
    const deptSelects = [document.getElementById('reg-dept'), document.getElementById('portal-reg-dept')].filter(Boolean);
    const yearSelects = [document.getElementById('portal-reg-year')].filter(Boolean);

    const emailNumber = (STATE.user.email || '').match(/\d+/);
    const effectiveReg = STATE.user.reg || (emailNumber ? emailNumber[0] : '24104015');

    regInputs.forEach(inp => { inp.value = effectiveReg; });
    nameInputs.forEach(inp => { if (STATE.user.name) inp.value = STATE.user.name; });
    deptSelects.forEach(sel => { if (STATE.user.dept) sel.value = STATE.user.dept; });
    yearSelects.forEach(sel => { if (STATE.user.year) sel.value = STATE.user.year; });
  }

  // Update preview for initial selection
  const firstEvent = eventName || (openEvents[0] ? openEvents[0].name : '');
  updateEventRegPreview(firstEvent);

  openModal('registration-modal');
}

function updateEventRegPreview(eventName) {
  const previewBox = document.getElementById('portal-reg-event-preview');
  if (!previewBox) return;

  if (!eventName) {
    previewBox.style.display = 'none';
    return;
  }

  const ev = (STATE.events || []).find(e => (e.name || '').toLowerCase() === eventName.toLowerCase());
  if (ev) {
    previewBox.style.display = 'block';
    const nameEl = document.getElementById('preview-event-name');
    const metaEl = document.getElementById('preview-event-meta');
    if (nameEl) nameEl.innerHTML = `🏆 ${escapeHtml(ev.name)} <span class="badge badge-outline" style="font-size: 0.75rem;">${escapeHtml(ev.category)}</span>`;
    if (metaEl) metaEl.innerHTML = `📅 <strong>${formatDate(ev.date)}</strong> at <strong>${escapeHtml(ev.time || '09:00 AM')}</strong> • 📍 Venue: <strong>${escapeHtml(ev.venue)}</strong> • 👥 Capacity: ${ev.participantCount || 0}/${ev.limit || 40} enrolled`;
  } else {
    previewBox.style.display = 'none';
  }
}

async function handleStudentRegistration(e) {
  e.preventDefault();
  const form = e.target;
  const reg = (form.regno ? form.regno.value : '').trim();
  const name = (form.name ? form.name.value : '').trim();
  const dept = (form.dept ? form.dept.value : '').trim();
  const event = (form.event ? form.event.value : '').trim();
  const gender = (form.gender ? form.gender.value : 'Male');
  const year = (form.year ? form.year.value : 'III Year');

  if (!reg || !name || !dept || !event) {
    showToast('Please fill all mandatory fields.', 'warning');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-sm"></span> Registering...`;
  }

  try {
    const res = await api('/api/participants', {
      method: 'POST',
      body: { reg, name, dept, event, gender, year }
    });

    if (res.success) {
      // Immediately bind reg to STATE.user and update storage
      if (STATE.user) {
        STATE.user.reg = reg;
        if (!STATE.user.dept) STATE.user.dept = dept;
        localStorage.setItem('nec_sports_user', JSON.stringify(STATE.user));
        const regDisplay = document.getElementById('overview-student-reg');
        if (regDisplay) regDisplay.textContent = reg;
      }

      showToast(`🎉 Registration confirmed for ${name} in ${event}!`, 'success', 3500);
      closeModal('registration-modal');
      form.reset();

      // Refresh public and portal views immediately
      if (typeof loadOverviewStats === 'function') await loadOverviewStats();
      if (typeof loadStudentRegisteredEvents === 'function') await loadStudentRegisteredEvents();
      if (typeof loadParticipantsRosterTable === 'function') loadParticipantsRosterTable();
      if (typeof loadPublicEvents === 'function') loadPublicEvents();
    }
  } catch (err) {
    showToast(err.message || 'Registration failed.', 'error', 4000);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Registration';
    }
  }
}

function setupPublicEventListeners() {
  // Search input
  const searchInput = document.getElementById('events-search');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadPublicEvents({ search: e.target.value.trim() });
      }, 300);
    });
  }

  // Category filter tabs
  document.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const category = e.target.dataset.category || 'All';
      loadPublicEvents({ category });
    });
  });

  // Registration form
  const regForm = document.getElementById('event-registration-form');
  if (regForm) {
    regForm.addEventListener('submit', handleStudentRegistration);
  }
}

// ============================================================================
// 6. PROTECTED PORTAL LOGIC (portal.html)
// ============================================================================
async function initPortal() {
  const isAuth = await verifyAuth();
  if (!isAuth) return;

  renderUserHeader();
  renderRoleNavigation();
  setupPortalEventListeners();
  loadPortalData();
  startNotificationPolling();
}

function renderUserHeader() {
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const deptEl = document.getElementById('user-display-dept');
  const avatarEl = document.getElementById('user-avatar-initials');

  if (nameEl) nameEl.textContent = STATE.user.name;
  if (roleEl) {
    roleEl.textContent = STATE.user.role.toUpperCase();
    roleEl.className = `role-badge role-${STATE.user.role}`;
  }
  if (deptEl) {
    deptEl.textContent = STATE.user.dept || (STATE.user.reg ? `Reg: ${STATE.user.reg}` : 'NEC Sports');
  }
  if (avatarEl) {
    const initials = (STATE.user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

function renderRoleNavigation() {
  const role = STATE.user.role; // 'student', 'staff', 'admin'
  const navContainer = document.getElementById('portal-nav-links');
  if (!navContainer) return;

  let links = [];

  if (role === 'student') {
    links = [
      { id: 'overview', icon: '📊', label: t('my_dashboard', 'My Dashboard') },
      { id: 'my-od', icon: '🎫', label: t('my_od_passes', 'My OD Passes') },
      { id: 'my-events', icon: '🏃', label: t('registered_events', 'Registered Events') },
      { id: 'standings', icon: '🏆', label: t('leaderboards', 'Leaderboards') },
      { id: 'notifications', icon: '🔔', label: t('notifications_hub', 'Notification Hub') },
      { id: 'settings', icon: '⚙️', label: t('settings', 'Portal Settings') }
    ];
  } else if (role === 'staff') {
    links = [
      { id: 'overview', icon: '📊', label: t('staff_dashboard', 'Staff Dashboard') },
      { id: 'auto-od', icon: '⚡', label: t('auto_od', 'Automatic OD Generator') },
      { id: 'attendance', icon: '📝', label: t('live_attendance', 'Live Attendance') },
      { id: 'events', icon: '📅', label: t('manage_events', 'Manage Events') },
      { id: 'roster', icon: '👥', label: t('participants_roster', 'Participants Roster') },
      { id: 'notifications', icon: '🔔', label: t('notifications_hub', 'Notification Hub') },
      { id: 'communication', icon: '💬', label: t('comm_hub_title_short', 'Communication Hub') },
      { id: 'od-analytics', icon: '📈', label: t('od_analytics', 'OD Analytics') },
      { id: 'points', icon: '🏆', label: t('sports_points', 'Sports Points') },
      { id: 'reports', icon: '📥', label: t('export_reports', 'Export Reports') },
      { id: 'settings', icon: '⚙️', label: t('settings', 'Portal Settings') }
    ];
  } else if (role === 'admin') {
    links = [
      { id: 'overview', icon: '📊', label: t('admin_dashboard', 'Admin Dashboard') },
      { id: 'auto-od', icon: '⚡', label: t('auto_od', 'Automatic OD Generator') },
      { id: 'attendance', icon: '📝', label: t('live_attendance', 'Attendance Tracking') },
      { id: 'events', icon: '📅', label: t('manage_events', 'Events Control') },
      { id: 'roster', icon: '👥', label: t('participants_roster', 'Participants Roster') },
      { id: 'notifications', icon: '🔔', label: t('notifications_hub', 'Notification Hub') },
      { id: 'communication', icon: '💬', label: t('comm_hub_title_short', 'Communication Hub') },
      { id: 'points', icon: '🏆', label: t('points_mgmt', 'Points Management') },
      { id: 'users', icon: '🛡️', label: t('user_accounts', 'User Accounts') },
      { id: 'reports', icon: '📥', label: t('reports_audit', 'Reports & Audit') },
      { id: 'settings', icon: '⚙️', label: t('settings', 'Portal Settings') }
    ];
  }

  const activeId = STATE.activePortalTab || links[0].id;

  navContainer.innerHTML = links.map(link => `
    <button class="portal-nav-item ${link.id === activeId ? 'active' : ''}" data-tab="${link.id}" onclick="switchPortalTab('${link.id}')">
      <span class="nav-icon">${link.icon}</span>
      <span class="nav-label">${link.label}</span>
      ${link.id === 'notifications' && STATE.unreadNotifications > 0 ? `<span class="badge badge-danger notification-badge-pulsing" style="margin-left: auto; font-size: 0.65rem; padding: 2px 6px;">${STATE.unreadNotifications}</span>` : ''}
    </button>
  `).join('');

  // Set initial active tab if not already active
  if (!STATE.activePortalTab) {
    switchPortalTab(links[0].id);
  }
}

function switchPortalTab(tabId) {
  STATE.activePortalTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.portal-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Hide all tab views and show target tab
  document.querySelectorAll('.portal-tab-content').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`tab-view-${tabId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Refresh tab-specific data
  if (tabId === 'overview') loadOverviewStats();
  if (tabId === 'standings') loadLeaderboards();
  if (tabId === 'auto-od') loadODBatchesList();
  if (tabId === 'attendance') loadAttendanceTab();
  if (tabId === 'events') loadEventsManagementTable();
  if (tabId === 'roster') loadParticipantsRosterTable();
  if (tabId === 'notifications') loadNotificationsTab();
  if (tabId === 'communication') loadCommunicationTab();
  if (tabId === 'settings') loadSettingsTab();
  if (tabId === 'my-od') loadStudentPersonalOD();
  if (tabId === 'od-analytics') loadODAnalyticsView();
  if (tabId === 'points') loadPointsManagementView();
  if (tabId === 'reports') loadReportsAndAudit();
  if (tabId === 'users') loadUsersManagementTable();
  if (tabId === 'my-events') loadStudentRegisteredEvents();
}

async function loadPortalData() {
  await Promise.allSettled([
    api('/api/events').then(res => { STATE.events = res.data || []; }),
    api('/api/notifications').then(res => {
      STATE.notifications = res.data || [];
      STATE.unreadNotifications = res.unreadCount || 0;
      updateNotificationBell();
    })
  ]);
  loadOverviewStats();
}

function updateNotificationBell() {
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = STATE.unreadNotifications;
    badge.style.display = STATE.unreadNotifications > 0 ? 'inline-flex' : 'none';
  }
}

// ----------------------------------------------------------------------------
// 6.1 OVERVIEW STATS
// ----------------------------------------------------------------------------
async function loadOverviewStats() {
  try {
    const [eventsRes, odRes, pointsRes] = await Promise.allSettled([
      api('/api/events'),
      api('/api/od/batches'),
      api('/api/points/departments')
    ]);

    const events = (eventsRes.status === 'fulfilled' && eventsRes.value.data) || STATE.events || [];
    const batches = (odRes.status === 'fulfilled' && odRes.value.data) || STATE.odBatches || [];
    const deptPoints = (pointsRes.status === 'fulfilled' && pointsRes.value.data) || STATE.deptPoints || [];
    const totalPoints = (pointsRes.status === 'fulfilled' && pointsRes.value.totalPoints) || 0;

    STATE.events = events;
    STATE.odBatches = batches;

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('stat-portal-events', events.length);
    setEl('stat-portal-open-events', events.filter(e => e.status === 'Open').length);
    setEl('stat-portal-od-batches', batches.length);
    setEl('stat-portal-approved-od', batches.filter(b => b.status === 'HOD Approved' || b.status === 'Principal Sanctioned').length);
    setEl('stat-portal-total-points', totalPoints);

    // If student, customize overview layout & calculate personal stats
    if (STATE.user && STATE.user.role === 'student') {
      const studentSec = document.getElementById('overview-student-section');
      const staffSec = document.getElementById('overview-staff-section');
      const headerActions = document.getElementById('overview-header-actions');
      const headingTitle = document.getElementById('overview-heading-title');
      const headingSub = document.getElementById('overview-heading-sub');

      if (studentSec) studentSec.style.display = 'block';
      if (staffSec) staffSec.style.display = 'none';
      if (headerActions) headerActions.style.display = 'block';
      if (headingTitle) headingTitle.textContent = t('my_dashboard', 'My Student Sports Dashboard');
      if (headingSub) headingSub.textContent = 'Track your tournament squad registrations, On-Duty (OD) sanction approvals, and match schedule.';

      setEl('overview-student-name', STATE.user.name);
      setEl('overview-student-reg', STATE.user.reg || '--');
      setEl('overview-student-dept', STATE.user.dept || '--');
      setEl('overview-student-year', STATE.user.year || 'III Year');

      // Open events count
      const openEventsCount = events.filter(e => e.status === 'Open').length;
      setEl('stat-student-open-events', openEventsCount);

      // Dept points
      const myDeptPointObj = deptPoints.find(d => (d.dept || '').toUpperCase() === (STATE.user.dept || '').toUpperCase());
      setEl('stat-student-dept-points', myDeptPointObj ? myDeptPointObj.points : 0);

      // Student ODs
      let myODs = [];
      const studentReg = (STATE.user.reg || '').trim();
      const studentName = (STATE.user.name || '').trim();
      try {
        const odUrl = (studentReg && studentReg !== 'null')
          ? `/api/od/student/${encodeURIComponent(studentReg)}`
          : `/api/od/student?name=${encodeURIComponent(studentName)}`;
        const studentODsRes = await api(odUrl);
        myODs = studentODsRes.data || [];
      } catch {}
      setEl('stat-student-od-count', myODs.length);

      // Student Registrations & Live Dashboard Table (Multi-criteria matching)
      let myRegistrations = [];
      try {
        const qParams = new URLSearchParams();
        if (studentReg && studentReg !== 'null') qParams.append('reg', studentReg);
        if (studentName) qParams.append('name', studentName);
        if (STATE.user.email) qParams.append('email', STATE.user.email);
        const pRes = await api(`/api/participants/my?${qParams.toString()}`);
        myRegistrations = pRes.data || [];
      } catch {
        // Fallback
        try {
          const pRes = await api('/api/participants');
          const allP = pRes.data || [];
          myRegistrations = allP.filter(p => {
            const pReg = (p.reg || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            if (studentReg && studentReg !== 'null' && pReg === studentReg.toLowerCase()) return true;
            if (studentName && (pName === studentName.toLowerCase() || pName.includes(studentName.toLowerCase()) || studentName.toLowerCase().includes(pName))) return true;
            return false;
          });
        } catch {}
      }

      // If registrations exist and user's profile was missing a reg, auto-bind it!
      if (myRegistrations.length > 0 && (!STATE.user.reg || STATE.user.reg === 'null')) {
        STATE.user.reg = myRegistrations[0].reg;
        localStorage.setItem('nec_sports_user', JSON.stringify(STATE.user));
        setEl('overview-student-reg', STATE.user.reg);
      } else {
        setEl('overview-student-reg', STATE.user.reg || '--');
      }

      setEl('stat-student-events-count', myRegistrations.length);

      // Render the student's registered events live list on the Overview Dashboard
      renderOverviewStudentEvents(myRegistrations, events, myODs);

    } else {
      // Staff / Admin overview
      const studentSec = document.getElementById('overview-student-section');
      const staffSec = document.getElementById('overview-staff-section');
      const headerActions = document.getElementById('overview-header-actions');
      if (studentSec) studentSec.style.display = 'none';
      if (staffSec) staffSec.style.display = 'block';
      if (headerActions) headerActions.style.display = 'none';
    }
  } catch (err) {
    console.warn('Overview stats error:', err);
  }
}

function renderOverviewStudentEvents(myRegistrations, events, myODs) {
  const container = document.getElementById('overview-student-events-list');
  if (!container) return;

  if (!myRegistrations || myRegistrations.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2.5rem 1.5rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 2px dashed var(--border-subtle);">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏃‍♂️</div>
        <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.4rem;">You haven't registered for any sports events yet!</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 500px; margin: 0 auto 1.25rem;">
          Represent National Engineering College in upcoming Athletics, Badminton, Football, Basketball, Volleyball & Cricket tournaments.
        </p>
        <button class="btn btn-primary" onclick="openRegistrationModal()">
          ⚡ Browse & Register for an Event Now
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tournament Event</th>
            <th>Schedule & Venue</th>
            <th>Squad Status</th>
            <th>Official OD Pass</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${myRegistrations.map((r, idx) => {
            const ev = events.find(e => (e.name || '').toLowerCase() === (r.event || '').toLowerCase());
            const odMatch = (myODs || []).find(o => (o.eventName || '').toLowerCase() === (r.event || '').toLowerCase());

            const statusClass = r.status === 'Selected' ? 'badge-success' : (r.status === 'Shortlisted' ? 'badge-warning' : 'badge-secondary');
            const odStatusBadge = odMatch
              ? `<span class="badge ${odMatch.odStatus === 'HOD Approved' || odMatch.odStatus === 'Approved' ? 'badge-success' : 'badge-warning'}">✓ ${escapeHtml(odMatch.odStatus || 'Sanctioned')}</span>`
              : `<span class="badge badge-outline" style="opacity: 0.75;">Pending OD</span>`;

            return `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <strong style="font-size: 0.95rem; color: var(--primary-800);">${escapeHtml(r.event)}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${ev ? escapeHtml(ev.category) : 'Sports Tournament'}</div>
                </td>
                <td>
                  <div>📅 ${ev ? formatDate(ev.date) : 'Upcoming'} • ${ev ? escapeHtml(ev.time || '09:00 AM') : 'TBA'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">📍 ${ev ? escapeHtml(ev.venue) : 'College Sports Complex'}</div>
                </td>
                <td>
                  <span class="badge ${statusClass}">${escapeHtml(r.status || 'Enrolled')}</span>
                </td>
                <td>
                  ${odStatusBadge}
                </td>
                <td>
                  <div class="action-btn-group">
                    ${odMatch ? `
                      <button class="btn btn-sm btn-primary" title="Print Personal OD Slip" onclick="printSingleStudentODSlip(${JSON.stringify(odMatch).replace(/"/g, '&quot;')})">
                        🖨️ OD Slip
                      </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline btn-danger" title="Cancel Registration" onclick="cancelStudentRegistration(${r.id}, '${escapeHtml(r.event)}')">
                      ✕ Cancel
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================================
// 7. CORE INNOVATION: AUTOMATIC ON-DUTY (OD) GENERATION ENGINE
// ============================================================================
/**
 * Auto-Generates official college On-Duty batches based on:
 * - Selected event
 * - Academic session (FN / AN / Full Day)
 * - Status filter (Selected / Shortlisted / All)
 * - Attendance verification (Only students marked Present)
 * - Automatic multi-department splitting into separate HOD requisition letters
 */
async function handleAutoGenerateOD(e) {
  if (e) e.preventDefault();

  const eventSelect = document.getElementById('od-event-select');
  const sessionSelect = document.getElementById('od-session-select');
  const statusSelect = document.getElementById('od-status-filter');
  const deptSelect = document.getElementById('od-dept-select');
  const splitDeptCheckbox = document.getElementById('od-split-dept');
  const attendanceOnlyCheckbox = document.getElementById('od-attendance-present-only');
  const remarksInput = document.getElementById('od-remarks-input');

  if (!eventSelect || !eventSelect.value) {
    showToast('Please select a sports event to generate OD.', 'warning');
    return;
  }

  const payload = {
    eventId: parseInt(eventSelect.value),
    session: sessionSelect ? sessionSelect.value : 'Full Day',
    minStatus: statusSelect ? statusSelect.value : 'Selected',
    department: deptSelect ? deptSelect.value : 'All',
    splitByDepartment: splitDeptCheckbox ? splitDeptCheckbox.checked : false,
    requireAttendancePresent: attendanceOnlyCheckbox ? attendanceOnlyCheckbox.checked : false,
    remarks: remarksInput ? remarksInput.value.trim() : ''
  };

  const submitBtn = document.getElementById('btn-generate-od');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-sm"></span> Generating Official OD Batch...`;
  }

  try {
    const res = await api('/api/od/auto-generate', {
      method: 'POST',
      body: payload
    });

    if (res.success) {
      showToast(res.message || 'Official OD batch generated successfully!', 'success', 3500);
      closeModal('generate-od-modal');
      loadODBatchesList();
    }
  } catch (err) {
    showToast(err.message || 'Failed to auto-generate OD.', 'error', 4000);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `⚡ Auto-Generate Official OD Requisition`;
    }
  }
}

async function loadODBatchesList(filters = {}) {
  const container = document.getElementById('od-batches-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner"></div><p>Loading OD batches...</p></td></tr>`;

  try {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.department && filters.department !== 'All') query.append('department', filters.department);
    if (filters.search) query.append('search', filters.search);

    const res = await api(`/api/od/batches?${query.toString()}`);
    STATE.odBatches = res.data || [];

    if (STATE.odBatches.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            No OD batches generated yet. Click <strong>"⚡ Auto-Generate OD Batch"</strong> above to create one.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = STATE.odBatches.map(batch => {
      const breakdownText = Object.entries(batch.departmentBreakdown || {})
        .map(([dept, count]) => `${dept}: ${count}`)
        .join(', ') || batch.department;

      const statusBadges = {
        'Generated': 'badge-secondary',
        'Submitted to HOD': 'badge-warning',
        'HOD Approved': 'badge-success',
        'Principal Sanctioned': 'badge-accent'
      };

      const statusClass = statusBadges[batch.status] || 'badge-secondary';

      return `
        <tr>
          <td>
            <div class="ref-cell">
              <strong>${escapeHtml(batch.refNo)}</strong>
              <small class="text-muted">${formatDate(batch.generatedAt)}</small>
            </div>
          </td>
          <td>
            <strong>${escapeHtml(batch.eventName)}</strong>
            <div class="text-muted small">${formatDate(batch.eventDate)} • ${escapeHtml(batch.session || 'Full Day')}</div>
          </td>
          <td>
            <span class="badge badge-outline">${escapeHtml(batch.department || 'All')}</span>
            <div class="text-muted small" title="${escapeHtml(breakdownText)}">${escapeHtml(breakdownText)}</div>
          </td>
          <td>
            <span class="badge badge-primary">${batch.totalStudents || (batch.students ? batch.students.length : 0)} Students</span>
          </td>
          <td>
            <span class="badge ${statusClass}">${escapeHtml(batch.status)}</span>
          </td>
          <td>
            <div class="action-btn-group">
              <button class="btn btn-sm btn-icon" title="View Roster" onclick="viewODBatchRoster(${batch.id})">
                👁️
              </button>
              <button class="btn btn-sm btn-icon btn-mail" title="Email Official OD Letters to Students" onclick="openEmailODModal(${batch.id})">
                ✉️
              </button>
              <button class="btn btn-sm btn-icon btn-whatsapp" title="Dispatch OD List to HOD via WhatsApp" onclick="openHODODWhatsAppModal(${batch.id})">
                📲
              </button>
              <button class="btn btn-sm btn-icon btn-print" title="Print Official Letterhead" onclick="printOfficialODLetterhead(${batch.id})">
                🖨️
              </button>
              <button class="btn btn-sm btn-icon" title="Advance Workflow Status" onclick="openUpdateODStatusModal(${batch.id}, '${escapeHtml(batch.status)}')">
                📑
              </button>
              <button class="btn btn-sm btn-icon" title="Export CSV" onclick="exportODBatchCSV(${batch.id})">
                📥
              </button>
              ${STATE.user.role === 'admin' ? `
                <button class="btn btn-sm btn-icon btn-danger" title="Delete Batch" onclick="deleteODBatch(${batch.id})">
                  🗑️
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load OD batches: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// View Roster in Modal
function viewODBatchRoster(batchId) {
  const batch = STATE.odBatches.find(b => b.id === batchId);
  if (!batch) return;

  const titleEl = document.getElementById('od-roster-modal-title');
  const bodyEl = document.getElementById('od-roster-modal-body');

  if (titleEl) titleEl.textContent = `Batch Roster: ${batch.refNo} — ${batch.eventName}`;

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="batch-meta-summary">
        <div><strong>Event:</strong> ${escapeHtml(batch.eventName)} (${formatDate(batch.eventDate)})</div>
        <div><strong>Session:</strong> ${escapeHtml(batch.session || 'Full Day')} | <strong>Venue:</strong> ${escapeHtml(batch.venue)}</div>
        <div><strong>Status:</strong> <span class="badge badge-success">${escapeHtml(batch.status)}</span></div>
        <div><strong>Remarks:</strong> ${escapeHtml(batch.remarks || 'Standard OD sanction')}</div>
      </div>
      <div class="table-responsive mt-3">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Reg No</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>Gender</th>
              <th>OD Status</th>
            </tr>
          </thead>
          <tbody>
            ${(batch.students || []).map((s, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(s.reg)}</strong></td>
                <td>${escapeHtml(s.name)}</td>
                <td><span class="badge badge-outline">${escapeHtml(s.dept)}</span></td>
                <td>${escapeHtml(s.year || 'III Year')}</td>
                <td>${escapeHtml(s.gender || 'N/A')}</td>
                <td><span class="badge badge-success">${escapeHtml(s.odStatus || 'Approved')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="modal-footer-actions mt-3" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-whatsapp" onclick="openHODODWhatsAppModal(${batch.id})">📲 Dispatch to HOD via WhatsApp</button>
        <button class="btn btn-mail" onclick="openEmailODModal(${batch.id})">✉️ Email OD to Students</button>
        <button class="btn btn-primary" onclick="printOfficialODLetterhead(${batch.id})">🖨️ Print Official Letterhead</button>
        <button class="btn btn-secondary" onclick="exportODBatchCSV(${batch.id})">📥 Download CSV</button>
      </div>
    `;
  }

  openModal('od-roster-modal');
}

// Update Workflow Status Modal
function openUpdateODStatusModal(batchId, currentStatus) {
  const batch = STATE.odBatches.find(b => b.id === batchId);
  if (!batch) return;

  const modal = document.getElementById('update-od-status-modal');
  const batchIdInput = document.getElementById('status-batch-id');
  const refNoEl = document.getElementById('status-ref-no');
  const statusSelect = document.getElementById('new-od-status-select');

  if (batchIdInput) batchIdInput.value = batchId;
  if (refNoEl) refNoEl.textContent = `${batch.refNo} (${batch.eventName})`;
  if (statusSelect) statusSelect.value = currentStatus;

  openModal('update-od-status-modal');
}

async function handleUpdateODStatus(e) {
  e.preventDefault();
  const form = e.target;
  const batchId = form.batchId.value;
  const status = form.status.value;
  const comments = form.comments ? form.comments.value.trim() : '';

  try {
    const res = await api(`/api/od/batches/${batchId}/status`, {
      method: 'PUT',
      body: { status, comments }
    });

    if (res.success) {
      showToast(`OD status updated to: ${status}`, 'success');
      closeModal('update-od-status-modal');
      loadODBatchesList();
    }
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
  }
}

async function deleteODBatch(batchId) {
  if (!confirm('Are you sure you want to permanently delete this OD batch?')) return;

  try {
    const res = await api(`/api/od/batches/${batchId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('OD batch deleted.', 'info');
      loadODBatchesList();
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete OD batch', 'error');
  }
}

// ============================================================================
// 8.1 EMAIL OD LETTER DISPATCH ENGINE (NEC AUTONOMOUS)
// ============================================================================
STATE.emailOD = {
  currentBatchId: null,
  allStudents: [],
  filteredStudents: [],
  selectedRegs: new Set(),
  previewOpen: false
};

/**
 * Open Email OD Modal
 * Populates events and departments, resolves batch details if batchId passed,
 * loads student athlete roster, and sets up filters.
 */
async function openEmailODModal(batchId = null) {
  STATE.emailOD.currentBatchId = batchId ? parseInt(batchId) : null;
  STATE.emailOD.selectedRegs.clear();
  STATE.emailOD.previewOpen = false;

  // Ensure events & participants are available
  try {
    if (!STATE.events || STATE.events.length === 0) {
      const evRes = await api('/api/events');
      STATE.events = evRes.data || [];
    }
  } catch (e) {
    console.warn('Could not refresh events:', e);
  }

  try {
    if (!STATE.participants || STATE.participants.length === 0) {
      const partRes = await api('/api/participants');
      STATE.participants = partRes.data || [];
    }
  } catch (e) {
    console.warn('Could not refresh participants:', e);
  }

  // Populate Event Filter Dropdown
  const eventFilter = document.getElementById('email-od-event-filter');
  if (eventFilter) {
    let optionsHtml = `<option value="All">All Events (${STATE.events.length})</option>`;
    STATE.events.forEach(ev => {
      optionsHtml += `<option value="${escapeHtml(ev.name)}" data-id="${ev.id}">${escapeHtml(ev.name)} (${formatDate(ev.date)})</option>`;
    });
    eventFilter.innerHTML = optionsHtml;
  }

  // Check if opened for a specific existing batch
  let targetBatch = null;
  if (batchId && STATE.odBatches) {
    targetBatch = STATE.odBatches.find(b => b.id === parseInt(batchId));
  }

  const deptFilter = document.getElementById('email-od-dept-filter');
  const statusFilter = document.getElementById('email-od-status-filter');
  const searchInput = document.getElementById('email-od-search-input');
  const subjectInput = document.getElementById('email-od-subject-input');
  const sessionSelect = document.getElementById('email-od-session-select');
  const remarksInput = document.getElementById('email-od-remarks-input');
  const ccInput = document.getElementById('email-od-cc-input');
  const previewContainer = document.getElementById('email-od-letterhead-preview-container');
  const previewToggleBtn = document.getElementById('btn-toggle-od-preview');

  if (previewContainer) previewContainer.style.display = 'none';
  if (previewToggleBtn) previewToggleBtn.textContent = '👁️ Show Letterhead Preview';

  if (targetBatch) {
    // Pre-populate filters from batch
    if (eventFilter) eventFilter.value = targetBatch.eventName || 'All';
    if (deptFilter) deptFilter.value = targetBatch.department || 'All';
    if (statusFilter) statusFilter.value = 'All';
    if (searchInput) searchInput.value = '';
    if (subjectInput) {
      subjectInput.value = `🏛️ Official NEC Sports OD Sanction Letter — ${targetBatch.eventName} [Ref: ${targetBatch.refNo}]`;
    }
    if (sessionSelect) sessionSelect.value = targetBatch.session || 'Full Day';
    if (remarksInput) {
      remarksInput.value = targetBatch.remarks || `Official On-Duty sanction for representing NEC in ${targetBatch.eventName}. Attendance regularization authorized.`;
    }
    if (ccInput) {
      const deptCode = (targetBatch.department && targetBatch.department !== 'All') ? targetBatch.department.toLowerCase() : '';
      ccInput.value = deptCode ? `hod${deptCode}@nec.edu.in, sports@nec.edu.in` : 'sports@nec.edu.in';
    }

    // Pre-select students that belong to this batch
    if (targetBatch.students && Array.isArray(targetBatch.students)) {
      targetBatch.students.forEach(s => {
        if (s.reg) STATE.emailOD.selectedRegs.add(s.reg);
      });
    }
  } else {
    // Default initial values
    if (eventFilter && eventFilter.value === '') eventFilter.value = 'All';
    if (deptFilter) deptFilter.value = 'All';
    if (statusFilter) statusFilter.value = 'Selected';
    if (searchInput) searchInput.value = '';
    if (subjectInput) {
      const firstEvName = STATE.events.length > 0 ? STATE.events[0].name : 'Sports Championship';
      subjectInput.value = `🏛️ Official NEC Sports OD Sanction Letter — ${firstEvName}`;
    }
    if (sessionSelect) sessionSelect.value = 'Full Day';
    if (remarksInput) {
      remarksInput.value = 'Granted official On-Duty attendance sanction for representing National Engineering College in sports tournament. Attendance regularization authorized.';
    }
    if (ccInput) ccInput.value = 'sports@nec.edu.in';
  }

  // Filter and populate student roster table
  filterEmailODStudents(true);

  // Show modal
  openModal('email-od-modal');
}

/**
 * Filter students for Email OD based on:
 * 1. Event selection
 * 2. Department selection
 * 3. Status selection
 * 4. Search input
 */
function filterEmailODStudents(autoSelectAll = false) {
  const eventFilter = document.getElementById('email-od-event-filter');
  const deptFilter = document.getElementById('email-od-dept-filter');
  const statusFilter = document.getElementById('email-od-status-filter');
  const searchInput = document.getElementById('email-od-search-input');

  const selectedEventName = eventFilter ? eventFilter.value : 'All';
  const selectedDept = deptFilter ? deptFilter.value : 'All';
  const selectedStatus = statusFilter ? statusFilter.value : 'All';
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // Get master candidate roster: either from current batch students or STATE.participants
  let candidatePool = [];
  let currentBatch = null;
  if (STATE.emailOD.currentBatchId && STATE.odBatches) {
    currentBatch = STATE.odBatches.find(b => b.id === STATE.emailOD.currentBatchId);
  }

  if (currentBatch && currentBatch.students && currentBatch.students.length > 0) {
    candidatePool = currentBatch.students.map(s => ({
      ...s,
      event: s.event || currentBatch.eventName
    }));
  } else if (STATE.participants && STATE.participants.length > 0) {
    candidatePool = [...STATE.participants];
  }

  // Apply filters
  let filtered = candidatePool.filter(s => {
    // 1. Filter by event
    if (selectedEventName && selectedEventName !== 'All') {
      const sEvent = (s.event || '').toLowerCase();
      if (sEvent !== selectedEventName.toLowerCase()) return false;
    }

    // 2. Filter by department
    if (selectedDept && selectedDept !== 'All') {
      const sDept = (s.dept || '').toUpperCase();
      if (sDept !== selectedDept.toUpperCase()) return false;
    }

    // 3. Filter by participant status
    if (selectedStatus && selectedStatus !== 'All') {
      const sStatus = (s.status || '').toLowerCase();
      if (sStatus !== selectedStatus.toLowerCase()) return false;
    }

    // 4. Search query
    if (searchQuery) {
      const matchName = (s.name || '').toLowerCase().includes(searchQuery);
      const matchReg = (s.reg || '').toLowerCase().includes(searchQuery);
      const matchDept = (s.dept || '').toLowerCase().includes(searchQuery);
      const matchEvent = (s.event || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchReg && !matchDept && !matchEvent) return false;
    }

    return true;
  });

  STATE.emailOD.filteredStudents = filtered;

  // Auto-select all filtered students on initial open if requested
  if (autoSelectAll && STATE.emailOD.selectedRegs.size === 0) {
    filtered.forEach(s => {
      if (s.reg) STATE.emailOD.selectedRegs.add(s.reg);
    });
  }

  // Update subject line if event filter changed
  const subjectInput = document.getElementById('email-od-subject-input');
  if (subjectInput && selectedEventName && selectedEventName !== 'All') {
    if (!subjectInput.value.includes(selectedEventName)) {
      subjectInput.value = `🏛️ Official NEC Sports OD Sanction Letter — ${selectedEventName}`;
    }
  }

  // Render Table Rows
  renderEmailODStudentTable();

  // Update preview if currently open
  if (STATE.emailOD.previewOpen) {
    updateEmailODPreview();
  }
}

/**
 * Render Student Athlete Rows in Email OD Selection Table
 */
function renderEmailODStudentTable() {
  const tbody = document.getElementById('email-od-student-table-body');
  const visibleCountEl = document.getElementById('email-od-visible-count');
  const selectedCountEl = document.getElementById('email-od-selected-count');
  const sendCountEl = document.getElementById('email-od-send-count');
  const masterCheck = document.getElementById('email-od-check-all');

  if (!tbody) return;

  const filtered = STATE.emailOD.filteredStudents || [];
  const selectedRegs = STATE.emailOD.selectedRegs;

  // Compute selected count amongst all or filtered
  const selectedCount = selectedRegs.size;
  if (visibleCountEl) visibleCountEl.textContent = filtered.length;
  if (selectedCountEl) selectedCountEl.textContent = selectedCount;
  if (sendCountEl) sendCountEl.textContent = selectedCount;

  // Update master checkbox status
  if (masterCheck) {
    if (filtered.length === 0) {
      masterCheck.checked = false;
      masterCheck.indeterminate = false;
    } else {
      const filteredSelectedCount = filtered.filter(s => selectedRegs.has(s.reg)).length;
      if (filteredSelectedCount === filtered.length) {
        masterCheck.checked = true;
        masterCheck.indeterminate = false;
      } else if (filteredSelectedCount > 0) {
        masterCheck.checked = false;
        masterCheck.indeterminate = true;
      } else {
        masterCheck.checked = false;
        masterCheck.indeterminate = false;
      }
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No students match the selected Event & Department criteria.
          <br><small>Try selecting "All Events" or "All Departments" to view available student athletes.</small>
        </td>
      </tr>
    `;
    return;
  }

  const statusBadges = {
    'Selected': 'badge-success',
    'Shortlisted': 'badge-warning',
    'Registered': 'badge-secondary',
    'Approved': 'badge-success'
  };

  tbody.innerHTML = filtered.map((s, idx) => {
    const isChecked = selectedRegs.has(s.reg);
    const email = s.email || `${s.reg}@nec.edu.in`;
    const badgeClass = statusBadges[s.status] || 'badge-outline';

    return `
      <tr style="${isChecked ? 'background-color: var(--primary-50, rgba(30, 58, 138, 0.05));' : ''}">
        <td style="text-align: center;">
          <input type="checkbox"
                 class="email-od-student-check"
                 data-reg="${escapeHtml(s.reg)}"
                 ${isChecked ? 'checked' : ''}
                 onchange="toggleStudentEmailODSelection('${escapeHtml(s.reg)}', this.checked)">
        </td>
        <td>
          <strong style="font-family: monospace; color: var(--primary-800);">${escapeHtml(s.reg)}</strong>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(s.name)}</div>
        </td>
        <td>
          <span class="badge badge-outline">${escapeHtml(s.dept || '—')}</span>
          <small class="text-muted">${escapeHtml(s.year || '')}</small>
        </td>
        <td>
          <span style="font-weight: 500;">${escapeHtml(s.event || 'Sports Event')}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}">${escapeHtml(s.status || 'Selected')}</span>
        </td>
        <td>
          <span style="font-size: 0.8rem; font-family: monospace; color: var(--text-muted);">${escapeHtml(email)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Toggle individual student selection
 */
function toggleStudentEmailODSelection(reg, isChecked) {
  if (isChecked) {
    STATE.emailOD.selectedRegs.add(reg);
  } else {
    STATE.emailOD.selectedRegs.delete(reg);
  }
  renderEmailODStudentTable();
  if (STATE.emailOD.previewOpen) {
    updateEmailODPreview();
  }
}

/**
 * Toggle Select All / Deselect All via Master Checkbox
 */
function toggleSelectAllEmailStudents(masterCheckbox) {
  const shouldSelect = masterCheckbox.checked;
  const filtered = STATE.emailOD.filteredStudents || [];

  filtered.forEach(s => {
    if (s.reg) {
      if (shouldSelect) {
        STATE.emailOD.selectedRegs.add(s.reg);
      } else {
        STATE.emailOD.selectedRegs.delete(s.reg);
      }
    }
  });

  renderEmailODStudentTable();
  if (STATE.emailOD.previewOpen) {
    updateEmailODPreview();
  }
}

/**
 * Select All / Clear Selection Helper Buttons
 */
function selectAllFilteredEmailStudents(selectState) {
  const filtered = STATE.emailOD.filteredStudents || [];
  filtered.forEach(s => {
    if (s.reg) {
      if (selectState) {
        STATE.emailOD.selectedRegs.add(s.reg);
      } else {
        STATE.emailOD.selectedRegs.delete(s.reg);
      }
    }
  });
  renderEmailODStudentTable();
  if (STATE.emailOD.previewOpen) {
    updateEmailODPreview();
  }
}

/**
 * Toggle Letterhead Preview
 */
function toggleEmailODPreview() {
  const container = document.getElementById('email-od-letterhead-preview-container');
  const toggleBtn = document.getElementById('btn-toggle-od-preview');
  if (!container) return;

  STATE.emailOD.previewOpen = !STATE.emailOD.previewOpen;
  if (STATE.emailOD.previewOpen) {
    container.style.display = 'block';
    if (toggleBtn) toggleBtn.textContent = '❌ Hide Letterhead Preview';
    updateEmailODPreview();
  } else {
    container.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '👁️ Show Letterhead Preview';
  }
}

/**
 * Update Letterhead Preview Content
 */
function updateEmailODPreview() {
  const previewEl = document.getElementById('email-od-letterhead-preview');
  const noticeEl = document.getElementById('email-od-preview-student-notice');
  if (!previewEl) return;

  // Resolve target student to preview
  let targetStudent = null;
  const filtered = STATE.emailOD.filteredStudents || [];
  const selectedRegs = STATE.emailOD.selectedRegs;

  // Find first selected student
  for (const s of filtered) {
    if (selectedRegs.has(s.reg)) {
      targetStudent = s;
      break;
    }
  }

  // Fallback to first filtered student or placeholder
  if (!targetStudent && filtered.length > 0) {
    targetStudent = filtered[0];
  }

  if (!targetStudent) {
    previewEl.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        Please select or filter students to preview the official OD sanction letterhead.
      </div>
    `;
    return;
  }

  const eventFilter = document.getElementById('email-od-event-filter');
  const sessionSelect = document.getElementById('email-od-session-select');
  const remarksInput = document.getElementById('email-od-remarks-input');

  const evName = targetStudent.event || (eventFilter && eventFilter.value !== 'All' ? eventFilter.value : 'College Sports Championship');
  const matchedEvent = STATE.events.find(e => (e.name || '').toLowerCase() === evName.toLowerCase()) || {};
  const evDate = matchedEvent.date ? formatDate(matchedEvent.date) : 'Upcoming Match Day';
  const evVenue = matchedEvent.venue || 'College Sports Ground';
  const session = sessionSelect ? sessionSelect.value : 'Full Day';
  const remarks = remarksInput ? remarksInput.value.trim() : 'Official OD sanction granted for representing NEC.';
  const academicYear = '2026-27';
  const refNo = `NEC/PED/OD/${academicYear}/${targetStudent.dept || 'GEN'}-${evName.slice(0, 4).toUpperCase()}/${Math.floor(1000 + Math.random() * 9000)}`;

  if (noticeEl) {
    noticeEl.innerHTML = `
      <span>📌 Previewing personalized letter for: <strong>${escapeHtml(targetStudent.name)}</strong> (${escapeHtml(targetStudent.reg)} - ${escapeHtml(targetStudent.dept || 'Engineering')}).</span>
      <span style="color: #0369a1; font-weight: 600; margin-left: 6px;">Total ${selectedRegs.size} student(s) selected will receive personalized letters via email.</span>
    `;
  }

  previewEl.innerHTML = `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.4; color: #0f172a; padding: 12px; background: #fff; border: 1px solid #94a3b8; border-radius: 4px;">
      <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px;">
        <h2 style="font-size: 16px; margin: 0; color: #1e3a8a; text-transform: uppercase; font-weight: 800;">
          NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)
        </h2>
        <div style="font-size: 11px; color: #334155;">(Affiliated to Anna University, Chennai • Accredited by NAAC & NBA)</div>
        <div style="font-size: 10px; color: #64748b;">K.R. Nagar, Kovilpatti – 628 503, Tamil Nadu</div>
        <div style="font-size: 12px; color: #991b1b; font-weight: bold; margin-top: 4px; text-transform: uppercase;">
          DEPARTMENT OF PHYSICAL EDUCATION & SPORTS
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; font-weight: 600;">
        <div>Ref No: <span style="font-family: monospace;">${escapeHtml(refNo)}</span></div>
        <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
      </div>

      <div style="font-size: 12px; line-height: 1.4; margin-bottom: 10px;">
        <strong>To:</strong><br>
        <strong>${escapeHtml(targetStudent.name)}</strong> (Reg No: <code>${escapeHtml(targetStudent.reg)}</code>)<br>
        Department of ${escapeHtml(targetStudent.dept || 'Concerned Dept')}, ${escapeHtml(targetStudent.year || 'III Year')}<br>
        National Engineering College, Kovilpatti.
      </div>

      <div style="background: #f1f5f9; border-left: 3px solid #1e3a8a; padding: 6px 10px; font-size: 11px; font-weight: bold; margin-bottom: 10px;">
        Sub: Sanction Order for On-Duty (OD) Attendance Permission — ${escapeHtml(evName)} — Reg.
      </div>

      <div style="font-size: 11.5px; text-align: justify; margin-bottom: 10px; line-height: 1.45;">
        This is to certify that <strong>${escapeHtml(targetStudent.name)}</strong> (Reg No: <strong>${escapeHtml(targetStudent.reg)}</strong>) has been officially sanctioned On-Duty (OD) attendance status to participate and represent National Engineering College in the <strong>${escapeHtml(evName)}</strong> on <strong>${escapeHtml(evDate)}</strong> at <strong>${escapeHtml(evVenue)}</strong> (${escapeHtml(session)}).
      </div>

      <div style="font-size: 11px; color: #475569; margin-bottom: 12px;">
        <em>*Official Purpose: ${escapeHtml(remarks)}</em>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 18px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10.5px; text-align: center;">
        <div style="width: 30%;">
          <strong>Dr. K. Murugan</strong><br>
          <span style="color: #64748b;">Physical Director</span><br>
          <span style="font-size: 9px; color: #166534; font-weight: bold;">[Digitally Certified]</span>
        </div>
        <div style="width: 30%;">
          <strong>Head of Department</strong><br>
          <span style="color: #64748b;">Dept. of ${escapeHtml(targetStudent.dept || 'Engineering')}</span>
        </div>
        <div style="width: 30%;">
          <strong>Dr. S. Shanmugavel</strong><br>
          <span style="color: #64748b;">Principal</span><br>
          <span style="font-size: 9px; color: #1e3a8a; font-weight: bold;">NEC Autonomous</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle Submitting Email OD Dispatch Request to Backend
 */
async function handleSendEmailODSubmit() {
  const selectedRegs = STATE.emailOD.selectedRegs;
  const filtered = STATE.emailOD.filteredStudents || [];

  // Gather selected student objects
  let candidatePool = [];
  let currentBatch = null;
  if (STATE.emailOD.currentBatchId && STATE.odBatches) {
    currentBatch = STATE.odBatches.find(b => b.id === STATE.emailOD.currentBatchId);
  }

  if (currentBatch && currentBatch.students && currentBatch.students.length > 0) {
    candidatePool = currentBatch.students;
  } else if (STATE.participants) {
    candidatePool = STATE.participants;
  }

  const selectedStudents = candidatePool.filter(s => selectedRegs.has(s.reg));

  const ccInput = document.getElementById('email-od-cc-input');
  const customRecipients = ccInput ? ccInput.value.trim() : '';

  if (selectedStudents.length === 0 && !customRecipients) {
    showToast('Please select at least one student athlete to email the OD letter.', 'warning', 3500);
    return;
  }

  const eventFilter = document.getElementById('email-od-event-filter');
  const deptFilter = document.getElementById('email-od-dept-filter');
  const subjectInput = document.getElementById('email-od-subject-input');
  const sessionSelect = document.getElementById('email-od-session-select');
  const remarksInput = document.getElementById('email-od-remarks-input');
  const submitBtn = document.getElementById('btn-send-email-od');

  const selectedEventName = eventFilter ? eventFilter.value : 'All';
  const matchedEvent = STATE.events.find(e => (e.name || '').toLowerCase() === selectedEventName.toLowerCase());
  const eventId = matchedEvent ? matchedEvent.id : (currentBatch ? currentBatch.eventId : null);
  const department = deptFilter ? deptFilter.value : 'All';
  const subject = subjectInput ? subjectInput.value.trim() : '';
  const session = sessionSelect ? sessionSelect.value : 'Full Day';
  const customRemarks = remarksInput ? remarksInput.value.trim() : '';

  // Confirmation dialog
  const confirmMsg = `Are you sure you want to dispatch official OD sanction emails to ${selectedStudents.length} student athlete(s)${customRecipients ? ` and CC to: ${customRecipients}` : ''}?`;
  if (!confirm(confirmMsg)) {
    return;
  }

  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-sm"></span> Dispatching Official OD Letters...`;
  }

  try {
    const payload = {
      batchId: STATE.emailOD.currentBatchId,
      eventId,
      eventName: selectedEventName !== 'All' ? selectedEventName : (currentBatch ? currentBatch.eventName : 'Sports Event'),
      department,
      students: selectedStudents.map(s => ({
        name: s.name,
        reg: s.reg,
        dept: s.dept,
        year: s.year || 'III Year',
        event: s.event || selectedEventName,
        email: s.email || `${s.reg}@nec.edu.in`
      })),
      customRecipients,
      subject,
      customRemarks,
      session
    };

    const res = await api('/api/od/email-dispatch', {
      method: 'POST',
      body: payload
    });

    if (res.success) {
      showToast(
        `✉️ ${res.message || `Official OD letter dispatched to ${res.totalSent} recipient(s)!`}`,
        'success',
        5000
      );

      // Play success audio feedback if available
      if (typeof playNotificationChime === 'function') {
        playNotificationChime();
      }

      // Close modal
      closeModal('email-od-modal');

      // Refresh OD batches table
      if (typeof loadODBatchesList === 'function') {
        loadODBatchesList();
      }

      // Refresh notification badge
      if (typeof fetchNotifications === 'function') {
        fetchNotifications();
      }
    } else {
      showToast(res.message || 'Failed to dispatch OD emails.', 'error', 4000);
    }
  } catch (err) {
    showToast(err.message || 'Error occurred while emailing OD letters.', 'error', 4500);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

/**
 * Open Mailto Fallback Link in User's Email Client (Outlook / Gmail)
 */
function openMailtoODFallback() {
  const selectedRegs = STATE.emailOD.selectedRegs;
  const filtered = STATE.emailOD.filteredStudents || [];

  let candidatePool = [];
  if (STATE.emailOD.currentBatchId && STATE.odBatches) {
    const batch = STATE.odBatches.find(b => b.id === STATE.emailOD.currentBatchId);
    if (batch && batch.students) candidatePool = batch.students;
  }
  if (candidatePool.length === 0 && STATE.participants) {
    candidatePool = STATE.participants;
  }

  const selectedStudents = candidatePool.filter(s => selectedRegs.has(s.reg));
  const studentEmails = selectedStudents.map(s => s.email || `${s.reg}@nec.edu.in`);

  const ccInput = document.getElementById('email-od-cc-input');
  const ccEmails = ccInput ? ccInput.value.trim() : '';

  const subjectInput = document.getElementById('email-od-subject-input');
  const subject = subjectInput ? subjectInput.value.trim() : 'Official NEC Sports OD Sanction Letter';

  const sessionSelect = document.getElementById('email-od-session-select');
  const remarksInput = document.getElementById('email-od-remarks-input');
  const eventFilter = document.getElementById('email-od-event-filter');

  const evName = (eventFilter && eventFilter.value !== 'All') ? eventFilter.value : 'Sports Championship';
  const session = sessionSelect ? sessionSelect.value : 'Full Day';
  const remarks = remarksInput ? remarksInput.value.trim() : 'Attendance regularization approved.';

  const bodyText = 
    `NATIONAL ENGINEERING COLLEGE (AUTONOMOUS), KOVILPATTI\n` +
    `DEPARTMENT OF PHYSICAL EDUCATION & SPORTS\n\n` +
    `OFFICIAL ON-DUTY (OD) ATTENDANCE SANCTION ORDER\n` +
    `--------------------------------------------------\n` +
    `Tournament / Event: ${evName}\n` +
    `Session: ${session}\n` +
    `Official Remarks: ${remarks}\n\n` +
    `Selected Student Athlete(s) (${selectedStudents.length}):\n` +
    selectedStudents.map((s, idx) => `${idx + 1}. ${s.name} (${s.reg}) - Dept: ${s.dept}`).join('\n') +
    `\n\nKindly regularize attendance for the above student athletes.\n\n` +
    `Dr. K. Murugan, Physical Director\n` +
    `National Engineering College (Autonomous)`;

  const toList = studentEmails.slice(0, 20).join(',');
  let mailtoUrl = `mailto:${toList}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  if (ccEmails) {
    mailtoUrl += `&cc=${encodeURIComponent(ccEmails)}`;
  }

  window.open(mailtoUrl, '_blank');
}

// ============================================================================
// 8. OFFICIAL PRINTABLE OD LETTERHEAD GENERATION (NEC AUTONOMOUS)
// ============================================================================
/**
 * Generates and triggers high-fidelity printable official letterhead
 * including college seals, reference formula, autonomous affiliation,
 * student roster table, and triple signature blocks (PED, HOD, Principal).
 */
function printOfficialODLetterhead(batchId) {
  const batch = STATE.odBatches.find(b => b.id === batchId);
  if (!batch) {
    showToast('Batch record not found.', 'error');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=950,height=1100');
  if (!printWindow) {
    showToast('Pop-up blocked. Please allow popups to print official letterhead.', 'warning');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const studentsRows = (batch.students || []).map((s, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-family: monospace; font-weight: bold;">${escapeHtml(s.reg)}</td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td style="text-align: center;">${escapeHtml(s.dept)}</td>
      <td style="text-align: center;">${escapeHtml(s.year || 'III Year')}</td>
      <td style="text-align: center;">${escapeHtml(s.gender || '—')}</td>
      <td style="text-align: center; color: #166534; font-weight: bold;">${escapeHtml(s.odStatus || 'Granted')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official OD Requisition — ${escapeHtml(batch.refNo)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 20px;
          line-height: 1.45;
          font-size: 13pt;
        }
        .letterhead-border {
          border: 2px solid #1e3a8a;
          padding: 24px;
          border-radius: 4px;
          min-height: 98%;
          position: relative;
        }
        .header-table {
          width: 100%;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .logo-col {
          width: 90px;
          vertical-align: middle;
          text-align: center;
        }
        .logo-img {
          max-width: 80px;
          height: auto;
        }
        .header-text-col {
          text-align: center;
          vertical-align: middle;
        }
        .college-title {
          font-size: 19pt;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .college-sub {
          font-size: 10pt;
          font-weight: bold;
          color: #374151;
          margin: 2px 0;
        }
        .college-address {
          font-size: 9.5pt;
          color: #4b5563;
          margin: 2px 0;
        }
        .dept-banner {
          font-size: 12.5pt;
          font-weight: bold;
          color: #991b1b;
          text-transform: uppercase;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }
        .ref-date-row {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          margin-bottom: 14px;
          font-size: 11pt;
          font-weight: 600;
        }
        .recipient-block {
          margin-bottom: 16px;
          font-size: 12pt;
          line-height: 1.4;
        }
        .subject-block {
          background-color: #f3f4f6;
          border-left: 4px solid #1e3a8a;
          padding: 8px 12px;
          margin: 14px 0;
          font-weight: bold;
          font-size: 11.5pt;
        }
        .content-para {
          text-align: justify;
          text-indent: 30px;
          margin-bottom: 12px;
          font-size: 12pt;
        }
        .roster-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 10.5pt;
        }
        .roster-table th, .roster-table td {
          border: 1px solid #374151;
          padding: 6px 8px;
        }
        .roster-table th {
          background-color: #1e3a8a;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
        }
        .roster-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .stamp-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 50px;
          padding-top: 20px;
        }
        .sig-block {
          text-align: center;
          width: 30%;
        }
        .sig-line {
          border-top: 1px solid #111827;
          margin-top: 40px;
          padding-top: 5px;
          font-weight: bold;
          font-size: 11pt;
        }
        .sig-role {
          font-size: 9.5pt;
          color: #4b5563;
        }
        .seal-box {
          border: 1px dashed #9ca3af;
          width: 120px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9pt;
          color: #6b7280;
          margin: 0 auto;
          text-transform: uppercase;
        }
        .print-btn-bar {
          background: #1e3a8a;
          color: white;
          padding: 10px 20px;
          text-align: right;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .print-btn-bar button {
          background: #22c55e;
          border: none;
          color: white;
          padding: 8px 16px;
          font-size: 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        @media print {
          .print-btn-bar { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button onclick="window.print()">🖨️ Click to Print / Save as PDF</button>
      </div>

      <div class="letterhead-border">
        <table class="header-table">
          <tr>
            <td class="logo-col">
              <img src="assets/nec-logo.png" class="logo-img" alt="NEC Logo" onerror="this.style.display='none'">
            </td>
            <td class="header-text-col">
              <h1 class="college-title">National Engineering College</h1>
              <div class="college-sub">(An Autonomous Institution, Affiliated to Anna University, Chennai)</div>
              <div class="college-address">K.R. Nagar, Kovilpatti – 628 503, Thoothukudi District, Tamil Nadu</div>
              <div class="dept-banner">Department of Physical Education & Sports</div>
            </td>
          </tr>
        </table>

        <div class="ref-date-row">
          <div>Ref No: <span style="font-family: monospace; font-size: 11pt;">${escapeHtml(batch.refNo)}</span></div>
          <div>Date: ${currentDate}</div>
        </div>

        <div class="recipient-block">
          <strong>To:</strong><br>
          The Head of the Department,<br>
          Department of ${escapeHtml(batch.department === 'All' ? 'Concerned Departments (CSE / ECE / EEE / MECH / CIVIL / IT / AIDS / S&H)' : batch.department)},<br>
          National Engineering College (Autonomous),<br>
          Kovilpatti – 628 503.
        </div>

        <div class="subject-block">
          Sub: Requisition for On-Duty (OD) Permission for College Sports Tournament / Trials — Reg.
        </div>

        <p class="content-para">
          Respected Sir / Madam,<br>
          The following bonafide student(s) of your esteemed department have been officially selected / verified to represent our college in the <strong>${escapeHtml(batch.eventName)}</strong> competition scheduled to be held on <strong>${formatDate(batch.eventDate)}</strong> at <strong>${escapeHtml(batch.venue)}</strong> (${escapeHtml(batch.session || 'Full Day')}).
        </p>

        <p class="content-para">
          Hence, it is kindly requested that On-Duty (OD) attendance permission may be granted to the student(s) listed below for the specified duration to facilitate their participation in the college sports championship.
        </p>

        <table class="roster-table">
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th style="width: 18%;">Register No</th>
              <th style="width: 32%;">Student Name</th>
              <th style="width: 12%;">Dept</th>
              <th style="width: 12%;">Year</th>
              <th style="width: 10%;">Gender</th>
              <th style="width: 11%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${studentsRows}
          </tbody>
        </table>

        <div style="font-size: 10pt; color: #4b5563; margin-top: 6px;">
          *Remarks: ${escapeHtml(batch.remarks || 'Duly sanctioned for college sports quota attendance benefit.')}
        </div>

        <div class="stamp-section">
          <div class="sig-block">
            <div class="seal-box">College Sports Seal</div>
            <div class="sig-line">Physical Director</div>
            <div class="sig-role">Dept. of Physical Education</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">Head of Department</div>
            <div class="sig-role">Dept. of ${escapeHtml(batch.department)}</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">Principal</div>
            <div class="sig-role">NEC Autonomous</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

// Student Personal OD Slip Printer (for tutor submission)
function printSingleStudentODSlip(record) {
  const printWindow = window.open('', '_blank', 'width=750,height=800');
  if (!printWindow) {
    showToast('Pop-up blocked. Please allow popups.', 'warning');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Personal OD Slip — ${escapeHtml(record.studentName)}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 25px; line-height: 1.5; }
        .slip-box { border: 2px dashed #1e3a8a; padding: 20px; border-radius: 6px; }
        .slip-header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 16pt; font-weight: bold; color: #1e3a8a; margin: 0; }
        .subtitle { font-size: 10pt; color: #4b5563; }
        .ref-bar { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px; font-size: 11pt; }
        .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-data td { padding: 6px 10px; border: 1px solid #ccc; font-size: 11pt; }
        .table-data td.lbl { background: #f3f4f6; font-weight: bold; width: 35%; }
        .sigs { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
        .sig { width: 30%; border-top: 1px solid black; padding-top: 5px; font-size: 10pt; font-weight: bold; }
        @media print { .btn { display: none; } }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button class="btn" onclick="window.print()" style="padding: 8px 16px; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer;">🖨️ Print OD Slip</button>
      </div>
      <div class="slip-box">
        <div class="slip-header">
          <div class="title">NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)</div>
          <div class="subtitle">Department of Physical Education & Sports • Student OD Sanction Slip</div>
        </div>
        <div class="ref-bar">
          <div>Ref: <span style="font-family: monospace;">${escapeHtml(record.refNo)}</span></div>
          <div>Date: ${formatDate(record.generatedAt || new Date())}</div>
        </div>
        <table class="table-data">
          <tr><td class="lbl">Student Name</td><td><strong>${escapeHtml(record.studentName)}</strong></td></tr>
          <tr><td class="lbl">Register Number</td><td><strong style="font-family: monospace;">${escapeHtml(record.reg || record.studentReg)}</strong></td></tr>
          <tr><td class="lbl">Department & Year</td><td>${escapeHtml(record.studentDept)} (${escapeHtml(record.studentYear || 'III Year')})</td></tr>
          <tr><td class="lbl">Sports Event</td><td><strong>${escapeHtml(record.eventName)}</strong></td></tr>
          <tr><td class="lbl">Event Date & Session</td><td>${formatDate(record.eventDate)} (${escapeHtml(record.session || 'Full Day')})</td></tr>
          <tr><td class="lbl">Venue</td><td>${escapeHtml(record.venue)}</td></tr>
          <tr><td class="lbl">Sanction Status</td><td><span style="color: green; font-weight: bold;">${escapeHtml(record.odStatus || record.batchStatus)}</span></td></tr>
        </table>
        <p style="font-size: 10pt; color: #4b5563;">
          *Certified that the above student has represented the college sports contingent. Please condone class attendance for the sanctioned session.
        </p>
        <div class="sigs">
          <div class="sig">Staff / Physical Director</div>
          <div class="sig">Class Tutor / Advisor</div>
          <div class="sig">Head of Department</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

async function exportODBatchCSV(batchId) {
  try {
    const blob = await api(`/api/reports/export/od/${batchId}`, { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEC_OD_Batch_${batchId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast('OD batch CSV exported successfully.', 'success');
  } catch (err) {
    showToast('Failed to export CSV: ' + err.message, 'error');
  }
}

// ============================================================================
// 9. LIVE ATTENDANCE MANAGEMENT & 1-CLICK OD GENERATION
// ============================================================================
async function loadAttendanceTab() {
  const eventSelect = document.getElementById('attendance-event-select');
  if (!eventSelect) return;

  // Populate events
  eventSelect.innerHTML = `<option value="">-- Select Sports Event --</option>` +
    STATE.events.map(e => `<option value="${escapeHtml(e.name)}">${escapeHtml(e.name)} (${formatDate(e.date)} - ${escapeHtml(e.venue)})</option>`).join('');

  eventSelect.onchange = (e) => {
    loadAttendanceRoster(e.target.value);
  };

  // If already selected, load
  if (eventSelect.value) {
    loadAttendanceRoster(eventSelect.value);
  }
}

async function loadAttendanceRoster(eventName) {
  const container = document.getElementById('attendance-table-body');
  const actionRow = document.getElementById('attendance-action-row');
  if (!container) return;

  if (!eventName) {
    container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Select an event above to record attendance.</td></tr>`;
    if (actionRow) actionRow.style.display = 'none';
    return;
  }

  STATE.selectedEventForAttendance = eventName;
  container.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner"></div><p>Fetching registered participants...</p></td></tr>`;

  try {
    const res = await api(`/api/attendance?event=${encodeURIComponent(eventName)}`);
    STATE.attendanceRecords = res.data || [];

    if (STATE.attendanceRecords.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No students registered for this event yet.</td></tr>`;
      if (actionRow) actionRow.style.display = 'none';
      return;
    }

    if (actionRow) actionRow.style.display = 'flex';

    container.innerHTML = STATE.attendanceRecords.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong style="font-family: monospace;">${escapeHtml(item.reg)}</strong></td>
        <td>${escapeHtml(item.name)}</td>
        <td><span class="badge badge-outline">${escapeHtml(item.dept)}</span></td>
        <td>${escapeHtml(item.year || 'III Year')}</td>
        <td style="text-align: center;">
          <label class="switch-label">
            <input type="checkbox" class="attendance-check" data-reg="${escapeHtml(item.reg)}" ${item.present ? 'checked' : ''}>
            <span class="status-indicator">${item.present ? '✓ Present' : '✗ Absent'}</span>
          </label>
        </td>
      </tr>
    `).join('');

    // Toggle label dynamically
    document.querySelectorAll('.attendance-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const span = e.target.parentElement.querySelector('.status-indicator');
        if (span) {
          span.textContent = e.target.checked ? '✓ Present' : '✗ Absent';
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load attendance: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function setAllAttendance(presentStatus) {
  document.querySelectorAll('.attendance-check').forEach(chk => {
    chk.checked = presentStatus;
    const span = chk.parentElement.querySelector('.status-indicator');
    if (span) span.textContent = presentStatus ? '✓ Present' : '✗ Absent';
  });
  showToast(`Marked all students as ${presentStatus ? 'Present' : 'Absent'}`, 'info', 1500);
}

async function saveAttendanceRecords(autoGenerateODAfter = false) {
  if (!STATE.selectedEventForAttendance) {
    showToast('Please select an event first.', 'warning');
    return;
  }

  const checks = document.querySelectorAll('.attendance-check');
  const records = [];

  checks.forEach(chk => {
    const reg = chk.dataset.reg;
    const item = STATE.attendanceRecords.find(a => a.reg === reg);
    if (item) {
      records.push({
        reg: item.reg,
        name: item.name,
        dept: item.dept,
        present: chk.checked
      });
    }
  });

  try {
    const res = await api('/api/attendance', {
      method: 'POST',
      body: {
        event: STATE.selectedEventForAttendance,
        records
      }
    });

    if (res.success) {
      showToast(`Saved attendance: ${res.presentCount} present out of ${records.length} students.`, 'success');

      if (autoGenerateODAfter) {
        // Automatically trigger OD generation for students marked Present
        triggerODFromAttendance(STATE.selectedEventForAttendance, records);
      }
    }
  } catch (err) {
    showToast(err.message || 'Failed to save attendance', 'error');
  }
}

// Standout One-Click OD Feature from Attendance
async function triggerODFromAttendance(eventName, attendanceRecords) {
  const event = STATE.events.find(e => e.name.toLowerCase() === eventName.toLowerCase());
  const presentCount = attendanceRecords.filter(r => r.present).length;

  if (presentCount === 0) {
    showToast('Cannot generate OD: No students were marked Present.', 'warning');
    return;
  }

  showToast(`Generating official OD batch for ${presentCount} present students...`, 'info', 2000);

  try {
    const res = await api('/api/od/auto-generate', {
      method: 'POST',
      body: {
        eventId: event ? event.id : undefined,
        session: 'Full Day',
        minStatus: 'All',
        requireAttendancePresent: true,
        splitByDepartment: false,
        remarks: `Attendance-linked OD sanctioned for ${presentCount} present participants in ${eventName}`
      }
    });

    if (res.success) {
      showToast(`🎉 Attendance Saved & Official OD Batch Auto-Generated! Ref: ${res.data ? res.data.refNo : 'Created'}`, 'success', 4500);
      switchPortalTab('auto-od');
    }
  } catch (err) {
    showToast('Attendance saved, but OD generation failed: ' + err.message, 'warning');
  }
}

// ============================================================================
// 10. EVENTS MANAGEMENT (Staff / Admin)
// ============================================================================
async function loadEventsManagementTable() {
  const container = document.getElementById('events-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner"></div><p>Loading events...</p></td></tr>`;

  try {
    const res = await api('/api/events');
    STATE.events = res.data || [];

    if (STATE.events.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No events found. Click "Add Event" to schedule.</td></tr>`;
      return;
    }

    container.innerHTML = STATE.events.map((e, idx) => {
      const isCompleted = (e.status || '').toLowerCase() === 'completed';
      const winnerName = e.results ? e.results.winner : null;

      return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${escapeHtml(e.name)}</strong>
          ${winnerName ? `<div style="font-size: 0.775rem; color: #b45309; font-weight: 700; margin-top: 2px;">🥇 Winner: ${escapeHtml(winnerName)} (${e.results.scoreDifference || 0} pts lead)</div>` : ''}
        </td>
        <td><span class="badge badge-outline">${escapeHtml(e.category)}</span></td>
        <td>${formatDate(e.date)} • ${escapeHtml(e.time || '09:00 AM')}</td>
        <td>${escapeHtml(e.venue)}</td>
        <td>
          <span class="badge ${isCompleted ? 'badge-success' : (e.status === 'Ongoing' ? 'badge-warning' : 'badge-primary')}">
            ${escapeHtml(e.status || 'Open')}
          </span>
          <div class="text-muted small">${e.participantCount || 0} / ${e.limit || 40} Athletes</div>
        </td>
        <td>
          <div class="action-btn-group">
            ${isCompleted ? `
              <button class="btn btn-sm btn-icon" title="View Results & WhatsApp Broadcast" onclick="openCompletedResultsHub(${e.id})" style="background: rgba(37, 211, 102, 0.15); color: #166534; border: 1px solid rgba(37, 211, 102, 0.4);">
                🏆
              </button>
            ` : `
              <button class="btn btn-sm btn-icon" title="Conclude Match & Publish Results" onclick="openConcludeEventModal(${e.id})" style="background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.4);">
                🏆
              </button>
            `}
            <button class="btn btn-sm btn-icon" title="Edit Event" onclick="openEditEventModal(${e.id})">✏️</button>
            ${STATE.user.role === 'admin' ? `
              <button class="btn btn-sm btn-icon btn-danger" title="Delete Event" onclick="deleteEvent(${e.id})">🗑️</button>
            ` : ''}
          </div>
        </td>
      </tr>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load events: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function openAddEventModal() {
  const form = document.getElementById('event-form');
  if (form) form.reset();
  const idInput = document.getElementById('event-form-id');
  if (idInput) idInput.value = '';
  const title = document.getElementById('event-modal-title');
  if (title) title.textContent = 'Schedule New Sports Event';
  openModal('event-modal');
}

function openEditEventModal(eventId) {
  const event = STATE.events.find(e => e.id === eventId);
  if (!event) return;

  const form = document.getElementById('event-form');
  if (!form) return;

  const setVal = (name, val) => {
    if (form[name]) form[name].value = val || '';
  };

  const idInput = document.getElementById('event-form-id');
  if (idInput) idInput.value = event.id;

  setVal('name', event.name);
  setVal('category', event.category);
  setVal('type', event.type);
  setVal('venue', event.venue);
  setVal('date', event.date);
  setVal('time', event.time);
  setVal('status', event.status);
  setVal('limit', event.limit);
  setVal('description', event.description);

  const title = document.getElementById('event-modal-title');
  if (title) title.textContent = `Edit Event: ${event.name}`;

  openModal('event-modal');
}

async function handleSaveEvent(e) {
  e.preventDefault();
  const form = e.target;
  const id = document.getElementById('event-form-id').value;

  const payload = {
    name: form.name.value.trim(),
    category: form.category.value,
    type: form.type.value,
    venue: form.venue.value.trim(),
    date: form.date.value,
    time: form.time.value,
    status: form.status.value,
    limit: parseInt(form.limit.value) || 40,
    description: form.description ? form.description.value.trim() : ''
  };

  try {
    let res;
    if (id) {
      res = await api(`/api/events/${id}`, { method: 'PUT', body: payload });
    } else {
      res = await api('/api/events', { method: 'POST', body: payload });
    }

    if (res.success) {
      showToast(res.message || 'Event saved successfully!', 'success');
      closeModal('event-modal');
      loadEventsManagementTable();
    }
  } catch (err) {
    showToast(err.message || 'Failed to save event', 'error');
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event? This action is irreversible.')) return;
  try {
    const res = await api(`/api/events/${eventId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Event removed.', 'info');
      loadEventsManagementTable();
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete event', 'error');
  }
}

// ============================================================================
// 11. PARTICIPANTS ROSTER (Staff / Admin)
// ============================================================================
function renderRosterRows(participants, filters = {}) {
  const container = document.getElementById('roster-table-body');
  if (!container) return;

  let filtered = [...participants];
  if (filters.event && filters.event !== 'All') {
    filtered = filtered.filter(p => (p.event || '').toLowerCase() === filters.event.toLowerCase());
  }
  if (filters.dept && filters.dept !== 'All') {
    filtered = filtered.filter(p => (p.dept || '').toLowerCase() === filters.dept.toLowerCase());
  }
  if (filters.status && filters.status !== 'All') {
    filtered = filtered.filter(p => (p.status || '').toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q) || (p.reg || '').toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No participants found matching the criteria.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map((p, idx) => {
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong style="font-family: monospace;">${escapeHtml(p.reg)}</strong></td>
        <td>${escapeHtml(p.name)}</td>
        <td><span class="badge badge-outline">${escapeHtml(p.dept)}</span></td>
        <td>${escapeHtml(p.year || 'III Year')}</td>
        <td><strong>${escapeHtml(p.event)}</strong></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateParticipantStatus(${p.id}, this.value)">
            <option value="Selected" ${p.status === 'Selected' ? 'selected' : ''}>Selected</option>
            <option value="Shortlisted" ${p.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="Rejected" ${p.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-icon" title="View Student OD" onclick="lookupStudentODByReg('${escapeHtml(p.reg)}')">
            📋
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadParticipantsRosterTable(filters = {}) {
  const container = document.getElementById('roster-table-body');
  if (!container) return;

  const currentList = (STATE.participants && STATE.participants.length > 0) ? STATE.participants : SEED_PARTICIPANTS;
  renderRosterRows(currentList, filters);

  try {
    const query = new URLSearchParams();
    if (filters.event && filters.event !== 'All') query.append('event', filters.event);
    if (filters.dept && filters.dept !== 'All') query.append('dept', filters.dept);
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.search) query.append('search', filters.search);

    const res = await api(`/api/participants?${query.toString()}`);
    if (res && res.data && res.data.length > 0) {
      STATE.participants = res.data;
      renderRosterRows(STATE.participants, filters);
    }
  } catch (err) {
    console.warn('Participants API sync fallback:', err.message);
  }
}

async function updateParticipantStatus(id, newStatus) {
  try {
    const res = await api(`/api/participants/${id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    });
    if (res.success) {
      showToast(`Participant status updated to ${newStatus}`, 'success', 1500);
    }
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
  }
}

// ============================================================================
// 12. STUDENT SELF-SERVICE PORTAL FEATURES
// ============================================================================
async function loadStudentPersonalOD() {
  const container = document.getElementById('student-personal-od-list');
  if (!container) return;

  const reg = STATE.user.reg;
  if (!reg) {
    container.innerHTML = `<div class="empty-state"><p>No register number associated with your profile.</p></div>`;
    return;
  }

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Fetching your official OD passes...</p></div>`;

  try {
    const res = await api(`/api/od/student/${encodeURIComponent(reg)}`);
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎫</div>
          <h4>No OD Passes Issued Yet</h4>
          <p>Once you are selected and approved for college sports, your On-Duty passes will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="od-cards-grid">
        ${list.map(od => `
          <div class="od-personal-card">
            <div class="od-card-header">
              <span class="ref-no-badge">Ref: ${escapeHtml(od.refNo)}</span>
              <span class="badge ${od.odStatus === 'HOD Approved' || od.odStatus === 'Approved' ? 'badge-success' : 'badge-warning'}">
                ${escapeHtml(od.odStatus || od.batchStatus)}
              </span>
            </div>
            <div class="od-card-body">
              <h3>${escapeHtml(od.eventName)}</h3>
              <div class="od-meta-line">📅 Date: <strong>${formatDate(od.eventDate)}</strong> (${escapeHtml(od.session || 'Full Day')})</div>
              <div class="od-meta-line">📍 Venue: <strong>${escapeHtml(od.venue)}</strong></div>
              <div class="od-meta-line">👤 Student: <strong>${escapeHtml(od.studentName)} (${escapeHtml(od.studentDept)})</strong></div>
            </div>
            <div class="od-card-footer">
              <button class="btn btn-primary btn-sm btn-block" onclick="printSingleStudentODSlip(${JSON.stringify(od).replace(/"/g, '&quot;')})">
                🖨️ Print Personal OD Slip
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-state"><p>Error fetching OD passes: ${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadStudentRegisteredEvents() {
  const container = document.getElementById('student-enrolled-events-list');
  if (!container) return;

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading your event registrations...</p></div>`;

  try {
    const studentReg = (STATE.user?.reg || '').trim();
    const studentName = (STATE.user?.name || '').trim();

    let myRegistrations = [];
    try {
      const qParams = new URLSearchParams();
      if (studentReg && studentReg !== 'null') qParams.append('reg', studentReg);
      if (studentName) qParams.append('name', studentName);
      if (STATE.user?.email) qParams.append('email', STATE.user.email);
      const res = await api(`/api/participants/my?${qParams.toString()}`);
      myRegistrations = res.data || [];
    } catch {
      // Fallback
      try {
        const res = await api('/api/participants');
        const allP = res.data || [];
        myRegistrations = allP.filter(p => {
          const pReg = (p.reg || '').toLowerCase();
          const pName = (p.name || '').toLowerCase();
          if (studentReg && studentReg !== 'null' && pReg === studentReg.toLowerCase()) return true;
          if (studentName && (pName === studentName.toLowerCase() || pName.includes(studentName.toLowerCase()) || studentName.toLowerCase().includes(pName))) return true;
          return false;
        });
      } catch {}
    }

    if (myRegistrations.length > 0 && (!STATE.user.reg || STATE.user.reg === 'null')) {
      STATE.user.reg = myRegistrations[0].reg;
      localStorage.setItem('nec_sports_user', JSON.stringify(STATE.user));
      const regEl = document.getElementById('overview-student-reg');
      if (regEl) regEl.textContent = STATE.user.reg;
    }

    if (myRegistrations.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1.5rem; text-align: center;">
          <div class="empty-icon" style="font-size: 3.5rem;">🏃</div>
          <h4>You have not registered for any events yet</h4>
          <p style="color: var(--text-muted); margin: 0.5rem 0 1.25rem;">Browse available tournaments and enroll to compete for your department trophy!</p>
          <button class="btn btn-primary" onclick="openRegistrationModal()">
            ⚡ Browse & Register for Sports Event
          </button>
        </div>
      `;
      return;
    }

    // Also get student ODs to link OD passes directly
    let myODs = [];
    try {
      const odRes = await api(`/api/od/student/${encodeURIComponent(reg)}`);
      myODs = odRes.data || [];
    } catch {}

    const events = STATE.events || [];

    container.innerHTML = `
      <div class="card mb-3" style="background: var(--bg-body); padding: 1rem 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <strong>Enrolled Tournaments:</strong> <span class="badge badge-primary">${myRegistrations.length} Events</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openRegistrationModal()">
            ➕ Register for Another Event
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tournament Event</th>
              <th>Category</th>
              <th>Tournament Date & Venue</th>
              <th>Selection Status</th>
              <th>OD Sanction Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${myRegistrations.map((r, idx) => {
              const ev = events.find(e => (e.name || '').toLowerCase() === (r.event || '').toLowerCase());
              const odMatch = myODs.find(o => (o.eventName || '').toLowerCase() === (r.event || '').toLowerCase());
              const statusClass = r.status === 'Selected' ? 'badge-success' : (r.status === 'Shortlisted' ? 'badge-warning' : 'badge-secondary');

              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>
                    <strong style="color: var(--primary-800); font-size: 1rem;">${escapeHtml(r.event)}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Registered on ${formatDate(r.registeredAt)}</div>
                  </td>
                  <td><span class="badge badge-outline">${ev ? escapeHtml(ev.category) : 'Sports'}</span></td>
                  <td>
                    <div>📅 <strong>${ev ? formatDate(ev.date) : 'Upcoming'}</strong> (${ev ? escapeHtml(ev.time || '09:00 AM') : 'TBA'})</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">📍 ${ev ? escapeHtml(ev.venue) : 'College Ground'}</div>
                  </td>
                  <td><span class="badge ${statusClass}">${escapeHtml(r.status || 'Enrolled')}</span></td>
                  <td>
                    ${odMatch ? `
                      <span class="badge ${odMatch.odStatus === 'HOD Approved' || odMatch.odStatus === 'Approved' ? 'badge-success' : 'badge-warning'}">
                        ✓ ${escapeHtml(odMatch.odStatus || 'Sanctioned')}
                      </span>
                      <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Ref: ${escapeHtml(odMatch.refNo)}</div>
                    ` : `
                      <span class="badge badge-outline" style="opacity: 0.75;">Pending OD Processing</span>
                    `}
                  </td>
                  <td>
                    <div class="action-btn-group">
                      ${odMatch ? `
                        <button class="btn btn-sm btn-primary" title="Print Personal OD Slip" onclick="printSingleStudentODSlip(${JSON.stringify(odMatch).replace(/"/g, '&quot;')})">
                          🖨️ Print OD Slip
                        </button>
                      ` : ''}
                      <button class="btn btn-sm btn-outline btn-danger" title="Withdraw / Cancel Registration" onclick="cancelStudentRegistration(${r.id}, '${escapeHtml(r.event)}')">
                        ✕ Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to load events: ${escapeHtml(err.message)}</p>`;
  }
}

async function cancelStudentRegistration(id, eventName) {
  if (!confirm(`Are you sure you want to cancel your registration for ${eventName}?`)) return;
  try {
    const res = await api(`/api/participants/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(res.message || 'Registration cancelled successfully.', 'info');
      loadOverviewStats();
      loadStudentRegisteredEvents();
      if (typeof loadPublicEvents === 'function') loadPublicEvents();
    }
  } catch (err) {
    showToast(err.message || 'Failed to cancel registration', 'error');
  }
}

// ============================================================================
// 13. OD ANALYTICS & POINTS MANAGEMENT
// ============================================================================
async function loadODAnalyticsView() {
  const container = document.getElementById('od-analytics-container');
  if (!container) return;

  try {
    const res = await api('/api/od/analytics');
    const data = res.data || { totalBatches: 0, totalStudentODs: 0, departmentBreakdown: {} };

    const breakdown = data.departmentBreakdown || {};
    const maxVal = Math.max(...Object.values(breakdown), 1);

    container.innerHTML = `
      <div class="stats-overview-grid mb-4">
        <div class="stat-card">
          <div class="stat-icon">📑</div>
          <div class="stat-info">
            <span class="stat-value">${data.totalBatches}</span>
            <span class="stat-label">Total OD Batches Generated</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-info">
            <span class="stat-value">${data.totalStudentODs}</span>
            <span class="stat-label">Total Student OD Passes</span>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <h4 class="mb-3">Department-wise OD Attendance Concessions</h4>
        <div class="analytics-bars-list">
          ${Object.entries(breakdown).map(([dept, count]) => {
            const pct = Math.round((count / maxVal) * 100);
            return `
              <div class="analytics-bar-item mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <strong>Department of ${escapeHtml(dept)}</strong>
                  <span><strong>${count}</strong> OD Passes (${pct}%)</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to load analytics: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadPointsManagementView() {
  const deptTable = document.getElementById('points-dept-table-body');
  if (deptTable) {
    try {
      const res = await api('/api/points/departments');
      deptTable.innerHTML = (res.data || []).map((d, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(d.dept)}</strong></td>
          <td><span class="badge badge-accent">${d.points} Points</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="openAwardPointsModal('dept', '${escapeHtml(d.dept)}')">
              + Award Points
            </button>
          </td>
        </tr>
      `).join('');
    } catch {
      deptTable.innerHTML = `<tr><td colspan="4">Error loading points</td></tr>`;
    }
  }
}

function openAwardPointsModal(type, target) {
  const modal = document.getElementById('award-points-modal');
  const targetInput = document.getElementById('points-target');
  const typeInput = document.getElementById('points-type');

  if (targetInput) targetInput.value = target;
  if (typeInput) typeInput.value = type;

  openModal('award-points-modal');
}

async function handleAwardPoints(e) {
  e.preventDefault();
  const form = e.target;
  const target = form.target.value;
  const type = form.type.value;
  const points = parseInt(form.points.value);
  const reason = form.reason.value.trim();

  const payload = {
    points,
    reason,
    dept: type === 'dept' ? target : undefined,
    reg: type === 'student' ? target : undefined
  };

  try {
    const res = await api('/api/points/update', { method: 'POST', body: payload });
    if (res.success) {
      showToast(`Awarded +${points} points to ${target}!`, 'success');
      closeModal('award-points-modal');
      loadPointsManagementView();
    }
  } catch (err) {
    showToast(err.message || 'Failed to award points', 'error');
  }
}

// ============================================================================
// 14. REPORTS & AUDIT TRAIL
// ============================================================================
async function loadReportsAndAudit() {
  const auditBody = document.getElementById('audit-table-body');
  if (!auditBody) return;

  auditBody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><div class="spinner"></div><p>Loading security audit logs...</p></td></tr>`;

  try {
    const res = await api('/api/reports/audit');
    const logs = (res.data || []).slice(0, 30);

    if (logs.length === 0) {
      auditBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No audit logs recorded yet.</td></tr>`;
      return;
    }

    auditBody.innerHTML = logs.map(l => `
      <tr>
        <td><small class="text-muted">${formatDateTime(l.date)}</small></td>
        <td><strong>${escapeHtml(l.actor || 'System')}</strong></td>
        <td><span class="badge badge-outline">${escapeHtml(l.action)}</span></td>
        <td><strong>${escapeHtml(l.target || '—')}</strong></td>
        <td><small class="text-muted" title="${escapeHtml(l.detail)}">${escapeHtml(l.detail || '—')}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    auditBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load audit logs: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function exportCSV(type) {
  const endpoints = {
    members: '/api/reports/export/members',
    attendance: '/api/reports/export/attendance',
    points: '/api/reports/export/points',
    audit: '/api/reports/export/audit'
  };

  const filename = `NEC_Sports_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    showToast(`Generating ${type.toUpperCase()} CSV report...`, 'info', 1500);
    const blob = await api(endpoints[type], { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  } catch (err) {
    showToast(`Failed to export ${type}: ` + err.message, 'error');
  }
}

// ============================================================================
// 15. USER MANAGEMENT (Admin only)
// ============================================================================
async function loadUsersManagementTable() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner"></div><p>Loading users...</p></td></tr>`;

  try {
    const res = await api('/api/users');
    const users = res.data || [];

    container.innerHTML = users.map((u, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge role-badge role-${u.role}">${escapeHtml(u.role.toUpperCase())}</span></td>
        <td>${escapeHtml(u.dept || u.reg || 'General')}</td>
        <td><small class="text-muted">${formatDate(u.createdAt || 'Seed')}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load users: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function handleCreateUser(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    role: form.role.value,
    dept: form.dept ? form.dept.value.trim() : undefined,
    reg: form.reg ? form.reg.value.trim() : undefined
  };

  try {
    const res = await api('/api/users', { method: 'POST', body: payload });
    if (res.success) {
      showToast('User account created successfully!', 'success');
      closeModal('create-user-modal');
      form.reset();
      loadUsersManagementTable();
    }
  } catch (err) {
    showToast(err.message || 'Failed to create user', 'error');
  }
}

// ============================================================================
// 16. ADVANCED NOTIFICATIONS & WHATSAPP HUB SUBSYSTEM
// ============================================================================

// 16.1 Audio Chime Engine (Web Audio API Synthesizer - 100% Self-Contained)
function playNotificationChime() {
  if (!STATE.notifSoundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone chime: D5 (587Hz) to A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.48);
  } catch (e) {
    // Non-blocking fallback
  }
}

function toggleNotificationSound() {
  STATE.notifSoundEnabled = !STATE.notifSoundEnabled;
  localStorage.setItem('nec_sports_sound', STATE.notifSoundEnabled ? 'true' : 'false');

  const flyoutBtn = document.getElementById('flyout-sound-btn');
  if (flyoutBtn) flyoutBtn.textContent = STATE.notifSoundEnabled ? '🔊' : '🔇';

  const centerLabel = document.getElementById('center-sound-label');
  if (centerLabel) centerLabel.textContent = STATE.notifSoundEnabled ? 'Sound On' : 'Sound Muted';

  const centerBtn = document.getElementById('center-sound-btn');
  if (centerBtn) centerBtn.innerHTML = STATE.notifSoundEnabled ? '🔊 <span>Sound On</span>' : '🔇 <span>Sound Muted</span>';

  if (STATE.notifSoundEnabled) {
    playNotificationChime();
    showToast('🔔 Notification chime enabled', 'info', 1500);
  } else {
    showToast('🔇 Notification chime muted', 'info', 1500);
  }
}

// 16.2 Web Push Notification API
async function requestPushNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Desktop push notifications are not supported by this browser.', 'warning');
    return;
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast('✓ Browser Push Notifications enabled!', 'success', 3000);
      new Notification('🏆 NEC Sports Portal', {
        body: 'Push notifications are now active for match results and OD approvals.',
        icon: 'assets/nec-logo.png'
      });
      const btn = document.getElementById('push-permission-btn');
      if (btn) btn.innerHTML = '✅ Push Enabled';
    } else {
      showToast('Push notifications permission was not granted.', 'warning');
    }
  } catch (e) {
    showToast('Error requesting push permission: ' + e.message, 'error');
  }
}

function showBrowserPushNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'assets/nec-logo.png'
      });
    } catch (e) {}
  }
}

// 16.3 Header Flyout Dropdown & Bell
function updateNotificationBell() {
  const badge = document.getElementById('notification-badge');
  const flyoutPill = document.getElementById('flyout-unread-pill');

  if (badge) {
    badge.textContent = STATE.unreadNotifications;
    badge.style.display = STATE.unreadNotifications > 0 ? 'inline-flex' : 'none';
  }

  if (flyoutPill) {
    flyoutPill.textContent = `${STATE.unreadNotifications} unread`;
    flyoutPill.style.display = STATE.unreadNotifications > 0 ? 'inline-block' : 'none';
  }

  // Update sidebar badge
  const sidebarNotifBtn = document.querySelector('.portal-nav-item[data-tab="notifications"]');
  if (sidebarNotifBtn) {
    let sideBadge = sidebarNotifBtn.querySelector('.notification-badge-pulsing');
    if (STATE.unreadNotifications > 0) {
      if (!sideBadge) {
        sideBadge = document.createElement('span');
        sideBadge.className = 'badge badge-danger notification-badge-pulsing';
        sideBadge.style.cssText = 'margin-left: auto; font-size: 0.65rem; padding: 2px 6px;';
        sidebarNotifBtn.appendChild(sideBadge);
      }
      sideBadge.textContent = STATE.unreadNotifications;
      sideBadge.style.display = 'inline-flex';
    } else if (sideBadge) {
      sideBadge.style.display = 'none';
    }
  }
}

async function toggleNotificationsFlyout() {
  const flyout = document.getElementById('notifications-flyout');
  if (!flyout) return;

  const isActive = flyout.classList.contains('active');
  if (isActive) {
    flyout.classList.remove('active');
    return;
  }

  flyout.classList.add('active');
  const listEl = document.getElementById('flyout-notifications-list');
  if (listEl) {
    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div><p style="font-size: 0.8rem;">Loading alerts...</p></div>`;
  }

  try {
    const res = await api('/api/notifications?limit=6');
    const items = res.data || [];

    if (items.length === 0) {
      if (listEl) listEl.innerHTML = `<div class="empty-state" style="padding: 1.5rem;"><p style="font-size: 0.85rem; color: var(--text-muted);">No sports notifications yet.</p></div>`;
      return;
    }

    if (listEl) {
      listEl.innerHTML = items.map(n => `
        <div class="participant-whatsapp-row" style="cursor: pointer;" onclick="handleNotificationCardClick(${n.id}, '${escapeHtml(n.type || 'general')}')">
          <div style="flex: 1; padding-right: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 2px;">
              <span style="font-size: 0.8rem;">${getNotifIcon(n.type)}</span>
              <strong style="font-size: 0.825rem; color: var(--text-main);">${escapeHtml(n.title)}</strong>
              ${!n.read ? `<span style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>` : ''}
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted); margin: 0; line-height: 1.3;">${escapeHtml(n.body.slice(0, 90))}${n.body.length > 90 ? '...' : ''}</p>
            <small style="font-size: 0.7rem; color: var(--text-light);">${formatDateTime(n.date)}</small>
          </div>
          <span style="color: var(--primary-600); font-size: 0.9rem;">➔</span>
        </div>
      `).join('');
    }
  } catch (err) {
    if (listEl) listEl.innerHTML = `<p style="padding: 1rem; color: #ef4444; font-size: 0.8rem;">Failed: ${escapeHtml(err.message)}</p>`;
  }

  // Close flyout on outside click
  const closeListener = (evt) => {
    if (!flyout.contains(evt.target) && !document.getElementById('notif-bell-btn').contains(evt.target)) {
      flyout.classList.remove('active');
      document.removeEventListener('click', closeListener);
    }
  };
  setTimeout(() => document.addEventListener('click', closeListener), 100);
}

function openFullNotificationCenter() {
  const flyout = document.getElementById('notifications-flyout');
  if (flyout) flyout.classList.remove('active');
  switchPortalTab('notifications');
}

function getNotifIcon(type) {
  const icons = {
    result: '🏆',
    od: '🎫',
    points: '📊',
    alert: '⚠️',
    system: '⚡',
    general: '📢'
  };
  return icons[type] || '🔔';
}

// 16.4 Notification Center Tab Loader & Interactive Filter
async function loadNotificationsTab() {
  const container = document.getElementById('notifications-feed-list');
  if (!container) return;

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Fetching notifications & match results...</p></div>`;

  try {
    const filterType = STATE.activeNotifFilter || 'all';
    const query = filterType !== 'all' ? `?type=${encodeURIComponent(filterType)}` : '';
    const res = await api(`/api/notifications${query}`);

    STATE.notifications = res.data || [];
    STATE.unreadNotifications = res.unreadCount || 0;
    updateNotificationBell();

    const stats = res.categoryStats || {};
    const setStat = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    };

    setStat('notif-stat-total', stats.total || STATE.notifications.length);
    setStat('notif-stat-unread', stats.unread || STATE.unreadNotifications);
    setStat('notif-stat-results', stats.results || 0);
    setStat('notif-stat-od', stats.od || 0);
    setStat('notif-stat-points', stats.points || 0);

    setStat('pill-count-all', stats.total || STATE.notifications.length);
    setStat('pill-count-result', stats.results || 0);
    setStat('pill-count-od', stats.od || 0);
    setStat('pill-count-points', stats.points || 0);
    setStat('pill-count-alert', stats.alerts || 0);

    renderNotificationFeed(STATE.notifications);

  } catch (err) {
    container.innerHTML = `<div class="card text-danger py-4 text-center">Failed to load notifications: ${escapeHtml(err.message)}</div>`;
  }
}

function renderNotificationFeed(items) {
  const container = document.getElementById('notifications-feed-list');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="card text-center py-5">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔔</div>
        <h3 style="color: var(--text-main); margin-bottom: 0.35rem;">No Notifications Found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          ${STATE.activeNotifFilter !== 'all' ? `No alerts under '${STATE.activeNotifFilter}'. Try switching to 'All Alerts'.` : 'You are all caught up with the latest sports updates.'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(n => {
    const type = n.type || 'general';
    const isResult = type === 'result';
    const isOD = type === 'od';

    return `
      <div class="notif-card notif-card-${escapeHtml(type)} ${n.read ? 'read' : 'unread'}" id="notif-card-${n.id}">
        <div class="notif-card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="notif-tag notif-tag-${escapeHtml(type)}">${getNotifIcon(type)} ${escapeHtml(type.toUpperCase())}</span>
            <span class="text-muted" style="font-size: 0.775rem;">${formatDateTime(n.date)}</span>
            ${!n.read ? `<span class="badge badge-danger" style="font-size: 0.6rem; padding: 2px 5px;">NEW</span>` : ''}
          </div>
          <div style="display: flex; gap: 0.35rem;">
            ${!n.read ? `
              <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.75rem;" title="Mark as Read" onclick="markNotificationRead(${n.id})">
                ✓ Read
              </button>
            ` : ''}
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.75rem; color: #ef4444;" title="Delete" onclick="deleteNotificationItem(${n.id})">
              🗑️
            </button>
          </div>
        </div>

        <div class="notif-card-title">${escapeHtml(n.title)}</div>
        <div class="notif-card-body">${escapeHtml(n.body)}</div>

        <div class="notif-card-footer">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${isResult ? `
              <button type="button" class="btn btn-whatsapp-sm" onclick="shareNotifResultWhatsApp('${escapeHtml(n.title)}', '${escapeHtml(n.body)}')">
                🟢 Share on WhatsApp
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="switchPortalTab('standings')">
                🏆 View Standings
              </button>
            ` : ''}
            ${isOD ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="switchPortalTab('my-od')">
                🎫 View My OD Pass
              </button>
              <button type="button" class="btn btn-whatsapp-sm" onclick="shareNotifODWhatsApp('${escapeHtml(n.title)}', '${escapeHtml(n.body)}')">
                🟢 WhatsApp OD
              </button>
            ` : ''}
            ${type === 'points' ? `
              <button type="button" class="btn btn-secondary btn-sm" onclick="switchPortalTab('points')">
                📊 Points Leaderboard
              </button>
            ` : ''}
          </div>
          <span style="font-size: 0.75rem; color: var(--text-light);">NEC Sports Alert Engine</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterNotificationsByType(type) {
  STATE.activeNotifFilter = type;
  document.querySelectorAll('.notif-filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.type === type);
  });
  loadNotificationsTab();
}

function handleNotifSearch(query) {
  if (!query) {
    renderNotificationFeed(STATE.notifications);
    return;
  }
  const q = query.toLowerCase();
  const filtered = STATE.notifications.filter(n =>
    (n.title || '').toLowerCase().includes(q) ||
    (n.body || '').toLowerCase().includes(q) ||
    (n.type || '').toLowerCase().includes(q)
  );
  renderNotificationFeed(filtered);
}

async function markAllNotificationsRead() {
  try {
    const res = await api('/api/notifications/read-all', { method: 'POST' });
    if (res.success) {
      STATE.unreadNotifications = 0;
      updateNotificationBell();
      STATE.notifications.forEach(n => { n.read = true; });
      renderNotificationFeed(STATE.notifications);
      showToast('All notifications marked as read.', 'success', 2000);
    }
  } catch (err) {
    showToast('Failed to mark read: ' + err.message, 'error');
  }
}

async function markNotificationRead(id) {
  try {
    const res = await api(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (res.success) {
      const item = STATE.notifications.find(n => n.id === id);
      if (item && !item.read) {
        item.read = true;
        STATE.unreadNotifications = Math.max(0, STATE.unreadNotifications - 1);
        updateNotificationBell();
      }
      const card = document.getElementById(`notif-card-${id}`);
      if (card) {
        card.classList.remove('unread');
        card.classList.add('read');
      }
      showToast('Notification marked as read.', 'info', 1500);
    }
  } catch (err) {
    showToast('Failed to update: ' + err.message, 'error');
  }
}

async function deleteNotificationItem(id) {
  try {
    const res = await api(`/api/notifications/${id}`, { method: 'DELETE' });
    if (res.success) {
      STATE.notifications = STATE.notifications.filter(n => n.id !== id);
      renderNotificationFeed(STATE.notifications);
      showToast('Notification deleted.', 'info', 1500);
    }
  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'error');
  }
}

async function clearAllNotifications() {
  if (!confirm('Are you sure you want to clear all notifications?')) return;
  try {
    const res = await api('/api/notifications/clear', { method: 'POST' });
    if (res.success) {
      STATE.notifications = [];
      STATE.unreadNotifications = 0;
      updateNotificationBell();
      renderNotificationFeed([]);
      showToast('Notifications cleared.', 'info', 2000);
    }
  } catch (err) {
    showToast('Failed to clear: ' + err.message, 'error');
  }
}

function handleNotificationCardClick(id, type) {
  markNotificationRead(id);
  const flyout = document.getElementById('notifications-flyout');
  if (flyout) flyout.classList.remove('active');

  if (type === 'result') switchPortalTab('standings');
  else if (type === 'od') switchPortalTab('my-od');
  else if (type === 'points') switchPortalTab('points');
  else switchPortalTab('notifications');
}

// 16.5 Broadcast Custom Announcement Modal
function openBroadcastModal() {
  const form = document.getElementById('broadcast-notification-form');
  if (form) form.reset();
  openModal('broadcast-notification-modal');
}

async function handleBroadcastSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    title: document.getElementById('broadcast-title').value.trim(),
    type: document.getElementById('broadcast-type').value,
    targetRole: document.getElementById('broadcast-target-role').value,
    body: document.getElementById('broadcast-body').value.trim()
  };

  try {
    const res = await api('/api/notifications', { method: 'POST', body: payload });
    if (res.success) {
      showToast('📢 Announcement broadcasted to ' + payload.targetRole + '!', 'success');
      closeModal('broadcast-notification-modal');
      playNotificationChime();
      loadNotificationsTab();
    }
  } catch (err) {
    showToast('Failed to broadcast: ' + err.message, 'error');
  }
}

// ============================================================================
// 16.6 EVENT CONCLUSION & AUTOMATED WHATSAPP RESULTS ENGINE
// ============================================================================

function openConcludeEventModal(eventId) {
  const event = STATE.events.find(e => e.id === eventId);
  if (!event) {
    showToast('Event not found', 'error');
    return;
  }

  STATE.activeConcludeEventId = eventId;
  const idInput = document.getElementById('event-result-id');
  if (idInput) idInput.value = event.id;

  const nameEl = document.getElementById('event-result-name-display');
  if (nameEl) nameEl.textContent = `${event.name} (${event.category})`;

  const metaEl = document.getElementById('event-result-meta-display');
  if (metaEl) metaEl.textContent = `📅 ${formatDate(event.date)} at ${event.venue} • Session: ${event.time || '09:00 AM'}`;

  // Default values
  const winnerInput = document.getElementById('event-result-winner');
  const runnerInput = document.getElementById('event-result-runner');
  const winPtsInput = document.getElementById('event-result-winner-pts');
  const runPtsInput = document.getElementById('event-result-runner-pts');

  if (winnerInput) winnerInput.value = event.results?.winner || 'CSE';
  if (runnerInput) runnerInput.value = event.results?.runnerUp || 'ECE';
  if (winPtsInput) winPtsInput.value = event.results?.winnerPoints || 50;
  if (runPtsInput) runPtsInput.value = event.results?.runnerPoints || 35;

  const topPerf = document.getElementById('event-result-top-performer');
  if (topPerf) topPerf.value = event.results?.topPerformer || '';

  const summaryInput = document.getElementById('event-result-summary');
  if (summaryInput) summaryInput.value = event.results?.summary || `Sensational performance! ${winnerInput.value} clinched victory with clinical teamwork.`;

  updateScoreDiffPreview();
  openModal('event-result-modal');
}

function updateScoreDiffPreview() {
  const winPts = parseInt(document.getElementById('event-result-winner-pts')?.value) || 0;
  const runPts = parseInt(document.getElementById('event-result-runner-pts')?.value) || 0;
  const winnerName = document.getElementById('event-result-winner')?.value || 'Winner';
  const diff = Math.abs(winPts - runPts);

  const diffEl = document.getElementById('event-result-diff-display');
  if (diffEl) {
    diffEl.innerHTML = `Score Margin: <strong>+${diff} Points</strong> (${escapeHtml(winnerName)} Lead)`;
  }
}

async function handleConcludeEventSubmit(e) {
  e.preventDefault();
  const eventId = STATE.activeConcludeEventId || document.getElementById('event-result-id')?.value;
  if (!eventId) return;

  const winner = document.getElementById('event-result-winner').value.trim();
  const winnerPoints = parseInt(document.getElementById('event-result-winner-pts').value) || 0;
  const runnerUp = document.getElementById('event-result-runner').value.trim();
  const runnerPoints = parseInt(document.getElementById('event-result-runner-pts').value) || 0;
  const scoreDifference = Math.abs(winnerPoints - runnerPoints);
  const topPerformer = document.getElementById('event-result-top-performer').value.trim();
  const summary = document.getElementById('event-result-summary').value.trim();
  const autoAwardPoints = document.getElementById('event-result-auto-points').checked;
  const notifyParticipants = document.getElementById('event-result-notify-participants').checked;
  const openWhatsAppPrompt = document.getElementById('event-result-whatsapp-prompt').checked;

  const submitBtn = document.getElementById('event-result-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Publishing Results & Notifying...';
  }

  let res;
  try {
    try {
      res = await api(`/api/events/${eventId}/conclude`, {
        method: 'POST',
        body: {
          winner,
          winnerPoints,
          runnerUp,
          runnerPoints,
          scoreDifference,
          topPerformer,
          summary,
          autoAwardPoints
        }
      });
    } catch (err) {
      // Graceful fallback if server process has not been restarted
      const ev = STATE.events.find(e => e.id == eventId);
      const evName = ev ? ev.name : 'Sports Event';
      const participants = (STATE.participants || []).filter(p => (p.event || '').toLowerCase() === evName.toLowerCase());

      const results = {
        winner,
        winnerPoints,
        runnerUp,
        runnerPoints,
        scoreDifference,
        topPerformer,
        summary,
        concludedAt: new Date().toISOString()
      };

      // Try standard PUT update on event
      try {
        await api(`/api/events/${eventId}`, {
          method: 'PUT',
          body: { status: 'Completed', results }
        });
      } catch (e) {}

      // Dispatch broadcast notification via standard POST
      const whatsappText = `🏛️ *NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)*\n` +
        `🏆 *DEPARTMENT OF PHYSICAL EDUCATION & SPORTS*\n` +
        `-----------------------------------------\n` +
        `📢 *OFFICIAL TOURNAMENT RESULT ANNOUNCEMENT*\n\n` +
        `🏅 *Event:* ${evName}\n` +
        `📅 *Date:* ${ev ? ev.date : 'Tournament Day'} | 📍 *Venue:* ${ev ? ev.venue : 'Campus Ground'}\n\n` +
        `🥇 *CHAMPION / WINNER:* *${winner}* (${winnerPoints} Points)\n` +
        `🥈 *RUNNER-UP:* *${runnerUp}* (${runnerPoints} Points)\n` +
        `⚡ *SCORE MARGIN:* *+${scoreDifference} Points Lead*\n` +
        (topPerformer ? `⭐ *TOP PERFORMER / MVP:* ${topPerformer}\n` : '') +
        (summary ? `📝 *Match Highlights:* ${summary}\n` : '') +
        `\n📊 *College Championship Points Standings Updated!*\n` +
        `🎉 Congratulations to all participating athletes!\n` +
        `-----------------------------------------\n` +
        `_Department of Physical Education, NEC Kovilpatti_`;

      try {
        await api('/api/notifications', {
          method: 'POST',
          body: {
            title: `🏆 ${evName} Results: ${winner} Clinches Victory!`,
            body: `Winner: ${winner} (${winnerPoints} pts) | Runner-Up: ${runnerUp} (${runnerPoints} pts) | Score Margin: +${scoreDifference} pts lead. ${summary}`,
            type: 'result',
            targetRole: 'all'
          }
        });
      } catch (e) {}

      // Update local state event
      if (ev) {
        ev.status = 'Completed';
        ev.results = results;
      }

      res = {
        success: true,
        participantCount: participants.length,
        data: ev || { name: evName },
        results,
        participants,
        whatsappText
      };
    }

    if (res && res.success) {
      closeModal('event-result-modal');
      playNotificationChime();
      showToast(`🎉 Results published! Notifications sent to ${res.participantCount || 0} participants.`, 'success', 4000);

      // Refresh events and notifications
      await api('/api/events').then(r => { STATE.events = r.data || []; }).catch(() => {});
      loadEventsManagementTable();
      loadPortalData();

      // Open WhatsApp Broadcast Hub
      if (openWhatsAppPrompt) {
        openWhatsAppResultsHub(res.data, res.results, res.participants || [], res.whatsappText);
      }
    }
  } catch (err) {
    showToast(err.message || 'Failed to publish event results.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🏆 Conclude & Publish Results';
    }
  }
}

function openCompletedResultsHub(eventId) {
  const event = STATE.events.find(e => e.id === eventId);
  if (!event || !event.results) {
    showToast('Results not found for this event', 'error');
    return;
  }

  // Retrieve participants for this event
  const participants = (STATE.participants || []).filter(p => (p.event || '').toLowerCase() === event.name.toLowerCase());

  const whatsappText = `🏛️ *NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)*\n` +
    `🏆 *DEPARTMENT OF PHYSICAL EDUCATION & SPORTS*\n` +
    `-----------------------------------------\n` +
    `📢 *OFFICIAL TOURNAMENT RESULT ANNOUNCEMENT*\n\n` +
    `🏅 *Event:* ${event.name}\n` +
    `📅 *Date:* ${event.date} | 📍 *Venue:* ${event.venue}\n\n` +
    `🥇 *CHAMPION / WINNER:* *${event.results.winner}* (${event.results.winnerPoints} Points)\n` +
    `🥈 *RUNNER-UP:* *${event.results.runnerUp}* (${event.results.runnerPoints} Points)\n` +
    `⚡ *SCORE MARGIN:* *+${event.results.scoreDifference} Points Lead*\n` +
    (event.results.topPerformer ? `⭐ *TOP PERFORMER / MVP:* ${event.results.topPerformer}\n` : '') +
    (event.results.summary ? `📝 *Match Highlights:* ${event.results.summary}\n` : '') +
    `\n📊 *College Championship Points Standings Updated!*\n` +
    `🎉 Congratulations to all participating athletes!\n` +
    `-----------------------------------------\n` +
    `_Department of Physical Education, NEC Kovilpatti_`;

  openWhatsAppResultsHub(event, event.results, participants, whatsappText);
}

function openWhatsAppResultsHub(event, results, participants, whatsappText) {
  STATE.activeWhatsAppResult = { event, results, participants, whatsappText };

  // 1. Populate summary card
  const summaryCard = document.getElementById('whatsapp-results-summary-card');
  if (summaryCard) {
    summaryCard.innerHTML = `
      <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">
        🏅 ${escapeHtml(event.name)} Championship Results
      </div>
      <div class="score-diff-display">
        <div>
          <div class="score-diff-winner">🥇 ${escapeHtml(results.winner)}</div>
          <div style="font-size: 0.85rem; color: #fbbf24;">${results.winnerPoints} Points</div>
        </div>
        <div>
          <div class="score-diff-pill">+${results.scoreDifference} PTS DIFF</div>
          <div style="font-size: 0.75rem; margin-top: 4px; opacity: 0.8;">Victory Margin</div>
        </div>
        <div>
          <div class="score-diff-runner">🥈 ${escapeHtml(results.runnerUp)}</div>
          <div style="font-size: 0.85rem; color: #cbd5e1;">${results.runnerPoints} Points</div>
        </div>
      </div>
      ${results.topPerformer ? `<div style="text-align: center; font-size: 0.85rem; opacity: 0.9;">⭐ Top Performer: <strong>${escapeHtml(results.topPerformer)}</strong></div>` : ''}
    `;
  }

  // 2. Populate text preview
  const previewBox = document.getElementById('whatsapp-result-text-preview');
  if (previewBox) {
    previewBox.textContent = whatsappText;
  }

  // 3. Count
  const countEl = document.getElementById('whatsapp-participants-count');
  if (countEl) countEl.textContent = participants.length;

  // 4. Participant Directory
  const listEl = document.getElementById('whatsapp-participants-list');
  if (listEl) {
    if (participants.length === 0) {
      listEl.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No participant phone numbers recorded. Use the primary broadcast button above.</div>`;
    } else {
      listEl.innerHTML = participants.map((p, idx) => {
        const studentMsg = `Hi *${p.name}* (${p.reg})!\n` +
          `Official results for *${event.name}* have been declared!\n` +
          `🥇 Winner: *${results.winner}* (${results.winnerPoints} pts)\n` +
          `🥈 Runner-Up: *${results.runnerUp}* (${results.runnerPoints} pts)\n` +
          `⚡ Score Difference: *+${results.scoreDifference} pts lead*\n` +
          `Thank you for your sporting spirit and participation in NEC Sports!\n- Physical Education Dept, NEC`;

        const encodedMsg = encodeURIComponent(studentMsg);
        const waLink = p.phone ? `https://wa.me/91${p.phone.replace(/[^0-9]/g, '')}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;

        return `
          <div class="participant-whatsapp-row">
            <div>
              <strong>${idx + 1}. ${escapeHtml(p.name)}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                ${escapeHtml(p.reg)} • ${escapeHtml(p.dept)} (${escapeHtml(p.year || 'III Year')})
              </div>
            </div>
            <a href="${waLink}" target="_blank" class="btn btn-whatsapp-sm" title="Send Result to ${escapeHtml(p.name)} on WhatsApp">
              🟢 Send WhatsApp
            </a>
          </div>
        `;
      }).join('');
    }
  }

  openModal('whatsapp-results-modal');
}

function copyWhatsAppResultText() {
  const text = STATE.activeWhatsAppResult?.whatsappText || document.getElementById('whatsapp-result-text-preview')?.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ WhatsApp announcement copied to clipboard!', 'success', 2500);
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}

function openWhatsAppBroadcastDirect() {
  const text = STATE.activeWhatsAppResult?.whatsappText || document.getElementById('whatsapp-result-text-preview')?.textContent;
  if (!text) return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  showToast('✓ WhatsApp opened with pre-filled announcement!', 'success', 2500);
}

function shareWhatsAppStatus() {
  openWhatsAppBroadcastDirect();
}

function shareNotifResultWhatsApp(title, body) {
  const text = `🏆 *NEC SPORTS RESULT ANNOUNCEMENT*\n\n*${title}*\n${body}\n\n- Department of Physical Education, NEC Kovilpatti`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareNotifODWhatsApp(title, body) {
  const text = `🎫 *NEC SPORTS ON-DUTY (OD) PASS*\n\n*${title}*\n${body}\n\n- Department of Physical Education, NEC Kovilpatti`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// ============================================================================
// 16.7 HOD ON-DUTY (OD) WHATSAPP REQUISITION ENGINE
// ============================================================================

async function openHODODWhatsAppModal(batchId) {
  const batch = STATE.odBatches.find(b => b.id === batchId);
  if (!batch) {
    showToast('OD Batch not found', 'error');
    return;
  }

  STATE.activeHODBatch = batch;

  // Set HOD department
  const deptSelect = document.getElementById('hod-dept-select');
  if (deptSelect && batch.department) {
    deptSelect.value = batch.department !== 'All' ? batch.department : 'CSE';
  }

  // Pre-fill phone number based on department
  const defaultPhones = {
    CSE: '9842100001',
    ECE: '9842100002',
    IT: '9842100003',
    EEE: '9842100004',
    MECH: '9842100005',
    CIVIL: '9842100006',
    AIDS: '9842100007',
    'S&H': '9842100008'
  };

  const phoneInput = document.getElementById('hod-whatsapp-phone');
  if (phoneInput) {
    phoneInput.value = defaultPhones[deptSelect?.value] || '9876543210';
  }

  // Fetch or format official HOD letter text
  try {
    const res = await api(`/api/od/batches/${batchId}/whatsapp-hod`);
    const preview = document.getElementById('hod-od-text-preview');
    if (preview) {
      preview.textContent = res.whatsappText;
      STATE.activeHODBatch.whatsappText = res.whatsappText;
    }
  } catch (err) {
    // Fallback format
    const studentsFormatted = (batch.students || []).map((s, idx) =>
      `${idx + 1}. *${s.name}* (${s.reg}) - ${s.dept} (${s.year || 'III Year'})`
    ).join('\n');

    const fallbackText = `🏛️ *NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)*\n` +
      `*DEPARTMENT OF PHYSICAL EDUCATION & SPORTS*\n` +
      `-----------------------------------------\n` +
      `📋 *OFFICIAL ON-DUTY (OD) REQUISITION FOR HOD SANCTION*\n\n` +
      `Respected Head of the Department,\n` +
      `Department of *${batch.department}*,\n\n` +
      `The following bonafide students are representing our college in sports:\n\n` +
      `🏆 *Event:* ${batch.eventName}\n` +
      `📅 *Date:* ${batch.eventDate}\n` +
      `⏰ *Session:* ${batch.session || 'Full Day'}\n` +
      `📍 *Venue:* ${batch.venue}\n` +
      `📄 *Ref No:* ${batch.refNo}\n\n` +
      `👥 *STUDENT ROSTER (${batch.students ? batch.students.length : 0} Students):*\n` +
      `${studentsFormatted}\n\n` +
      `Kindly grant official On-Duty (OD) attendance permission.\n\n` +
      `Warm regards,\n` +
      `*Dr. K. Murugan*, Physical Director\n` +
      `National Engineering College, Kovilpatti`;

    const preview = document.getElementById('hod-od-text-preview');
    if (preview) preview.textContent = fallbackText;
    STATE.activeHODBatch.whatsappText = fallbackText;
  }

  openModal('hod-od-whatsapp-modal');
}

function handleHODDeptSelect(dept) {
  const defaultPhones = {
    CSE: '9842100001',
    ECE: '9842100002',
    IT: '9842100003',
    EEE: '9842100004',
    MECH: '9842100005',
    CIVIL: '9842100006',
    AIDS: '9842100007',
    'S&H': '9842100008'
  };
  const phoneInput = document.getElementById('hod-whatsapp-phone');
  if (phoneInput && defaultPhones[dept]) {
    phoneInput.value = defaultPhones[dept];
  }
}

function copyHODODText() {
  const text = STATE.activeHODBatch?.whatsappText || document.getElementById('hod-od-text-preview')?.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ HOD OD requisition letter copied!', 'success', 2000);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function sendHODWhatsAppDirect() {
  const text = STATE.activeHODBatch?.whatsappText || document.getElementById('hod-od-text-preview')?.textContent;
  const rawPhone = document.getElementById('hod-whatsapp-phone')?.value || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  if (!text) return;

  const url = cleanPhone.length >= 10
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  window.open(url, '_blank');
  showToast('✓ Opened WhatsApp with OD requisition for HOD Mam/Sir!', 'success', 3000);
}

function markHODODDispatched() {
  showToast('✓ Recorded: OD Requisition dispatched to HOD Mam/Sir on WhatsApp.', 'success', 3000);
  closeModal('hod-od-whatsapp-modal');
}

// Legacy modal opener support
async function openNotificationsModal() {
  openFullNotificationCenter();
}

// 16.8 Real-Time Live Notification Polling Engine (Every 10 Seconds)
let pollingInterval = null;

function startNotificationPolling() {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    try {
      const res = await api('/api/notifications');
      if (res && res.success) {
        const newUnread = res.unreadCount || 0;
        const previousUnread = STATE.unreadNotifications || 0;

        STATE.notifications = res.data || [];
        STATE.unreadNotifications = newUnread;
        updateNotificationBell();

        // If new notifications arrived while user is browsing
        if (newUnread > previousUnread) {
          playNotificationChime();
          const latest = STATE.notifications[0];
          if (latest) {
            showToast(`🔔 New Alert: ${latest.title}`, 'info', 4000);
            showBrowserPushNotification(latest.title, latest.body);
          }
          if (STATE.activePortalTab === 'notifications') {
            renderNotificationFeed(STATE.notifications);
          }
        }
      }
    } catch (e) {
      // Silent polling error
    }
  }, 10000); // 10 seconds
}

// ============================================================================
// 17. PORTAL EVENT LISTENERS INITIALIZATION
// ============================================================================
function setupPortalEventListeners() {
  // OD Generation form
  const odForm = document.getElementById('auto-od-form');
  if (odForm) {
    odForm.addEventListener('submit', handleAutoGenerateOD);
  }

  // Populate events into OD Event Select
  const odEventSelect = document.getElementById('od-event-select');
  if (odEventSelect && STATE.events.length > 0) {
    odEventSelect.innerHTML = `<option value="">-- Choose Event --</option>` +
      STATE.events.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${formatDate(e.date)} - ${escapeHtml(e.venue)})</option>`).join('');
  }

  // Event modal form
  const eventForm = document.getElementById('event-form');
  if (eventForm) {
    eventForm.addEventListener('submit', handleSaveEvent);
  }

  // Award points form
  const pointsForm = document.getElementById('award-points-form');
  if (pointsForm) {
    pointsForm.addEventListener('submit', handleAwardPoints);
  }

  // Create user form
  const userForm = document.getElementById('create-user-form');
  if (userForm) {
    userForm.addEventListener('submit', handleCreateUser);
  }

  // Update OD status form
  const statusForm = document.getElementById('update-od-status-form');
  if (statusForm) {
    statusForm.addEventListener('submit', handleUpdateODStatus);
  }

  // Portal event registration form (Student Self-Service)
  const portalRegForm = document.getElementById('portal-event-registration-form');
  if (portalRegForm) {
    portalRegForm.addEventListener('submit', handleStudentRegistration);
  }

  // Event Result Conclusion Form
  const concludeForm = document.getElementById('event-result-form');
  if (concludeForm) {
    concludeForm.addEventListener('submit', handleConcludeEventSubmit);
  }

  // Broadcast Notification Form
  const broadcastForm = document.getElementById('broadcast-notification-form');
  if (broadcastForm) {
    broadcastForm.addEventListener('submit', handleBroadcastSubmit);
  }
}

// ============================================================================
// 18. APPLICATION BOOTSTRAPPER (Auto-detects active page)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme mode (dark/light), custom sports color palette, and localization
  initThemeAndLocalization();
  // Initialize Google OAuth 2.0 Identity Services
  initGoogleAuth();

  const pagePath = window.location.pathname.toLowerCase();

  // 1. Login Page
  if (pagePath.endsWith('login.html') || pagePath === '/login' || document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        const role = loginForm.role.value;
        await loginUser(email, password, role);
      });
    }

    // Redirect to portal if already authenticated
    if (STATE.token && STATE.user) {
      window.location.href = 'portal.html';
    }
  }

  // 2. Protected Portal Page
  else if (pagePath.endsWith('portal.html') || pagePath === '/portal' || document.getElementById('portal-nav-links')) {
    initPortal();
  }

  // 3. Public Dashboard (Home)
  else {
    initPublicDashboard();
  }
});
