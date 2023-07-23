app.factory('Util', ['$rootScope', '$location', function ($rootScope, $location) {

	const {Util, Select, Global} = nhm;
	const Pages = nhm.DAO('pages');
	const Tables = nhm.DAO('tables',{data});
	const Articles = nhm.DAO('articles',{data});

	Object.assign($rootScope, {nhm, sys, data, Pages, Tables, Articles, moment});
	Object.assign(sys, {$rootScope, Pages, Articles, Tables});

	Pages.watch('pages',()=>sys.safeApply());
	Articles.watch('articles',()=>sys.safeApply());

	sys.loadPages = async ()=>{
		const pages = await Pages.reload();
		const isUser = Global.user.type=='user';
		const isAdmin = Global.user.type=='admin';
		Util.setField(pages, 'hide', true);
		Util.setField(pages, 'viewport', 'home');
		sys.pages = [
			...((isUser||isAdmin)?Select.accountPages:[]),
			...(isAdmin?Select.adminPages:[]),
			...pages,
			...Select.defaultPages
		];
		data.menus = Util.cloneRecords(Select.menus);
		const defaultMenu = Util.findRecord(data.menus,'tag','default');
		sys.pages.forEach(page=>{
			const menu = Util.findRecord(data.menus,'tag',page.menu) || defaultMenu;
			if(!menu.pages) menu.pages = [];
			menu.pages.push(page);
		})
		Util.safeApply();
	};

	nhm.Global.navTo = (path)=>{
		const matches = path.toString().match(/^\/(home|account|admin)/);
		if(matches instanceof Array) [,viewport] = matches;
		if(viewport && data.viewport!=viewport) location = path;
		$location.path(path);
	}

	sys.goto = async (pageTag, section) => {
		await sys.loadPages();
		const nextPage = Util.findRecord(sys.pages, 'tag', pageTag);
		if(!nextPage || !(nextPage instanceof Object)) return sys.goto('welcome');
		if(nextPage.url instanceof String || typeof nextPage.url === 'string'){
			let viewport = nextPage.viewport;
			const matches = nextPage.url.toString().match(/^\/(home|account|admin)/);
			if(matches instanceof Array) [,viewport] = matches;
			if(viewport && data.viewport!=viewport)
				location = (nextPage.redirect || `/${viewport}/${pageTag}`+(section?`/${section}`:''));
			else{
				$location.path(`/${pageTag}`+(section?`/${section}`:''));
				sys.page = nextPage;
			}
		} else if(nextPage.redirect)
			window.open(nextPage.redirect);
		else if(nextPage.content){
			// if(watcher){
			// 	Pages.unwatch(watcher);
			// 	watcher = null;
			// }
			// console.log('Watching');
			// watcher = await Pages.watch('record',rec=>{
			// 	nhm.Data('pages').read({id:rec.id}).then(page=>{
			// 		Object.assign(nextPage, page);
			// 		Util.safeApply();
			// 	});
			// })
			sys.page = await Pages.load(nextPage.id);
		}
		if(nextPage && nextPage.id && sys.genTOC) await sys.genTOC();

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