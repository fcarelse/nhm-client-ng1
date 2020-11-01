<?php

// Returns:
//     true: On valid operations
//     array: On invalud operations
//         data: Corrected creation data (optional)
//         message: Text about invalidity (optional)
//         valid: false or true if returning message with successful validation
//         status: Post status code to respond with
class Validation{

	public static $lastError;

	// Creation validation
	public static function validate($type, $data, $method=false){
		if(!$method) return false;
		switch($type){
			default: return true;
		}
		return true;
	}

	public static function create($type, $data){
		return self::validate($type, $data, 'create');
	}

	public static function update($type, $data){
		return self::validate($type, $data ,'update');
	}

	public static function delete($type, $data){
		return self::validate($type, $data, 'delete');
	}
}

?>