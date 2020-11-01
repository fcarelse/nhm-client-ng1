<?php
class Templates{
	public static function process($filename, $data = null){
		if(!file_exists($filename)) return false;
		$file = file_get_contents($filename);
		if(isset($data) && is_array($data)){
			foreach($data as $key=>$value){
				if(preg_match('/[^A-Za-z0-9_-]/', $key)) continue; // Enforce character only convention.
				if(!is_object($value))
					$file = preg_replace('/\$\{'.$key.'\}/', $value, $file);
			}
		}
		$file = preg_replace('/\$\{[^}]*\}/', $value, $file);
		return $file;
	}
	public static function processHTML($html, $data = null){
		if(isset($data) && is_array($data)){
			foreach($data as $key=>$value){
				if(preg_match('/[^A-Za-z0-9_-]/', $key)) continue; // Enforce character only convention.
				if(!is_object($value))
					$html = preg_replace('/\$\{'.$key.'\}/', $value, $html);
			}
		}
		$html = preg_replace('/\$\{[^}]*\}/', $value, $html);
		return $html;
	}
	public static function haveTemplate($name){
		if($name == 'test') return true;
		return false;
	}
	public static function getTemplate($name){
		switch($name){
			case 'test': // Internship/TeachersGoAbroad Notification.
			return [
				"subject"=>"Testing",
				"message" => '<p>This is a test</p>'
			];
		}
	}
}