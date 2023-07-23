(function(){
// Start of enclosed scope

var Utils = window.FXCUtils = {};
var Deferred = Utils.Deferred = function(){
	var fails = [];
	var dones = [];
	var thens = [];
	var nexts = [];
	var context = this;
	var resolution, rejection;
	var promise = {
		isResolved: function(){ return (resolution !== undefined); },
		isRejected: function(){ return (rejection !== undefined); },
		isDone: function(){ return (resolution !== undefined || rejection !== undefined); },
		resolve: function(result){
			if(resolution !== undefined || rejection !== undefined) return;
			resolution = result==undefined?null:result;
			var i;
			for(i=0;i<thens.length;i++) thens[i](rejection, resolution);
			for(i=0;i<dones.length;i++) dones[i](resolution);
			for(i=0;i<nexts.length;i++) nexts[i]();
			return promise;
		},
		reject: function(result){
			if(resolution !== undefined || rejection !== undefined) return;
			rejection = result==undefined?null:result;
			var i;
			for(i=0;i<thens.length;i++) thens[i](rejection, resolution);
			for(i=0;i<fails.length;i++) fails[i](rejection);
			for(i=0;i<nexts.length;i++) nexts[i]();
			return promise;
		},
		fail: function(cb){
			if(rejection !== undefined || resolution !== undefined){
				if(rejection !== undefined) cb(rejection);
			}else if(rejection !== undefined)
				for(var i=0;i<fails.length;i++) fails[i](rejection);
			return promise;
		},
		then: function(cb){
			if(rejection !== undefined || resolution !== undefined){
				if(rejection !== undefined) cb(rejection);
				else cb(resolution);
			}else thens.push(cb);
			return promise;
		},
		done: function(cb){
			if(rejection !== undefined || resolution !== undefined){
				if(resolution !== undefined) cb(resolution);
			}else dones.push(cb);
			return promise;
		},
		next: function(cb){
			if(rejection !== undefined || resolution !== undefined){
				if(rejection !== undefined) cb(rejection);
				else cb(resolution);
			}else nexts.push(cb);
			return promise;
		},
	};
	promise.promise = promise;
	return promise;
};

Utils.Watch = function(types){
	const Watch = {

		// Add tag type
		addType(type){
			return Watch.watchers[type] = Watch.watchers[type] || [];
		},

		// Verify tag type
		isType(type){
			return Watch.watchers[type] instanceof Array;
		},

		// Collections of watches by tag
		watchers: {},

		/**
		 * Set up a watcher for a specific tag
		 * @param {string} tag 
		 * @param {function} watcher
		 * @returns {string} cuid ID of watch record for use with unwatch
		 * @throws {Error}
		 */
		watch(tag, watcher){
			if(!(tag instanceof String) || tag == null)
				throw TypeError('tag string required')
			if(Object.keys(Watch.watchers).indexOf(tag)==-1)
				throw Error('Invalid tag');
			if(!(watcher instanceof Object) || watcher == null)
				throw TypeError('Watcher needs to be a function')
			const watch = {id: cuid(), run: watcher};
			Watch.watchers[tag].push(watch);
			return watch.id;
		},

		/**
		 * Removes watch record
		 * @param {string} id cuid of watch record to unwatch
		 */
		unwatch(id){
			if(!id) return;
			Object.keys(Watch.watchers).forEach(tag=>
				Utils.removeRecords(Watch.watchers[tag], 'id', id)
			);
		},

		/**
		 * Alerts watchers of a tag with a value or values
		 * @param {string} tag
		 * @param {any} value
		 */
		emit(tag){
			if(!(tag instanceof String) || tag == null)
				throw TypeError('tag string required')
			if(Object.keys(Watch.watchers).indexOf(tag)==-1)
				throw Error('Invalid tag');
			const args = Array.prototype.split.call(arguments);
			args.shift();
			if(args.length == 0) args.push(true);
			Watch.watchers[tag].forEach(f=>f.run.apply(null, args))
		}
	}
	if(types instanceof Array)
		types.forEach(type=>Watch.addType(type));
	return Watch;
}


Utils.extend = function(target){
	var i,j,k,o;
	for(i=1;i<arguments.length;i++){
		o=arguments[i];
		if(o !== undefined && o !== null){
			k=Object.keys(o);
			for(j=0;j<k.length;j++) target[k[j]] = o[k[j]];
		}
	}
	return target;
};

Utils.merge = function(arr){
	if(!(arr instanceof Array)) return arr;
	for(var i=1;i<arguments.length;i++){
		if(arguments[i] instanceof Array)
			for(var j=0;j<arguments[i].length;j++)
				arr.push(arguments[i][j]);
		else
			arr.push(arguments[i]);
	}
	return arr;
};

Utils.bind = function bind(func, target){
	return function(){
		func.apply(target, arguments);
	};
};

Utils.nextTick = callback => setTimeout(callback,0);

Utils.sequence = function(){
	var args = Array.prototype.slice.call(arguments);
	var def = Deferred();
	var index = -1;
	var defs = [];
	next();
	function next(){
		index++;
		if(index>=args.length) return defs;
		defs[index] = args[index];
		process.nextTick(function(){ args[index]().next(next); });
	};
};

// ES2017 required
Utils.cloneValuesDeep = function(obj){
	const values = new Set();
	return _cloneValuesDeep(obj);

	function _cloneValuesDeep(obj){
		return Object.entries(obj).reduce(([key, value],all)=>{
			if(value && value instanceof Object){
				if(values.has(value))
					throw new Error('Cyclic object cloning')
				values.add(value);
				value = _cloneValuesDeep(value);
			}
			all[key]=value;
			return all;
		},{})
	}
};

Utils.randomString = function (len, charSet) {
	charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	len = len || 8;
	var randomString = '';
	for (var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz,randomPoz+1);
	}
	return randomString;
};

Utils.decodeHtmlEntity = function(str) {
	return str.replace(/&#(\d+);/g, function(match, dec) {
		return String.fromCharCode(dec);
	});
};

Utils.encodeHtmlEntity = function(str) {
	var buf = [];
	for (var i=str.length-1;i>=0;i--) {
		buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
	}
	return buf.join('');
};

Utils.genFilter = function(f,o,v,g,i){return {field:f,op:o,value:v,group:g||null,id:i||null};};

// Generate an ordering function depending on ordering required for a field and take a second set of field and ordering for second comparison.
Utils.compareFn = function(field, order, field2, order2){
	order = order == 'DESC'? 'DESC': 'ASC';
	return {
		DESC: function(a,b){
			var c=(isString(a[field])?a[field].trim():a[field])+'';
			var d=(isString(b[field])?b[field].trim():b[field])+'';
			if(isNaN(c) && isNaN(d))
				return c > d? -1: c < d? 1: 
					field2? Utils.compareFn(field2, order2)(a,b): 0;
			else
				return d - c? d - c:
					field2? Utils.compareFn(field2, order2)(a,b): 0;

		},
		ASC: function(a,b){ 
			var c=(isString(a[field])?a[field].trim():a[field])+'';
			var d=(isString(b[field])?b[field].trim():b[field])+'';
			if(isNaN(c) && isNaN(d))
				return c < d? -1: c > d? 1: 
					field2? Utils.compareFn(field2, order2)(a,b): 0;
			else
				return c - d? c - d: 
					field2? Utils.compareFn(field2, order2)(a,b): 0;
		},
	}[order];
};

// Sort record by 2 sets of field and order.
Utils.sortRecords = function(arr, field, order, field2, order2, trim){
	if(!(arr instanceof Array)) return false;
	if(!field) return false;
	if(order != 'DESC') order = 'ASC';
	arr.sort(Utils.compareFn(field, order, field2, order2, trim));
	return arr;
};

Utils.findRecord = Utils.findBone = function(arr, key, value){
	if(!(arr instanceof Array)) return false;
	if(value === null) return false;
	if(value === undefined) return false;
	for(var i = 0; i < arr.length; i++)
		if(arr[i][key] && arr[i][key].toString() === value.toString()) return arr[i];
	return false;
};

Utils.findRecords = function(arr, key, values, anyType){
	var records = [];
	if(!(arr instanceof Array)) return records;
	//if(!isString(key)) return records;
	if(!(values instanceof Array)) values = [values];
	for(var i = 0; i < arr.length; i++)
		if(anyType && values.indexOf(''+arr[i][key]) != -1) records.push(arr[i]);
		else if(anyType && values.indexOf(0+arr[i][key]) != -1) records.push(arr[i]);
		else if(values.indexOf(arr[i][key]) != -1) records.push(arr[i]);
	return records;
};

Utils.matchRecords = function(arr, key, values){
	var records = [];
	if(!(arr instanceof Array)) return records;
	//if(!isString(key)) return records;
	if(isString(values) || !(values instanceof Array)) values = [values];
	values = [].concat(values);
	for(var i = 0; i < values.length; i++)
		records[i] = Utils.findRecord(arr, key, values[i]);
	//if(values.indexOf(arr[i][key]) != -1) records.push(arr[i]);
	return records;
};

Utils.findRecordsWithFieldSet = function(arr, field){
	var records = [];
	if(!(arr instanceof Array)) return records;
	//if(!isString(key)) return records;
	if(field !== undefined && field !== null)
		for(var i = 0; i < arr.length; i++)
			if(arr[i][field] !== undefined && arr[i][field] !== null) records.push(arr[i]);
	return records;
};

Utils.cloneRecords = function(arr){
	if(!(arr instanceof Array)) return [];
	var clone = [];
	for(var i = 0; i < arr.length; i++)
		clone.push( $.extend({}, arr[i]) );
	return clone;
};

Utils.clearField = function(arr, field){
	if(!field) return arr;
	if(!(arr instanceof Array)) return [];
	for(var i = 0; i < arr.length; i++)
		if(arr[i][field] !== undefined) delete arr[i][field];
	return arr;
};

Utils.setField = function(arr, field, value, all){
	if(!field) return arr;
	if(!(arr instanceof Array)) return [];
	for(var i = 0; i < arr.length; i++)
		if(arr[i][field] !== undefined || all) arr[i][field] = value;
	return arr;
};

Utils.listValues = function(arr, key){
	var list = [];
	if(arr === undefined && !(ea.global.user && ea.global.user.id == 2550)){
		console.error('Array Undefined');
		return [];
	}
	for(var i = 0; i < arr.length; i++)
		list.push(arr[i][key]);
	return list;
};

Utils.findValues = function(arr, key){
	var list = [];
	for(var i = 0; i < arr.length; i++)
		if(arr[i][key] !== undefined && arr[i][key] !== null)
			list.push(arr[i][key]);
	return list;
};

Utils.uniqueValues = function(arr, key){
	var list = [];
	if(arr === undefined && !(ea.global.user && ea.global.user.id == 2550)){
		console.error('Array Undefined');
		return [];
	}
	for(var i = 0; i < arr.length; i++)
		if(list.indexOf(arr[i][key])==-1 && arr[i][key] !== undefined && arr[i][key] !== null)
			list.push(arr[i][key]);
	return list;
};

Utils.removeRecords = function(arr, key, values, anyType){
	if(!(arr instanceof Array)) return 0;
	var found = 0;
	if(!(values instanceof Array)) values = [values];
	for(var i = 0; i < arr.length; i++)
		if((anyType && values.indexOf(''+arr[i][key]) != -1) ||
			(anyType && values.indexOf(0+arr[i][key]) != -1) ||
			(values.indexOf(arr[i][key]) != -1)){
			for(var j = i--; j < arr.length; j++)
				arr[j] = arr[j + 1];
			arr.length--;
			found++;
		}
	return found;
};

Utils.copyFields= function(target, source, fields, id){
	var i;
	if(!id) id = 'id';
	if(!(source instanceof Array)) return target;
	if(!(fields instanceof Array)) fields = Object.keys(source);
	if(target instanceof Array && source instanceof Array){
		for(i = 0; i < source.length; i++){
			var sRecord = Utils.findBone(source, id, source[i].id);
			var tRecord = Utils.findBone(target, id, source[i].id);
			if(!tRecord) target.push(tRecord = {id: source[i].id});
			for(var j = 0; j < fields.length; j++)
				tRecord[fields[j]] = sRecord[fields[j]];
		}
	}
	else
		for(i = 0; i < fields.length; i++)
			target[fields[i]] = source[fields[i]];
	return target;
};

Utils.copyFieldsCheckedOnly= function(target, source, fields, id){
	var i;
	if(!id) id = 'id';
	if(!(source instanceof Array)) return target;
	if(!(fields instanceof Array)) fields = Object.keys(source);
	if(target instanceof Array && source instanceof Array){
		for(i = 0; i < source.length; i++){
			var sRecord = Utils.findBone(source, id, source[i].id);
			var tRecord = Utils.findBone(target, id, source[i].id);
			if(!tRecord && sRecord.check) target.push(tRecord = {id: source[i].id});
			for(var j = 0; j < fields.length; j++)
				tRecord[fields[j]] = sRecord[fields[j]];
		}
	}
	else
		for(i = 0; i < fields.length; i++)
			target[fields[i]] = source[fields[i]];
	return target;
};

Utils.removeDuplicates = function(arr){
	if(!(arr instanceof Array)) return arr;
	var second;
	for(var i=0;i<arr.length;i++)
		while((second = arr.indexOf(arr[i],arr.indexOf(arr[i]) + 1)) > 0)
			arr.splice(second,1);
};

Utils.genRecordSet = function(arr, field){
	var recs = [];
	for(var i=0;i<arr.length;i++){
		var rec = {id: 1+i};
		rec[field || 'name'] = arr[i];
		recs.push(rec);
	}
	return recs;
};

Utils.fixContext = function(func, context) {
	return function() {
		return func.apply(context, arguments);
	};
};

Utils.fixContexts = function(object) {
	for (var func in object)
		if (typeof (object[func]) === 'function')
			object[func] = Utils.fixContext(object[func], object);
	return object;
};

Utils.shuffle = function(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	// While there remain elements to shuffle...
	while (1 < currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

Utils.lookup = function(obj, field) {
	if (!obj) { return null; }
	var chain = field.split(']').join('').split('[');
	for (var i = 0, len = chain.length; i < len; i++) {
		var prop = obj[chain[i]];
		if (typeof(prop) === 'undefined') { return null; }
		if (typeof(prop) !== 'object') { return prop; }
		obj = prop;
	}
	return null;
};

Utils.numberWithCommas = function(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

Utils.model2columns = function(model){
	if(!model) return [];
	var keys = Object.keys(model);
	var columns = [];
	if(!(keys instanceof Array) || !keys || !model[keys[0]] || !model[keys[0]].field) return [];
	for(var i=0;i<keys.length;i++)
		columns.push($.extend( {id: keys[i]} , model[ keys[i] ] ));
	return columns;
};

Utils.onlyFields = function(arr, fields){
	if(!(arr instanceof Array)) return [];
	if(!(fields instanceof Array)) return [];
	var records = [];
	var rec;
	for(var i=0;i<arr.length;i++){
		rec = {};
		for(var j=0;j<fields.length;j++){
			rec[fields[j]]=arr[i][fields[j]];
		}
		records.push(rec);
	}
	return records;
};

// Utils.Captcha = require('./captcha');



Utils.jsonToArray = function(jsonArray){
	var s = [];
	try {
		s = JSON.parse(jsonArray);
	} catch(e) {
		s = [];
	}
	return s;
};

Utils.arrayToJson = function(array, clearHashKey){
	var s = '[]';
	if(!(array instanceof Array)) return s;
	if(clearHashKey)
		Utils.clearField(array, '$$hashKey');
	try {
		s = JSON.stringify(array);
	} catch(e) {
		s = '[]';
	}
	return s;
};

Utils.jsonToObject = function(jsonObject){
	var s = {};
	try {
		s = JSON.parse(jsonObject);
	} catch(e) {
		s = {};
	}
	return s;
};

Utils.objectToJson = function(object, pretty){
	var s = '{}';
	if(!(object instanceof Object)) return s;
	try {
		s = JSON.stringify(object, pretty?null:undefined, pretty?2:undefined);
	} catch(e) {
		s = '{}';
	}
	return s;
};

Utils.jsonToAny = function(jsonObject){
	var s = null;
	try {
		s = JSON.parse(jsonObject);
	} catch(e) {
		s = null;
	}
	return s;
};

Utils.anyToJson = function(object){
	var s = 'null';
	try {
		s = JSON.stringify(object);
	} catch(e) {
		s = 'null';
	}
	return s;
};

Utils.isString = isString;
function isString(s){
	return s instanceof String || typeof(s) === 'string';
};

Utils.isEmail = function(s){
	return Utils.isString(s) && s.match(
		new RegExp('(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])')
	);
};

Utils.hex2str = hex=>{
	var str = '';
	for (var i = 0; i < hex.length; i += 2) {
		var v = parseInt(hex.substr(i, 2), 16);
		str += Utils.chra(v % 256);// += chr(v % 256);
	}
	return str;
};

Utils.chra = ch=>(
	'\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F'+
	'\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F'+
	'\x20\x21\x22\x23\x24\x25\x26\x27\x28\x29\x2A\x2B\x2C\x2D\x2E\x2F'+
	'\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\x3A\x3B\x3C\x3D\x3E\x3F'+
	'\x40\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4A\x4B\x4C\x4D\x4E\x4F'+
	'\x50\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5A\x5B\x5C\x5D\x5E\x5F'+
	'\x60\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6A\x6B\x6C\x6D\x6E\x6F'+
	'\x70\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7A\x7B\x7C\x7D\x7E\x7F'+
	'\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F'+
	'\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F'+
	'\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF'+
	'\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF'+
	'\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF'+
	'\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF'+
	'\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF'+
	'\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF'
)[ch];

Utils.stripSlashes = function(str) {
	return (str + '').replace(/\\(.?)/g, function (s, n1) {
		switch (n1) {
		case '\\':
			return '\\';
		case '0':
			return '\u0000';
		case '':
			return '';
		default:
			return n1;
		}
	});
};

Utils.treeBuilder = (
	data = [],
	{ idKey = "id", parentKey = "parent", childrenKey = "children" } = {}
) => {
	const tree = [];
	const childrenOf = {};
	data.forEach(item => {
		const { [idKey]: id, [parentKey]: parentId = 0 } = item;
		item[childrenKey] = childrenOf[id] = childrenOf[id] || [];
		( parentId?
			(childrenOf[parentId] = childrenOf[parentId] || []):
			tree
		).push(item);
	});
	return tree;
};

Utils.ready = function(cb) {
	if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
		cb();
	} else {
		document.addEventListener('DOMContentLoaded', cb);
	}
};

// End of enclosed scope
})();
