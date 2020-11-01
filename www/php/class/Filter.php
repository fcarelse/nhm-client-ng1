<?php

class Filter{
	public static function gen($field, $op = 'EQ', $value = '%', $group = null, $id = null){
		return array('field'=>$field, 'op'=>$op, 'value'=>$value, 'group'=>$group, 'id'=>$id);
	}
}
?>