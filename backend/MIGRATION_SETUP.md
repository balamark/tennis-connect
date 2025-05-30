# Database Migration Framework Setup

## Overview

We have successfully implemented a robust database migration system using **golang-migrate**, one of the most popular and reliable migration frameworks for Go applications.

## Why golang-migrate?

After researching various migration frameworks, we chose golang-migrate because:

1. **Most Popular**: 10.3k+ GitHub stars with active maintenance
2. **Excellent PostgreSQL Support**: Native support for all PostgreSQL features
3. **Windows Compatible**: Reliable cross-platform support
4. **Simple & Reliable**: Proven in production environments
5. **CLI & Library Support**: Can be used both as command-line tool and Go library

## Alternative Frameworks Considered

- **Atlas**: More advanced with declarative migrations and linting, but newer and more complex
- **Goose**: Good Go-native support but limited database drivers
- **Flyway**: Java-based, not Go-native
- **Custom Scripts**: Prone to Windows path issues and maintenance overhead

## Migration System Features

### ✅ Implemented Features

1. **Migration Commands**:
   - `make migrate` - Apply all pending migrations
   - `make migrate-down` - Rollback last migration
   - `make migrate-status` - Show current migration status
   - `make migrate-create name=migration_name` - Create new migration files

2. **Windows Compatibility**:
   - Fixed file path issues that were causing failures
   - Uses relative paths to avoid Windows-specific problems
   - Proper PowerShell command support

3. **Database Schema**:
   - **Booking System**: Court reservations with conflict detection
   - **Matching System**: Intelligent player pairing algorithms
   - **Notifications**: Real-time updates for users
   - **User Stats**: Dashboard metrics and analytics

4. **Safety Features**:
   - Migration version tracking
   - Dirty state detection and recovery
   - Conflict prevention for overlapping bookings
   - Comprehensive indexing for performance

## Database Tables Added

### Booking Tables
- `bookings` - Court reservations with time slots
- `notifications` - Real-time user notifications
- `user_stats` - Personal dashboard metrics

### Matching Tables
- `match_sessions` - Organized matches by court/time
- `match_players` - Players joined to sessions
- `player_pairings` - Actual match results
- `player_feedback` - Post-match ratings and comments

## Usage Examples

### Running Migrations

#### Using Make (Linux/macOS)
```bash
# Apply all pending migrations
make migrate

# Check current status
make migrate-status

# Rollback last migration
make migrate-down

# Create new migration
make migrate-create name=add_new_feature
```

#### Using Go Commands (Windows/Cross-platform)
```powershell
# Apply all pending migrations
go run cmd/migrate/main.go up

# Check current status
go run cmd/migrate/main.go status

# Rollback last migration
go run cmd/migrate/main.go down

# Create new migration
go run cmd/migrate/main.go create add_new_feature
```

### Direct Commands
```bash
# Using Go directly
go run cmd/migrate/main.go up
go run cmd/migrate/main.go status
go run cmd/migrate/main.go down

# Force specific version (emergency use)
go run cmd/migrate/main.go force 2
```

### Environment-Specific Migrations
```bash
# Test database
$env:APP_ENV="test"; go run cmd/migrate/main.go up

# Production database
$env:APP_ENV="production"; go run cmd/migrate/main.go up
```

## Testing

All migration functionality is thoroughly tested:

### ✅ Test Coverage
- **Booking Repository Tests**: Create, conflict detection, availability checking
- **Matching Repository Tests**: Session creation, player joining, pairing algorithms
- **User Repository Tests**: All existing functionality preserved
- **Integration Tests**: End-to-end workflow testing

### Running Tests
```bash
# All repository tests
go test ./repository -v

# Specific test suites
go test ./repository -run TestBooking -v
go test ./repository -run TestMatching -v
go test ./repository -run TestUser -v
```

## Migration Files Structure

```
backend/migrations/
├── 1_init_schema.up.sql          # Initial database schema
├── 1_init_schema.down.sql        # Rollback initial schema
├── 2_seed_demo_data.up.sql       # Demo data seeding
├── 2_seed_demo_data.down.sql     # Remove demo data
├── 3_add_booking_and_matching.up.sql    # Booking & matching features
└── 3_add_booking_and_matching.down.sql  # Rollback booking & matching
```

## Key Implementation Details

### 1. Windows Path Resolution
- Uses relative paths (`file://migrations`) instead of absolute paths
- Avoids complex file URL formatting that caused issues
- Compatible with PowerShell and CMD

### 2. PostgreSQL Extensions
- Automatically enables `btree_gist` extension for advanced indexing
- Simplified constraints to avoid version compatibility issues
- Comprehensive indexing strategy for performance

### 3. Conflict Prevention
- Unique index prevents overlapping court bookings
- Status-aware constraints (only active bookings checked)
- Graceful error handling with descriptive messages

### 4. Test Database Safety
- Automatic test database verification
- Environment-specific configuration loading
- Clean test data isolation

## Troubleshooting

### Common Issues

1. **Dirty Database State**:
   ```bash
   # Force clean state
   go run cmd/migrate/main.go force 2
   go run cmd/migrate/main.go up
   ```

2. **Test Database Issues**:
   ```bash
   # Reset test database
   $env:APP_ENV="test"; go run cmd/migrate/main.go force 2
   $env:APP_ENV="test"; go run cmd/migrate/main.go up
   ```

3. **Permission Issues**:
   - Ensure database user has CREATE EXTENSION privileges
   - Check PostgreSQL version compatibility (9.5+)

## Next Steps

1. **Frontend Integration**: Connect React frontend to booking/matching APIs
2. **Real-time Features**: Implement WebSocket notifications
3. **Advanced Matching**: Add more sophisticated pairing algorithms
4. **Performance Optimization**: Add database connection pooling
5. **Monitoring**: Add migration status monitoring in production

## Production Deployment

For production deployment:

1. **Backup Database**: Always backup before migrations
2. **Test Migrations**: Run on staging environment first
3. **Monitor Performance**: Check migration execution time
4. **Rollback Plan**: Have rollback strategy ready
5. **Zero-Downtime**: Consider blue-green deployment for large changes

## Conclusion

The migration system is now production-ready with:
- ✅ Reliable Windows support
- ✅ Comprehensive test coverage
- ✅ Complete booking and matching functionality
- ✅ Safety features and error handling
- ✅ Clear documentation and usage examples

The tennis connect application now has a solid foundation for court booking and intelligent player matching features. 