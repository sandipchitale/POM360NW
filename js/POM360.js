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
        }).state('agenda', {
            url : '/agenda',
            templateUrl : 'templates/agenda.html'
        }).state('effective-settings', {
            url : '/effective-settings',
            templateUrl : 'templates/effective-settings.html'
        }).state('system', {
            url : '/system',
            templateUrl : 'templates/system.html'
        }).state('cliargs', {
            url : '/cliargs',
            templateUrl : 'templates/cliargs.html'
        }).state('describe-plugin', {
            url : '/describe-plugin',
            templateUrl : 'templates/describe-plugin.html'
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

        $scope.atAgendaTab = function() {
            return ($location.path() === '/agenda');
        }

        $scope.atEffectiveSettingsTab = function() {
            return ($location.path() === '/effective-settings');
        }

        $scope.atSystemTab = function() {
            return ($location.path() === '/system');
        }

        $scope.atRunTab = function() {
            return ($location.path() === '/cliargs');
        }

        $scope.atDescribePluginTab = function() {
            return ($location.path() === '/describe-plugin');
        }

        $scope.config = {
            mvnCommand: 'mvn',
            mvnCommandDir: '.',
            mvnOptions: '',
            pomFile: '',
            pomDir: '.',
            defaultPomFile: path.join(process.cwd(), 'pom.xml'),
            settingsFile: '',
            defaultSettingsFile: path.join(pathExtra.homedir(), '.m2', 'settings.xml')
        }

        $scope.cli = {
            args: "-h"
        }

        $scope.plugin = {
            gid: 'org.apache.maven.plugins',
            gids: ['org.apache.maven.plugins'],
            aid: 'maven-help-plugin',
            aids: ['maven-help-plugin',
                'maven-dependency-plugin',
                'maven-compiler-plugin',
                'maven-resources-plugin',
                'maven-install-plugin',
                'maven-assembly-plugin',
                'maven-archiver-plugin']
        }

        $scope.setGid = function(gid) {
            $scope.plugin.gid = gid;
        }

        $scope.setAid = function(aid) {
            $scope.plugin.aid = aid;
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
            if ('' !== mvnCommandSelector.val().trim()) {
                $scope.config.mvnCommand = mvnCommandSelector.val().trim();
                $scope.config.mvnCommandDir = path.dirname($scope.config.mvnCommand);

                $scope.$apply();
                setTimeout(validateMvnCommand, 0);
            }
        });
        $scope.selectMvnCommand = function() {
            mvnCommandSelector.trigger('click');
        }

        // Select POM file
        var pomFileSelector = $('#pomFileSelector');
        pomFileSelector.change(function(evt) {
            if ('' !== pomFileSelector.val().trim()) {
                $scope.config.pomFile = pomFileSelector.val().trim();
                $scope.config.pomDir = path.dirname($scope.config.pomFile);

                $scope.$apply();
                setTimeout(validatePomFile, 0);
            }
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

        function runMvnCommand(mvnCommand, pomFile, commands, textArea) {
            textArea.val('');
            $(textArea).addClass('busy');
            var pomDir = path.dirname(pomFile);
            var args = ['-B'];
            if (pomFile) {
                args.push('-f');
                args.push(pomFile);
            }
            if ($.isArray(commands)) {
                args = args.concat(commands);
            } else if ((typeof commands) === 'string') {
                args = args.concat(commands.split('\\s+'));
            }
            var mvnProcess = childProcess.spawn(mvnCommand,
                args,
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
                 $(textArea).removeClass('busy');
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
                                effectivePomCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-pom')
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
                                dependenciesCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' dependency:tree')
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

        $scope.runAgenda = function() {
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
                            var agendaCommand = $('#agenda-command');
                            if (agendaCommand) {
                                agendaCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' help:describe -Dcmd=clean -Dcmd=deploy -Dcmd=site')
                            }
                            var cleanAgenda = $('#clean-agenda');
                            if (cleanAgenda) {
                                runMvnCommand(mvnCommand, pomFile, ['help:describe', '-Dcmd=clean'], cleanAgenda);
                            }
                            var deployAgenda = $('#deploy-agenda');
                            if (deployAgenda) {
                                runMvnCommand(mvnCommand, pomFile, ['help:describe', '-Dcmd=deploy'], deployAgenda);
                            }
                            var siteAgenda = $('#site-agenda');
                            if (siteAgenda) {
                                runMvnCommand(mvnCommand, pomFile, ['help:describe', '-Dcmd=site'], siteAgenda);
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
                                effectiveSettingsCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' help:effective-settings')
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

        $scope.runSystem = function() {
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
                            var systemCommand = $('#system-command');
                            if (systemCommand) {
                                systemCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' help:system')
                            }
                            var system = $('#system');
                            if (system) {
                                runMvnCommand(mvnCommand, pomFile, 'help:system', system);
                            }
                        }
                    });
                }
            });
        }

        $scope.runCliArgs = function() {
            if (mvn.parent().hasClass('has-error')) {
                return;
            }
            var mvnCommand = mvn.val();
            fileSystem.stat(mvnCommand, function(err, stat) {
                if (err) {
                    return;
                }
                if (stat.isFile()) {
                    var mvnCommandInput = $('#mvnCommand');
                    if (mvnCommandInput) {
                        mvnCommandInput.val(mvn.val())
                    }

                    var pomFile;
                    if (!pom.parent().hasClass('has-error')) {
                            pomFile - pom.val();
                    }

                    var cliArgsOutput = $('#cli-args-output');

                    runMvnCommand(mvnCommand, null, $scope.cli.args, cliArgsOutput);
                }
            });
        }

        $scope.runDescribePlugin = function() {
            if (cantRun()) {
                return;
            }
            var mvnCommand = mvn.val();
            fileSystem.stat(mvnCommand, function(err, stat) {
                if (err) {
                    return;
                }
                if (stat.isFile()) {
                    var mvnCommandInput = $('#mvnCommand');
                    if (mvnCommandInput) {
                        mvnCommandInput.val(mvn.val())
                    }

                    var pomFile;
                    if (!pom.parent().hasClass('has-error')) {
                            pomFile - pom.val();
                    }

                    var describePluginCommand = $('#describe-plugin-command');
                    if (describePluginCommand) {
                        describePluginCommand.val(mvn.val() + (pomFile ? ' -f ' + pomFile : '') + ' help:describe -Ddetail -Dplugin=' + $scope.plugin.gid + ':' + $scope.plugin.aid)
                    }
                    var describePlugin = $('#describe-plugin');
                    if (describePlugin) {
                        runMvnCommand(mvnCommand, pomFile,
                            ['help:describe', '-Ddetail', '-Dplugin=' + $scope.plugin.gid + ':' + $scope.plugin.aid],
                            describePlugin);
                    }
                }
            });
        }
    });
})();