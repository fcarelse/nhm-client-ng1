app.controller('Edit', ['$scope', '$location', function ($scope, $location) {

	const Util = nhm.Util;
	$scope.options = sys.ckeditorOptions;
	sys.editInline = true;

	$scope.init = async ()=>{
	}

	const Pages = sys.edit.Pages = nhm.DAO('pages', {data, singular: 'edit'});
	const Sections = nhm.Data('sections');

	$scope.dragOptions = {
		start: function(e) {
			console.log("STARTING"+JSON.stringify(Object.keys(e)));
		},
		drag: function(e) {
			console.log("DRAGGING"+JSON.stringify(Object.keys(e)));
		},
		stop: function(e) {
			console.log("STOPPING"+JSON.stringify(Object.keys(e)));
		},
		container: 'sections'
	}

	// nhm.Select.editors = [
	// 	{id:'ace', name: 'Ace Editor'},
	// 	{id:'markdown', name: 'Markdown Editor'},
	// 	{id:'ckeditor', name: 'CK Editor'},
	// 	{id:'textarea', name: 'Text Area'},
	// ];

	sys.initAceEditor = ()=>{
		sys.aceLoaded = function(_editor) {
			_editor.setOption("enableEmmet", true);
			data.edit._editor = _editor;
			// console.log('Ace Loaded');
		};

		sys.aceChanged = function(e) {
			Pages.changed('content');
		};

		data.edit.aceOptions = {
			useWrapMode : true,
			showGutter: true,
			theme:'twilight',
			mode: 'ace/mode/html',
			firstLineNumber: 1,
			onLoad: sys.aceLoaded,
			onChange: sys.aceChanged,
			enableEmmet: true,
		};

	data.edit.pages = Pages;
		console.log('Init Ace Editor');
	}

	sys.edit = sys.edit || {};
	Object.assign(sys.edit, {
		init: () => {
			return (async()=>{
				let [,page,tag] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
				data.edit = await Pages.read({tag});
				$location.path(`/editPage/${tag}`);
				data.edit.sections = await Sections.list({filters:[
					{field: 'page', value: data.edit.id}
				]});
				data.edit.sections.forEach(sectionInject);
				genTOC();
				data.edit.editor = data.edit.editor || 'ckeditor';
				sys.safeApply();
			})().catch(nhm.Log.genFailer('sys.edit.init'));
		},
		changed: field=>{
			if(field=='content') data.edit.content = Util.stripSlashes(data.edit.content)
			if(data.edit && data.edit.id)
				Pages.changed(field);
		},
		appendSection: ()=>{
			const name = prompt('Name for new section');
			if(!name) return;
			return (async()=>{
				const {record, error, message} = await Sections.create({
					page: data.edit.id,
					type: 'markdown',
					name
				});
				if(error) sys.Notify.show(message);
				else{
					const section = sectionInject(record);
					section.page = data.edit.id;
					section.changed('page');
					data.edit.sections.push(section);
					genTOC();
				}
			})().catch(nhm.Log.genFailer('sys.edit.appendSection'));
		}
	});

	function genTOC(){
		data.edit.toc = Util.treeBuilder(data.edit.sections,{parentKey: 'section'});
		data.edit.toc.forEach((it, index)=>setLevel(it,1,index+1, `${index+1}`));
		function setLevel(item, level, index, ref){
			item.children.forEach((it, index)=>setLevel(it, level+1, index+1, ref+`.${index+1}`));
			item.level = level;
			item.indent = (level * 20) - 10;
			item.index = index;
			item.ref = ref;
		}
		sys.safeApply();
	}

	function sectionInject(section){
		section.changed = async field => {
			if(field=='content')
				value = Util.stripSlashes(section.content)
			else
				value = section[field]
			const {error, message} = await Sections.change({field, id: section.id, value });
			if(field=='section') genTOC();
			if(error) alert(message)
		}

		section.remove = () => {
			Sections.change({field: 'status', id: section.id, value: 'DE'});
			Util.removeRecords(data.edit.sections,'id',section.id);
			genTOC();
		}

		section.parentName = () => 
			(Util.findRecord(data.edit.sections,'id',section.section) || {name:'Root'}).name
		return section;
	}


}]);

app.directive('mySection', function($document){
	return {
		link: function(scope, el, attrs){
			scope.data = data;
			scope.sys = sys;
			scope.nhm = nhm;
			scope.$watch('section.type',()=>{
				if(nhm.Select.getRecord('sectionTypes',scope.section.type) && scope.section.type != 'basic'){
					scope.editor = new tui.Editor({
						el: $(el).find('#edart')[0],
						previewStyle: 'vertical',
						height: '300px',
						initialEditType: 'markdown',
						initialValue:	scope.section.content
					});
					scope.editor.on('change',()=>{
						scope.section.content = scope.editor.getValue()
						scope.section.changed('content');
					})
				}
			})
		},
		scope: {
			section: '=ngModel',
		},
		templateUrl: function(elem, attr){
			if(!attr.type || !nhm.Select.getRecord('sectionTypes',attr.type))
				return '/admin/templates/section-basic.html';
			return '/admin/templates/section-'+attr.type+'.html';
		}
	}
});

/*
app.directive('post', ['$parse', function ($parse) {
	return {
		restrict: 'A',
		scope: {post:'=post',preview:'=preview'},
		link: function(scope){
			scope.ea = ea;
		},
		templateUrl: function(elem, attr){
			return 'js/templates/post-'+attr.type+'.html';
		},
	};
}]);
/**/