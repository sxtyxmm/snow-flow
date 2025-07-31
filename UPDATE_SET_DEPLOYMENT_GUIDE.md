# iPhone 6 Approval Flow - Update Set Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the iPhone 6 approval flow in ServiceNow using an Update Set.

## Prerequisites
- ServiceNow instance with admin access
- Flow Designer plugin activated
- Service Catalog configured

## Update Set Information
- **Name**: iPhone 6 Approval Flow
- **Description**: Flow that requires admin approval for every iPhone 6 request
- **Story**: FLOW-001
- **Components**: Flow Designer flow, trigger conditions, approval routing

## Step-by-Step Deployment

### Step 1: Create Update Set
1. Navigate to **System Update Sets > Update Sets to Commit**
2. Click **New** to create a new Update Set
3. Fill in:
   - **Name**: iPhone 6 Approval Flow
   - **Description**: Flow Designer flow that requires admin approval for every iPhone 6 request
   - **State**: In Progress
4. Click **Submit**
5. Switch to the new Update Set

### Step 2: Create Flow Designer Flow
1. Navigate to **Flow Designer** in ServiceNow
2. Click **New** > **Flow**
3. Configure flow properties:
   - **Name**: iPhone 6 Approval Flow
   - **Description**: Requires admin approval for iPhone 6 requests
   - **Application**: Global (or your scoped application)

### Step 3: Configure Flow Trigger
1. Add **Record Created** trigger
2. Set table to **Service Catalog Request (sc_request)**
3. Add condition: `item.name=iPhone 6^ORitem.short_description=iPhone 6`

### Step 4: Add Flow Steps

#### Step 4.1: Add Condition - Check for iPhone 6
- **Name**: Check for iPhone 6
- **Type**: If/Else condition
- **Condition**: `trigger.current.item.name.indexOf('iPhone 6') !== -1`

#### Step 4.2: Add Action - Create Approval
- **Name**: Create Approval Record
- **Type**: Create Record
- **Table**: Approval [sysapproval_approver]
- **Fields**:
  - Source Table: sc_request
  - Source ID: {{trigger.current.sys_id}}
  - Approver: admin (or admin group)
  - State: requested

#### Step 4.3: Add Wait - Wait for Approval
- **Name**: Wait for Approval Decision
- **Type**: Wait for Condition
- **Condition**: `approval.state == 'approved' || approval.state == 'rejected'`
- **Timeout**: 72 hours

#### Step 4.4: Add Condition - Check Approval Result
- **Name**: Check Approval Result
- **Type**: If/Else condition
- **Condition**: `approval.state == 'approved'`

#### Step 4.5: Add Action - Approve Request
- **Name**: Approve Request
- **Type**: Update Record
- **Table**: Service Catalog Request [sc_request]
- **Record**: {{trigger.current.sys_id}}
- **Fields**:
  - State: 3 (Approved)
  - Comments: iPhone 6 request approved by admin

#### Step 4.6: Add Action - Reject Request
- **Name**: Reject Request
- **Type**: Update Record
- **Table**: Service Catalog Request [sc_request]
- **Record**: {{trigger.current.sys_id}}
- **Fields**:
  - State: 4 (Rejected)
  - Comments: iPhone 6 request rejected by admin

### Step 5: Test Flow
1. Save and activate the flow
2. Create a test catalog request for iPhone 6
3. Verify the flow triggers and creates approval
4. Test approval and rejection scenarios

### Step 6: Complete Update Set
1. Return to **System Update Sets > Update Sets to Commit**
2. Find your Update Set
3. Change state to **Complete**
4. Export Update Set for deployment to other environments

## Flow Structure
```
[Record Created - sc_request] 
    ↓
[Check for iPhone 6] 
    ↓ (if iPhone 6)
[Create Approval Record] 
    ↓
[Wait for Approval Decision] 
    ↓
[Check Approval Result] 
    ↓                    ↓
[Approve Request]    [Reject Request]
    ↓                    ↓
[End]                [End]
```

## Testing Checklist
- [ ] Flow triggers on iPhone 6 catalog requests
- [ ] Approval record is created for admin
- [ ] Flow waits for approval decision
- [ ] Approved requests update to state 3
- [ ] Rejected requests update to state 4
- [ ] Comments are added to requests
- [ ] Flow handles timeout scenarios

## Troubleshooting
- If flow doesn't trigger: Check trigger conditions and table permissions
- If approval doesn't route: Verify admin user/group configuration
- If states don't update: Check field permissions and business rules

## Update Set Export
After testing, export the Update Set for deployment to other environments:
1. Navigate to **System Update Sets > Retrieved Update Sets**
2. Find your completed Update Set
3. Click **Export to XML**
4. Save the XML file for deployment

## Deployment to Target Environment
1. In target environment, navigate to **System Update Sets > Retrieved Update Sets**
2. Import the XML file
3. Preview the Update Set
4. Commit the Update Set
5. Test the flow in the target environment

## Support
For issues or questions, refer to:
- ServiceNow Flow Designer documentation
- Update Set deployment guides
- ServiceNow community forums