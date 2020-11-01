app.controller('Main', ['$scope', '$location', '$sce', 'Util', function ($scope, $location, $sce, Util) {

	data.viewport = 'account';

	sys.navbar = {
		init: async ()=>{
			let [,page,edit] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
			if(page != 'editor')
				sys.goto(page);
			else {
				sys.edit.init(edit);
			}
			Util.safeApply();
		},
	};

	// sys.edit = page => {
	// 	data.page = Util.findRecord(data.pages, 'tag', page);
	// 	if(!data.page) return sys.goto('welcome');
	// 	$location.path(`/edit/${page}`);
	// 	Util.safeApply();
	// }

}]);