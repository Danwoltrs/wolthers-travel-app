# Role Permissions & Access Control

## User Roles Overview

### 1. **Global Admin** (`global_admin`)
- **Access**: Full system access
- **Dashboard**: `/admin/dashboard`
- **Permissions**:
  - Manage all trips across all companies
  - Access all financial data and reports
  - Manage users and permissions
  - System configuration and settings
  - View all company data
- **Example**: Daniel Wolthers (Wolthers & Associates CEO)

### 2. **Wolthers Staff** (`wolthers_staff`)
- **Access**: Operational access to manage trips
- **Dashboard**: `/dashboard`
- **Permissions**:
  - Create and manage trips for all clients
  - View all trips and itineraries
  - Manage driver assignments and vehicles
  - Coordinate with visitors and hosts
  - Cannot access financial data
- **Example**: Maria Silva (Trip Coordinator)

### 3. **Wolthers Finance** (`wolthers_finance`)
- **Access**: Financial and cost management
- **Dashboard**: `/finance/dashboard`
- **Permissions**:
  - View all trip costs and expenses
  - Manage reimbursements
  - Generate financial reports
  - Export cost data
  - Cannot edit trip details
- **Example**: Lars Andersen (Finance Manager)

### 4. **Visitor Admin** (`visitor_admin`)
- **Access**: Company-wide trip management for their organization
- **Dashboard**: `/company/trips`
- **Permissions**:
  - View all trips for employees from their company
  - See trip costs allocated to their company
  - Manage travel approvals for their team
  - Export trip reports for their company
  - Cannot see trips from other companies
- **Example**: Emma Schneider (Blaser Trading Travel Admin)

### 5. **Visitor** (`visitor`)
- **Access**: Personal trip access only
- **Dashboard**: `/trips`
- **Permissions**:
  - View only their own trips
  - Access trip itineraries and documents
  - View meeting details
  - Cannot see trips of colleagues
  - Cannot see financial information
- **Example**: Johann Mueller (Blaser Trading Executive)

### 6. **Host** (`host`)
- **Access**: View incoming visitors to their facilities
- **Dashboard**: `/host/dashboard`
- **Permissions**:
  - View trips scheduled to visit their location
  - See visitor information and arrival times
  - Upload venue information and documents
  - Cannot see trips to other locations
- **Example**: Antonio Veloso (Veloso Agro Farm Owner)

### 7. **Driver** (`driver`)
- **Access**: Driving assignments and schedules
- **Dashboard**: `/driver/schedule`
- **Permissions**:
  - View assigned trips and routes
  - Update trip status (picked up, arrived, etc.)
  - Access passenger information
  - Report vehicle issues
  - Cannot see unassigned trips
- **Example**: Carlos Rodriguez (Professional Driver)

### 8. **Guest** (`guest`)
- **Access**: Limited read-only access
- **Dashboard**: `/guest/trips`
- **Permissions**:
  - View specific trips they're invited to
  - Access basic itinerary information
  - No edit capabilities
  - Time-limited access
- **Example**: External consultant or temporary traveler

## Role Hierarchy

```
Global Admin
    ├── Wolthers Staff
    ├── Wolthers Finance
    └── Company Admin (deprecated - split into Visitor Admin)
         └── Visitor Admin
              └── Visitor
                   └── Guest

Host (separate branch - location based)
Driver (separate branch - operational)
```

## Key Permission Differences

### Financial Access
- ✅ Global Admin - Full access
- ✅ Wolthers Finance - Full access
- ✅ Visitor Admin - Company costs only
- ❌ All other roles - No financial access

### Trip Visibility
- **Global Admin**: All trips
- **Wolthers Staff**: All trips
- **Wolthers Finance**: All trips (read-only)
- **Visitor Admin**: All trips for their company
- **Visitor**: Only their own trips
- **Host**: Only trips visiting their location
- **Driver**: Only assigned trips
- **Guest**: Only invited trips

### Management Capabilities
- **Create Trips**: Global Admin, Wolthers Staff
- **Edit Trips**: Global Admin, Wolthers Staff
- **Approve Trips**: Global Admin, Wolthers Staff, Visitor Admin (own company)
- **Assign Drivers**: Global Admin, Wolthers Staff
- **Manage Costs**: Global Admin, Wolthers Finance

## Implementation Notes

1. **Visitor Admin** is a new role that allows company travel coordinators to oversee all trips for their organization's employees
2. **Wolthers Finance** is a specialized role for financial oversight without operational access
3. The system uses role-based routing to automatically direct users to appropriate dashboards
4. Permissions are enforced at both UI and API levels
5. All roles except Global Admin have data isolation by company/scope