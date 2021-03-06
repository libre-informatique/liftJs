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
