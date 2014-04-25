(function() {
    var path = require('path');
    var fileSystem = require('fs');
    var childProcess = require('child_process');
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
        }).state('effective-settings', {
            url : '/effective-settings',
            templateUrl : 'templates/effective-settings.html'
        });
    }).run(function($rootScope, $window, $location) {
        $rootScope.openThis = function(fileOrUrl) {
            openThis(fileOrUrl);
            return false;
        }
        $rootScope.openThisRelativeToHomeDir = function(relativePathToFile) {
            return $rootScope.openThis(pathExtra.homedir() + '/' + relativePathToFile);
        }
    }).controller('POM360Controller', function($scope, $location) {

        $scope.atEffectivePomTab = function() {
            return ($location.path() === '/' || $location.path() === '/effective-pom');
        }

        $scope.atDependenciesTab = function() {
            return ($location.path() === '/dependencies');
        }

        $scope.config = {
            mvnCommand: 'mvn',
            mvnOptions: '',
            pomFile: '',
            defaultPomFile: path.join(process.cwd(), 'pom.xml'),
            settingsFile: '',
            defaultSettingsFile: path.join(pathExtra.homedir(), '.m2', 'settings.xml')
        }

        var mvn = $('#mvn');
        var pom = $('#pom');
        var settings = $('#settings');

        function cantRun() {
            return mvn.parent().hasClass('has-error') || pom.parent().hasClass('has-error') || settings.parent().hasClass('has-error');
        }

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

        function validatePomFile() {
            var pomFile = pom.val().trim();

            if (fileSystem.existsSync(pomFile)) {
                pom.parent().removeClass('has-error');
            } else {
                pom.parent().addClass('has-error');
            }
        }
        validatePomFile();
        pom.on('input', validatePomFile);

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
            setTimeout(validateMvnCommand, 0);
        });
        $scope.selectMvnCommand = function() {
            mvnCommandSelector.trigger('click');
        }

        // Select POM file
        var pomFileSelector = $('#pomFileSelector');
        pomFileSelector.change(function(evt) {
            $scope.config.pomFile = pomFileSelector.val();
            $scope.$apply();
            setTimeout(validatePomFile, 0);
        });
        $scope.selectPomFile = function() {
            pomFileSelector.trigger('click');
        }

        var settingsFileSelector = $('#settingsFileSelector');
        settingsFileSelector.change(function(evt) {
            $scope.config.settingsFile = settingsFileSelector.val();
            $scope.$apply();
            setTimeout(validateSettingsFile, 0);
        });

        $scope.selectSettingsFile = function() {
            settingsFileSelector.trigger('click');
        }

        function runMvnCommand(mvnCommand, pomFile, command, textArea) {
            textArea.val('');
            var pomDir = path.dirname(pomFile);
            var mvnProcess = childProcess.spawn(mvnCommand,
                ['-B', '-f', pomFile, command],
                {
                    cwd: pomDir,
                    env: process.env
                });

            mvnProcess.stdout.on('data', function (data) {
                textArea.val(textArea.val() + data);
            });

            mvnProcess.stderr.on('data', function (data) {
                textArea.val(textArea.val() + data);
            });

            mvnProcess.on('close', function (code) {
            });
        }

        $scope.runEffectivePom = function() {
            if (cantRun()) {
                return;
            }
            var mvnCommand = mvn.val();
            fileSystem.stat(mvnCommand, function(err, stat) {
                if (err) {
                    return;
                }
                if (stat.isFile()) {
                    var pomFile = pom.val();
                    fileSystem.stat(pomFile, function(err, stat) {
                        if (err) {
                            return;
                        }
                        if (stat.isFile()) {
                            var effectivePomCommand = $('#effective-pom-command');
                            if (effectivePomCommand) {
                                effectivePomCommand.val($('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-pom')
                            }
                            var effectivePom = $('#effective-pom');
                            if (effectivePom) {
                                runMvnCommand(mvnCommand, pomFile, 'help:effective-pom', effectivePom);
                            }
                        }
                    });
                }
            });
        }

        $scope.runDependencies = function() {
            if (cantRun()) {
                return;
            }
            var mvnCommand = mvn.val();
            fileSystem.stat(mvnCommand, function(err, stat) {
                if (err) {
                    return;
                }
                if (stat.isFile()) {
                    var pomFile = pom.val();
                    fileSystem.stat(pomFile, function(err, stat) {
                        if (err) {
                            return;
                        }
                        if (stat.isFile()) {
                            var dependenciesCommand = $('#dependencies-command');
                            if (dependenciesCommand) {
                                dependenciesCommand.val($('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' dependency:tree')
                            }
                            var dependencies = $('#dependencies');
                            if (dependencies) {
                                runMvnCommand(mvnCommand, pomFile, 'dependency:tree', dependencies);
                            }
                        }
                    });
                }
            });
        }

        $scope.runEffectiveSettings = function() {
            if (cantRun()) {
                return;
            }
            var mvnCommand = mvn.val();
            fileSystem.stat(mvnCommand, function(err, stat) {
                if (err) {
                    return;
                }
                if (stat.isFile()) {
                    var pomFile = pom.val();
                    fileSystem.stat(pomFile, function(err, stat) {
                        if (err) {
                            return;
                        }
                        if (stat.isFile()) {
                            var effectiveSettingsCommand = $('#effective-settings-command');
                            if (effectiveSettingsCommand) {
                                effectiveSettingsCommand.val($('#mvn').val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-settings')
                            }
                            var effectiveSettings = $('#effective-settings');
                            if (effectiveSettings) {
                                runMvnCommand(mvnCommand, pomFile, 'help:effective-settings', effectiveSettings);
                            }
                        }
                    });
                }
            });
        }
    });
})();