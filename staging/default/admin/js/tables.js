app.controller('Tables', ['$scope', '$location', function ($scope, $location) {

  const Tables = sys.Tables;

	Tables.init = ()=>{
    $scope.$watch('data.table.model', evalModel);
    Tables.watch('table',evalModel);
	}

  function evalModel(){
    // 
  }

  return;

}]);

