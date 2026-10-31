export const API_PREFIX = '/api/v1';
type EndpointId = string | number;

export const endpoints = {
  health: `${API_PREFIX}/health/`,
  // Public and exempt from the maintenance/version gate, so it can report the gate state.
  mobileBootstrap: `${API_PREFIX}/mobile/bootstrap/`,
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
  account: {
    deletionRequest: `${API_PREFIX}/account/deletion/request/`,
    deletionCancel: `${API_PREFIX}/account/deletion/cancel/`,
    deletionStatus: `${API_PREFIX}/account/deletion/status/`,
  },
  students: {
    profile: `${API_PREFIX}/students/me/profile/`,
    parseStudentNumber: `${API_PREFIX}/students/student-number/parse/`,
    termConfirmation: `${API_PREFIX}/students/me/term-confirmation/`,
  },
  academic: {
    universities: `${API_PREFIX}/universities/`,
    academicYears: `${API_PREFIX}/academic-years/`,
    semesters: `${API_PREFIX}/semesters/`,
    /** The semester the university is in right now, plus the other one. Any signed-in user may read it. */
    currentTerm: `${API_PREFIX}/academic/current-term/`,
    facultiesForUniversity: (universityId: EndpointId) =>
      `${API_PREFIX}/universities/${universityId}/faculties/`,
    majorsForFaculty: (facultyId: EndpointId) => `${API_PREFIX}/faculties/${facultyId}/majors/`,
    subjectsForFaculty: (facultyId: EndpointId) => `${API_PREFIX}/faculties/${facultyId}/subjects/`,
    subjectsForMajor: (majorId: EndpointId) => `${API_PREFIX}/majors/${majorId}/subjects/`,
  },
  verification: {
    submit: `${API_PREFIX}/verification/submit/`,
    me: `${API_PREFIX}/verification/me/`,
    resubmit: `${API_PREFIX}/verification/resubmit/`,
  },
  search: `${API_PREFIX}/search/`,
  policies: {
    current: `${API_PREFIX}/policies/current/`,
    status: `${API_PREFIX}/policies/status/`,
    accept: `${API_PREFIX}/policies/accept/`,
  },
  announcements: {
    list: `${API_PREFIX}/announcements/`,
    detail: (announcementId: EndpointId) => `${API_PREFIX}/announcements/${announcementId}/`,
  },
  groups: {
    available: `${API_PREFIX}/groups/available/`,
    my: `${API_PREFIX}/groups/my/`,
    detail: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/`,
    join: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/join/`,
    leave: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/leave/`,
    files: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/files/`,
    messages: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/messages/`,
    chatTicket: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/chat-ticket/`,
    chatReceipts: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/chat/receipts/`,
    chatPreferences: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/chat/preferences/`,
    messageReaction: (groupId: EndpointId, messageId: EndpointId) =>
      `${API_PREFIX}/groups/${groupId}/messages/${messageId}/reaction/`,
    messageDelete: (groupId: EndpointId, messageId: EndpointId) =>
      `${API_PREFIX}/groups/${groupId}/messages/${messageId}/`,
    chatUnread: `${API_PREFIX}/chat/unread/`,
    chatPreferencesAll: `${API_PREFIX}/chat/preferences/`,
    whatsappLaunch: (groupId: EndpointId) => `${API_PREFIX}/groups/${groupId}/whatsapp-launch/`,
    messageAttachmentTicket: (groupId: EndpointId, messageId: EndpointId) =>
      `${API_PREFIX}/groups/${groupId}/messages/${messageId}/attachment-ticket/`,
  },
  enrollment: {
    subjects: `${API_PREFIX}/enrollment/subjects/`,
    requests: `${API_PREFIX}/enrollment/requests/`,
    cancel: (id: EndpointId) => `${API_PREFIX}/enrollment/requests/${id}/cancel/`,
  },
  files: {
    list: `${API_PREFIX}/files/`,
    detail: (fileId: EndpointId) => `${API_PREFIX}/files/${fileId}/`,
    accessTicket: (fileId: EndpointId) => `${API_PREFIX}/files/${fileId}/access-ticket/`,
  },
  printing: {
    quote: `${API_PREFIX}/printing/quote/`,
    options: `${API_PREFIX}/printing/options/`,
    products: `${API_PREFIX}/printing/products/`,
    convert: `${API_PREFIX}/printing/convert/`,
    convertDetail: (id: string) => `${API_PREFIX}/printing/convert/${id}/`,
    createOrder: `${API_PREFIX}/printing/orders/`,
    myOrders: `${API_PREFIX}/printing/orders/my/`,
    orderDetail: (orderId: EndpointId) => `${API_PREFIX}/printing/orders/my/${orderId}/`,
    cancelOrder: (orderId: EndpointId) => `${API_PREFIX}/printing/orders/${orderId}/cancel/`,
    pickupLocations: `${API_PREFIX}/printing/pickup-locations/`,
    itemAccessTicket: (itemId: EndpointId) =>
      `${API_PREFIX}/printing/items/${itemId}/access-ticket/`,
  },
  notifications: {
    list: `${API_PREFIX}/notifications/`,
    unreadCount: `${API_PREFIX}/notifications/unread-count/`,
    summary: `${API_PREFIX}/notifications/summary/`,
    markRead: (notificationId: EndpointId) => `${API_PREFIX}/notifications/${notificationId}/read/`,
    readAll: `${API_PREFIX}/notifications/read-all/`,
    preferences: `${API_PREFIX}/notifications/preferences/`,
    deviceTokens: `${API_PREFIX}/notifications/device-tokens/`,
    deviceTokenDetail: (tokenId: EndpointId) =>
      `${API_PREFIX}/notifications/device-tokens/${tokenId}/`,
  },
  support: {
    createTicket: `${API_PREFIX}/support/tickets/`,
    myTickets: `${API_PREFIX}/support/tickets/my/`,
    ticketDetail: (ticketId: EndpointId) => `${API_PREFIX}/support/tickets/${ticketId}/`,
    addMessage: (ticketId: EndpointId) => `${API_PREFIX}/support/tickets/${ticketId}/messages/`,
    attachmentTicket: (messageId: EndpointId) =>
      `${API_PREFIX}/support/messages/${messageId}/attachment-ticket/`,
  },
  lectures: {
    list: `${API_PREFIX}/lectures/`,
    detail: (lectureId: EndpointId) => `${API_PREFIX}/lectures/${lectureId}/`,
    processingStatus: (lectureId: EndpointId) =>
      `${API_PREFIX}/lectures/${lectureId}/processing-status/`,
    viewerSession: (lectureId: EndpointId) => `${API_PREFIX}/lectures/${lectureId}/viewer/session/`,
    pageImage: (lectureId: EndpointId, page: number) =>
      `${API_PREFIX}/lectures/${lectureId}/viewer/pages/${page}/`,
    pageThumbnail: (lectureId: EndpointId, page: number) =>
      `${API_PREFIX}/lectures/${lectureId}/viewer/pages/${page}/thumbnail/`,
    pageText: (lectureId: EndpointId, page: number) =>
      `${API_PREFIX}/lectures/${lectureId}/viewer/pages/${page}/text/`,
    notes: (lectureId: EndpointId) => `${API_PREFIX}/lectures/${lectureId}/notes/`,
    noteDetail: (lectureId: EndpointId, noteId: EndpointId) =>
      `${API_PREFIX}/lectures/${lectureId}/notes/${noteId}/`,
  },
  fileViewer: {
    manifest: (fileId: EndpointId) => `${API_PREFIX}/files/${fileId}/viewer/manifest/`,
    session: (fileId: EndpointId) => `${API_PREFIX}/files/${fileId}/viewer/session/`,
    pageImage: (fileId: EndpointId, page: number) =>
      `${API_PREFIX}/files/${fileId}/viewer/pages/${page}/`,
    pageThumbnail: (fileId: EndpointId, page: number) =>
      `${API_PREFIX}/files/${fileId}/viewer/pages/${page}/thumbnail/`,
    pageText: (fileId: EndpointId, page: number) =>
      `${API_PREFIX}/files/${fileId}/viewer/pages/${page}/text/`,
  },
  annotations: {
    list: (kind: 'lectures' | 'files', id: EndpointId) =>
      `${API_PREFIX}/annotations/${kind}/${id}/`,
    sync: (kind: 'lectures' | 'files', id: EndpointId) =>
      `${API_PREFIX}/annotations/${kind}/${id}/sync/`,
    myNotes: `${API_PREFIX}/my-notes/`,
  },
  feedback: {
    submit: `${API_PREFIX}/feedback/`,
    prompt: `${API_PREFIX}/feedback/prompt/`,
    promptEvent: `${API_PREFIX}/feedback/prompt-event/`,
    mine: `${API_PREFIX}/feedback/mine/`,
    suggestions: `${API_PREFIX}/feedback/suggestions/`,
    vote: (feedbackId: EndpointId) => `${API_PREFIX}/feedback/${feedbackId}/vote/`,
    privacyRequest: (feedbackId: EndpointId) =>
      `${API_PREFIX}/feedback/${feedbackId}/privacy-request/`,
  },
} as const;
