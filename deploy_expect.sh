#!/usr/bin/expect -f
set timeout -1
spawn ssh -o StrictHostKeyChecking=no root@138.197.8.136
expect "password:"
send "935559Emerson@\r"
expect "$ "
send "cd /var/www/academia\r"
expect "$ "
send "git pull origin main\r"
expect "$ "
send "npm run build\r"
expect "$ "
send "pm2 restart academia-api\r"
expect "$ "
send "pm2 logs academia-api --lines 10 --nostream\r"
expect "$ "
send "exit\r"
expect eof
