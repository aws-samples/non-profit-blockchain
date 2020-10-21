#!/bin/bash
export CONN=$( jq -r .postgreSQL.conn ../../../../explorerconfig.json )
export HOSTNAME=$( jq -r .postgreSQL.host ../../../../explorerconfig.json )
export USER=$( jq -r .postgreSQL.username ../../../../explorerconfig.json )
export DATABASE=$(jq -r .postgreSQL.database ../../../../explorerconfig.json )
export PASSWD=$(jq .postgreSQL.passwd ../../../../explorerconfig.json | sed "y/\"/'/")
echo "USER=${USER}"
echo "DATABASE=${DATABASE}"
echo "PASSWD=${PASSWD}"
echo "CONN=${CONN}"
echo "HOSTNAME=${HOSTNAME}"
echo "Executing SQL scripts..."
psql -X -h $HOSTNAME -d $DATABASE --username=$USER -v dbname=$DATABASE -v user=$USER -v passwd=$PASSWD -f ./explorerpg.sql ;
psql -X -h $HOSTNAME -d $DATABASE --username=$USER -v dbname=$DATABASE -v user=$USER -v passwd=$PASSWD -f ./updatepg.sql ;
