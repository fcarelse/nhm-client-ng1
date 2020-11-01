<?php

class Auth
{
	public static $user;
	public static $cache;
	public static $groups;
	public static $groupIDs;
	public static $realGroups;
	public static $realGroupIDs;
	private static $inited = false;
	private static $initedReal = false;

	public static function init(){
		if(self::$inited) return;
		else self::$inited = true;
		if(!isset(self::$cache)){
			self::$cache = array();
			self::$groups = self::getGroups(self::getID());
			self::$groupIDs = self::listNonZeroValues(self::$groups, 'group');
		}
	}
	public static function initReal(){
		if(!self::$inited) self::init();
		if(self::$initedReal) return;
		else self::$initedReal = true;
		self::$realGroups = self::getGroups(self::getRealID());
		self::$realGroupIDs = self::listNonZeroValues(self::$realGroups, 'group');
	}

	public static function getSession(){
		if(isset($_SESSION['user'])){
			if(!isset($_SESSION['user']['email'])) $_SESSION['user']['email'] = null;
			if(!isset($_SESSION['user']['id'])) $_SESSION['user']['id'] = null;
			if(!isset($_SESSION['user']['username'])) $_SESSION['user']['username'] = '';
			unset($_SESSION['user']['password']);
			self::$user = $_SESSION['user'];
			$_SESSION['email'] = $_SESSION['user']['email'];
			$_SESSION['id'] = $_SESSION['user']['id'];
		} else {
			self::$user = array('type'=>GUEST); 
		}
		if(!isset($user['type'])) self::$user['type'] = GUEST;

	}

	public static function isAdmin($redirect = ""){
		return self::hasAccess(ADMIN, $redirect) || self::hasAnyTag(['directorsEA','admin','webdev','support']);
	}

	public static function getID(){
		self::init();
		if(isset($_SESSION['user']) && isset($_SESSION['user']['id']))
			return $_SESSION['user']['id'];
		else
			return false;
	}
	public static function getRealID(){
		self::initReal();
		if(isset($_SESSION['realUserID'])) return $_SESSION['realUserID'];
		if(isset($_SESSION['user']) && isset($_SESSION['user']['id']))
			return $_SESSION['user']['id'];
		else
			return false;
	}
	public static function hasAccess($restriction, $redirect = ""){
		if(isset($_SESSION['user'])){
			switch(strtolower($restriction)){
				case GUEST: if($_SESSION['user']['type'] == GUEST) return true;
				case USER: if($_SESSION['user']['type'] == USER) return true;
				case ADMIN: if($_SESSION['user']['type'] == ADMIN) return true;
				case SYSTEM: if($_SESSION['user']['type'] == SYSTEM) return true;
			}
		}
		if($redirect != ""){
			if($redirect = '/'){
				header('location: /account/login.php?return='.$_SERVER['PHP_SELF']);
			} else
				header('location: '.$redirect);
			exit();
		}
		return false;
	}
	public static function getAccessFolder(){
		global $user;
		switch($user['type']){
			case USER: return 'user';
			case ADMIN: return 'admin';
			default: return 'guest';
		}
	}
	public static function hasRealAccess($restriction, $redirect = ""){
		if(isset($_SESSION['realUser'])){
			switch(strtolower($restriction)){
				case GUEST: if($_SESSION['realUser']['type'] == GUEST) return true;
				case USER: if($_SESSION['realUser']['type'] == USER) return true;
				case ADMIN: if($_SESSION['realUser']['type'] == ADMIN) return true;
				case SYSTEM: if($_SESSION['realUser']['type'] == SYSTEM) return true;
			}
		}
		if($redirect != ""){
			if($redirect = '/'){
				header('location: /account/login.php?return='.$_SERVER['PHP_SELF']);
			} else
				header('location: '.$redirect);
			exit();
		}
		return false;
	}
	public static function getPartID($redirect = '', $pid = 'pid', $message = ''){
		self::init();
		if(Auth::hasAccess(ADMIN) && isset($_REQUEST[$pid]))
 			return $_REQUEST[$pid];
		if(Auth::hasAccess(USER))
			return Auth::getID();
		if($message != '') die($message);
		if($redirect != '') {
			$_SESSION['flash'] = 'Access Denied';
			session_commit();
			header("location: ".$redirect);
			exit(0);
		}
		return false;
	}

	public static function getPID($pid = 'pid', $redirect = ''){
		self::init();
		if(isset($_REQUEST[$pid])) return $_REQUEST[$pid];
		if(Auth::getID()) return Auth::getID();
		if($redirect != '') {
			$_SESSION['flash'] = 'Access Denied';
			session_commit();
			header("location: ".$redirect);
			exit(0);
		}
		return false;
	}

	public static function getAssociations($id){
		self::init();
		//if(!self::hasAccess(PERSONNEL)) return false;
		if(isset(self::$cache[$id])) return self::$cache[$id];
		$associations = Json::build('associations');
		if(!isset($associations)) return false;
		$all = $associations->find(['filters'=>[['field'=>'personnel','op'=>'EQ','value'=>$id]]]);
		return self::$cache[$id] = [
			'groups'=>self::sort(self::listNonZeroValues($all, 'group')),
		];
	}

	public static function getGroups($id){
		self::init();
		//if(!self::hasAccess(PERSONNEL)) return false;
		$associations = Json::build('associations');
		if(!$associations) return false;
		return $associations->find([
			'filters'=>[
				['field'=>'personnel','op'=>'EQ','value'=>$id],
				['field'=>'group','op'=>'NE','value'=>0]
			]
		]);
	}

	public static function hasTag($tag){
		self::init();
		if(!self::hasAccess(PERSONNEL)) return false;
		$group = Util::findRecord(self::$allGroups, 'tag', $tag);
		if($group == false) return false;
		return in_array($group['id'], self::$groupIDs);
	}

	public static function hasAnyTag($tags){
		foreach($tags as $tag)
			if(self::hasTag($tag)) return true;
		return false;
	}

	public static function getRealGroups(){
		self::initReal();
		if(!self::getRealID()) return [];
		//if(!self::hasAccess(PERSONNEL)) return false;
		$associations = Json::build('associations');
		if(!$associations) return false;
		return $associations->find([
			'filters'=>[
				['field'=>'personnel','op'=>'EQ','value'=>self::getRealID()],
				['field'=>'group','op'=>'NE','value'=>0]
			]
		]);
	}

	public static function hasRealTag($tag){
		self::initReal();
		if(!self::hasRealAccess(PERSONNEL)) return false;
		$group = Util::findRecord(self::$allGroups, 'tag', $tag);
		if($group == false) return false;
		return in_array($group['id'], self::$realGroupIDs);
	}

	public static function hasAnyRealTag($tags){
		foreach($tags as $tag)
			if(self::hasRealTag($tag)) return true;
		return false;
	}

	public static function getAccessList($id){
		self::init();
		$assocs = self::getAssociations($id);
		if(!$assocs) return false;
		$matches = array();
		return $assocs;
	}

	public static function getPartsList($id){
		self::init();
		$assocs = self::getAssociations($id);
		if(!$assocs) return false;

		return $assocs;
	}
	public static function listValues($array, $key){
		$list = array();
		for($i = 0; $i < count($array); $i++){
			$list[] = $array[$i][$key];
		}
		return $list;
	}
	public static function listNonZeroValues($array, $key){
		$list = array();
		for($i = 0; $i < count($array); $i++)
			if($array[$i][$key] != 0)
				$list[] = $array[$i][$key];
		return $list;
	}
	public static function sort($array){
		sort($array); return $array;
	}

	public static function loginNode($username, $password){
		$url = 'http://localhost:3000/login';
		$username = isset($_REQUEST['username'])?$_REQUEST['username']:'';
		$password = isset($_REQUEST['password'])?$_REQUEST['password']:'';
		$data = array('username' => $username, 'password' => $password);

		// use key 'http' even if you send the request to https://...
		$options = array(
			'http' => array(
				'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
				'method'  => 'POST',
				'content' => http_build_query($data),
			),
		);
		$context  = stream_context_create($options);
		$result = file_get_contents($url, false, $context);

		//$_SESSION['flash'] = json_encode($result);
		try{
			$json = json_decode($result, true);
		} catch (Exception $e){ return '/'; }
		return (isset($json['Redirect']) && $json['Redirect'] == 'invalid')? '/': $json['Redirect'];
	}

	public static $allGroups = [
		["id"=> 1, "tag"=> "administrators", "name"=> "Administrators"],
	];
}
