app.controller('Main', ['$scope', '$location', '$sce', 'Util', 'Notify', function ($scope, $location, $sce, Util, Notify) {

	data.viewport = 'home';
	
	const Sections = nhm.Data('sections');
	const Articles = nhm.Data('articles');

	Object.assign($scope, {$sce});

	sys.navbar = {
		init: async ()=>{
			let [,page,tag] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
			switch(page){
				case 'article':{
					data.article = await Articles.read({tag});
					sys.editor = new showdown.Converter(),
					data.article.html = sys.editor.makeHtml(data.article.content);
					await sys.goto(page, tag);
				} break;
				case 'tasks':{
					await sys.gotoTask(tag);
				} break;
				default:{
					await sys.goto(page,tag);
					data.page.sections = await Sections.list({filters:[
						{field: 'page', value: data.page.id}
					]});
					sys.genTOC();
				}
			}
		},
	};

	// nhm.Comms.watch({type:'pages'},async event=>{
	// 	switch(event.method){
	// 		case 'change': case 'update': {
	// 			const page = Util.findRecord(data.pages,'id',event.id);
	// 			if(!page || !page.id) return;
	// 			const rec = await nhm.Data('pages').read({id: page.id});
	// 			if(rec) Object.assign(page, rec);
	// 			sys.safeApply();
	// 		} break;
	// 	}
	// })

	sys.genTOC = ()=>{
		data.page.toc = Util.treeBuilder(data.page.sections,{parentKey: 'section'});
		data.page.toc.forEach((it, index)=>setLevel(it,1,index+1, `${index+1}`));
		function setLevel(item, level, index, ref){
			item.children.forEach((it, index)=>setLevel(it, level+1, index+1, ref+`.${index+1}`));
			item.level = level;
			item.indent = (level * 20) - 10;
			item.index = index;
			item.ref = ref;
		}
		sys.safeApply();
	}

}]);


app.directive('mySection', ['$sce', function($sce){
	return {
		link: function(scope, el, attrs){
			scope.data = data;
			scope.$sce = $sce;
		},
		scope: {
			section: '=ngModel'
		},
		templateUrl: '/home/views/sectionView.html'
	}
}]);