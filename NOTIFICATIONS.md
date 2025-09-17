# Email Notification System - Wolthers Travel App

## 📧 Overview

The Wolthers Travel App has a comprehensive email notification system that sends different types of emails to different participants based on their role in the trip. This ensures privacy, relevance, and proper communication flow.

## 🎯 Email Types & Recipients

### 1. **Trip Creation Notifications**

When a trip is created and finalized, the system sends **two different types of emails**:

#### **A. General Trip Creation Notification**
**Recipients:**
- Wolthers staff attending the trip
- Buyer company guests/representatives

**Template:** `"NEW Trip Creation Notification"`

**Content Includes:**
- Complete trip itinerary with all activities
- Full participant list (staff + guests)
- Trip dates and access code
- Vehicle and driver information
- Accommodation details

**Purpose:** Keep internal team and traveling guests informed of the complete trip plan.

---

#### **B. Host Visit Confirmation Requests**
**Recipients:**
- Host company representatives (selected during Host/Visits Selector step)

**Template:** `"Visit Request from Wolthers & Associates"`

**Content Includes:**
- **ONLY** their specific visit details
- Visit date and time for their company
- Names of visiting guest companies (e.g., "Randy Myers from Blaser Trading")
- Accept/Decline action buttons
- Wolthers contact information
- **NO** full trip itinerary (privacy protection)

**Purpose:** Request confirmation for specific company visits without exposing the entire trip schedule.

## 🔄 Email Flow Example

### Trip Example: Coffee Tour - September 2024

**Trip Participants:**
- **Wolthers Staff:** Daniel Wolthers
- **Buyer Company:** Blaser Trading A/G (Randy Myers)
- **Host Companies:** COFCO, EISA, COMEXIM, COOXUPE, Veloso Green Coffee

### Email Distribution:

#### **General Trip Notifications:**
✅ **Daniel Wolthers** → Full trip itinerary email
✅ **Randy Myers (Blaser Trading)** → Full trip itinerary email

#### **Host Visit Confirmation Requests:**
✅ **COFCO representative** → "Can you receive Randy Myers from Blaser Trading on September 21 at 09:00?"
✅ **EISA representative** → "Can you receive Randy Myers from Blaser Trading on September 21 at 12:15?"
✅ **COMEXIM representative** → "Can you receive Randy Myers from Blaser Trading on September 22 at 09:15?"
✅ **COOXUPE representative** → "Can you receive Randy Myers from Blaser Trading on September 22 at 16:55?"
✅ **Veloso Green Coffee representative** → "Can you receive Randy Myers from Blaser Trading on September 23 at 14:56?"

## 🛠️ Technical Implementation

### **File Locations:**
- **Main Implementation:** `/src/app/api/trips/create/route.ts` (lines 272-321)
- **Email Templates:** `/src/lib/resend.ts`
- **Host Selection UI:** `/src/components/trips/CompanySelectionStep.tsx`

### **Key Functions:**
- `sendTripCreationNotificationEmails()` - General trip notifications
- `sendHostVisitConfirmationEmail()` - Individual host visit requests
- `createHostVisitConfirmationTemplate()` - Host email template

### **Rate Limiting:**
- 2-second delays between individual host emails
- 1-second delays for general notifications
- 10-second retry delays if rate limited
- Individual sending for large recipient lists (>3 people)

### **Data Flow:**
1. Trip creation process collects host companies with representatives
2. System extracts visit activities from itinerary
3. Matches host companies with their scheduled visits
4. Sends personalized visit confirmation requests
5. Logs all email sending attempts and results

## 🎨 Email Design Standards

### **Host Visit Confirmation Email Design:**
- **Subject:** "Visit Request from Wolthers & Associates"
- **Header:** Wolthers & Associates branding
- **Content:** Clean, professional layout
- **Colors:** Forest green (#2D5347), gold accents (#FEF3C7)
- **Actions:** Accept/Decline buttons with proper URLs
- **Footer:** Contact information and branding

### **Privacy Principles:**
- ✅ Host companies only see their specific visit details
- ✅ No exposure of full trip itinerary to external hosts
- ✅ Guest company information limited to visiting parties
- ✅ Internal team gets complete information
- ✅ Buyer companies get full trip context

## 🔐 Security & Privacy Features

### **Data Isolation:**
- Host representatives receive only visit-specific information
- Full trip itinerary restricted to internal participants and traveling guests
- Email addresses validated before sending
- Failed sends logged without exposing sensitive data

### **Authentication:**
- All emails sent from verified `trips@trips.wolthers.com` address
- Accept/Decline URLs include secure tokens
- User authentication required for trip creation

## 📊 Email Delivery Tracking

### **Logging System:**
```
✅ [Create Trip API] All trip creation notification emails sent successfully
📧 [Create Trip API] Sending host visit confirmation emails...
✅ [Create Trip API] Sent visit confirmation to [Name] at [Company]
❌ [Create Trip API] Failed to send visit confirmation to [email]: [error]
```

### **Error Handling:**
- Email failures don't break trip creation process
- Individual email errors logged separately
- Retry logic for rate limit violations
- Graceful degradation when external services fail

## 🚀 Benefits

### **For Wolthers & Associates:**
- ✅ Automated professional communication
- ✅ Reduced manual coordination work
- ✅ Proper privacy protection for hosts
- ✅ Complete audit trail of notifications

### **For Host Companies:**
- ✅ Clear, focused visit requests
- ✅ No information overload
- ✅ Easy accept/decline process
- ✅ Professional communication experience

### **For Buyer Companies:**
- ✅ Complete trip visibility
- ✅ Full itinerary access
- ✅ Coordinated travel planning
- ✅ Professional trip organization

## 📈 System Status

**Implementation Status:** ✅ **COMPLETE & PRODUCTION READY**

**Last Updated:** January 17, 2025
**Version:** 1.0
**Testing Status:** Ready for live deployment

---

## 🔧 Development Notes

### **Future Enhancements:**
- Real-time notification status tracking
- Email preference management for participants
- Multi-language support for international hosts
- Calendar integration for visit confirmations
- SMS notifications for urgent changes
- Analytics dashboard for email engagement

### **Maintenance:**
- Monitor email delivery rates
- Update templates based on user feedback
- Maintain rate limiting compliance
- Regular security audits of email system
- Performance optimization for large trip lists

---

*This notification system ensures professional, privacy-conscious, and efficient communication for all Wolthers Travel App users while maintaining the highest standards of data protection and user experience.*