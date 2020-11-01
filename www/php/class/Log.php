<?php require_once(dirname(__FILE__).'/../init.php');

define('ERROR_LOGFILE', HOMEDIR.'/logs/error.log');
define('EVENT_LOGFILE', HOMEDIR.'/logs/event.log');

class Log{
	public static function error($tag = 'General', $message = 'General Error', $data = null){
		$err = array('tag'=>$tag, 'message'=>$message, 'data'=>$data);
		file_put_contents(ERROR_LOGFILE, json_encode($err)."\n", file_exists(ERROR_LOGFILE)? FILE_APPEND: 0);
	}
	public static function event($tag = 'General', $message = 'General Event', $data = null){
		$evt = array('tag'=>$tag, 'message'=>$message, 'data'=>$data);
		file_put_contents(EVENT_LOGFILE, json_encode($evt)."\n", file_exists(EVENT_LOGFILE)? FILE_APPEND: 0);
	}
}

if(isset($_GET['test']) && $_GET['test']=='Log') {
	Log::event('Log.test','Testing the Log Class');
	if(!file_exists(EVENT_LOGFILE)) echo 'No Event log created: Log class test failed!';
	else echo 'Log class test passed!';
}

?>