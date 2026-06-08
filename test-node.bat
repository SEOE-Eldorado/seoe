@echo off
cd /d C:\Users\ECO-1\Desktop\seoe-fundamental
echo 1. Simple node -e:
node -e "console.log('test1 ok')"
echo 2. Require crypto:
node -e "require('crypto'); console.log('crypto ok')"
echo 3. Require next:
node -e "require('next'); console.log('next ok')"
echo Done
