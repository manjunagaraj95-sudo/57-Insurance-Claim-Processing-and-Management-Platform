
import React, { useState, useEffect } from 'react';
// import './App.css'; // This is implied by the output format

// --- ROLES Configuration for RBAC ---
const ROLES = {
  POLICYHOLDER: {
    name: 'Policyholder',
    screens: ['DASHBOARD', 'CLAIMS', 'CLAIM_DETAIL', 'CLAIM_FORM'],
    can: { viewOwnClaims: true, submitClaims: true, viewPolicies: true },
  },
  CLAIMS_OFFICER: {
    name: 'Claims Officer',
    screens: ['DASHBOARD', 'CLAIMS', 'CLAIM_DETAIL', 'CLAIM_FORM', 'POLICIES'],
    can: { viewAllClaims: true, approveClaims: true, assignClaims: true, viewPolicies: true, manageClaims: true },
  },
  VERIFICATION_OFFICER: {
    name: 'Verification Officer',
    screens: ['DASHBOARD', 'CLAIMS', 'CLAIM_DETAIL'],
    can: { verifyDocuments: true, investigateClaims: true, viewAllClaims: true },
  },
  FINANCE_TEAM: {
    name: 'Finance Team',
    screens: ['DASHBOARD', 'CLAIMS', 'CLAIM_DETAIL', 'REPORTS'],
    can: { processPayments: true, viewFinancialReports: true, viewAllClaims: true },
  },
  ADMIN: {
    name: 'Admin',
    screens: ['DASHBOARD', 'CLAIMS', 'CLAIM_DETAIL', 'CLAIM_FORM', 'POLICIES', 'POLICY_DETAIL', 'USER_MANAGEMENT', 'REPORTS'],
    can: { manageUsers: true, fullAccess: true, viewAllClaims: true, manageClaims: true, viewPolicies: true },
  },
};

// --- Standardized Status Keys and UI Mapping ---
const CLAIM_STATUS_MAP = {
  SUBMITTED: { label: 'Submitted', color: 'var(--status-info)' },
  PENDING_VERIFICATION: { label: 'Pending Verification', color: 'var(--status-warning)' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'var(--status-primary)' },
  APPROVED: { label: 'Approved', color: 'var(--status-success)' },
  REJECTED: { label: 'Rejected', color: 'var(--status-danger)' },
  SETTLED: { label: 'Settled', color: 'var(--status-completed)' },
};

const POLICY_STATUS_MAP = {
  ACTIVE: { label: 'Active', color: 'var(--status-success)' },
  EXPIRED: { label: 'Expired', color: 'var(--status-danger)' },
  PENDING: { label: 'Pending Activation', color: 'var(--status-warning)' },
};

const USER_STATUS_MAP = {
  ACTIVE: { label: 'Active', color: 'var(--status-success)' },
  INACTIVE: { label: 'Inactive', color: 'var(--status-danger)' },
  PENDING: { label: 'Pending Invite', color: 'var(--status-info)' },
};

// --- Dummy Data ---
const DUMMY_CLAIMS = [
  {
    id: 'C001',
    policyId: 'P101',
    policyholderName: 'Alice Johnson',
    claimType: 'Auto Accident',
    status: 'PENDING_VERIFICATION',
    submissionDate: '2023-10-26T10:00:00Z',
    lastUpdated: '2023-10-27T09:30:00Z',
    amount: 15000.00,
    documents: ['Accident_Report.pdf', 'Police_Statement.pdf', 'Repair_Estimate.pdf'],
    auditTrail: [
      { timestamp: '2023-10-26T10:00:00Z', user: 'Alice Johnson', action: 'Claim Submitted' },
      { timestamp: '2023-10-27T09:30:00Z', user: 'John Doe (Claims Officer)', action: 'Assigned to Verification' },
      { timestamp: '2023-10-27T14:15:00Z', user: 'Jane Smith (Verification Officer)', action: 'Documents Reviewed' },
    ],
    assignedTo: 'Jane Smith (Verification Officer)',
    resolutionDate: null,
    priority: 'High',
    notes: 'Policyholder reported a minor accident, third-party involved. Waiting for police report verification.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED']
  },
  {
    id: 'C002',
    policyId: 'P102',
    policyholderName: 'Bob Williams',
    claimType: 'Home Burglary',
    status: 'APPROVED',
    submissionDate: '2023-10-20T14:00:00Z',
    lastUpdated: '2023-11-01T11:00:00Z',
    amount: 5000.00,
    documents: ['Police_Report_Burglary.pdf', 'Itemized_Loss.pdf'],
    auditTrail: [
      { timestamp: '2023-10-20T14:00:00Z', user: 'Bob Williams', action: 'Claim Submitted' },
      { timestamp: '2023-10-22T08:00:00Z', user: 'Sarah Lee (Claims Officer)', action: 'Approved initial assessment' },
      { timestamp: '2023-11-01T11:00:00Z', user: 'Finance Team', action: 'Payment scheduled' },
    ],
    assignedTo: 'Finance Team',
    resolutionDate: '2023-11-05',
    priority: 'Medium',
    notes: 'Approved for settlement. Funds to be transferred within 5 business days.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED']
  },
  {
    id: 'C003',
    policyId: 'P103',
    policyholderName: 'Charlie Brown',
    claimType: 'Medical Emergency',
    status: 'SUBMITTED',
    submissionDate: '2023-11-05T09:00:00Z',
    lastUpdated: '2023-11-05T09:00:00Z',
    amount: 800.00,
    documents: ['Hospital_Bill.pdf', 'Medical_Report.pdf'],
    auditTrail: [
      { timestamp: '2023-11-05T09:00:00Z', user: 'Charlie Brown', action: 'Claim Submitted' },
    ],
    assignedTo: 'John Doe (Claims Officer)',
    resolutionDate: null,
    priority: 'Low',
    notes: 'New claim for emergency medical treatment. Awaiting initial review.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED']
  },
  {
    id: 'C004',
    policyId: 'P104',
    policyholderName: 'Diana Prince',
    claimType: 'Travel Cancellation',
    status: 'REJECTED',
    submissionDate: '2023-09-15T11:00:00Z',
    lastUpdated: '2023-09-20T16:00:00Z',
    amount: 1200.00,
    documents: ['Booking_Confirmation.pdf', 'Cancellation_Notice.pdf'],
    auditTrail: [
      { timestamp: '2023-09-15T11:00:00Z', user: 'Diana Prince', action: 'Claim Submitted' },
      { timestamp: '2023-09-18T10:00:00Z', user: 'John Doe (Claims Officer)', action: 'Reviewed for eligibility' },
      { timestamp: '2023-09-20T16:00:00Z', user: 'John Doe (Claims Officer)', action: 'Claim Rejected: Not covered under policy terms' },
    ],
    assignedTo: null,
    resolutionDate: '2023-09-20',
    priority: 'Medium',
    notes: 'Claim rejected due to specific exclusion for "Act of God" events. Policyholder informed.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'REJECTED']
  },
  {
    id: 'C005',
    policyId: 'P105',
    policyholderName: 'Eve Adams',
    claimType: 'Property Damage',
    status: 'PENDING_APPROVAL',
    submissionDate: '2023-10-01T13:00:00Z',
    lastUpdated: '2023-10-10T10:00:00Z',
    amount: 7500.00,
    documents: ['Damage_Photos.zip', 'Contractor_Quote.pdf'],
    auditTrail: [
      { timestamp: '2023-10-01T13:00:00Z', user: 'Eve Adams', action: 'Claim Submitted' },
      { timestamp: '2023-10-03T09:00:00Z', user: 'Jane Smith (Verification Officer)', action: 'Field Inspection Completed' },
      { timestamp: '2023-10-08T15:00:00Z', user: 'John Doe (Claims Officer)', action: 'Ready for Approval' },
    ],
    assignedTo: 'Sarah Lee (Claims Officer)',
    resolutionDate: null,
    priority: 'High',
    notes: 'Verification complete, awaiting final approval from senior claims officer.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED']
  },
  {
    id: 'C006',
    policyId: 'P101',
    policyholderName: 'Alice Johnson',
    claimType: 'Pet Injury',
    status: 'SETTLED',
    submissionDate: '2023-08-10T09:00:00Z',
    lastUpdated: '2023-08-25T14:00:00Z',
    amount: 300.00,
    documents: ['Vet_Bill.pdf'],
    auditTrail: [
      { timestamp: '2023-08-10T09:00:00Z', user: 'Alice Johnson', action: 'Claim Submitted' },
      { timestamp: '2023-08-12T11:00:00Z', user: 'John Doe (Claims Officer)', action: 'Approved' },
      { timestamp: '2023-08-25T14:00:00Z', user: 'Finance Team', action: 'Settled' },
    ],
    assignedTo: null,
    resolutionDate: '2023-08-25',
    priority: 'Low',
    notes: 'Claim fully processed and settled. Policyholder satisfaction confirmed.',
    workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED']
  },
];

const DUMMY_POLICIES = [
  {
    id: 'P101',
    policyNumber: 'AUTO-2023-001',
    policyholderName: 'Alice Johnson',
    type: 'Auto Insurance',
    status: 'ACTIVE',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    coverageAmount: 250000.00,
    premium: 1200.00,
    details: 'Comprehensive auto coverage for sedan, includes collision and liability. Pet injury rider included.',
  },
  {
    id: 'P102',
    policyNumber: 'HOME-2023-002',
    policyholderName: 'Bob Williams',
    type: 'Homeowner\'s Insurance',
    status: 'ACTIVE',
    startDate: '2023-02-15',
    endDate: '2024-02-15',
    coverageAmount: 300000.00,
    premium: 950.00,
    details: 'Standard homeowner\'s policy covering dwelling, personal property, and liability. Excludes flood.',
  },
  {
    id: 'P103',
    policyNumber: 'LIFE-2023-003',
    policyholderName: 'Charlie Brown',
    type: 'Life Insurance',
    status: 'ACTIVE',
    startDate: '2023-03-01',
    endDate: '2043-03-01',
    coverageAmount: 100000.00,
    premium: 300.00,
    details: 'Term life insurance with medical rider.',
  },
  {
    id: 'P104',
    policyNumber: 'TRAVEL-2023-004',
    policyholderName: 'Diana Prince',
    type: 'Travel Insurance',
    status: 'EXPIRED',
    startDate: '2023-09-01',
    endDate: '2023-09-30',
    coverageAmount: 5000.00,
    premium: 50.00,
    details: 'Single-trip travel insurance. Covered emergency medical and baggage loss. Excludes cancellation due to natural disasters.',
  },
  {
    id: 'P105',
    policyNumber: 'PROP-2023-005',
    policyholderName: 'Eve Adams',
    type: 'Property Insurance',
    status: 'ACTIVE',
    startDate: '2023-07-01',
    endDate: '2024-07-01',
    coverageAmount: 150000.00,
    premium: 700.00,
    details: 'Commercial property insurance for a small business. Covers fire, theft, and vandalism.',
  },
  {
    id: 'P106',
    policyNumber: 'HEALTH-2023-006',
    policyholderName: 'Frank Green',
    type: 'Health Insurance',
    status: 'PENDING',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    coverageAmount: 500000.00,
    premium: 4000.00,
    details: 'Comprehensive health plan with dental and vision. Activation pending document verification.',
  },
];

const DUMMY_USERS = [
  { id: 'U001', name: 'John Doe', email: 'john.doe@insurecorp.com', role: ROLES.CLAIMS_OFFICER.name, status: 'ACTIVE' },
  { id: 'U002', name: 'Jane Smith', email: 'jane.smith@insurecorp.com', role: ROLES.VERIFICATION_OFFICER.name, status: 'ACTIVE' },
  { id: 'U003', name: 'Alice Johnson', email: 'alice.j@example.com', role: ROLES.POLICYHOLDER.name, status: 'ACTIVE' },
  { id: 'U004', name: 'Bob Williams', email: 'bob.w@example.com', role: ROLES.POLICYHOLDER.name, status: 'ACTIVE' },
  { id: 'U005', name: 'Sarah Lee', email: 'sarah.lee@insurecorp.com', role: ROLES.ADMIN.name, status: 'ACTIVE' },
  { id: 'U006', name: 'Mike Ross', email: 'mike.r@insurecorp.com', role: ROLES.FINANCE_TEAM.name, status: 'INACTIVE' },
];

const DUMMY_DASHBOARD_DATA = {
  totalClaims: DUMMY_CLAIMS.length,
  pendingClaims: DUMMY_CLAIMS.filter(c => c.status === 'PENDING_VERIFICATION' || c.status === 'PENDING_APPROVAL').length,
  approvedClaims: DUMMY_CLAIMS.filter(c => c.status === 'APPROVED').length,
  settledClaims: DUMMY_CLAIMS.filter(c => c.status === 'SETTLED').length,
  recentActivities: [
    { timestamp: 'Just now', description: 'Claim <strong>C003</strong> (Medical Emergency) submitted by Charlie Brown.' },
    { timestamp: '15 mins ago', description: 'Claim <strong>C005</strong> (Property Damage) moved to Pending Approval.' },
    { timestamp: '2 hours ago', description: 'User <strong>Sarah Lee</strong> updated Policy P102 details.' },
    { timestamp: 'Yesterday', description: 'Claim <strong>C002</strong> (Home Burglary) payment processed.' },
  ],
  claimsByStatus: {
    labels: ['Submitted', 'Pending Verification', 'Pending Approval', 'Approved', 'Rejected', 'Settled'],
    data: [1, 1, 1, 1, 1, 1] // Based on DUMMY_CLAIMS counts
  },
  claimsByType: {
    labels: ['Auto Accident', 'Home Burglary', 'Medical Emergency', 'Travel Cancellation', 'Property Damage', 'Pet Injury'],
    data: [2, 1, 1, 1, 1, 1]
  }
};


function App() {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [currentUser, setCurrentUser] = useState(ROLES.CLAIMS_OFFICER); // Default to Claims Officer
  const [claims, setClaims] = useState(DUMMY_CLAIMS);
  const [policies, setPolicies] = useState(DUMMY_POLICIES);
  const [users, setUsers] = useState(DUMMY_USERS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Update claimsByStatus in dashboard data based on current claims state
  useEffect(() => {
    const counts = {
      SUBMITTED: 0,
      PENDING_VERIFICATION: 0,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
      SETTLED: 0,
    };
    claims.forEach(claim => {
      counts[claim.status] = (counts[claim.status] || 0) + 1;
    });
    DUMMY_DASHBOARD_DATA.claimsByStatus.data = Object.values(counts);
  }, [claims]);


  const navigate = (screen, params = {}) => {
    setView({ screen, params });
    setIsDropdownOpen(false); // Close dropdown on navigation
  };

  const handleLogout = () => {
    console.log('User logged out'); // In a real app, clear auth tokens, redirect
    // For this demo, we'll just reset view or maybe switch user if we had a login screen
    setCurrentUser(ROLES.POLICYHOLDER); // Simulating logging out to a different role
    navigate('DASHBOARD');
  };

  const handleSubmitClaim = (newClaimData) => {
    const newClaim = {
      id: `C${String(claims.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'SUBMITTED',
      auditTrail: [{ timestamp: new Date().toISOString(), user: currentUser?.name, action: 'Claim Submitted' }],
      documents: newClaimData.documents || [],
      workflow: ['SUBMITTED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'SETTLED'],
      ...newClaimData,
    };
    setClaims(prevClaims => [...prevClaims, newClaim]);
    navigate('CLAIMS');
  };

  const handleUpdateClaim = (updatedClaim) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        (claim.id === updatedClaim.id)
          ? { ...claim, ...updatedClaim, lastUpdated: new Date().toISOString() }
          : claim
      )
    );
    navigate('CLAIM_DETAIL', { id: updatedClaim.id });
  };

  const handleApproveClaim = (claimId) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        (claim.id === claimId)
          ? {
              ...claim,
              status: 'APPROVED',
              lastUpdated: new Date().toISOString(),
              auditTrail: [...(claim.auditTrail || []), { timestamp: new Date().toISOString(), user: currentUser?.name, action: 'Claim Approved' }]
            }
          : claim
      )
    );
    navigate('CLAIM_DETAIL', { id: claimId });
  };

  const handleRejectClaim = (claimId) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        (claim.id === claimId)
          ? {
              ...claim,
              status: 'REJECTED',
              lastUpdated: new Date().toISOString(),
              resolutionDate: new Date().toISOString().split('T')[0],
              auditTrail: [...(claim.auditTrail || []), { timestamp: new Date().toISOString(), user: currentUser?.name, action: 'Claim Rejected' }]
            }
          : claim
      )
    );
    navigate('CLAIM_DETAIL', { id: claimId });
  };

  const handleSettleClaim = (claimId) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        (claim.id === claimId)
          ? {
              ...claim,
              status: 'SETTLED',
              lastUpdated: new Date().toISOString(),
              resolutionDate: new Date().toISOString().split('T')[0],
              auditTrail: [...(claim.auditTrail || []), { timestamp: new Date().toISOString(), user: currentUser?.name, action: 'Claim Settled' }]
            }
          : claim
      )
    );
    navigate('CLAIM_DETAIL', { id: claimId });
  };

  // Generic render for status badge
  const renderStatusBadge = (statusKey, statusMap) => {
    const statusInfo = statusMap[statusKey];
    if (!statusInfo) return null;
    return (
      <span className="status-badge" style={{ backgroundColor: statusInfo.color }} data-status={statusKey.toLowerCase()}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // --- Screens ---

  const DashboardScreen = () => (
    <>
      <h1 className="dashboard-section-title">Dashboard Overview</h1>

      <div className="dashboard-grid mb-lg">
        <div className="card metric-card live-data">
          <h3>Total Claims</h3>
          <p>{DUMMY_DASHBOARD_DATA.totalClaims}</p>
        </div>
        <div className="card metric-card live-data">
          <h3>Pending Claims</h3>
          <p>{DUMMY_DASHBOARD_DATA.pendingClaims}</p>
        </div>
        <div className="card metric-card live-data">
          <h3>Approved Claims</h3>
          <p>{DUMMY_DASHBOARD_DATA.approvedClaims}</p>
        </div>
        <div className="card metric-card live-data">
          <h3>Settled Claims</h3>
          <p>{DUMMY_DASHBOARD_DATA.settledClaims}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Claims by Status (Donut Chart)</h4>
          <div className="chart-placeholder">Donut Chart Placeholder</div>
        </div>
        <div className="card">
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Claims by Type (Bar Chart)</h4>
          <div className="chart-placeholder">Bar Chart Placeholder</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Claim Processing Timeline (Line Chart)</h4>
          <div className="chart-placeholder">Line Chart Placeholder</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Recent Activities</h4>
          <ul className="recent-activities-panel">
            {DUMMY_DASHBOARD_DATA.recentActivities.slice(0, 5).map((activity, index) => (
              <li key={`activity-${index}`} className="activity-item">
                <span className="activity-timestamp">{activity.timestamp}</span>
                <span className="activity-description" dangerouslySetInnerHTML={{ __html: activity.description }}></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  const ClaimsScreen = () => {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAndSortedClaims = claims
      .filter(claim =>
        (filterStatus === 'ALL' || claim.status === filterStatus) &&
        (claim.policyholderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         claim.claimType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         claim.id?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
        if (sortOrder === 'oldest') return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
        if (sortOrder === 'amount_desc') return b.amount - a.amount;
        if (sortOrder === 'amount_asc') return a.amount - b.amount;
        return 0;
      });

    return (
      <>
        <div className="flex-row justify-between items-center mb-lg">
          <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)' }}>All Claims</h1>
          {(currentUser?.can?.submitClaims || currentUser?.can?.manageClaims) && (
             <button className="btn btn-primary" onClick={() => navigate('CLAIM_FORM')}>
               + Submit New Claim
             </button>
           )}
        </div>

        <div className="controls-bar">
          <div className="controls-left">
            <input
              type="text"
              className="form-control"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(CLAIM_STATUS_MAP).map(status => (
                <option key={status} value={status}>{CLAIM_STATUS_MAP[status].label}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
            </select>
          </div>
          <div className="controls-right">
            <button className="btn action-btn">Export</button>
            {(currentUser?.can?.manageClaims) && (
              <button className="btn action-btn">Bulk Actions</button>
            )}
          </div>
        </div>

        {filteredAndSortedClaims.length === 0 ? (
          <div className="empty-state">
            <img src="https://via.placeholder.com/150/EEEEEE/888888?text=No+Claims" alt="No claims found" />
            <h3>No Claims Found</h3>
            <p>Your search or filter criteria did not match any claims.</p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}>Clear Filters</button>
          </div>
        ) : (
          <div className="claims-grid">
            {filteredAndSortedClaims.map(claim => (
              <div
                key={claim.id}
                className="card clickable-card"
                onClick={() => navigate('CLAIM_DETAIL', { id: claim.id })}
                style={{
                  '--card-border-color': CLAIM_STATUS_MAP[claim.status]?.color || 'var(--color-border)',
                  borderTop: '5px solid var(--card-border-color)',
                  paddingTop: 'var(--spacing-md)'
                }}
              >
                <div className="claim-card-header">
                  <div>
                    <h3 className="claim-card-title">{claim.claimType} <span style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary-500)'}}>{claim.id}</span></h3>
                    <p className="claim-card-meta">Policyholder: {claim.policyholderName}</p>
                  </div>
                  {renderStatusBadge(claim.status, CLAIM_STATUS_MAP)}
                </div>
                <div className="claim-card-info">
                  <p><strong>Amount:</strong> ${claim.amount?.toLocaleString()}</p>
                  <p><strong>Submitted:</strong> {formatDate(claim.submissionDate)}</p>
                  <p><strong>Last Updated:</strong> {formatDate(claim.lastUpdated)}</p>
                </div>
                <div className="claim-actions">
                  <button className="btn btn-outline-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate('CLAIM_DETAIL', { id: claim.id }); }}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const ClaimDetailScreen = () => {
    const claimId = view.params?.id;
    const claim = claims.find(c => c.id === claimId);

    if (!claim) {
      return <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-h3)' }}>Claim Not Found</h2>
        <p style={{ marginTop: 'var(--spacing-sm)' }}>The claim with ID "{claimId}" does not exist.</p>
        <button className="btn btn-primary mt-lg" onClick={() => navigate('CLAIMS')}>Back to Claims</button>
      </div>;
    }

    const currentWorkflowIndex = claim.workflow?.indexOf(claim.status);
    const policy = policies.find(p => p.id === claim.policyId);

    return (
      <>
        <div className="breadcrumb-nav">
          <a onClick={() => navigate('DASHBOARD')}>Dashboard</a>
          <span>/</span>
          <a onClick={() => navigate('CLAIMS')}>Claims</a>
          <span>/</span>
          <span className="current-page">{claim.id}</span>
        </div>

        <div className="detail-header">
          <h1 className="detail-title">Claim: {claim.claimType} ({claim.id})</h1>
          <div className="flex-row gap-sm items-center">
            {renderStatusBadge(claim.status, CLAIM_STATUS_MAP)}
            {(currentUser?.can?.manageClaims) && (
              <>
                {claim.status === 'PENDING_APPROVAL' && (
                  <button className="btn btn-success" onClick={() => handleApproveClaim(claim.id)}>Approve</button>
                )}
                {claim.status === 'APPROVED' && (
                  <button className="btn btn-secondary" onClick={() => handleSettleClaim(claim.id)}>Settle</button>
                )}
                {(claim.status === 'PENDING_VERIFICATION' || claim.status === 'PENDING_APPROVAL') && (
                  <button className="btn btn-danger" onClick={() => handleRejectClaim(claim.id)}>Reject</button>
                )}
                {(currentUser?.can?.manageClaims && claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && claim.status !== 'SETTLED') && (
                  <button className="btn btn-primary" onClick={() => navigate('CLAIM_FORM', { id: claim.id })}>Edit</button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h2 className="detail-section-title">Workflow Progress</h2>
          <div className="workflow-tracker">
            {claim.workflow?.map((stage, index) => (
              <div
                key={stage}
                className={`workflow-stage ${index <= currentWorkflowIndex ? 'completed' : ''} ${index === currentWorkflowIndex ? 'active' : ''}`}
              >
                <div className="workflow-stage-name">{CLAIM_STATUS_MAP[stage]?.label || stage}</div>
                {index < currentWorkflowIndex && <div className="workflow-stage-status">Completed</div>}
                {index === currentWorkflowIndex && <div className="workflow-stage-status">Current Stage</div>}
                {index > currentWorkflowIndex && <div className="workflow-stage-status">Pending</div>}
                {index < claim.workflow.length - 1 && <div className="workflow-stage-arrow"></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Claim Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Policyholder</span>
              <span className="detail-value">{claim.policyholderName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Claim Type</span>
              <span className="detail-value">{claim.claimType}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Policy ID</span>
              <a className="detail-value" onClick={() => navigate('POLICY_DETAIL', { id: claim.policyId })} style={{ cursor: 'pointer' }}>{claim.policyId}</a>
            </div>
            <div className="detail-item">
              <span className="detail-label">Claim Amount</span>
              <span className="detail-value">${claim.amount?.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Submission Date</span>
              <span className="detail-value">{formatDateTime(claim.submissionDate)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">{formatDateTime(claim.lastUpdated)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Assigned To</span>
              <span className="detail-value">{claim.assignedTo || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Resolution Date</span>
              <span className="detail-value">{formatDate(claim.resolutionDate) || 'Pending'}</span>
            </div>
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <span className="detail-label">Notes</span>
              <span className="detail-value">{claim.notes || 'No notes provided.'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Supporting Documents</h2>
          <div className="detail-documents-list">
            {(claim.documents?.length === 0) ? (
              <p className="text-muted" style={{ padding: 'var(--spacing-sm) 0' }}>No documents uploaded.</p>
            ) : (
              claim.documents?.map((doc, index) => (
                <div key={index} className="detail-document-item">
                  <span className="detail-document-name">{doc}</span>
                  <div className="detail-document-actions">
                    <a href="#" onClick={(e) => e.preventDefault()}>View</a>
                    <a href="#" onClick={(e) => e.preventDefault()}>Download</a>
                  </div>
                </div>
              ))
            )}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div className="document-preview-card">
                Document Preview Placeholder
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Related Policy</h2>
          {policy ? (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Policy Number</span>
                <span className="detail-value">{policy.policyNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Policy Type</span>
                <span className="detail-value">{policy.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">{renderStatusBadge(policy.status, POLICY_STATUS_MAP)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coverage Amount</span>
                <span className="detail-value">${policy.coverageAmount?.toLocaleString()}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <button className="btn btn-outline-primary" onClick={() => navigate('POLICY_DETAIL', { id: policy.id })}>View Policy Details</button>
              </div>
            </div>
          ) : (
            <p className="text-muted">No related policy found.</p>
          )}
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Audit Trail</h2>
          <ul className="audit-trail-list">
            {(claim.auditTrail?.length === 0) ? (
              <p className="text-muted" style={{ padding: 'var(--spacing-sm) 0' }}>No audit history available.</p>
            ) : (
              claim.auditTrail?.map((entry, index) => (
                <li key={index} className="audit-trail-item">
                  <span className="audit-timestamp">{formatDateTime(entry.timestamp)}</span>
                  <span className="audit-description">
                    <strong>{entry.user}</strong> {entry.action}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </>
    );
  };

  const ClaimFormScreen = () => {
    const claimId = view.params?.id;
    const existingClaim = claimId ? claims.find(c => c.id === claimId) : null;

    const [formData, setFormData] = useState({
      policyId: existingClaim?.policyId || '',
      policyholderName: existingClaim?.policyholderName || '',
      claimType: existingClaim?.claimType || '',
      amount: existingClaim?.amount || '',
      notes: existingClaim?.notes || '',
      documents: existingClaim?.documents || [],
      assignedTo: existingClaim?.assignedTo || currentUser?.name, // Auto-populate assigned to current user
      priority: existingClaim?.priority || 'Medium',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) { // Clear error on change
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    };

    const handleFileChange = (e) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files).map(file => file.name); // In real app, upload files
        setFormData(prev => ({
          ...prev,
          documents: [...(prev.documents || []), ...newFiles],
        }));
      }
    };

    const validateForm = () => {
      const newErrors = {};
      if (!formData.policyId) newErrors.policyId = 'Policy ID is mandatory.';
      if (!formData.policyholderName) newErrors.policyholderName = 'Policyholder Name is mandatory.';
      if (!formData.claimType) newErrors.claimType = 'Claim Type is mandatory.';
      if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number.';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = (e) => {
      e.preventDefault();
      if (!validateForm()) {
        alert('Please correct the errors in the form.');
        return;
      }

      if (existingClaim) {
        handleUpdateClaim({ ...existingClaim, ...formData });
      } else {
        handleSubmitClaim(formData);
      }
    };

    return (
      <>
        <div className="breadcrumb-nav">
          <a onClick={() => navigate('DASHBOARD')}>Dashboard</a>
          <span>/</span>
          <a onClick={() => navigate('CLAIMS')}>Claims</a>
          <span>/</span>
          <span className="current-page">{existingClaim ? `Edit ${existingClaim.id}` : 'New Claim'}</span>
        </div>

        <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
          {existingClaim ? `Edit Claim: ${existingClaim.id}` : 'Submit New Claim'}
        </h1>

        <form onSubmit={handleSave} className="card" style={{ padding: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
          <div className="form-group">
            <label htmlFor="policyId" className="form-label">Policy ID *</label>
            <input
              type="text"
              id="policyId"
              name="policyId"
              className={`form-control ${errors.policyId ? 'error' : ''}`}
              value={formData.policyId}
              onChange={handleChange}
              placeholder="e.g., P101"
              required
            />
            {errors.policyId && <span className="error-message">{errors.policyId}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="policyholderName" className="form-label">Policyholder Name *</label>
            <input
              type="text"
              id="policyholderName"
              name="policyholderName"
              className={`form-control ${errors.policyholderName ? 'error' : ''}`}
              value={formData.policyholderName}
              onChange={handleChange}
              placeholder="e.g., Alice Johnson"
              required
            />
            {errors.policyholderName && <span className="error-message">{errors.policyholderName}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="claimType" className="form-label">Claim Type *</label>
            <input
              type="text"
              id="claimType"
              name="claimType"
              className={`form-control ${errors.claimType ? 'error' : ''}`}
              value={formData.claimType}
              onChange={handleChange}
              placeholder="e.g., Auto Accident, Home Burglary"
              required
            />
            {errors.claimType && <span className="error-message">{errors.claimType}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="amount" className="form-label">Claim Amount *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              className={`form-control ${errors.amount ? 'error' : ''}`}
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g., 15000.00"
              required
              min="0.01"
              step="0.01"
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="assignedTo" className="form-label">Assigned To (Auto-populated)</label>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              className="form-control"
              value={formData.assignedTo}
              onChange={handleChange}
              readOnly
              style={{ backgroundColor: 'var(--color-background-dark)' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="priority" className="form-label">Priority</label>
            <select
              id="priority"
              name="priority"
              className="form-control"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Add any relevant notes or details..."
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="documents" className="form-label">Upload Supporting Documents</label>
            <div className="file-upload-container">
              <input type="file" id="documents" name="documents" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              <p style={{ color: 'var(--color-secondary-500)', fontSize: 'var(--font-size-sm)' }}>Drag & drop files here or <span style={{ color: 'var(--color-primary-500)', fontWeight: 'var(--font-weight-medium)' }}>browse</span></p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary-600)' }}>Max file size: 10MB</p>
            </div>
            {formData.documents?.length > 0 && (
              <ul className="file-list">
                {formData.documents.map((doc, index) => (
                  <li key={index} className="file-item">
                    <span>{doc}</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }))} style={{ color: 'var(--color-danger-500)' }}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-row justify-end gap-md mt-lg">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('CLAIMS')}>Cancel</button>
            <button type="submit" className="btn btn-primary">{existingClaim ? 'Update Claim' : 'Submit Claim'}</button>
          </div>
        </form>
      </>
    );
  };

  const PoliciesScreen = () => {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPolicies = policies
      .filter(policy =>
        (filterStatus === 'ALL' || policy.status === filterStatus) &&
        (policy.policyholderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         policy.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         policy.type?.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    return (
      <>
        <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>All Policies</h1>

        <div className="controls-bar">
          <div className="controls-left">
            <input
              type="text"
              className="form-control"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(POLICY_STATUS_MAP).map(status => (
                <option key={status} value={status}>{POLICY_STATUS_MAP[status].label}</option>
              ))}
            </select>
          </div>
          <div className="controls-right">
            <button className="btn action-btn">Export</button>
          </div>
        </div>

        {filteredPolicies.length === 0 ? (
          <div className="empty-state">
            <img src="https://via.placeholder.com/150/EEEEEE/888888?text=No+Policies" alt="No policies found" />
            <h3>No Policies Found</h3>
            <p>Your search or filter criteria did not match any policies.</p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}>Clear Filters</button>
          </div>
        ) : (
          <div className="claims-grid"> {/* Reusing claims-grid for general card layout */}
            {filteredPolicies.map(policy => (
              <div
                key={policy.id}
                className="card clickable-card"
                onClick={() => navigate('POLICY_DETAIL', { id: policy.id })}
                style={{
                  '--card-border-color': POLICY_STATUS_MAP[policy.status]?.color || 'var(--color-border)',
                  borderTop: '5px solid var(--card-border-color)',
                  paddingTop: 'var(--spacing-md)'
                }}
              >
                <div className="claim-card-header">
                  <div>
                    <h3 className="claim-card-title">{policy.type} <span style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary-500)'}}>{policy.policyNumber}</span></h3>
                    <p className="claim-card-meta">Policyholder: {policy.policyholderName}</p>
                  </div>
                  {renderStatusBadge(policy.status, POLICY_STATUS_MAP)}
                </div>
                <div className="claim-card-info">
                  <p><strong>Coverage:</strong> ${policy.coverageAmount?.toLocaleString()}</p>
                  <p><strong>Period:</strong> {formatDate(policy.startDate)} - {formatDate(policy.endDate)}</p>
                </div>
                <div className="claim-actions">
                  <button className="btn btn-outline-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate('POLICY_DETAIL', { id: policy.id }); }}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const PolicyDetailScreen = () => {
    const policyId = view.params?.id;
    const policy = policies.find(p => p.id === policyId);
    const relatedClaims = claims.filter(c => c.policyId === policyId);

    if (!policy) {
      return <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-h3)' }}>Policy Not Found</h2>
        <p style={{ marginTop: 'var(--spacing-sm)' }}>The policy with ID "{policyId}" does not exist.</p>
        <button className="btn btn-primary mt-lg" onClick={() => navigate('POLICIES')}>Back to Policies</button>
      </div>;
    }

    return (
      <>
        <div className="breadcrumb-nav">
          <a onClick={() => navigate('DASHBOARD')}>Dashboard</a>
          <span>/</span>
          <a onClick={() => navigate('POLICIES')}>Policies</a>
          <span>/</span>
          <span className="current-page">{policy.policyNumber}</span>
        </div>

        <div className="detail-header">
          <h1 className="detail-title">Policy: {policy.policyNumber} ({policy.type})</h1>
          <div className="flex-row gap-sm items-center">
            {renderStatusBadge(policy.status, POLICY_STATUS_MAP)}
            {(currentUser?.can?.fullAccess) && ( // Example: Only Admin can edit policy
              <button className="btn btn-primary">Edit Policy</button>
            )}
          </div>
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Policy Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Policyholder</span>
              <span className="detail-value">{policy.policyholderName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Policy Type</span>
              <span className="detail-value">{policy.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Coverage Amount</span>
              <span className="detail-value">${policy.coverageAmount?.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Annual Premium</span>
              <span className="detail-value">${policy.premium?.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Start Date</span>
              <span className="detail-value">{formatDate(policy.startDate)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End Date</span>
              <span className="detail-value">{formatDate(policy.endDate)}</span>
            </div>
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <span className="detail-label">Details</span>
              <span className="detail-value">{policy.details || 'No additional details provided.'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section card" style={{padding: 'var(--spacing-lg)'}}>
          <h2 className="detail-section-title" style={{marginTop: '0', paddingBottom: 'var(--spacing-sm)'}}>Related Claims</h2>
          {(relatedClaims.length === 0) ? (
            <p className="text-muted" style={{ padding: 'var(--spacing-sm) 0' }}>No claims associated with this policy.</p>
          ) : (
            <div className="claims-grid">
              {relatedClaims.map(claim => (
                <div
                  key={claim.id}
                  className="card clickable-card"
                  onClick={() => navigate('CLAIM_DETAIL', { id: claim.id })}
                  style={{
                    '--card-border-color': CLAIM_STATUS_MAP[claim.status]?.color || 'var(--color-border)',
                    borderTop: '5px solid var(--card-border-color)',
                    paddingTop: 'var(--spacing-md)'
                  }}
                >
                  <div className="claim-card-header">
                    <div>
                      <h3 className="claim-card-title">{claim.claimType} <span style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary-500)'}}>{claim.id}</span></h3>
                    </div>
                    {renderStatusBadge(claim.status, CLAIM_STATUS_MAP)}
                  </div>
                  <div className="claim-card-info">
                    <p><strong>Amount:</strong> ${claim.amount?.toLocaleString()}</p>
                    <p><strong>Submitted:</strong> {formatDate(claim.submissionDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const UserManagementScreen = () => {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users
      .filter(user =>
        (filterStatus === 'ALL' || user.status === filterStatus) &&
        (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    return (
      <>
        <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>User Management</h1>

        <div className="controls-bar">
          <div className="controls-left">
            <input
              type="text"
              className="form-control"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(USER_STATUS_MAP).map(status => (
                <option key={status} value={status}>{USER_STATUS_MAP[status].label}</option>
              ))}
            </select>
          </div>
          <div className="controls-right">
            <button className="btn btn-primary">+ Add New User</button>
            <button className="btn action-btn">Export</button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <img src="https://via.placeholder.com/150/EEEEEE/888888?text=No+Users" alt="No users found" />
            <h3>No Users Found</h3>
            <p>Your search or filter criteria did not match any users.</p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}>Clear Filters</button>
          </div>
        ) : (
          <div className="claims-grid"> {/* Reusing claims-grid for general card layout */}
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="card"
                style={{
                  '--card-border-color': USER_STATUS_MAP[user.status]?.color || 'var(--color-border)',
                  borderTop: '5px solid var(--card-border-color)',
                  paddingTop: 'var(--spacing-md)'
                }}
              >
                <div className="claim-card-header">
                  <div>
                    <h3 className="claim-card-title">{user.name}</h3>
                    <p className="claim-card-meta">Role: {user.role}</p>
                  </div>
                  {renderStatusBadge(user.status, USER_STATUS_MAP)}
                </div>
                <div className="claim-card-info">
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
                <div className="claim-actions">
                  <button className="btn btn-outline-primary btn-sm">Edit User</button>
                  <button className="btn btn-danger btn-sm">Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const ReportsScreen = () => (
    <>
      <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>Reports & Analytics</h1>

      <div className="controls-bar">
        <div className="controls-left">
          <select className="form-control" style={{ width: '200px' }}>
            <option>All Time</option>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Custom Range</option>
          </select>
          <button className="btn action-btn">Apply Filters</button>
        </div>
        <div className="controls-right">
          <button className="btn btn-primary">Generate Report</button>
          <button className="btn action-btn">Export to PDF</button>
          <button className="btn action-btn">Export to Excel</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Monthly Claims Volume (Bar Chart)</h4>
          <div className="chart-placeholder">Bar Chart Placeholder</div>
        </div>
        <div className="card">
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Average Resolution Time (Gauge Chart)</h4>
          <div className="chart-placeholder">Gauge Chart Placeholder</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h4 style={{ fontSize: 'var(--font-size-h5)', marginBottom: 'var(--spacing-md)' }}>Financial Settlements Trend (Line Chart)</h4>
          <div className="chart-placeholder">Line Chart Placeholder</div>
        </div>
      </div>
    </>
  );

  const renderScreen = () => {
    if (!currentUser?.screens?.includes(view.screen)) {
      return (
        <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-h3)', color: 'var(--color-danger-500)' }}>Access Denied</h2>
          <p style={{ marginTop: 'var(--spacing-sm)' }}>You do not have permission to view this page ({view.screen}).</p>
          <button className="btn btn-primary mt-lg" onClick={() => navigate('DASHBOARD')}>Go to Dashboard</button>
        </div>
      );
    }

    switch (view.screen) {
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'CLAIMS':
        return <ClaimsScreen />;
      case 'CLAIM_DETAIL':
        return <ClaimDetailScreen />;
      case 'CLAIM_FORM':
        return <ClaimFormScreen />;
      case 'POLICIES':
        return <PoliciesScreen />;
      case 'POLICY_DETAIL':
        return <PolicyDetailScreen />;
      case 'USER_MANAGEMENT':
        return <UserManagementScreen />;
      case 'REPORTS':
        return <ReportsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">InsureCorp Platform</span>
        </div>
        <div className="header-right">
          <input
            type="text"
            className="search-input"
            placeholder="Global search..."
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
          />
          <div className="user-menu-dropdown">
            <div className="user-avatar" onClick={() => setIsDropdownOpen(prev => !prev)}>
              {currentUser?.name?.substring(0, 1).toUpperCase() || 'U'}
            </div>
            {isDropdownOpen && (
              <div className="dropdown-content">
                <span className="dropdown-item" style={{ cursor: 'default', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-dark)' }}>{currentUser?.name} ({currentUser?.role})</span>
                <span className="dropdown-item" onClick={() => console.log('View Profile')}>Profile</span>
                <span className="dropdown-item" onClick={handleLogout}>Logout</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="app-sidebar">
        <ul className="sidebar-nav-list">
          <li className="sidebar-heading">Main Navigation</li>
          {currentUser?.screens?.includes('DASHBOARD') && (
            <li className="sidebar-nav-item">
              <a className={view.screen === 'DASHBOARD' ? 'active' : ''} onClick={() => navigate('DASHBOARD')}>
                📊 Dashboard
              </a>
            </li>
          )}
          {currentUser?.screens?.includes('CLAIMS') && (
            <li className="sidebar-nav-item">
              <a className={view.screen === 'CLAIMS' || view.screen === 'CLAIM_DETAIL' || view.screen === 'CLAIM_FORM' ? 'active' : ''} onClick={() => navigate('CLAIMS')}>
                📝 Claims
              </a>
            </li>
          )}
          {currentUser?.screens?.includes('POLICIES') && (
            <li className="sidebar-nav-item">
              <a className={view.screen === 'POLICIES' || view.screen === 'POLICY_DETAIL' ? 'active' : ''} onClick={() => navigate('POLICIES')}>
                📑 Policies
              </a>
            </li>
          )}
          {(currentUser?.screens?.includes('USER_MANAGEMENT') || currentUser?.can?.manageUsers) && (
            <li className="sidebar-nav-item">
              <a className={view.screen === 'USER_MANAGEMENT' ? 'active' : ''} onClick={() => navigate('USER_MANAGEMENT')}>
                👥 Users
              </a>
            </li>
          )}
          {(currentUser?.screens?.includes('REPORTS') || currentUser?.can?.viewFinancialReports) && (
            <li className="sidebar-nav-item">
              <a className={view.screen === 'REPORTS' ? 'active' : ''} onClick={() => navigate('REPORTS')}>
                📈 Reports
              </a>
            </li>
          )}
        </ul>
      </nav>

      <main className="app-main-content">
        {renderScreen()}
      </main>
    </div>
  );
}

export default App;