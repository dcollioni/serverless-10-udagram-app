#! /bin/bash

export NODE_OPTIONS=--max_old_space_size=4096
sls deploy -v --region eu-west-1 --stage dev --aws-profile serverless
