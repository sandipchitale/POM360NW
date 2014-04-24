(function() {
    angular.module("POM360App", ['ui.router'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('POM360', {
                url: '/',
                templateUrl : 'templates/effective-pom.html'
            })
            .state('effective-pom', {
                url: '/effective-pom',
                templateUrl : 'templates/effective-pom.html'
            })
            .state('dependencies', {
                url: '/dependencies',
                templateUrl : 'templates/dependencies.html'
            });
    })
    .run(function($rootScope, $window, $location) {

    })
    .controller('POM360Controller', function($scope) {
        $scope.message = new Date();
    });
})();