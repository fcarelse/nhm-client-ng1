<?php require_once(dirname(__FILE__).'/../config.php');
# Use login.php for data accessible only when logged in.

# Decode hex encoded string.
function hex2str($hex) {
	$str = "";
	for($i=0; $i<strlen($hex); $i+=2) $str .= chr(hexdec(substr($hex,$i,2)));
	return $str;
}

# My choice for hashing method
function myHash($str){
	return base64_encode(hex2str(hash('SHA256', $str)));
}

# Read json file to a string
function import_json($filename){
	return json_decode(file_get_contents($filename), true);
}

# Read json file to a string
function download_json($url){
	$stream = @fopen($url, "rd");
	if(!$stream) return false;
	return @json_decode(@stream_get_contents($stream));
}

# Use to get a value for a Posted Variable name
# or blank string if it does not exist.
function getPosted($varName){
	if(isset($_POST[$varName]))
		return $_POST[$varName];
	return "";
}

# Escape data.
function ms_escape_string($data) {
	if ( !isset($data) or empty($data) ) return '';
	if ( is_numeric($data) ) return $data;

	$non_displayables = array(
		'/%0[0-8bcef]/',	// url encoded 00-08, 11, 12, 14, 15
		'/%1[0-9a-f]/',		// url encoded 16-31
		'/[\x00-\x08]/',	// 00-08
		'/\x0b/',			// 11
		'/\x0c/',			// 12
		'/[\x0e-\x1f]/'		// 14-31
	);
	if(gettype($data) != 'string') return $data;
	foreach ( $non_displayables as $regex)
		$data = preg_replace( $regex, '', $data);
	$data = str_replace("'", "''", $data);
	return $data;
}

include(dirname(__FILE__).'/DBSystems/mysql.php');

?>