gunicorn -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:$PORT
EOF

chmod +x /home/site/wwwroot/azure-startup.sh
