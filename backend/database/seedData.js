// Seed data for NEC Sports Event Management & Automation System

module.exports = {
  users: [
    {
      id: 1,
      email: 'sportsstaff@nec.edu.in',
      password: 'NECStaff@2026',
      name: 'Sports Coordinator',
      role: 'staff',
      dept: 'Physical Education'
    },
    {
      id: 2,
      email: 'sportsadmin@nec.edu.in',
      password: 'NECAdmin@2026',
      name: 'Sports Administrator',
      role: 'admin',
      dept: 'Administration'
    },
    {
      id: 3,
      email: '24104016@nec.edu.in',
      password: 'Student@2026',
      name: 'Bhavana Lakshmi',
      role: 'student',
      reg: '24104016',
      dept: 'CSE',
      year: 'III Year'
    },
    {
      id: 15,
      email: '24104015@nec.edu.in',
      password: 'Student@2026',
      name: 'Arun Kumar M',
      role: 'student',
      reg: '24104015',
      dept: 'CSE',
      year: 'III Year'
    },
    {
      id: 4,
      email: '24104021@nec.edu.in',
      password: 'Student@2026',
      name: 'Kavin Raj',
      role: 'student',
      reg: '24104021',
      dept: 'CSE',
      year: 'III Year'
    },
    {
      id: 5,
      email: '24104035@nec.edu.in',
      password: 'Student@2026',
      name: 'Ananya S',
      role: 'student',
      reg: '24104035',
      dept: 'ECE',
      year: 'II Year'
    }
  ],

  events: [
    {
      id: 1,
      name: '100m Running',
      category: 'Athletics',
      type: 'Individual',
      venue: 'College Ground',
      date: '2026-09-20',
      time: '09:00 AM',
      status: 'Open',
      limit: 40,
      description: 'Annual college athletics 100m sprint competition for men and women.'
    },
    {
      id: 2,
      name: 'Football',
      category: 'Team Sport',
      type: 'Team',
      venue: 'Main Stadium',
      date: '2026-09-22',
      time: '03:30 PM',
      status: 'Open',
      limit: 60,
      description: 'Inter-departmental 11-a-side football tournament championship trophy.'
    },
    {
      id: 3,
      name: 'Badminton',
      category: 'Racket',
      type: 'Individual',
      venue: 'Indoor Hall',
      date: '2026-09-24',
      time: '10:00 AM',
      status: 'Open',
      limit: 30,
      description: 'Men and Women singles and doubles badminton knockout matches.'
    },
    {
      id: 4,
      name: 'Basketball',
      category: 'Team Sport',
      type: 'Team',
      venue: 'Indoor Court',
      date: '2026-09-26',
      time: '04:00 PM',
      status: 'Ongoing',
      limit: 50,
      description: 'Fast-paced 5v5 basketball league tournament with department teams.'
    },
    {
      id: 5,
      name: 'Volleyball',
      category: 'Team Sport',
      type: 'Team',
      venue: 'Volleyball Court',
      date: '2026-09-28',
      time: '03:00 PM',
      status: 'Open',
      limit: 48,
      description: 'Standard 6v6 departmental volleyball tournament.'
    },
    {
      id: 6,
      name: 'Cricket',
      category: 'Team Sport',
      type: 'Team',
      venue: 'Cricket Ground',
      date: '2026-09-30',
      time: '08:30 AM',
      status: 'Completed',
      limit: 80,
      description: 'T10 Inter-departmental cricket league matches.'
    }
  ],

  participants: [
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
  ],

  points: {
    CSE: 186,
    ECE: 172,
    IT: 158,
    EEE: 141,
    MECH: 126,
    CIVIL: 119,
    AIDS: 104,
    'S&H': 88
  },

  studentPoints: {
    '24104016': 42,
    '24104021': 38,
    '24104035': 35,
    '24104048': 31,
    '24104062': 29,
    '24104073': 27,
    '24104081': 25,
    '24104095': 23,
    '24104102': 21,
    '24104114': 20,
    '24104127': 18,
    '24104139': 17
  },

  attendance: [
    { id: 1, key: 'Football|24104021', event: 'Football', reg: '24104021', name: 'Kavin Raj', dept: 'CSE', present: true, date: '2026-09-22 03:30 PM' },
    { id: 2, key: '100m Running|24104016', event: '100m Running', reg: '24104016', name: 'Bhavana Lakshmi', dept: 'CSE', present: true, date: '2026-09-20 09:00 AM' }
  ],

  odBatches: [
    {
      id: 1,
      refNo: 'NEC/PED/OD/2026-27/ATH-01',
      title: 'Automated OD Batch for 100m Running Sprint',
      eventId: 1,
      eventName: '100m Running',
      eventDate: '2026-09-20',
      venue: 'College Ground',
      session: 'Forenoon (FN)',
      department: 'All',
      totalStudents: 2,
      departmentBreakdown: { CSE: 1, 'S&H': 1 },
      status: 'HOD Approved',
      generatedAt: '2026-09-18T10:30:00.000Z',
      generatedBy: 'Sports Coordinator',
      remarks: 'Automated OD approval for 100m sprint trials and finals',
      students: [
        { reg: '24104016', name: 'Bhavana Lakshmi', dept: 'CSE', year: 'III Year', gender: 'Female', status: 'Selected', odStatus: 'Approved' },
        { reg: '24104102', name: 'Nivetha S', dept: 'S&H', year: 'I Year', gender: 'Female', status: 'Selected', odStatus: 'Approved' }
      ],
      approvalHistory: [
        { status: 'Generated', changedBy: 'Sports Coordinator', timestamp: '2026-09-18T10:30:00.000Z', comments: 'Auto-generated from selected roster' },
        { status: 'Submitted to HOD', changedBy: 'Sports Coordinator', timestamp: '2026-09-18T11:00:00.000Z', comments: 'Forwarded for HOD clearance' },
        { status: 'HOD Approved', changedBy: 'HOD / Physical Director', timestamp: '2026-09-18T14:15:00.000Z', comments: 'Sanctioned for college sports' }
      ]
    }
  ],

  notifications: [
    {
      id: 1,
      title: 'Sports Portal Backend Ready',
      body: 'Automated OD list generation and real-time backend synchronization are now active.',
      date: new Date().toLocaleString(),
      type: 'system',
      read: false
    },
    {
      id: 2,
      title: 'OD Pass Available',
      body: 'Your On-Duty (OD) pass for 100m Running on 2026-09-20 has been sanctioned.',
      date: new Date().toLocaleString(),
      type: 'od',
      targetReg: '24104016',
      read: false
    }
  ],

  audit: [
    {
      id: 1,
      actor: 'System',
      action: 'Initialized Backend Database',
      target: 'NEC Sports Core',
      detail: 'Loaded seed events, participants, and automated OD modules',
      date: new Date().toLocaleString()
    }
  ]
};
