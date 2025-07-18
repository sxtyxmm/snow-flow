# iPhone 6 Approval Flow Documentation

## Overview
This flow implements an approval process for ServiceNow service catalog requests. When a user requests an iPhone 6, the flow automatically routes the request to admin approval before fulfillment.

## Update Set Information
- **Name**: iPhone 6 Approval Flow
- **Update Set ID**: 74fba27983faea102a7ea130ceaad3bd
- **State**: In Progress
- **User Story**: FLOW-001
- **View Update Set**: https://dev198027.service-now.com/sys_update_set.do?sys_id=74fba27983faea102a7ea130ceaad3bd

## Flow Details

### Basic Information
- **Flow Name**: iPhone 6 Admin Approval Flow
- **Table**: Service Catalog Request (sc_request)
- **Trigger**: When a service catalog request is created
- **Purpose**: Enforce admin approval for iPhone 6 requests

### Flow Logic

1. **Trigger**: Flow starts when a new service catalog request is created

2. **Condition Check**: 
   - Checks if the requested item name contains "iPhone 6"
   - Uses condition: `cat_item.name CONTAINS 'iPhone 6'`

3. **Approval Routing**:
   - **If iPhone 6**:
     - Routes to admin approval
     - Admin group: System Administrators
     - If approved → Sets request state to "Approved" and continues fulfillment
     - If rejected → Sets request state to "Closed Rejected" with rejection reason
   
   - **If NOT iPhone 6**:
     - Skips approval process
     - Sets request state directly to "Approved"
     - Proceeds with standard fulfillment

### Flow Components

The flow includes the following activities:
1. **Condition Block** - Checks if item is iPhone 6
2. **Approval Action** - Routes to admin for approval
3. **Update Record** - Updates request state based on approval
4. **Create Task** - Creates fulfillment task for approved requests
5. **Log Message** - Logs flow execution details

## Implementation Steps

### 1. Access Flow Designer
Navigate to: https://dev198027.service-now.com/flow-designer

### 2. Flow Structure
The flow implements the following structure:
```
Start (Request Created)
    ↓
Check if iPhone 6
    ├─ Yes → Admin Approval
    │         ├─ Approved → Update State (Approved) → Create Fulfillment Task
    │         └─ Rejected → Update State (Closed Rejected)
    └─ No → Update State (Approved) → Create Fulfillment Task
```

### 3. Configuration Details

#### Trigger Configuration
- **Type**: Record Created
- **Table**: sc_request
- **Condition**: Active = true

#### iPhone 6 Check Condition
- **Type**: If/Else
- **Condition**: `current.cat_item.name.indexOf('iPhone 6') != -1`

#### Admin Approval Configuration
- **Approval For**: current
- **Assigned To**: Admin group
- **Due Date**: 2 days from creation
- **Instructions**: "Please review and approve this iPhone 6 request"

#### State Updates
- **Approved State**: 
  - Field: request_state
  - Value: approved
  
- **Rejected State**:
  - Field: request_state
  - Value: closed_rejected
  - Additional: rejection_reason = "Admin rejected iPhone 6 request"

## Testing Instructions

### Test Case 1: iPhone 6 Request
1. Create a service catalog request for "iPhone 6"
2. Verify flow triggers and routes to admin approval
3. As admin, approve the request
4. Verify request state changes to "Approved"
5. Verify fulfillment task is created

### Test Case 2: Non-iPhone 6 Request
1. Create a service catalog request for any other item (e.g., "Laptop")
2. Verify flow triggers but skips approval
3. Verify request state changes directly to "Approved"
4. Verify fulfillment task is created

### Test Case 3: iPhone 6 Rejection
1. Create a service catalog request for "iPhone 6"
2. As admin, reject the request
3. Verify request state changes to "Closed Rejected"
4. Verify rejection reason is populated
5. Verify no fulfillment task is created

## Deployment Instructions

### Export Update Set
1. Navigate to the Update Set: https://dev198027.service-now.com/sys_update_set.do?sys_id=74fba27983faea102a7ea130ceaad3bd
2. Mark the Update Set as "Complete"
3. Export the Update Set as XML

### Import to Target Instance
1. In target instance, navigate to System Update Sets > Retrieved Update Sets
2. Import the XML file
3. Preview the Update Set
4. Commit the Update Set

### Post-Deployment Validation
1. Verify flow exists in Flow Designer
2. Ensure flow is Active
3. Test with sample requests
4. Monitor flow execution logs

## Monitoring and Maintenance

### Flow Execution Logs
- Navigate to: Flow Designer > Flow Executions
- Filter by flow name: "iPhone 6 Admin Approval Flow"
- Review execution details and any errors

### Performance Metrics
- Average execution time: < 5 seconds
- Success rate target: > 99%
- Monitor approval response times

### Common Issues and Solutions

1. **Flow not triggering**
   - Verify flow is Active
   - Check trigger conditions
   - Ensure user has proper permissions

2. **Approval not routing correctly**
   - Verify admin group exists and has members
   - Check approval assignment rules
   - Review approval policies

3. **State not updating**
   - Check field permissions
   - Verify state values exist in choice list
   - Review ACLs on sc_request table

## Support and Contacts

- **Flow Owner**: ServiceNow Admin Team
- **Technical Contact**: Flow Development Team
- **Business Contact**: IT Service Catalog Manager

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2025-07-18 | Initial implementation of iPhone 6 approval flow | Snow-Flow System |

## Additional Resources

- [ServiceNow Flow Designer Documentation](https://docs.servicenow.com/bundle/latest/page/administer/flow-designer/concept/flow-designer.html)
- [Service Catalog Best Practices](https://docs.servicenow.com/bundle/latest/page/product/service-catalog/concept/c_ServiceCatalogBestPractices.html)
- [Approval Management](https://docs.servicenow.com/bundle/latest/page/administer/approval/concept/approval-management.html)