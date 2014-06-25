#!/bin/bash
# Coworking startup service script for Linden Editor
# to make node.js socket.io app run as service
# USAGE: start|stop|status|logs
#

#DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR="__DIR__"
INFINITELOOP=`echo $DIR/infinite.sh`
LOGPATH='/var/www/lindneo.com/subs/cowork/logs/coworking.log'
TAIL=`which tail`
NOHUP=`which nohup`
PSS=`which ps`
GREP=`which grep`
AWK=`which awk`
KILL=`which kill`
HEAD=`which head`
SORT=`which sort`
start() {
    echo "Starting Socket.io Coworking System"
    PS=`$PSS -ef | $GREP infinite.sh | $GREP -v grep | $AWK '{print  $2}' `
    if [ $PS ]
        then
            stop
    fi
    $NOHUP $INFINITELOOP >> $LOGPATH  &
    echo "Started"
}

stop() {
    echo "Stopping Socket.io Coworking System."
    PS=`$PSS -ef | $GREP infinite.sh | $GREP -v grep | $AWK '{print  $2}' `
    PSCOWORK=`$PSS -ef | $GREP $DIR/cowork.js | $GREP -v grep | $SORT -n | $HEAD -1 | $AWK '{print  $2}' `
    echo $PS $PSCOWORK
    if [ $PS ]
        then
            echo "Killing $PS"
            $KILL -9 $PS
            $KILL -9 $PSCOWORK
        else
            echo "Not Working"
    fi
}

restart() {
        stop
        start
}

status(){
    PS=`$PSS -ef | $GREP infinite.sh | $GREP -v grep | $AWK '{print  $2}' `
    if [ $PS ]
        then
            echo "Working"
        else
            echo "Not Working"
    fi
}

logs(){
    echo Status of Socket.io Coworking System $LOGPATH
    $TAIL -f  $LOGPATH
}

case "$1" in
        start)
            start
            ;;

        stop)
            stop
            ;;

        status)
            status
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;

        *)
            echo $”Usage: $0 {start|stop|status|logs}”
            exit 1
 
esac

