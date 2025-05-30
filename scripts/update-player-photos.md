# Update Player Photos - Instructions

## What was changed:

1. **Database Seed Data**: Updated `backend/migrations/2_seed_demo_data.up.sql` to use high-quality tennis player photos
2. **Frontend Mock Data**: Updated `frontend/src/components/NearbyPlayers.js` to match the database seed data

## New Photo URLs:

The 10 demo players now use these high-quality, tennis-themed photos:

1. **Sarah Chen** - `https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face`
2. **Mike Rodriguez** - `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=400&fit=crop&crop=face`
3. **Emma Johnson** - `https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face`
4. **David Kim** - `https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop&crop=face`
5. **Lisa Patel** - `https://images.unsplash.com/photo-1582655008695-f3d1a00e1b1c?w=400&h=400&fit=crop&crop=face`
6. **Alex Thompson** - `https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face`
7. **Maria Garcia** - `https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=400&h=400&fit=crop&crop=face`
8. **James Wilson** - `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face`
9. **Rachel Brown** - `https://images.unsplash.com/photo-1564415637254-92c6e4b0b6e3?w=400&h=400&fit=crop&crop=face`
10. **Chris Lee** - `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`

## How to apply the changes:

### Option 1: Reset Database (Recommended)
```bash
# Stop services
docker-compose down

# Remove database volume to reset data
docker volume rm tennis-connect_postgres_data

# Start services (will recreate database with new seed data)
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f backend
```

### Option 2: Run Migration Manually
```bash
# Connect to database and run the migration
docker-compose exec db psql -U postgres -d tennis_connect_dev

# In psql, run:
DELETE FROM users WHERE email LIKE '%@email.com';
# Then copy and paste the INSERT statement from the migration file
```

### Option 3: Update Existing Records
```sql
-- Update profile pictures for existing demo users
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face' WHERE email = 'sarah.chen@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=400&fit=crop&crop=face' WHERE email = 'mike.rodriguez@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face' WHERE email = 'emma.johnson@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop&crop=face' WHERE email = 'david.kim@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1582655008695-f3d1a00e1b1c?w=400&h=400&fit=crop&crop=face' WHERE email = 'lisa.patel@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face' WHERE email = 'alex.thompson@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=400&h=400&fit=crop&crop=face' WHERE email = 'maria.garcia@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face' WHERE email = 'james.wilson@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1564415637254-92c6e4b0b6e3?w=400&h=400&fit=crop&crop=face' WHERE email = 'rachel.brown@email.com';
UPDATE users SET profile_picture = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' WHERE email = 'chris.lee@email.com';
```

## Benefits:

1. **Professional Appearance**: High-quality, tennis-themed photos make the app look more professional
2. **Consistent Sizing**: All photos are properly sized (400x400) and cropped to faces
3. **Diverse Representation**: Mix of male and female players with diverse backgrounds
4. **Realistic Demo**: Photos look like real tennis players rather than generic stock photos

## Testing:

After applying the changes:
1. Visit the "Players Near You" page
2. You should see the new high-quality photos for all demo players
3. The photos should load quickly and display consistently
4. Both the frontend mock data and database seed data will show the same photos 