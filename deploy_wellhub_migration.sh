#!/bin/bash

echo "Deploying Wellhub migration to VPS..."

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 << 'ENDSSH'
cd /var/www/academia

echo "Pulling latest code..."
git pull origin main

echo "Running Wellhub tables migration..."
node migrate_wellhub_tables.js

echo "Restarting PM2..."
pm2 restart academia

echo "✓ Deployment complete!"
ENDSSH
