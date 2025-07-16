# iPhone 6 Request Approval Flow

## Overview

This Flow Designer workflow automatically routes iPhone 6 requests to administrators for approval before processing. The flow ensures proper governance and approval processes for high-value mobile device requests.

## Flow Architecture

### Trigger
- **Type**: Record Created
- **Table**: Service Catalog Requests (sc_request)
- **Condition**: New requests (state = 1)

### Flow Activities

#### 1. Check iPhone 6 Request
- **Activity**: Condition Check
- **Purpose**: Scan requested items for iPhone 6
- **Logic**: Queries sc_req_item table for iPhone 6 catalog items
- **Output**: Boolean flag indicating iPhone 6 presence

#### 2. Set Pending Approval
- **Activity**: Update Record
- **Purpose**: Change request state to pending approval
- **Fields Updated**:
  - State: Pending Approval (2)
  - Approval: Requested
  - Comments: Admin approval required message

#### 3. Create Admin Approval
- **Activity**: Approval
- **Purpose**: Generate approval task for administrators
- **Settings**:
  - Approvers: Admin role
  - Type: Anyone can approve
  - Due Date: 3 days from creation
  - Instructions: Business justification review

#### 4. Notify Requestor - Pending
- **Activity**: Notification
- **Purpose**: Inform requestor of pending status
- **Recipients**: Original requestor
- **Content**: Request details and expected timeline

#### 5. Process Approval Decision
- **Activity**: Condition Check
- **Purpose**: Determine approval outcome
- **Branches**: Approved or Rejected paths

#### 6. Update Request Status
- **Activity**: Update Record (Conditional)
- **Purpose**: Set final request state
- **Approved**: State = Approved (3)
- **Rejected**: State = Rejected (4)

#### 7. Final Notifications
- **Activity**: Notification (Conditional)
- **Purpose**: Notify all parties of decision
- **Recipients**: Requestor and Admin
- **Content**: Decision details and next steps

#### 8. Workflow Logging
- **Activity**: Script
- **Purpose**: Audit trail and completion tracking
- **Data**: Workflow completion status and metrics

## Configuration

### Approval Settings
```json
{
  "approvers": ["admin"],
  "approval_type": "anyone",
  "due_date": "3 days",
  "escalation": "auto",
  "reminder_interval": "1 day"
}
```

### Notification Templates
- **Pending Approval**: Professional notification with request details
- **Approved**: Confirmation with next steps
- **Rejected**: Explanation with contact information
- **Admin Decision**: Confirmation of processed decision

### Error Handling
- **Timeout**: 7 days maximum
- **Retry Policy**: 3 attempts with 1-hour intervals
- **Error Notifications**: Admin notification on workflow failures

## Business Rules

### iPhone 6 Detection
The flow scans for these patterns in catalog items:
- "iPhone 6" (case-insensitive)
- "iPhone 6 Plus"
- "iPhone 6S"
- "iPhone 6S Plus"

### Approval Criteria
Administrators should consider:
- Business justification
- Budget availability
- Alternative options
- User role requirements
- Security implications

## Testing Scenarios

### Test Case 1: iPhone 6 Request
1. Create service catalog request
2. Add iPhone 6 catalog item
3. Submit request
4. Verify pending approval state
5. Check admin approval creation
6. Verify requestor notification

### Test Case 2: Non-iPhone Request
1. Create service catalog request
2. Add non-iPhone catalog items
3. Submit request
4. Verify normal processing (no approval)
5. Confirm workflow completion

### Test Case 3: Approval Decision
1. Complete Test Case 1
2. Admin approves request
3. Verify request state change
4. Check notification delivery
5. Confirm logging completion

### Test Case 4: Rejection Decision
1. Complete Test Case 1
2. Admin rejects request
3. Verify request state change
4. Check rejection notification
5. Confirm workflow completion

## Installation

### Prerequisites
- ServiceNow Flow Designer license
- Admin role permissions
- Service Catalog module enabled
- Notification system configured

### Deployment Steps

1. **Deploy Flow**:
   ```bash
   npm run build
   node dist/cli/deploy-iphone6-flow.js
   ```

2. **Configure Catalog Items**:
   - Ensure iPhone 6 catalog items exist
   - Verify item names match detection patterns
   - Test catalog item accessibility

3. **Set Up Approvers**:
   - Assign admin role to appropriate users
   - Configure approval group if needed
   - Test approval notifications

4. **Activate Flow**:
   - Navigate to Flow Designer
   - Find "iPhone 6 Request Approval Flow"
   - Set Active = true
   - Test with sample request

## Monitoring

### Flow Execution
- **Path**: System Logs > Flow Execution
- **Filter**: iPhone 6 Request Approval Flow
- **Metrics**: Execution time, success rate, error count

### Approval Metrics
- **Path**: Approval Admin > Approval Reports
- **Data**: Approval times, decision patterns, overdue approvals
- **KPIs**: Average approval time, approval rate, escalation frequency

### Request Tracking
- **Path**: Service Catalog > My Requests
- **Filter**: iPhone 6 requests
- **Status**: Pending, Approved, Rejected tracking

## Troubleshooting

### Common Issues

#### Flow Not Triggering
- Check flow active status
- Verify trigger conditions
- Review service catalog permissions
- Confirm iPhone 6 catalog items exist

#### Approval Not Created
- Verify admin role assignments
- Check approval group configuration
- Review notification settings
- Confirm approval table permissions

#### Notifications Not Sent
- Check notification preferences
- Verify email configuration
- Review notification templates
- Confirm recipient permissions

### Debug Steps

1. **Check Flow Execution Logs**:
   ```
   Navigate to: System Logs > Flow Execution
   Filter: iPhone 6 Request Approval Flow
   ```

2. **Review Approval Records**:
   ```
   Navigate to: Approval Admin > Approval Records
   Filter: iPhone 6 requests
   ```

3. **Monitor Request States**:
   ```
   Navigate to: Service Catalog > Requests
   Filter: iPhone 6 related requests
   ```

## Maintenance

### Regular Tasks
- **Monthly**: Review approval metrics and timing
- **Quarterly**: Update approval criteria and documentation
- **Annually**: Review and update catalog item patterns

### Flow Updates
- Version control all flow changes
- Test updates in sub-production environment
- Document changes and rollback procedures
- Communicate updates to stakeholders

## Security Considerations

### Access Control
- Restrict flow modification to admin role
- Limit approval access to authorized personnel
- Monitor approval decision patterns
- Audit workflow execution logs

### Data Protection
- Ensure secure transmission of approval data
- Protect requestor personal information
- Maintain audit trail for compliance
- Regular security reviews

## Support

### Contact Information
- **Technical Support**: IT Service Management
- **Flow Owner**: ServiceNow Administrator
- **Business Owner**: IT Asset Management

### Documentation
- Flow Designer documentation
- ServiceNow approval process guide
- Service catalog administration guide
- Notification configuration reference

---

**Flow Version**: 1.0
**Last Updated**: January 2025
**Next Review**: April 2025