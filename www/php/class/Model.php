<?php

class Model{
	private static $personnel;
	private static $participants;
	private static $types;
	private static $models;
	private static function init(){
		if(!isset(self::$types)){
			self::$models = array();
			self::$types = json_decode(file_get_contents(dirname(__FILE__)."/../type/types.json"), true);
			self::$personnel = json_decode(file_get_contents(dirname(__FILE__)."/../type/personnel.json"), true);
			self::$participants = json_decode(file_get_contents(dirname(__FILE__)."/../type/participants.json"), true);
		}
	}
	public static function getModel($type){
		self::init();
		if(!isset(self::$types[$type])) return false;
		$file = dirname(__FILE__)."/../type/".self::$types[$type];
		if(!file_exists($file)) return false;
		if(!array_key_exists($type, self::$models))
			self::$models[$type] = json_decode(file_get_contents($file), true);
		return self::$models[$type];
	}
	public static function getTableName($type){
		self::init();
		self::getModel($type);
		if(!isset(self::$models[$type]['schema']['table'])) return false;
		return self::$models[$type]['schema']['table'];
	}
	public static function getFieldMap($type){
		self::init();
		self::getModel($type);
		if(!isset(self::$types[$type])) return null;
		if(!isset(self::$models[$type])) return null;
		$fieldMap = array();
		foreach(array_keys(self::$models[$type]['model']) as $key){
			$fieldMap[$key] = self::$models[$type]['model'][$key]['field'];
		}
		return $fieldMap;
	}
	public static function getPersonnelFieldMap(){
		self::init();
		$fieldMap = array();
		foreach(array_keys(self::$personnel['model']) as $key){
			$fieldMap[$key] = self::$personnel['model'][$key]['field'];
		}
		return $fieldMap;
	}
	public static function getParticipantsFieldMap(){
		self::init();
		$fieldMap = array();
		// if(!($model=self::getModel('participants'))) return false;
		foreach(array_keys(self::$participants['model']) as $key){
			$fieldMap[$key] = self::$participants['model'][$key]['field'];
		}
		return $fieldMap;
	}
}
?>