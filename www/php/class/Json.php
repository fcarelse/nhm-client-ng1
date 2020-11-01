<?php require_once(dirname(__FILE__)."/Validation.php");


class Json {
	// Object attributes and methods
	public $db;
	public $pid;
	public $restrict;
	private $type;
	private $model;
	public $schema;
	private $count;
	private $table;
	private $sort;
	private $sort2;
	private $order;
	private $order2;
	private $primary;
	private $foreign;
	private $filters;
	private $matches;
	private function __construct($class, $type){
		$this->db = new Database();
		$this->db->connect();
		$this->pid = 0;
		$this->type = $type;
		$this->class = $class;
		$this->model = $this->class['model'];
		$this->schema = $this->class['schema'];
		$this->table = $this->schema['table'];
		$this->count = $this->getCount();
		$this->sort = $this->schema['sort']['by'];
		$this->order = $this->schema['sort']['order'];
		$this->sort2 = (isset($this->schema['sort2']) && isset($this->schema['sort2']['by']))? $this->schema['sort2']['by']: '';
		$this->order2 = (isset($this->schema['sort2']) && isset($this->schema['sort2']['order']))? $this->schema['sort2']['order']: '';
		$this->restrict = isset($this->schema['restrict'])?
			$this->schema['restrict'] : false;
		$this->groupby = (isset($this->schema['groupby']))? $this->schema['groupby']: '';
		$this->keys = $this->schema['keys'];
		$this->primary = $this->keys['primary'];
		$this->createPrimary = isset($this->schema['createPrimary'])?$this->schema['createPrimary']:false;
		$this->foreign = isset($this->keys['foreign'])?$this->keys['foreign']:array();
		$this->limit = (isset($this->schema['limit']))?
			$this->schema['limit'] : $this->count;
		$this->filters = (isset($this->class['filters']))?
			$this->class['filters'] : array();
	}
	public function isPublic(){
		return (isset($this->schema['public']) && $this->schema['public'] == true);
	}

	public function restriction($method){
		if(isset($this->restrict[$method]))
			return $this->restrict[$method];
		return false;
	}
	public static function toSQLDateString($date){
		if(is_bool($date) || is_null($date) || (is_string($date) && $date==''))
			return "NULL";
		else if(isset($date['date']))
			$date = substr($date['date'],0,10);
		else{
			$date = date_create_from_format('d/m/Y', $date);
			$default = date_create_from_format('d/m/Y', '01/01/1900');
			$date = date_format($date===false?$default:$date,'Y-m-d');
		}
		if($date)
			return "CAST('".$date."' AS DATE)";
		else return "NULL";
	}
	public static function toSQLTimeString($time){
		if(is_bool($time) || is_null($time) || (is_string($time) && $time==''))
			return "NULL";
		else{
			$time = date_create_from_format(EATIMEFORMAT, $time);
			$default = date_create_from_format(EATIMEFORMAT, '1900-01-01 00:00:00');
			$time = date_format($time===false?$default:$time,'Y-m-d H:i:s'); // mssql time format is Y-m-d H:i:s
		}
		if($time)
			return "CAST('".$time."' AS DATETIME)";
		else return "NULL";
	}
	public function create($data){
		// if($this->restrict && $this->restrict['CREATE'] && !Auth::hasAccess($this->restrict['CREATE']))
		// 	return false;
		$values = "";
		$keys = "";
		// $output = "INSERTED.id";
		foreach(array_keys($data) as $key){
			if($this->createPrimary || $key != $this->primary[0]){
				if(!isset($this->model[$key])) continue;
				if($values != "") $values .= ",";
				if($keys != "") $keys .= ",";
				// if($output != "") $output .= ",";
				$keys .= $this->getField($key);
				// $output .= 'INSERTED.'.$key;
				switch(strtolower($this->model[$key]['type'])){
					case 'date':
						$values .= self::toSQLDateString($data[$key]);
						break;
					case 'time':
						$values .= self::toSQLTimeString($data[$key]);
						break;
					case 'number': case 'money':
						$values .= floatval($data[$key]);
						break;
					case 'jsonarray': case 'jsonobject':
						if(is_array($data[$key])) $data[$key] = Util::arrayToJson($data[$key]);
						$values .= "'".ms_escape_string($data[$key])."'";
						break;
					case 'string': case 'text': default:
						$values .= "'".ms_escape_string($data[$key])."'";
				}
			}
		}
		$table = $this->table;
		$sql = "INSERT INTO $table ($keys) OUTPUT INSERTED.* VALUES ($values); SELECT @@IDENTITY;";
		// $debug=true;
		if(isset($debug))
			file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", "\n".$sql, FILE_APPEND);
		$this->db->query($sql);
		$result = $this->db->fetch_array();
		if($result === false) return false;
		$result = $this->translateFields($result);
		// file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", "\n".json_encode($result), FILE_APPEND);
		return $result;
	}

	public function delete($data){
		if(!isset($data['id'])) return false;
		if(!isset($data['filters']) || !is_array($data['filters']))  $data['filters'] = array();
		$data['filters'][] = array('field'=>$this->getPrimary(), 'value'=>$data['id']);

		if(Auth::isParticipant()){
			if(!$this->hasField('partID')){
				return array('error'=>'401','message'=>'Participants can only access their own records');
			} else {
				$data['filters'][] = array('field'=>'partID', 'value'=>Auth::getID());
			}
		}

		$where = $this->genWhere($data['filters']);

		$table = $this->table;
		$sql = "DELETE FROM $table OUTPUT DELETED.* $where";
		$this->db->query($sql);
		return $this->translateFields($this->db->fetch_array());
	}

	public function update($data){
		if(!isset($data['id'])) return false;
		$changes = "";
		foreach(array_keys($data) as $key){
			if($key != $this->primary[0] && array_key_exists($key, $this->model)){
				if($changes != "") $changes .= ",";
				switch(strtolower($this->model[$key]['type'])){
					case 'date':
						$changes .= $this->getField($key)."=".
							self::toSQLDateString($data[$key]);
						break;
					case 'time':
						$changes .= $this->getField($key)."=".
							self::toSQLTimeString($data[$key]);
						break;
					case 'number':
						$changes .= $this->getField($key)."=".floatval($data[$key]);
						break;
					case 'integer': case 'int': case 'money':
						$changes .= $this->getField($key)."=".intval($data[$key]);
						break;
					case 'boolean':
						// file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", "\n".json_encode(array('bool'=>$data[$key])), FILE_APPEND);
						$changes .= $this->getField($key)."=".(is_bool($data[$key])? (($data[$key] === '' )? 'NULL': intval($data[$key])): 'null' );
						break;
					case 'select':
						if(is_numeric($data[$key]))
							$changes .= $this->getField($key)."=".intval(ms_escape_string($data[$key]));
						else
							$changes .= $this->getField($key)."='".ms_escape_string($data[$key])."'";
						break;
					case 'string': case 'text': default:
						$changes .= $this->getField($key)."=";
						if(!isset($data[$key]))
							$changes .= 'null';
						else if(is_array($data[$key])){
							$changes .= "'[]'";
							for($i=0;$i<count($data[$key]);$i++)
								$data[$key][$i] = Database::clean($data[$key][$i]);
							// file_put_contents(dirname(__FILE__)."/json-arrayError.log", "\n".$key.'='.json_encode($data[$key])."\n", FILE_APPEND);
						} else {
							$changes .= "'".Database::clean($data[$key])."'";
						}
				}
			}
		}
		$sql = "UPDATE ".$this->table." ";
		$sql .= " SET ".$changes." WHERE ".
			$this->getField($this->primary[0])."='".$data[$this->primary[0]]."'";
		// $debug=true;
		if(isset($debug))
			file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", "\n".$sql, FILE_APPEND);
		$result = $this->db->query($sql);
		return $result;
	}

	public static function build($type){ return self::buildCRUDL($type); }
	public static function buildCRUDL($type){
		if(!($class = Model::getModel($type)))
			return false;
		else
			return new Json($class, $type);
	}
	public function getPrimary(){
		return $this->primary[0];
	}
	public function hasField($key){
		if(!isset($key)) return false;
		if(array_key_exists($key, $this->model))
			return true;
		else
			return false;
	}
	public function getField($key){
		if(!isset($key)) return false;
		if(array_key_exists($key, $this->model))
			return $this->model[$key]['field'];
		else
			return false;
	}
	public function find($data = array()){
		$page = 1;
		$limit = $this->limit;
		$start = 1;
		$sort = $this->sort;
		$order = $this->order;
		$sort2 = $this->sort2;
		$order2 = $this->order2;
		$groupby = $this->groupby;
		$table = $this->table;
		$where = "";

		// Setup filters for $where
		$filters = array();
		if(isset($data['filters']))
			$filters = $data['filters'];
		$where = $this->genWhere($filters);

		$count = $this->count;
		if(isset($data['page'])) $page = $data['page'];
		if(isset($data['limit'])) $limit = $data['limit'];
		if(is_string($limit)) $limit = intval($limit);
		if($limit == -1) $limit = $count;
		if($limit > $count) $limit = $count;
		if($limit < 1) $limit = 1;
		if($limit > 1000000 && !isset($data['limit'])) $limit = 1000000;
		$start = $page * $limit - $limit + 1;
		if(isset($data['start'])) $start = $data['start'];
		if(isset($data['sort'])) $sort = $data['sort'];
		if(isset($data['order'])) $order = $data['order'];
		if(isset($data['sort2'])) $sort2 = $data['sort2'];
		if(isset($data['order2'])) $order2 = $data['order2'];
		$ordering = ((array_key_exists($sort, $this->model))?
			$this->getField($sort) : $this->getPrimary()).
			(($order == 'DESC')?' DESC ':' ASC ').
			(($sort2 !== '' && array_key_exists($sort2, $this->model))?
			(','.$this->getField($sort2).(($order2 == 'DESC')?' DESC ':' ASC ')): '');
		$numPages = $count / $limit;
		$max = $start + $limit - 1;
		if($max < 1) $max = 1;

		// Grouping
		if(isset($data['groupby'])) $groupby = $data['groupby'];
		$grouping = ($groupby == '')? '': "GROUP BY ".$this->getField($groupby);

		// Create list of fields to be read.
		$keyset = (isset($data['fields']))? explode(' ', $data['fields']):
			((isset($this->schema['short']))? $this->schema['short']: '*');
		$list = "";
		if($keyset != '*'){
			foreach($keyset as $key){
				if(isset($this->model[$key])){
					if($list != "") $list .= ",";
					$list .= $this->model[$key]['field'];
				}
			}
		} else
			$list = "*";

		// Set sql depending on whether paging is being used.
		if($limit == $count) $sql = "SELECT TOP 1000000 $list FROM $table $where ORDER BY $ordering";
		else $sql = "SELECT TOP $limit $list ".
			" FROM (SELECT TOP $max $list, ROW_NUMBER()".
			" OVER (ORDER BY $ordering) as row".
			" FROM $table $where) a".
			" WHERE a.row >= $start";
		if(isset($_GET['test']) && $_GET['test'] == 'sql'){
			echo $sql;
			exit(0);
		}
		$debug =true;
		if(isset($debug))
			file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", "\n".$sql, FILE_APPEND);
		$cursor = $this->db->query($sql);
		$records = array();
		while($record = $this->db->fetch_array($cursor)){
			$record = $this->translateFields($record, $keyset);
			// Convert Dates to string.
			foreach(array_keys($record) as $key){
				if(isset($this->model[$key]['restricted']) && $this->model[$key]['restricted'] &&
					!(isset($this->model[$key]['allow'])
					// && Auth::hasTag($this->model[$key]['allow'])
					))
				switch (strtolower($this->model[$key]['type'])) {
					case 'money':
						if($record[$key] != null)
							$record[$key] = intVal($record[$key]);
						break;
					
					case 'date':
						if($record[$key] != null && !is_string($record[$key]))
							$record[$key] = $record[$key]->format(EADATEFORMAT);
						break;
					
					case 'time':
						if($record[$key] != null && !is_string($record[$key]))
							$record[$key] = $record[$key]->format(EATIMEFORMAT);
						break;
					
					default:
						# code...
						break;
				}
			}
			$records[] = $record;
		}
		return $records;
	}
	public function transOp($op, $type='String'){
		switch($type){
			case 'String':{
				switch(strtoupper($op)){
					case 'EQ': return '=';
					case 'LI': return 'LIKE';
					case 'NL': return 'NOT LIKE';
					case 'LT': return '<';
					case 'GT': return '>';
					case 'NE': return '<>';
					case 'LE': return '<=';
					case 'GE': return '>=';
					case 'NI': return 'IS NOT';
					case 'IS': return 'IS';
					case 'NN': return 'IS NOT NULL';
					case 'NU': return 'IS NULL';
				}
			}break;
			case 'Date':{
				switch(strtoupper($op)){
					case 'EQ': return '=';
					case 'LI': return 'LIKE';
					case 'NL': return 'NOT LIKE';
					case 'LT': return '<';
					case 'GT': return '>';
					case 'NE': return '<>';
					case 'LE': return '<=';
					case 'GE': return '>=';
					case 'NI': return 'IS NOT';
					case 'IS': return 'IS';
					case 'NN': return 'IS NOT NULL';
					case 'NU': return 'IS NULL';
				}
			}break;
			default:{
				switch(strtoupper($op)){
					case 'EQ': return '=';
					case 'LI': return 'LIKE';
					case 'NL': return 'NOT LIKE';
					case 'LT': return '<';
					case 'GT': return '>';
					case 'NE': return '<>';
					case 'LE': return '<=';
					case 'GE': return '>=';
					case 'NI': return 'IS NOT';
					case 'IS': return 'IS';
					case 'NN': return 'IS NOT NULL';
					case 'NU': return 'IS NULL';
				}
			}break;
		}
	}
	public function genFilter($key){
		if(!isset($this->filters[$key])){
			switch(substr($key, -2)){
				case 'EQ': $operator = '='; break;
				case 'LI': $operator = 'LIKE'; break;
				case 'NL': $operator = 'NOT LIKE'; break;
				case 'LT': $operator = '<'; break;
				case 'GT': $operator = '>'; break;
				case 'NE': $operator = '<>'; break;
				case 'LE': $operator = '<='; break;
				case 'GE': $operator = '>='; break;
				case 'NI': $operator = 'IS NOT'; break;
				case 'IS': $operator = 'IS'; break;
			}
			$this->filters[$key] = array(
				'field'=>substr($key, 0, -2),
				'operator'=>$operator
			);
		}
	}
	public function read($data){
		for($i=0;$i<count($this->primary);$i++)
			if(isset($data[$this->primary[$i]])) $primary = $this->primary[$i];
		if(!isset($primary)) $primary = $this->primary[0];
		if(!isset($data[$primary])) return false;
		$id = $data[$primary];
		$sql = "SELECT * FROM ".$this->table;
		switch (strtolower($this->model[$primary]['type'])){
			case 'number': case 'money':
				$sql .= " WHERE ".$this->getField($primary).
					"=".ms_escape_string($id)."";
				break;
			case 'string': case 'text':
				$sql .= " WHERE ".$this->getField($primary).
					"=('".ms_escape_string($id)."')";
				break;
			case 'date':
				$sql .= " WHERE ".$this->getField($primary).
					"=('".ms_escape_string($id)."')";
				break;
			case 'time':
				$sql .= " WHERE ".$this->getField($primary).
					"=('".ms_escape_string($id)."')";
				break;
			case 'boolean':
				$sql .= " WHERE ".$this->getField($primary).
					"=(".ms_escape_string($id).")";
				break;
			case 'select':
				$sql .= " WHERE ".$this->getField($primary).
					"=(".ms_escape_string($id).")";
				break;
			default: // Use same as string.
				$sql .= " WHERE ".$this->getField($primary).
					"=('".ms_escape_string($id)."')";
				break;
		}
		$cursor = $this->db->query($sql);
		$record = $this->db->fetch_array($cursor);
		$keyset = isset($data['fields'])? explode(' ', $data['fields']): null;
		//file_put_contents(dirname(__FILE__).'/test.log', json_encode($data['fields'],JSON_PRETTY_PRINT));
		if(isset($record)){
			return $this->translateFields($record, $keyset);
		} else return false;
	}
	public function translateFields($row, $keyset = null){
		$map = Model::getFieldMap($this->type);
		$record = array();
		if(!is_null($keyset) && $keyset != '*'){
			$keys = ($keyset)? $keyset: array_keys($map);
			if(!$keyset && isset($this->schema['short']))
				$keys = $this->schema['short'];
		} else $keys = array_keys($map);
		foreach($keys as $key){
			if(isset($map[$key])){
				// Create a logger class so that you can manage issues better.
				//if(!isset($row[$map[$key]])) continue;
				$value = isset($row[$map[$key]])? $row[$map[$key]]: '';
				if(strtolower($this->model[$key]['type'])=='date'){
					if(!is_null($value) && ($value instanceof DateTime)
						&& (date_format($value,'Y')!='1900'))
						$value = $value->format(EADATEFORMAT);
					else
						$value = '';
				} else if(strtolower($this->model[$key]['type'])=='time'){
					if(!is_null($value) && ($value instanceof DateTime))
						$value = $value->format(EATIMEFORMAT);
					else
						$value = '';
				} else if(strtolower($this->model[$key]['type'])=='boolean'){
					if(!is_null($value)){
						$value = !!$value? true:false;
					}else{
						$value = 0;
					}
				} 
				if(gettype($value) == 'string')
				 	$value = Database::unclean($value);
				$record[$key] = $value;
			}
		}
		return $record;
	}
	public function existsByKeyfield($key){
		$cursor = $this->db->query("SELECT * FROM TblGSTJson ".
			"WHERE GSTJsonEmail=(?) OR GSTJsonUsername=(?)",
			array($username, $username));
		$participant = $this->db->fetch_array($cursor);
		if(isset($participant))
			return $this->translateFields($participant);
		else
			return false;
	}
	public function filter2Condition($filter){
		if(!isset($filter['op'])) $filter['op'] = (
			$this->model[$filter['field']]['type'] == 'Number' ||
			$this->model[$filter['field']]['type'] == 'Select')? 'EQ': 'LI';
		// file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", json_encode($filter), FILE_APPEND);
		try {
			$field = $this->getField($filter['field']);
			$op = isset($filter['op'])?strtoupper($filter['op']):'EQ';
			$operator = $this->transOp($op, $this->model[$filter['field']]['type']);
			if($op == 'NN' || $op == 'NU') $value = '';
			else $value = ($this->model[$filter['field']]['type'] == 'Date')?
				self::toSQLDateString($filter['value']):
				"'${filter['value']}'";
		} catch (Exception $e) {
			if(isset($debug))
				file_put_contents(dirname(__FILE__)."/json-${_SERVER['SERVER_NAME']}.log", json_encode($filter)."\n".print_r($e), FILE_APPEND);
		}
		return " $field $operator $value ";
	}
	public function genWhere($filters){
		$where = "";
		foreach($filters as $filter){
			if($where == "") $where .= "WHERE ";
			else $where .= " AND ";
			if(!isset($filter['field']) &&
				isset($filter[0]) &&
				is_array($filter[0])){
				$where .= '(';
				for($i = 0; $i < count($filter); $i++){
					if($i != 0) $where .= ' OR ';
					if(!isset($filter[$i]['field']) &&
						isset($filter[$i][0]) &&
						is_array($filter[$i][0]) &&
						isset($filter[$i][0]['field'])){
						$where .= '(';
						for($j = 0; $j < count($filter[$i]); $j++){
							if($j != 0) $where .= ' AND ';
							$where .= $this->filter2Condition($filter[$i][$j]);
						}
						$where .= ')';
					} else
						$where .= $this->filter2Condition($filter[$i]);
				}
				$where .= ')';
			} else
				$where .= $this->filter2Condition($filter);
		}
		return $where;
	}
	public function getCount($data = null){
		$db = new Database();
		$db->connect();
		$where = "";

		// Setup filters for $where
		$filters = array();
		if(isset($data['filters']) && is_array($data['filters']))
			$filters = $data['filters'];
		$where = $this->genWhere($filters);

		$table = $this->table;
		$sql = "SELECT COUNT(*) AS count FROM $table $where";
		if($this->type == 'participants')
			if(isset($debug))
				file_put_contents('jsonLog.txt', $sql);
		$db->query($sql);
		$record =  $db->fetch_array();
		return $record['count'];
	}
}