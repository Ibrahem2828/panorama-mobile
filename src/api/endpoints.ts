export const API_PREFIX = '/api/v1';

type EndpointId = string | number;

export const endpoints = {
  health: `${API_PREFIX}/health/`,
  auth: {
    login: `${API_PREFIX}/auth/login/`,
    registerStudent: `${API_PREFIX}/auth/register/student/`,
    registerNormal: `${API_PREFIX}/auth/register/normal/`,
    refresh: `${API_PREFIX}/auth/token/refresh/`,
    logout: `${API_PREFIX}/auth/logout/`,
    me: `${API_PREFIX}/auth/me/`,
    changePassword: `${API_PREFIX}/auth/change-password/`,
    sendOtp: `${API_PREFIX}/auth/otp/send/`,
    verifyOtp: `${API_PREFIX}/auth/otp/verify/`,
    requestPasswordReset: `${API_PREFIX}/auth/request-password-reset/`,
    confirmPasswordReset: `${API_PREFIX}/auth/confirm-password-reset/`,
  },
  students: {
    profile: `${API_PREFIX}/students/me/profile/`,
    parseStudentNumber: `${API_PREFIX}/students/student-number/parse/`,
  },
  academic: {
    universities: `${API_PREFIX}/universities/`,
    academicYears: `${API_PREFIX}/academic-years/`,
    semesters: `${API_PREFIX}/semesters/`,
    universityDetail: (universityId: EndpointId) => `${API_PREFIX}/universities/${universityId}/`,
    facultiesForUniversity: (universityId: EndpointId) =>
      `${API_PREFIX}/universities/${universityId}/faculties/`,
    majorsForFaculty: (facultyId: EndpointId) => `${API_PREFIX}/faculties/${facultyId}/majors/`,
    subjectsForMajor: (majorId: EndpointId) => `${API_PREFIX}/majors/${majorId}/subjects/`,
  },
  verification: {
    submit: `${API_PREFIX}/verification/submit/`,
    me: `${API_PREFIX}/verification/me/`,
    resubmit: `${API_PREFIX}/verification/resubmit/`,
  },
  announcements: {
    list: `${API_PREFIX}/announcements/`,
  },
  groups: {
    available: `${API_PREFIX}/groups/available/`,
    my: `${API_PREFIX}/groups/my/`,
    detail: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/`,
    join: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/join/`,
    leave: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/leave/`,
    files: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/files/`,
    messages: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/messages/`,
  },
  files: {
    list: `${API_PREFIX}/files/`,
    detail: (fileId: EndpointId) => `${API_PREFIX}/files/${fileId}/`,
  },
  printing: {
    createOrder: `${API_PREFIX}/printing/orders/`,
    myOrders: `${API_PREFIX}/printing/orders/my/`,
    orderDetail: (orderId: EndpointId) => `${API_PREFIX}/printing/orders/${orderId}/`,
    cancelOrder: (orderId: EndpointId) => `${API_PREFIX}/printing/orders/${orderId}/cancel/`,
  },
  notifications: {
    list: `${API_PREFIX}/notifications/`,
    unreadCount: `${API_PREFIX}/notifications/unread-count/`,
    markRead: (notificationId: EndpointId) => `${API_PREFIX}/notifications/${notificationId}/read/`,
    readAll: `${API_PREFIX}/notifications/read-all/`,
    deviceTokens: `${API_PREFIX}/notifications/device-tokens/`,
  },
  support: {
    createTicket: `${API_PREFIX}/support/tickets/`,
    myTickets: `${API_PREFIX}/support/tickets/my/`,
    ticketDetail: (ticketId: EndpointId) => `${API_PREFIX}/support/tickets/${ticketId}/`,
    addMessage: (ticketId: EndpointId) => `${API_PREFIX}/support/tickets/${ticketId}/messages/`,
  },
} as const;
