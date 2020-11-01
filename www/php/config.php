<?php
if(!defined('CONFIG')){
	if(!isset($_SERVER['SERVER_NAME'])) $_SERVER['SERVER_NAME']='localhost';
	// else if(strtolower($_SERVER['SERVER_NAME']) == 'javascie') $_SERVER['SERVER_NAME']='localhost';

	define('SERVER_NAME', $_SERVER['SERVER_NAME']);
	define('HOMEDIR', __DIR__.'/../');

	if(function_exists('mssql_connect')){
		define('WINDOWS', false);
		define('LINUX', true);
	}
	else{
		define('WINDOWS', true);
		define('LINUX', false);
	}
	define('CONFIG', true);
	ini_set("log_errors", 1);
	ini_set("error_log", "/phpError.log");
	ini_set('post_max_size','20M');
	ini_set('upload_max_filesize','20M');
	// ini_set("file_uploads", true);
	// ini_set("upload_max_filesize", '2000M');
	define('TEMPDIR', sys_get_temp_dir());

	if(isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST']!='localhost'){
		// **PREVENTING SESSION HIJACKING**
		// Prevents javascript XSS attacks aimed to steal the session ID
		ini_set('session.cookie_httponly', 1);

		// **PREVENTING SESSION FIXATION**
		// Session ID cannot be passed through URLs
		ini_set('session.use_only_cookies', 1);

		// Uses a secure connection (HTTPS) if possible
		ini_set('session.cookie_secure', 1);
	} else $_SERVER['HTTP_HOST'] = 'localhost';
	define('HTTP_HOST', $_SERVER['HTTP_HOST']);

	ini_set('SMTP', "smtp.gmail.com");
	ini_set('smtp_port', "25");
	ini_set('sendmail_from', 'no-reply@gmail.com:password');

	# Access Levels
	define('UNKNOWN', 'unknown');
	define('GUEST', 'guest');
	define('USER', 'user');
	define('ADMIN', 'admin');
	define('SYSTEM', 'system');

	if(true || $_SERVER['HTTP_HOST'] != 'localhost') {
		define('DBTYPE','mysql');
		define('DBSERVER','example.com');
		define('DBDATA','DatabaseName');
		define('DBUSER','DatabaseUsername');
		define('DBPASS','DatabasePassword');
	} else {
		define('DBTYPE','mysql');
		define('DBSERVER','localhost');
		define('DBDATA','LocalDatabaseName');
		define('DBUSER','LocalDatabaseUsername');
		define('DBPASS','LocalDatabasePassword');
	}

	define('DBMTYPE','mysql');
	define('DBMSERVER','mirror.example.com');
	define('DBMDATA','MirrorDatabaseName');
	define('DBMUSER','MirrorDatabaseUsername');
	define('DBMPASS','MirrorDatabasePassword');

}
