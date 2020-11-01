app.factory('Util', ['$rootScope', '$location', function ($rootScope, $location) {

	const {Util, Select, Global} = nhm;
	const Pages = nhm.DAO('pages');
	const Articles = nhm.DAO('articles');

	Object.assign($rootScope, {nhm, sys, data, Pages, Articles});
	Object.assign(sys, {$rootScope, Pages, Articles});

	Pages.watch('records',()=>sys.safeApply());
	Articles.watch('records',()=>sys.safeApply());

	sys.loadPages = async ()=>{
		const pages = await Pages.reload();
		const isUser = Global.user.type=='user';
		const isAdmin = Global.user.type=='admin';
		Util.setField(pages, 'hide', true);
		Util.setField(pages, 'viewport', 'home');
		data.pages = [
			...((isUser||isAdmin)?Select.accountPages:[]),
			...(isAdmin?Select.adminPages:[]),
			...pages,
			...Select.defaultPages
		];
		data.menus = Util.cloneRecords(Select.menus);
		const defaultMenu = Util.findRecord(data.menus,'tag','default');
		data.pages.forEach(page=>{
			const menu = Util.findRecord(data.menus,'tag',page.menu) || defaultMenu;
			if(!menu.pages) menu.pages = [];
			menu.pages.push(page);
		})
		Util.safeApply();
	};

	sys.goto = async (page, section) => {
		await sys.loadPages();
		data.page = Util.findRecord(data.pages, 'tag', page);
		if(!data.page || !(data.page instanceof Object)) return sys.goto('welcome');
		if(data.page.url instanceof String || typeof data.page.url === 'string'){
			let viewport = data.page.viewport;
			const matches = data.page.url.toString().match(/^\/(home|account|admin)/);
			if(matches instanceof Array) [,viewport] = matches;
			if(viewport && data.viewport!=viewport)
				location = (data.page.redirect || `/${viewport}/${page}`+(section?`/${section}`:''));
			else{
				$location.path(`/${page}`+(section?`/${section}`:''));
			}
		} else if(data.page.redirect)
			window.open(data.page.redirect);
		else if(data.page.content){
			// if(watcher){
			// 	Pages.unwatch(watcher);
			// 	watcher = null;
			// }
			// console.log('Watching');
			// watcher = await Pages.watch('record',rec=>{
			// 	nhm.Data('pages').read({id:rec.id}).then(page=>{
			// 		Object.assign(data.page, page);
			// 		Util.safeApply();
			// 	});
			// })
			await Pages.load(data.page.id);
		}
		if(data.page && data.page.id && sys.genTOC) await sys.genTOC();

		Util.safeApply();
	}

	let applyQueued;
	$rootScope.safeApply = Util.safeApply = sys.safeApply = function(cb){
		if(!$rootScope.$$phase){
			$rootScope.$apply(cb);
			applyQueued = false;
		}
		else {
			if(!applyQueued) setTimeout(Util.safeApply, 1000);
			applyQueued = true;
		}
	};

	sys.title = title => {
		document.title = title;
	}
	sys.title(nhm.Global.appTitle);

	Util.treeBuilder = (
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

	Select.getName = function(select, id, anyType){
		if(!Select[select]) return '';
		if(id === undefined) return '';
		var item = Util.findRecord(Select[select], 'id', id, !anyType);
		return item? item.name: Select[select][0].name;
	};

	Select.getTag = function(select, id, anyType){
		if(!Select[select]) return '';
		if(id === undefined) return '';
		var item = Util.findRecord(Select[select], 'id', id, !anyType);
		return item? item.tag: Select[select][0].tag;
	};

	Select.getRecord = function(select, id, anyType, deft){
		if(!Select[select]) return {};
		if(id === undefined) return {};
		var item = Util.findRecord(Select[select], 'id', id, !anyType);
		var deft = deft!==undefined?deft:Select[select][0].id?{}:Select[select][0];
		return item? item: deft;
	};

	sys.reg = async registration => {
		await nhm.User.register(registration);
		location = '/';
	}

	sys.login = async credentials => {
		await nhm.User.login(credentials);
		location = '/';
	}

	sys.logout = async () => {
		await nhm.User.logout();
		location = '/';
	}

	return Util
}]);