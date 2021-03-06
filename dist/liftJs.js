var app = {

    // APPLICATION CONFIG
    config: {},

    // APPLICATION CORE MODULES
    core: {},

    // APPLICATION READY STATE
    isReady: false,

    // -------------------------------------------------------------------------
    // INIT APPLICATION AT LOAD TIME
    // -------------------------------------------------------------------------

    init: function() {
        var host = null;

        // MANAGE INSTANCE HOST URL

        if (isDefined(app.config.host)) {
            host = app.config.host;
        } else {
            var protocol = location.protocol;
            var slashes = protocol.concat("//");
            host = slashes.concat(window.location.host);
        }

        // GET APP PARAMETERS
        $.get(host + (app.config.parametersPath ? app.config.parametersPath : '/data/parameters.json'), function(params) {
            app.config = params;
            app.core.utils.init();
            app.core.events.init();
            app.core.session.start();
        });

        // SESSION STARTED

        $(document).on('session.started', function() {
            app.core.ui.registerModulesTemplates();
            app.core.ui.initTemplates();
        });

        // ALL TEMPLATES LOADED

        $(document).on('templates.registered', function() {
            app.core.ui.plugins.init();
            app.core.ui.init();
            app.ready();
        });
    },

    ready: function() {
        $(document).trigger('app.ready');
    },

    // -------------------------------------------------------------------------
    // REGISTER APPLICATION MODULE
    // -------------------------------------------------------------------------

    register: function(component) {
        $.extend(true, app, component);
        return app;
    },

    // -------------------------------------------------------------------------
    // CHECK IF MODULE EXISTS
    // -------------------------------------------------------------------------

    moduleExists: function(modulePath) {
        return app.core.utils.deepFind(app,modulePath);
    }
};

app.register({
    ctrl: {

        // ---------------------------------------------------------------------
        // STATES
        // ---------------------------------------------------------------------

        states: {
            home: {
                path: "/",
                title: app.config.applicationName
            }
        },

        // ---------------------------------------------------------------------
        // ACTIONS
        // ---------------------------------------------------------------------

        homeAction: function()  {
            app.core.ctrl.go('home',{}).then(function() {
                app.core.history.add(app.ctrl.states.home);
            });
        }

    },
    core: {
        ctrl: {

            // ---------------------------------------------------------------------
            // INTERNAL METHODS
            // ---------------------------------------------------------------------

            go: function (templateName, data) {
                $(document).trigger('ctrl.beforego');
                return app.core.ctrl.render(templateName, data, true);
            },

            render: function (templateName, data, clearContent) {
                var defer = $.Deferred();

                $(document).trigger('ctrl.prerender');

                if (!isDefined(data) || data === null)
                    data = {};
                if (!isDefined(clearContent))
                    clearContent = false;

                if (clearContent) {
                    app.core.ui.clearContent();
                    app.core.ui.displayContentLoading(true);
                }

                app.core.ui.applyTemplate(templateName, data);

                $('.dropdown-button').dropdown('close');

                $(document).trigger('ctrl.postrender');

                defer.resolve();

                return defer.promise();
            }
        }
    }
});

app.register({
    core: {
        events: {
            init: function() {
                $(document)

                    // -------------------------------------------------------------
                    // APPLICATION READY
                    // -------------------------------------------------------------

                    .on('app.ready', function(e) {
                        app.isReady = true;
                        app.core.ui.displayContentLoading(false);
                    })

                    // -------------------------------------------------------------
                    // NAV BUTTONS
                    // -------------------------------------------------------------

                    .on('click', '*[data-go]', function(e) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        e.preventDefault();

                        $(document).trigger('ctrl.beforego');

                        var action = $(this).attr('data-go')+'Action';
                        var args = $(this).attr('data-go-args');

                        var callableAction = app.ctrl[action];

                        if (isDefined(args) && args !== null && args !== "")
                            args = JSON.parse(args);
                        else
                            args = undefined;

                        callableAction(args);
                    })

                    // -------------------------------------------------------------
                    // FORM CUSTOM SUBMIT
                    // -------------------------------------------------------------

                    .on('submit', 'form[data-ws], form[data-ctrl]', function(e) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        e.preventDefault();

                        var callableAction = null;

                        if ($(this).attr('data-ws')) {
                            callableAction = app.ws[$(this).attr('data-ws')];
                        } else if ($(this).attr('data-ctrl')) {
                            callableAction = app.ctrl[$(this).attr('data-ctrl')+'Action'];
                        } else {
                            app.core.ui.toast("Mauvais callable de traitement de formulaire", "error");
                            return;
                        }

                        callableAction(app.core.utils.formToObject($(this)),$(this));
                    })

                    // -------------------------------------------------------------
                    // GLOBAL BEHAVIORS
                    // -------------------------------------------------------------

                    .on('click', '[href="#"]', function(e) {
                        e.preventDefault();
                        return false;
                    })

                    // -------------------------------------------------------------
                    // TEMPLATING ENGINE
                    // -------------------------------------------------------------

                    .on('template.applied', function(e, name) {
                        if (app.isReady)
                            app.core.ui.displayContentLoading(false);
                        app.core.ui.plugins.init();
                        var forms = $('handlebars-template[name="' + name + '"]').find('form');
                        if (forms.length > 0 && forms.is(':visible')) {
                            try {
                                Materialize.updateTextFields();
                            } catch(e) {

                            }
                        }
                    })

                ;

                if (app.config.debug === true) {
                    window.onerror = function(msg, url, line, col, error) {
                        app.core.ui.toast('DEBUG: ' + msg + "<br/>" + url + ":" + line + ":" + col, 'error');
                    }
                }

                app.core.events.registerComponentEvents(app);
            },

            // ---------------------------------------------------------------------
            // INITIALIZE COMPONENTS EVENTS
            // ---------------------------------------------------------------------

            registerComponentEvents: function(component, depth) {
                if (!isDefined(depth))
                    depth = 0;

                if (depth > 4) // LIMIT INIT SEARCH RECURSION TO 4 LEVEL
                    return;

                // RECURSION OVER APPLICATION COMPONENTS
                Object.keys(component).forEach(function(key) {
                    var c = component[key];

                    if (isDefined(c) && c && c.hasOwnProperty('initEvents')) {
                        c.initEvents();
                    } else if (c && typeof c === "object") {
                        app.core.events.registerComponentEvents(c, depth + 1);
                    }
                });
            }
        }
    }
});

app.register({
    core: {

        history: {

            // HOLDS CURRENT VIEW STATE
            currentState: null,

            // HOLDS CURRENT VIEW CALLABLE (USED FOR RECALL)
            currentCallable: function() {
                // app.ctrl.homeAction();
            },

            // WRAPPER BROWSER HISTORY
            // provider: History,

            // NATIVE BROWSER HISTORY
            provider: window.history,

            // DISABLE BACK ACTION WHEN TRUE
            disableBack: false,

            // ---------------------------------------------------------------------
            // ADD ENTRY TO BROWSER HISTORY STACK
            // ---------------------------------------------------------------------

            add: function(state) {
                var currentState = app.core.history.provider.state;

                if (currentState === null || currentState.state.path !== state.path) {
                    var content = $('#app').html();
                    app.core.history.provider.pushState({
                        content: content,
                        state: state
                    }, state.title, app.config.appUriPrefix + state.path);

                    app.core.history.currentState = state;
                }
            },



            // ---------------------------------------------------------------------
            // INIT EVENTS (CALLED BY APP CORE EVENTS)
            // ---------------------------------------------------------------------

            initEvents: function() {

                // -----------------------------------------------------------------
                // HISTORY POP
                // -----------------------------------------------------------------

                $(window)
                    .on('popstate', function(event) {
                        var state = event.originalEvent.state;
                        if (state && !app.core.history.disableBack) {
                            $('#app').html(state.content);
                            $(document).trigger('history.popedstate');
                        }
                    });

                $(document)
                    .on('history.popedstate', function() {
                        app.core.ui.plugins.init();
                        $('.dropdown-button').dropdown('close');
                    });
            }
        }
    }
});

app.register({
    core: {
        routing: {
            getCurrentUri: function() {
                var uri = window.location.pathname;
                if (app.config.appUriPrefix.match(/^\?/)) {
                    var uri = window.location.search;
                } else if (app.config.appUriPrefix.match(/^\#/)) {
                    var uri = window.location.hash;
                }
                return uri;
            },

            findState: function(uri) {
                var foundState = null;

                $.each(app.ctrl.states, function(i, state) {
                    if (app.config.appUriPrefix + state.path === uri) {
                        foundState = state;
                        foundState.action = i + 'Action';
                    }
                });

                return foundState;
            },

            initEvents: function() {

                $(document)

                    .on('app.ready', function(e) {
                        var currentUri = app.core.routing.getCurrentUri();
                        var state = app.core.routing.findState(currentUri);

                        if (state) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();

                            var callable = app.ctrl[state.action];
                            callable();
                        }
                    });
            }
        }
    }
});

app.register({
    core: {
        session: {
            initEvents: function () {

            },

            start: function () {
                app.core.sessionStorage.initEngine();
                var currentSession = app.core.sessionStorage.get(app.config.clientSessionName);

                if (currentSession === null) {
                    app.core.session.save();
                } else {
                    app.core.session.reload();
                }
                $(document).trigger('session.started');
            },

            save: function () {
                if (app.core.sessionStorage.engine === null)
                    app.core.session.start();
                app.core.sessionStorage.set(app.config.clientSessionName, JSON.stringify(app.core.session));
            },

            destroy: function () {
                app.core.sessionStorage.set(app.config.clientSessionName, JSON.stringify({}));
            },

            reload: function () {

                if (app.core.sessionStorage.engine === null)
                    app.core.session.start();

                var currentSession = app.core.sessionStorage.get(app.config.clientSessionName);

                if (currentSession !== null) {
                    currentSession = JSON.parse(currentSession);
                }

                $.extend(app.core.session, currentSession);
            }
        },
        sessionStorage: {
            engine: sessionStorage,
            initEngine: function() {
                if (localStorage.getItem(app.config.clientSessionName) !== null) {
                    app.core.sessionStorage.engine = localStorage;
                    sessionStorage.removeItem(app.config.clientSessionName);
                } else {
                    app.core.sessionStorage.engine = sessionStorage;
                    localStorage.removeItem(app.config.clientSessionName);
                }
            },
            get: function (key) {
                return app.core.sessionStorage.engine.getItem(key);
            },
            set: function (key, val) {
                var r = app.core.sessionStorage.engine.setItem(key, val);
                app.core.session.reload();
                return r;
            },
            remove: function (key) {
                return app.core.sessionStorage.engine.removeItem(key);
            }
        }
    }
});

app.register({
    core: {
        settings: {

        }
    },

    ctrl: {
        states: {
            settings: {
                path: "/settings",
                title: "Paramètres"
            }
        },

        settingsAction: function () {
            app.core.history.currentCallable = app.ctrl.showSettings;
            app.core.ctrl.go('settings').then(function () {
                try {
                    Materialize.updateTextFields();
                } catch(e) {

                }
                app.core.history.add(app.ctrl.states.settings);
            });
        },

        updateSettings: function (data) {
            app.core.ui.toast("Paramètres enregistrés", "success");
            app.ctrl.homeAction();
        }
    }
});

app.register({
    core: {
        ui: {

            // HANDLE APPLICATION TEMPLATES
            templates: {},

            init: function() {
                $(document).trigger('ui.init');
            },

            // -------------------------------------------------------------------------
            // UI GLOBAL EVENTS
            // -------------------------------------------------------------------------

            initEvents: function() {

            },

            // -------------------------------------------------------------------------
            // UI PLUGINS (THIRD PARTY JS PLUGINS)
            // -------------------------------------------------------------------------

            plugins: {
                init: function() {
                    moment.locale('fr');
                    app.core.ui.setApplicationName();
                    app.core.ui.plugins.initTabs();
                    app.core.ui.plugins.initTooltips();
                    app.core.ui.plugins.initDropDown();
                    app.core.ui.plugins.registerComponentPlugins(app);
                },

                // ---------------------------------------------------------------------
                // MATERIALIZECSS TABS
                // ---------------------------------------------------------------------

                initTabs: function() {
                    $('ul#tabs').tabs();
                    var tabsId = $('div.tab-content:first-of-type').attr('id');
                    $('ul#tabs').tabs('select_tab', tabsId);
                },

                // ---------------------------------------------------------------------
                // MATERIALIZECSS TOOLTIPS
                // ---------------------------------------------------------------------

                initTooltips: function() {
                    $('.material-tooltip').remove();
                    $('*[data-tooltip]').tooltip({
                        delay: 50
                    });
                },

                // ---------------------------------------------------------------------
                // MATERIALIZECSS DROPDOWN
                // ---------------------------------------------------------------------

                initDropDown: function() {
                    $('.dropdown-button').dropdown();
                },

                // ---------------------------------------------------------------------
                // INITIALIZE COMPONENTS PLUGINS
                // ---------------------------------------------------------------------

                registerComponentPlugins: function(component, depth) {
                    if (!isDefined(depth))
                        depth = 0;

                    if (depth > 3) // LIMIT INIT SEARCH RECURSION TO 4 LEVEL
                        return;

                    if (typeof component === Object) {
                        // RECURSION OVER APPLICATION COMPONENTS
                        Object.keys(component).forEach(function(key) {
                            var c = component[key];
                            if (c && c.hasOwnProperty('initPlugins')) {
                                c.initPlugins();
                            } else if (typeof c === "object") {
                                app.core.ui.plugins.registerComponentPlugins(c, depth + 1);
                            }
                        });
                    }
                }
            },

            // -------------------------------------------------------------------------
            // SETS APP NAME IN NAVBAR AND PAGE TITLE
            // -------------------------------------------------------------------------

            setApplicationName: function() {
                var appName = app.config.applicationName;

                document.title = appName;
                $('nav .brand-logo').html(appName);
            },

            // -------------------------------------------------------------------------
            // CALL MODULES SELF TEMPLATES REGISTER
            // -------------------------------------------------------------------------

            registerModulesTemplates: function(component, depth) {
                if (!isDefined(component))
                    component = app;

                if (!isDefined(depth))
                    depth = 0;

                if (depth > 3) // LIMIT INIT SEARCH RECURSION TO 4 LEVEL
                    return;

                // RECURSION OVER APPLICATION COMPONENTS
                Object.keys(component).forEach(function(key) {
                    var c = component[key];
                    if (c !== null) {
                        if (c && c.hasOwnProperty('registerTemplates')) {
                            c.registerTemplates();
                        } else if (typeof c === "object") {
                            app.core.ui.registerModulesTemplates(c, depth + 1);
                        }
                    }
                });
            },

            // -------------------------------------------------------------------------
            // LOOP LOADING HANDLEBARS TEMPLATES
            // -------------------------------------------------------------------------

            initTemplates: function() {
                var promises = [];

                // FETCH TEMPLATES

                $('handlebars-template').each(function() {
                    var defer = $.Deferred();
                    var tpl = $(this);
                    var id = tpl.attr('name');
                    var src = tpl.attr('src');

                    promises.push(defer.promise());

                    if (isDefined(src)) {
                        $.ajax({
                            async: true,
                            url: src,
                            success: function(data) {

                                // REGISTER TEMPLATE

                                app.core.ui.templates[id] = {
                                    id: id,
                                    data: data,
                                    element: tpl
                                };

                                $(document).trigger('template.registered', [app.core.ui.templates[id]]);

                                defer.resolve();
                            }
                        });
                    } else {
                        // REGISTER TEMPLATE

                        app.core.ui.templates[id] = {
                            id: id,
                            data: tpl.html(),
                            element: tpl
                        };

                        $(document).trigger('template.registered', [app.core.ui.templates[id]]);

                        defer.resolve();
                    }
                });

                $.when.apply($, promises).then(function() {
                    $(document).trigger('templates.registered');
                }, function(e) {
                    $(document).trigger('app.failed');
                });
            },

            addTemplate: function(type, name, src) {
                var target = $('#app');
                var action = 'prepend';

                if (type === "content") {
                    target = target.find('.content');
                    action = 'append';
                }

                // REMOVE TEMPLATE IF ALREADY PRESENT IN BODY
                var existing = target.find('handlebars-template[name="' + name + '"]');
                if (existing.length != 0 && existing.attr('override') !== 'true') {
                    existing.remove();
                    delete app.core.ui.templates[name];
                }

                if (existing.attr('override') !== 'true') {
                    // ADDING TEMPLATE IN BODY
                    target[action](
                        $('<handlebars-template/>').attr({
                            name: name,
                            src: src
                        })
                    );
                }
            },

            // -------------------------------------------------------------------------
            // APPLY COMPILED TEMPLATE
            // -------------------------------------------------------------------------

            applyTemplate: function(name, data) {
                $('handlebars-template[name="' + name + '"]').html(
                    app.core.ui.renderTemplate(name, data)
                );

                $(document).trigger('template.applied', [name]);
            },

            // -------------------------------------------------------------------------
            // RETURN COMPILED TEMPLATE
            // -------------------------------------------------------------------------

            renderTemplate: function(name, data) {
                if(data === undefined) {
                    data = {};
                }

                if (app.core.ui.templates[name] !== undefined) {
                    var compiled = Handlebars.compile(app.core.ui.templates[name].data);

                    return compiled(data);
                }

                return false;
            },

            // -------------------------------------------------------------------------
            // CLEAR .CONTENT PLACEHOLDERS
            // -------------------------------------------------------------------------

            clearContent: function() {
                $('#app div.content handlebars-template').html('').css('display', 'none');
                $(document).trigger('content.cleared');
            },

            // -------------------------------------------------------------------------
            // SHOW BIG LOADER IN CONTENT
            // -------------------------------------------------------------------------

            displayContentLoading: function(show) {
                var loader = $('#contentLoader');

                if (!isDefined(show)) {
                    show = true;
                }

                show === true ? loader.show() : loader.hide();
            },

            // -------------------------------------------------------------------------
            // SHOW TOAST (FLASH MESSAGE)
            // -------------------------------------------------------------------------

            toast: function(message, type, delay) {
                if (!isDefined(delay))
                    delay = 5000;
                if (!isDefined(type))
                    type = 'default';

                switch (type) {
                    case 'info':
                        icon = '<i class="material-icons right">info</i>';
                        break;
                    case 'warning':
                        icon = '<i class="material-icons right">warning</i>';
                        break;
                    case 'error':
                        icon = '<i class="material-icons right">error</i>';
                        break;
                    case 'success':
                        icon = '<i class="material-icons right">check_circle</i>';
                        break;
                    default:
                        icon = '<i class="material-icons right">notifications</i>';
                        break;
                }

                Materialize.toast(message + icon, delay, type);
            }
        }
    }
});

app.register({
    core: {
        utils: {
            init: function() {

                // -----------------------------------------------------------------
                // HANDLEBAR MISSING IF
                // -----------------------------------------------------------------

                Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {

                    switch (operator) {
                        case '==':
                            return (v1 == v2) ? options.fn(this) : options.inverse(this);
                        case '===':
                            return (v1 === v2) ? options.fn(this) : options.inverse(this);
                        case '!=':
                            return (v1 != v2) ? options.fn(this) : options.inverse(this);
                        case '!==':
                            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                        case '<':
                            return (v1 < v2) ? options.fn(this) : options.inverse(this);
                        case '<=':
                            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                        case '>':
                            return (v1 > v2) ? options.fn(this) : options.inverse(this);
                        case '>=':
                            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                        case '&&':
                            return (v1 && v2) ? options.fn(this) : options.inverse(this);
                        case '||':
                            return (v1 || v2) ? options.fn(this) : options.inverse(this);
                        case 'null':
                            return (v1 === null) ? v2.fn(this) : v2.inverse(this);
                        case 'not null':
                            return (v1 !== null) ? v2.fn(this) : v2.inverse(this);
                        default:
                            return options.inverse(this);
                    }
                });

                // -----------------------------------------------------------------
                // RENDER DATE / DATETIME
                // -----------------------------------------------------------------

                Handlebars.registerHelper('formatDate', function(dateStr, format) {
                    var date = moment(dateStr);
                    return date.format(format);
                });

                // -----------------------------------------------------------------
                // RENDER YES / NO BADGE
                // -----------------------------------------------------------------

                Handlebars.registerHelper('ouiNon', function(boolean) {
                    return (boolean ? '<span class="teal badge white-text">Oui</span>' : '<span class="red badge">Non</span>');
                });

                // -----------------------------------------------------------------
                // EXPOSE CONFIG OBJECT
                // -----------------------------------------------------------------

                Handlebars.registerHelper('config', function(path) {
                    return app.core.utils.deepFind(app.config, path);
                });

                // -----------------------------------------------------------------
                // RENDER TEMPLATE INSIDE ANOTHER ONE
                // -----------------------------------------------------------------

                Handlebars.registerHelper('render', function() {
                    //Remove handlebar context param
                    var args = [];

                    for (var i = 0; i < arguments.length - 1; i++) {
                        args.push(arguments[i]);
                    }

                    //Wrap data in object
                    if(isDefined(args[2])) {
                        var object = {};

                        object[args[2]] = args[1];
                        args[1] = object;
                    }

                   return app.core.ui.renderTemplate(args[0], args[1]);
                });

                // -----------------------------------------------------------------
                // RENDER TEMPLATE INSIDE ANOTHER ONE
                // -----------------------------------------------------------------

                Handlebars.registerHelper('dump', function(variable) {
                  console.debug(variable);
                });

            },

            // ---------------------------------------------------------------------
            // CONVERT FORM (AFTER .serializeArray() ) TO OBJECT
            // ---------------------------------------------------------------------

            formToObject: function(formArray) {

                if (!Array.isArray(formArray)) {
                    if ($(formArray).is('form')) {
                        formArray = $(formArray).serializeArray();
                    }
                }

                var returnArray = {};
                for (var i = 0; i < formArray.length; i++) {
                    var value = formArray[i]['value'];

                    if (value == "true" || value == "false")
                        value = (value == "true");

                    returnArray[formArray[i]['name']] = value;
                }
                return returnArray;
            },

            // ---------------------------------------------------------------------
            // PUTS FIRST LETTER OF STRING IN UPPER CASE
            // ---------------------------------------------------------------------

            ucfirst: function(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },

            // ---------------------------------------------------------------------
            // WRAPPER FOR MOMENT JS PARSE DATE
            // ---------------------------------------------------------------------

            parseDate: function(string, format) {
                var date = null;
                if (isDefined(format))
                    date = moment(string, format).toDate();
                else
                    date = moment(string).toDate();
                return date;
            },

            // ---------------------------------------------------------------------
            // HELPER TO QUERY OBJECT WITH XPATH LIKE
            // ---------------------------------------------------------------------

            deepFind: function(obj, path) {
                var paths = path.split('.'),
                    current = obj,
                    i;

                for (i = 0; i < paths.length; ++i) {
                    if (current[paths[i]] === 'undefined' || current[paths[i]] === null) {
                        return null;
                    } else {
                        current = current[paths[i]];
                    }
                }
                return current;
            },
            uuidV1: function(prefix) {
              return prefix + uuid.v1();
            },
            uuidV4: function(prefix) {
              return prefix + uuid.v4();
            },
            mergeArrays: function(array1, array2) {
              return array1.concat(array2.filter(function (item) {
                return array1.indexOf(item) === -1;
              }));
            }
        }
    }
});

// ---------------------------------------------------------------------
// HELPER FUNCTION TO AVOID « typeof var !== 'undefined' » EVERY WHERE
// ---------------------------------------------------------------------

function isDefined(variable) {
    return typeof variable !== 'undefined';
}
