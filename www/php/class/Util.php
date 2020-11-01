<?php
class Util{
	public static function findRecord($arr, $key, $value){ return self::findBone($arr, $key, $value); }
	public static function findBone($arr, $key, $value){
		foreach($arr as $bone) if($bone[$key] == $value) return $bone;
		return false; }
	public static function findRecords($arr, $key, $value){ return self::findBones($arr, $key, $value); }
	public static function findBones($arr, $key, $value){
		self::clearReturn();
		foreach($arr as $bone) if($bone[$key] == $value) self::addReturn($bone);
		return self::$return; }
	public static function cloneRecords($arr){ return self::cloneBones($arr); }
	public static function cloneBones($arr){
		$retn = [];
		foreach($arr as $bone) $retn[] = array_merge([],$bone);
		return $retn; }
	public static function listValues($arr, $id, $filler = null){
		self::clearReturn();
		for($i=0;$i < count($arr);$i++)
			if(isset($arr[$i][$id]))
				self::addReturn($arr[$i][$id]);
			else if($filler !== null)
				self::addReturn($filler);
		return self::$return; }
	public static function removeBones(){}
	public static function copyFields(){}

	private static $return;
	private static function clearReturn(){ self::$return = array(); }
	private static function inReturn($id, $value){ return !is_null(self::findBone(self::$return, $id, $value)); }
 	private static function addReturn($bone){ self::$return[] = $bone; }

	public static function filterBones($arr, $matches){
		self::clearReturn();
		for($i=0;$i < count($arr);$i++){
			$bone = $arr[$i];
			for($j=0;$j < count($matches);$j++){
				$matcher = $matches[$j];
				if(isset($matches[$j]['op'])){
					switch($matches[$j]['op']){
						case 'EQ':
							if($bone[$matcher['field']] == $matcher['value'] && !self::inReturn($bone['id'], $bone['value']))
								self::addReturn($bone);
						break;
					}
				}
				else if($bone[$matcher['field']] == $matcher['value'] && !self::inReturn($bone['id'], $bone['value'])) self::addReturn($bone);
			}
		}
		return self::$return;
	}

	public static function getRandomString($length = 6, $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'){
		$randstring = '';
		for ($i = 0; $i < $length; $i++) {
			$randstring .= $characters[rand(0, strlen($characters) -1 )];
		}
		return $randstring;
	}

	public static function stringToDate($string){
		return date_create_from_format('d/m/Y', $string);
	}

	public static function dateToString($date){
		return $date->format('d/m/Y');
	}
	public static function today(){
		return new DateTime('now');
	}
	public static function todayString(){
		return dateToString(self::today());
	}

	public static function jsonToArray($json){
		try {
			return json_decode($json,true);
		} catch (Exception $e) {
			return [];
		}
	}
	public static function arrayToJson($arr){
		try {
			return json_encode($arr,JSON_PRETTY_PRINT);
		} catch (Exception $e) {
			return '[]';
		}
	}


}