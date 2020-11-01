<?php require_once(__DIR__."/config.php");

if(!defined('INIT')){
	define('INIT', true);

	if($_SERVER["REMOTE_ADDR"] != '127.0.0.1'){
		ini_set('display_errors', 0);
		error_reporting(0);
	}

	// if (strpos($_SERVER['HTTP_USER_AGENT'], 'Trident/7.0; rv:11.0') !== false) {
	//     header('location: /home/ie11.php');
	//     exit();
	// }

	date_default_timezone_set("Europe/London");
	define('DATEFORMAT', 'd/m/Y');
	define('TIMEFORMAT', "Y-m-d H:i:s");
	function today(){
		date_format(new DateTime(),DATEFORMAT);
	}
	function now(){
		date_format(new DateTime(),TIMEFORMAT);
	}
	if(!isset($_GET['noSession'])) session_start();
	
	$errors = array();

	require_once(__DIR__."/class/Log.php");
	require_once(__DIR__."/class/Util.php");
	require_once(__DIR__."/class/Auth.php");
	require_once(__DIR__."/class/Filter.php");
	require_once(__DIR__."/class/Database.php");
	require_once(__DIR__."/class/Json.php");
	require_once(__DIR__."/class/Model.php");
	require_once(__DIR__."/class/Validation.php");
	require_once(__DIR__.'/lib/PHPMailer/PHPMailerAutoload.php');



	require_once(__DIR__.'/class/Templates.php');
	require_once(__DIR__."/class/Email.php");

	Auth::getSession();

	function getStatusName($id){
		switch($id){
			case 'RA': return 'Registered Account';
			case 'DE': return 'Delete';
			case ''  : return "No Status";
			default  : return "Non-Status";
		}
	}

	// redirect only (Exits Code)
	function redirect($location){
		header('location: '.$location);
		exit(0);
	}

	// Check if valid email address.
	function isEmailValid($email){
		return !!filter_var($email, FILTER_VALIDATE_EMAIL);
	}

	function getClientIP() {
		if (getenv('HTTP_CLIENT_IP'))
			return getenv('HTTP_CLIENT_IP');
		else if(getenv('HTTP_X_FORWARDED_FOR'))
			return getenv('HTTP_X_FORWARDED_FOR');
		else if(getenv('HTTP_X_FORWARDED'))
			return getenv('HTTP_X_FORWARDED');
		else if(getenv('HTTP_FORWARDED_FOR'))
			return getenv('HTTP_FORWARDED_FOR');
		else if(getenv('HTTP_FORWARDED'))
			return getenv('HTTP_FORWARDED');
		else if(getenv('REMOTE_ADDR'))
			return getenv('REMOTE_ADDR');
		else
			return 'UNKNOWN';
	}

	function exitError($err = 500, $msg = 'Server Error'){
		echo json_encode(array('error'=>$err,'message'=>$msg));
		exit(0);
	}

}