svn up .
svn log -l 5 | iconv -f gbk -t utf-8 > sync.log
git add .
git commit -m "$(cat sync.log)"
git push

