# Registration Endpoint Validation Protocol

## Post-RLS Deployment Testing Steps

### 1. **Deploy RLS Policy Fix**
```bash
npx supabase db push
```

### 2. **Test Basic Service Role Connection**
```bash
# Test if service role can connect and perform operations
npx supabase db inspect --local
```

### 3. **Manual Endpoint Testing**
```bash
# Test with curl or API client
curl -X POST http://localhost:3000/api/auth/register-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "valid-invitation-token",
    "password": "testpassword123",
    "whatsapp": "+5511999999999"
  }'
```

### 4. **Monitor Console Logs**
Watch for specific log outputs:
- `[REGISTER INVITATION] Processing registration for token: ...`
- `[REGISTER INVITATION] User created successfully: ...`
- `[REGISTER INVITATION] Session created for user: ...`

### 5. **Database Verification**
```sql
-- Check if user was created
SELECT id, email, full_name, company_id, role, user_type 
FROM public.users 
WHERE email = 'test-user@domain.com';

-- Verify invitation status updated
SELECT status, updated_at 
FROM public.user_invitations 
WHERE invitation_token = 'test-token';
```

## Expected Success Flow

1. ✅ Invitation validation passes
2. ✅ Password hashing succeeds  
3. ✅ User INSERT operation completes (previously failing)
4. ✅ Invitation status updated to 'completed'
5. ✅ JWT session created and returned
6. ✅ HTTP-only cookie set correctly

## Potential Remaining Issues

### If Still Getting 500 Errors:
- **Check Migration Applied**: Verify RLS policy exists in database
- **Service Role Permissions**: Ensure service role key is valid
- **Database Constraints**: Check for missing foreign key references
- **Field Type Mismatches**: Verify enum values and data types

### Debug Commands:
```bash
# Check active RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

# Test service role directly
psql $DATABASE_URL -c "SET role service_role; INSERT INTO users (email) VALUES ('test@test.com');"
```

## Success Indicators

✅ **200 Status Code** instead of 500
✅ **User Created in Database** with all expected fields
✅ **Invitation Status** changed to 'completed'
✅ **JWT Cookie** set in response headers
✅ **No RLS Policy Errors** in console logs

## Implementation Notes

The registration endpoint code appears robust and well-structured. The primary issue was the missing RLS INSERT policy, which has been addressed by the migration file. After deployment, the endpoint should function correctly for the complete user registration workflow.