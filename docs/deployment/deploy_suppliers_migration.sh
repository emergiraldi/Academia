#!/bin/bash

echo "Deploying to VPS and running suppliers migration..."

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 << 'ENDSSH'
cd /var/www/academia

echo "Pulling latest code..."
git pull origin main

echo "Running suppliers table migration..."
node migrate_suppliers_table.js

echo "Restarting PM2..."
pm2 restart academia

echo "✓ Deployment complete!"
ENDSSH
