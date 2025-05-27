#!/bin/bash

# Zettelkasten Database and Cache Flush Script
# This script flushes MongoDB, Redis, and optionally Pinecone

set -e

echo "🗑️  Zettelkasten Database and Cache Flush Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017"}
REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}
DATABASE_NAME=${DATABASE_NAME:-"zettelkasten"}

# Function to check if service is running
check_service() {
    local service=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service is running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not running on port $port"
        return 1
    fi
}

# Function to flush MongoDB
flush_mongodb() {
    echo -e "\n${YELLOW}🗄️  Flushing MongoDB...${NC}"
    
    if ! check_service "MongoDB" 27017; then
        echo -e "${RED}MongoDB is not running. Please start MongoDB first.${NC}"
        return 1
    fi

    # Export current data before flushing (backup)
    echo "📦 Creating backup before flush..."
    mongosh $MONGO_URI/$DATABASE_NAME --eval "
        print('=== BACKUP BEFORE FLUSH ===');
        print('Database: $DATABASE_NAME');
        print('Collections: ' + db.getCollectionNames().join(', '));
        print('');
        print('=== USERS COLLECTION ===');
        db.users.find().forEach(function(doc) { printjson(doc); });
        print('');
        print('=== DOCUMENTS COLLECTION ===');
        db.documents.find().forEach(function(doc) { printjson(doc); });
    " > "backup_$(date +%Y%m%d_%H%M%S).json" 2>/dev/null || true

    # Drop all collections
    echo "🗑️  Dropping all collections..."
    mongosh $MONGO_URI/$DATABASE_NAME --eval "
        db.getCollectionNames().forEach(function(collection) {
            print('Dropping collection: ' + collection);
            db[collection].drop();
        });
        print('✓ All collections dropped');
    " --quiet

    echo -e "${GREEN}✓ MongoDB flushed successfully${NC}"
}

# Function to flush Redis
flush_redis() {
    echo -e "\n${YELLOW}🔄 Flushing Redis cache...${NC}"
    
    if ! check_service "Redis" 6379; then
        echo -e "${RED}Redis is not running. Please start Redis first.${NC}"
        return 1
    fi

    # Show current keys before flushing
    echo "📋 Current Redis keys:"
    redis-cli KEYS "*" | head -10
    if [ $(redis-cli KEYS "*" | wc -l) -gt 10 ]; then
        echo "... and $(redis-cli KEYS "*" | wc -l) more keys"
    fi

    # Flush all Redis databases
    echo "🗑️  Flushing all Redis databases..."
    redis-cli FLUSHALL
    
    echo -e "${GREEN}✓ Redis cache flushed successfully${NC}"
}

# Function to flush Pinecone (optional)
flush_pinecone() {
    echo -e "\n${YELLOW}🔍 Flushing Pinecone vectors...${NC}"
    
    if [ -z "$PINECONE_API_KEY" ] || [ -z "$PINECONE_ENVIRONMENT" ] || [ -z "$PINECONE_INDEX" ]; then
        echo -e "${YELLOW}⚠️  Pinecone environment variables not set. Skipping Pinecone flush.${NC}"
        echo "   Set PINECONE_API_KEY, PINECONE_ENVIRONMENT, and PINECONE_INDEX to flush Pinecone."
        return 0
    fi

    # Delete all vectors in the index
    echo "🗑️  Deleting all vectors from Pinecone index: $PINECONE_INDEX..."
    
    # Use curl to delete all vectors
    response=$(curl -s -X POST \
        "https://$PINECONE_INDEX-$PINECONE_ENVIRONMENT.svc.pinecone.io/vectors/delete" \
        -H "Api-Key: $PINECONE_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"deleteAll": true}')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Pinecone vectors flushed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to flush Pinecone vectors${NC}"
        echo "Response: $response"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --mongodb-only    Flush only MongoDB"
    echo "  --redis-only      Flush only Redis"
    echo "  --pinecone-only   Flush only Pinecone"
    echo "  --skip-pinecone   Skip Pinecone flush (default if env vars not set)"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  MONGO_URI         MongoDB connection URI (default: mongodb://localhost:27017)"
    echo "  REDIS_URL         Redis connection URL (default: redis://localhost:6379)"
    echo "  DATABASE_NAME     MongoDB database name (default: zettelkasten)"
    echo "  PINECONE_API_KEY  Pinecone API key"
    echo "  PINECONE_ENVIRONMENT  Pinecone environment"
    echo "  PINECONE_INDEX    Pinecone index name"
}

# Parse command line arguments
FLUSH_MONGODB=true
FLUSH_REDIS=true
FLUSH_PINECONE=true
SKIP_PINECONE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mongodb-only)
            FLUSH_MONGODB=true
            FLUSH_REDIS=false
            FLUSH_PINECONE=false
            shift
            ;;
        --redis-only)
            FLUSH_MONGODB=false
            FLUSH_REDIS=true
            FLUSH_PINECONE=false
            shift
            ;;
        --pinecone-only)
            FLUSH_MONGODB=false
            FLUSH_REDIS=false
            FLUSH_PINECONE=true
            shift
            ;;
        --skip-pinecone)
            SKIP_PINECONE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Override Pinecone flush if skip flag is set
if [ "$SKIP_PINECONE" = true ]; then
    FLUSH_PINECONE=false
fi

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will permanently delete all data!${NC}"
echo ""
echo "This will flush:"
[ "$FLUSH_MONGODB" = true ] && echo "  • MongoDB database: $DATABASE_NAME"
[ "$FLUSH_REDIS" = true ] && echo "  • Redis cache"
[ "$FLUSH_PINECONE" = true ] && echo "  • Pinecone vectors"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Execute flushes
echo -e "\n${GREEN}🚀 Starting database and cache flush...${NC}"

if [ "$FLUSH_MONGODB" = true ]; then
    flush_mongodb
fi

if [ "$FLUSH_REDIS" = true ]; then
    flush_redis
fi

if [ "$FLUSH_PINECONE" = true ]; then
    flush_pinecone
fi

echo -e "\n${GREEN}🎉 Database and cache flush completed!${NC}"
echo ""
echo "Summary:"
[ "$FLUSH_MONGODB" = true ] && echo -e "  ${GREEN}✓${NC} MongoDB flushed"
[ "$FLUSH_REDIS" = true ] && echo -e "  ${GREEN}✓${NC} Redis flushed"
[ "$FLUSH_PINECONE" = true ] && echo -e "  ${GREEN}✓${NC} Pinecone flushed"
echo ""
echo "💡 Tip: You can now restart your application with fresh databases." 