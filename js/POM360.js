(function() {
    var path = require('path');
    var fileSystem = require('fs');
    var pathExtra = require('path-extra');
    var gui = require('nw.gui');
    var openThis = require('open');
    var process = require('process');

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
            pomFile: path.join(process.cwd(), 'pom.xml'),
            settingsFile: path.join(pathExtra.homedir(), '.m2', 'settings.xml')
        }

        var mvn = $('#mvn');
        function validateMvnCommand() {
            var mvnCommand = mvn.val().trim();
            if (fileSystem.existsSync(mvnCommand)) {
                mvn.parent().removeClass('has-error');
            } else {
                mvn.parent().addClass('has-error');
            }
        }
        validateMvnCommand();
        mvn.on('input', validateMvnCommand);

        var pom = $('#pom');
        function validatePomFile() {
            var pomFile = pom.val().trim();

            if (pomFile === '') {
                pom.parent().removeClass('has-error');
                return;
            }

            if (fileSystem.existsSync(pomFile)) {
                pom.parent().removeClass('has-error');
            } else {
                pom.parent().addClass('has-error');
            }
        }
        validatePomFile();
        pom.on('input', validatePomFile);

        var settings = $('#settings');
        function validateSettingsFile() {
            var settingsFile = settings.val().trim();

            if (settingsFile === '') {
                settings.parent().removeClass('has-error');
                return;
            }
            if (fileSystem.existsSync(settingsFile)) {
                settings.parent().removeClass('has-error');
            } else {
                settings.parent().addClass('has-error');
            }
        }
        validateSettingsFile();
        settings.on('input', validateSettingsFile);

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
            var pomFile = $('#pom').val();
            var effectivePomCommand = $('#effective-pom-command');
            if (effectivePomCommand) {
                effectivePomCommand.val($('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-pom')
            }
            var effectivePom = $('#effective-pom');
            if (effectivePom) {
                effectivePom.val(effectivePom.val() + '\n' + $('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-pom')
            }
            return false;
        }

        $scope.runDependencies = function() {
            var pomFile = $('#pom').val();
            var dependenciesCommand = $('#dependencies-command');
            if (dependenciesCommand) {
                dependenciesCommand.val($('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' dependency:tree')
            }
            var dependencies = $('#dependencies');
            if (dependencies) {
                dependencies.val(dependencies.val() + '\n' + $('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' dependency:tree')
            }
            return false;
        }

        $scope.runMvn = function() {
            $scope.runEffectivePom();
            $scope.runDependencies();
            return false;
        }
    });
})();