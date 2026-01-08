#!/bin/bash
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 "cd /var/www/academia && git pull origin main && node update_student_password.js"
