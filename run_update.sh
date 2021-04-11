git checkout
git stash
git pull
npm install --unsafe-perm
pm2 restart all --update-env
service nginx reload
adonis migration:run --force
supervisorctl restart all
