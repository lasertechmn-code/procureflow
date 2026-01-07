import { PurchaseRequest, RequestStatus, Priority, Message, ApprovalEvent, UserRole, User } from '../types';

const STORAGE_KEY = 'procureflow_data_v4';
const USERS_KEY = 'procureflow_users_v4';

// Simple mock hash function for demonstration
const hashPassword = (pwd: string) => btoa(pwd).split('').reverse().join('');

// Helper to generate default password: LastName + FirstLetter (e.g., JacksonG)
export const generateDefaultPassword = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return 'password';
    return `${lastName.trim()}${firstName.trim().charAt(0)}`.replace(/\s/g, '');
};

const SEED_USERS: User[] = [
    {
        id: 'u1',
        firstName: 'System',
        lastName: 'Admin',
        jobTitle: 'IT Director',
        role: 'Admin',
        username: 'admin',
        passwordHash: hashPassword('admin123'), // Non-standard for admin
        isDefaultPassword: false
    },
    {
        id: 'u2',
        firstName: 'Morgan',
        lastName: 'Elliot',
        jobTitle: 'MFG ENG',
        role: 'Employee',
        username: 'morgan',
        passwordHash: hashPassword(generateDefaultPassword('Morgan', 'Elliot')),
        isDefaultPassword: true
    },
    {
        id: 'u3',
        firstName: 'Mike',
        lastName: 'Greere',
        jobTitle: 'ESS Lead',
        role: 'ESS',
        username: 'mike',
        passwordHash: hashPassword(generateDefaultPassword('Mike', 'Greere')),
        isDefaultPassword: true
    },
    {
        id: 'u4',
        firstName: 'Gerald',
        lastName: 'Jones',
        jobTitle: 'Facility Mgr',
        role: 'Employee',
        username: 'gerald',
        passwordHash: hashPassword(generateDefaultPassword('Gerald', 'Jones')),
        isDefaultPassword: true
    }
];

const SEED_DATA: PurchaseRequest[] = [
  {
    id: 'REQ-1001',
    projectCode: 'Project Alpha-X',
    requesterName: 'Morgan Elliot - MFG ENG',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    neededByDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    priority: Priority.HIGH,
    status: RequestStatus.ORDERED,
    items: [
      {
        id: 'item-1',
        name: 'High Performance Stepper Motor',
        description: 'NEMA 17, 1.8deg, 2A',
        vendor: 'DigiKey',
        mfgPartNumber: '123-STEP-MOTOR',
        url: 'https://digikey.com',
        quantity: 5,
        unitType: 'Each',
        pricePerUnit: 24.99
      },
      {
        id: 'item-2',
        name: 'Motor Driver',
        description: 'SilentStepStick',
        vendor: 'Pololu',
        mfgPartNumber: 'DRV8825',
        url: 'https://pololu.com',
        quantity: 5,
        unitType: 'Each',
        pricePerUnit: 8.50
      }
    ],
    totalAmount: 167.45,
    messages: [],
    approvalTimeline: [
        { id: 'evt-1', role: 'Employee', actorName: 'Morgan Elliot - MFG ENG', action: 'Submitted', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 'evt-3', role: 'ESS', actorName: 'Mike Greere - ESS', action: 'Ordered', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'PO #998877 created' }
    ],
    notes: 'Urgent for prototype phase 1'
  },
  {
    id: 'REQ-1002',
    projectCode: 'Facility Maint',
    requesterName: 'Gerald Jones - Facility Mgr',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    neededByDate: new Date(Date.now() + 86400000 * 20).toISOString(),
    priority: Priority.NORMAL,
    status: RequestStatus.NEEDS_INFO,
    items: [
      {
        id: 'item-3',
        name: 'Safety Glasses',
        description: 'Anti-fog, clear lens',
        vendor: 'Uline',
        mfgPartNumber: 'S-12345',
        url: 'https://uline.com',
        quantity: 2,
        unitType: 'Box of 10',
        pricePerUnit: 45.00
      }
    ],
    totalAmount: 90.00,
    messages: [
      {
        id: 'msg-1',
        sender: 'ESS',
        senderName: 'Mike Greere - ESS',
        text: 'Gerald, do you need the tinted ones or clear?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        attachments: []
      }
    ],
    approvalTimeline: [
        { id: 'evt-4', role: 'Employee', actorName: 'Gerald Jones - Facility Mgr', action: 'Submitted', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'evt-5', role: 'ESS', actorName: 'Mike Greere - ESS', action: 'Info Requested', timestamp: new Date(Date.now() - 1800000).toISOString() }
    ],
    notes: ''
  },
  {
    id: 'REQ-1003',
    projectCode: 'Project Beta',
    requesterName: 'Morgan Elliot - MFG ENG',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    neededByDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    priority: Priority.LOW,
    status: RequestStatus.PENDING,
    items: [
        {
            id: 'item-4',
            name: 'Dev Board',
            description: 'ESP32 Development Board',
            vendor: 'Amazon',
            mfgPartNumber: 'ESP32-DEVKIT',
            url: 'https://amazon.com',
            quantity: 2,
            unitType: 'Each',
            pricePerUnit: 12.50
        }
    ],
    totalAmount: 25.00,
    messages: [],
    approvalTimeline: [
        { id: 'evt-6', role: 'Employee', actorName: 'Morgan Elliot - MFG ENG', action: 'Submitted', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ],
    notes: 'For internal testing'
  }
];

// --- User Management ---

export const getUsers = (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
        return SEED_USERS;
    }
    return JSON.parse(data);
};

export const addUser = (firstName: string, lastName: string, jobTitle: string, role: UserRole, username: string): User => {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        throw new Error('Username already exists');
    }
    
    const defaultPwd = generateDefaultPassword(firstName, lastName);
    
    const newUser: User = {
        id: `u-${Date.now()}`,
        firstName,
        lastName,
        jobTitle,
        role,
        username,
        passwordHash: hashPassword(defaultPwd),
        isDefaultPassword: true
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const authenticateUser = (username: string, password: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user && user.passwordHash === hashPassword(password)) {
        return user;
    }
    return null;
};

export const updateUserPassword = (userId: string, newPassword: string): void => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].passwordHash = hashPassword(newPassword);
        users[index].isDefaultPassword = false;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

export const adminResetPassword = (userId: string): string => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        const user = users[index];
        const defaultPwd = generateDefaultPassword(user.firstName, user.lastName);
        users[index].passwordHash = hashPassword(defaultPwd);
        users[index].isDefaultPassword = true;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return defaultPwd;
    }
    return '';
};

// --- Request Management ---

export const getRequests = (): PurchaseRequest[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(data);
};

export const getRequestById = (id: string): PurchaseRequest | undefined => {
  const requests = getRequests();
  return requests.find(r => r.id === id);
};

export const saveRequest = (request: PurchaseRequest): void => {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === request.id);
  
  if (index === -1 && request.approvalTimeline.length === 0) {
      request.approvalTimeline.push({
          id: Date.now().toString(),
          role: 'Employee',
          actorName: request.requesterName,
          action: 'Submitted',
          timestamp: new Date().toISOString()
      });
  } else if (index !== -1) {
      request.updatedAt = new Date().toISOString();
      request.approvalTimeline.push({
          id: Date.now().toString(),
          role: 'Employee',
          actorName: request.requesterName,
          action: request.status === RequestStatus.PENDING ? 'Edited' : 'Resubmitted',
          timestamp: new Date().toISOString()
      });
      
      if (request.status === RequestStatus.REJECTED || request.status === RequestStatus.NEEDS_INFO) {
          request.status = RequestStatus.PENDING;
      }
  }

  if (index >= 0) {
    requests[index] = request;
  } else {
    requests.unshift(request);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const processApproval = (
    requestId: string, 
    role: UserRole, 
    action: 'Order' | 'Reject' | 'RequestInfo' | 'Received', 
    note?: string
): PurchaseRequest | null => {
    const requests = getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    const req = requests[index];
    const now = new Date().toISOString();
    
    let newStatus = req.status;
    let timelineAction: ApprovalEvent['action'] = 'Submitted';

    if (action === 'Order') {
        newStatus = RequestStatus.ORDERED;
        timelineAction = 'Ordered';
    } else if (action === 'Received') {
        newStatus = RequestStatus.RECEIVED;
        timelineAction = 'Received';
    } else if (action === 'Reject') {
        newStatus = RequestStatus.REJECTED;
        timelineAction = 'Rejected';
    } else if (action === 'RequestInfo') {
        newStatus = RequestStatus.NEEDS_INFO;
        timelineAction = 'Info Requested';
    }

    req.status = newStatus;
    req.updatedAt = now;
    req.approvalTimeline.push({
        id: Date.now().toString(),
        role: role,
        actorName: 'ESS Team',
        action: timelineAction,
        timestamp: now,
        note: note
    });

    requests[index] = req;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return req;
};

export const addMessage = (requestId: string, message: Message): PurchaseRequest | null => {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index >= 0) {
    requests[index].messages.push(message);
    requests[index].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return requests[index];
  }
  return null;
};

export const deleteRequest = (id: string): void => {
    const requests = getRequests();
    const newRequests = requests.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRequests));
}