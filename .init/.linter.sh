#!/bin/bash
cd /home/kavia/workspace/code-generation/enterprise-project-management-platform-6783-6792/frontend_web_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

