(function() {
    var pathExtra = require('path-extra');
    var gui = require('nw.gui');
    var openThis = require('open');

    angular.module("POM360App", ['ui.router']).config(function($stateProvider, $urlRouterProvider) {
        $stateProvider.state('POM360', {
            url : '/',
            templateUrl : 'templates/effective-pom.html'
        }).state('effective-pom', {
            url : '/effective-pom',
            templateUrl : 'templates/effective-pom.html'
        }).state('dependencies', {
            url : '/dependencies',
            templateUrl : 'templates/dependencies.html'
        });
    }).run(function($rootScope, $window, $location) {
        $rootScope.openThis = function(fileOrUrl) {
            openThis(fileOrUrl);
            return false;
        }
        $rootScope.openThisRelativeToHomeDir = function(relativePathToFile) {
            return $rootScope.openThis(pathExtra.homedir() + '/' + relativePathToFile);
        }
    }).controller('POM360Controller', function($scope) {
        $scope.config = {
            mvnCommand: 'mvn',
            mvnOptions: '',
            pomFile: 'pom.xml',
            settingsFile: '~/.m2/settings.xml'
        }

        $scope.debug = function() {
            gui.Window.get().showDevTools();
        }

        $scope.exit = function() {
            gui.Window.get().close();
            return false;
        }

        // Select mvn command
        var mvnCommandSelector = $('#mvnCommandSelector');
        mvnCommandSelector.change(function(evt) {
            $scope.config.mvnCommand = mvnCommandSelector.val();
            $scope.$apply();
        });
        $scope.selectMvnCommand = function() {
            mvnCommandSelector.trigger('click');
        }

        // Select POM file
        var pomFileSelector = $('#pomFileSelector');
        pomFileSelector.change(function(evt) {
            $scope.config.pomFile = pomFileSelector.val();
            $scope.$apply();
        });
        $scope.selectPomFile = function() {
            pomFileSelector.trigger('click');
        }

        var settingsFileSelector = $('#settingsFileSelector');
        settingsFileSelector.change(function(evt) {
            $scope.config.settingsFile = settingsFileSelector.val();
            $scope.$apply();
        });

        $scope.selectSettingsFile = function() {
            settingsFileSelector.trigger('click');
        }

        $scope.runEffectivePom = function() {
            var effectivePomCommand = $('#effective-pom-command');
            if (effectivePomCommand) {
                effectivePomCommand.val($('#mvn').val() + ' help:effective-pom')
            }
            var effectivePom = $('#effective-pom');
            if (effectivePom) {
                effectivePom.val(effectivePom.val() + '\n' + $('#mvn').val() + ' help:effective-pom')
            }
            return false;
        }

        $scope.runMvn = function() {
            $scope.runEffectivePom();
            return false;
        }
    });
})();