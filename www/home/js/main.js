app.controller('Main', ['$scope', '$location', '$sce', 'Util', 'Notify', function ($scope, $location, $sce, Util, Notify) {

	// nhm.debugMode = true;

	data.viewport = 'home';
	
	const Sections = nhm.Data('sections');
	const Articles = nhm.Data('articles');
	sys.Pages = nhm.DAO('pages', {data});

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
					sys.page.sections = await Sections.list({filters:[
						{field: 'page', value: sys.page.id},
						{field: 'status', op: 'NE', value: 'DE'},
					]});
					sys.genTOC();
				}
			}
		},
	};

	nhm.Comms.watch({type:'pages'},async event=>{
		switch(event.method){
			case 'change': {
				if(sys.page.id == event.id){
					// sys.page.content == event.value;
					updateContent();
				}
				sys.safeApply();
			} break;
		}
	})
	
	let reupdate = 0;
	async function updateContent(){
		if(reupdate) return reupdate = 2;
		reupdate = 1
		nhm.Data('pages').read({id: sys.page.id})
		.then(res=>{
			sys.page.content = res.content;
			sys.safeApply();
			console.log(res);
		})
		.finally(()=>reupdate = 0);
		if(reupdate == 2){
			reupdate = 0;
			setTimeout(()=>updateContent(),5000);
		}
	}

	sys.genTOC = ()=>{
		sys.page.toc = Util.treeBuilder(sys.page.sections,{parentKey: 'section'});
		sys.page.toc.forEach((it, index)=>setLevel(it,1,index+1, `${index+1}`));
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