<?php

class Database{
	// Server in the this format: <computer>\<instance name> or 
	// <server>,<port> when using a non default port number
	public $server = DBSERVER;
	public $database = DBDATA;
	private $username = DBUSER;
	private $password = DBPASS;
	private $conn = null;
	private $cursor = null;
	private $lastResult = null;

	// Connect to MSSQL
	public function connect($dbname = false){
		if($dbname == 'mirror'){
			$this->server = DBMSERVER;
			$this->database = DBMDATA;
			$this->username = DBMUSER;
			$this->password = DBMPASS;
		} else if($dbname && isset($this->databases[$dbname])) {
			$this->server = $DATABASES[$dbname]['server'];
			$this->database = $DATABASES[$dbname]['database'];
			$this->username = $DATABASES[$dbname]['username'];
			$this->password = $DATABASES[$dbname]['password'];
		}
		$this->conn = sqlsrv_connect($this->server, array(
			'Database' => $this->database,
			'UID' => $this->username,
			'PWD' => $this->password,
			"CharacterSet" => "UTF-8"
		));
		return $this->conn;
	}

	public function query($q, $a = array()){
		if(! $this->conn) return false;
		$this->cursor = sqlsrv_query($this->conn, $q, $a);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->cursor;
	}

	public function num_rows($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$this->lastResult = sqlsrv_num_rows($cur);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->lastResult;
	}

	public function next_result($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$this->lastResult = sqlsrv_next_result($cur);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->lastResult;
	}

	public function fetch($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$this->lastResult = sqlsrv_fetch($cur);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->lastResult;
	}

	public function fetch_array($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$this->lastResult = sqlsrv_fetch_array($cur);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->lastResult;
	}

	public function fetch_object($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$this->lastResult = sqlsrv_fetch_object($cur);
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $this->lastResult;
	}

	public function fetchAll($cur = null){
		if(!$cur) $cur = $this->cursor;
		if(!$cur) return false;
		$all = array();
		while($this->lastResult = sqlsrv_fetch_array($cur)){
			$all[] = $this->lastResult;
		}
		$errors = self::errors();
		if($errors) file_put_contents('sqlsrv-errors.log', json_encode($errors, JSON_PRETTY_PRINT), FILE_APPEND);
		return $all;
	}

	public function errors(){
		return sqlsrv_errors();
	}

	public function printErrors(){
		print_r(sqlsrv_errors());
	}

	public function cleanEmail($email){
		return filter_var($email, FILTER_VALIDATE_EMAIL);
	}

	// Clean up Special Characters
	public static function clean($string)
	{
		$string = strip_tags(ms_escape_string($string));

		$search = array( // 4 per line
			// '&', '<', '>', '"',
			// chr(212), chr(213), chr(210), chr(211),
			// chr(209), chr(208), chr(201), chr(145),
			// chr(146), chr(147), chr(148), chr(151),
			// chr(150), chr(133),
			chr(194), chr(160), chr(255)
		);
		$replace = array( // 4 per line
			// '&amp;', '&lt;', '&gt;', '&quot;',
			// '&#8216;', '&#8217;', '&#8220;', '&#8221;',
			// '&#8211;', '&#8212;', '&#8230;', '&#8216;',
			// '&#8217;', '&#8220;', '&#8221;', '&#8211;',
			// '&#8212;', '&#8230;',
			'', ' ', ' '
		);
		return str_replace($search, $replace, $string);
	}

	// Clean up Special Characters
	public static function unclean($string)
	{
		if(gettype($string) == 'string'){
			$string = htmlspecialchars_decode($string);
			$string = preg_replace("/''/", "'", $string);
		}
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&amp;/", "&", $string);
		$string = preg_replace("/&lt;/", "<", $string);
		$string = preg_replace("/&gt;/", ">", $string);
		$string = preg_replace("/&ndash;/", "-", $string);
		$string = preg_replace("/&mdash;/", "-", $string);
		$string = preg_replace("/&pound;/", "£", $string);
		$string = preg_replace("/&quot;/", "\"", $string);
		$string = preg_replace("/&eacute;/", "é", $string);
		$string = preg_replace("/&egrave;/", "è", $string);
		$string = preg_replace("/&aacute;/", "á", $string);
		$string = preg_replace("/&agrave;/", "à", $string);
		$string = preg_replace("/&lsquo;/", "'", $string);
		$string = preg_replace("/&rsquo;/", "'", $string);
		$string = preg_replace("/&ldquo;/", "'", $string);
		$string = preg_replace("/&rdquo;/", "'", $string);
		$string = preg_replace("/&auml;/", "ä", $string);
		$string = preg_replace("/&atilde;/", "ã", $string);
		$string = preg_replace("/&frac12;/", "½", $string);
		$string = preg_replace("/&hellip;/", "...", $string);

		$string = preg_replace("/&frac12;/", "½", $string);
		// $string = preg_replace("/''/", "'", $string);

		return preg_replace("/''/", "'", $string);
	}

	// Clean up garbage Characters
	public static function convertFromCP1252($string)
	{
		$search = array( // 4 per line
			chr(212), chr(213), chr(210), chr(211),
			chr(209), chr(208), chr(201), chr(145),
			chr(146), chr(147), chr(148), chr(151),
			chr(150), chr(133), chr(194), chr(160)
		);
		$replace = array( // 4 per line
			'&#8216;a', '&#8217;b', '&#8220;c', '&#8221;d',
			'&#8211;e', '&#8212;f', '&#8230;g', '&#8216;h',
			'&#8217;i', '-', '&#8221;k', '&#8211;l',
			'&#8212;m', '&#8230;n', '', ' '
		);
		return str_replace($search, $replace, $string);
	}

	// Clean up input
	public static function sanitize($data) {
		return htmlentities(strip_tags(ms_escape_string($data)));
	}


}
