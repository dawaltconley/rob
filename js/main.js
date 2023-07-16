---
---

{% unless jekyll.environment == "development" %}
(function () {
{% endunless %}

    {% include StackBlur.js %}
    {% include drawImageProp.js %}

    var page = document.querySelector(".parallax-page");
    var win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") == "none") {
        page = document.scrollingElement ? document.scrollingElement : getScrollableChild(document.documentElement);
        win = window;
    }

    jekyllEnv = "{{ jekyll.environment }}";
    hasGoogleAnalytics = "{{ site.google_analytics }}";

/*
 * General-purpose functions
 */

    function toArray(collection) {
        return Array.prototype.slice.call(collection);
    };

    function getScrollableParent(element) {
        var maxDepth = arguments.length > 2 && arguments[1] !== undefined ? arguments[1] : undefined;
        var ancestor = element;
        while (ancestor != document.documentElement && maxDepth !== 0) {
            ancestor = ancestor.parentElement;
            if (ancestor.scrollHeight > ancestor.clientHeight) {
                return ancestor;
            }
            maxDepth -= 1;
        }
        return null;
    };

    function getScrollableChild(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var currentDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (element.scrollHeight > element.clientHeight) {
            return element;
        }
        for (var i = 0; i < element.children.length && maxDepth > currentDepth; i++) {
            var child = element.children[i];
            var childMatch = getScrollableChild(child, maxDepth, currentDepth += currentDepth);
            if (childMatch) {
                return childMatch;
            }
        }
        return null;
    };

    function getTransitionTime(element) {
        var dur = 0;
        var transition = window.getComputedStyle(element).getPropertyValue("transition").split(", ");

        for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            properties[_key - 1] = arguments[_key];
        }

        if (properties.length > 0) {
            properties.forEach(function (property) {
                transition.forEach(function (transitionSet) {
                    var propertyMatch = new RegExp("(\\s|^)" + property + "(\\s|$)");
                    if (transitionSet.search(propertyMatch) >= 0) {
                        transitionSet.split(" ").forEach(function (value) {
                            if (value.search(/\ds$/) >= 0) {
                                var seconds = Number(value.replace("s", ""));
                                dur += seconds;
                            }
                        });
                    }
                });
            });
        } else {
            var durElement = void 0,
                durSet = [];
            transition.forEach(function (transitionSet) {
                durElement = 0;
                transitionSet.split(" ").forEach(function (value) {
                    if (value.search(/\ds$/) >= 0) {
                        var seconds = Number(value.replace("s", ""));
                        durElement += seconds;
                    }
                });
                durSet.push(durElement);
            });
            dur = Math.max.apply(null, durSet);
        }
        return dur * 1000;
    };

    function scrollBottom(element) {
        //opposite of .scrollTop: measures dist between bottom of view and bottom of element
        var elementBottom = element.scrollHeight;
        var viewBottom = element.scrollTop + element.clientHeight;
        return elementBottom - viewBottom;
    };

    function pagePos(element) {
        var posTop = element.getBoundingClientRect().top + page.scrollTop;
        var posLeft = element.getBoundingClientRect().left + page.scrollLeft;
        return { top: posTop, left: posLeft };
    };

    function getParentBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var ancestor = element;
        while (ancestor != document.documentElement && maxDepth !== 0) {
            ancestor = ancestor.parentElement;
            if (Sizzle.matchesSelector(ancestor, selector)) {
                return ancestor;
            }
            maxDepth -= 1;
        }
        return null;
    };

    function getChildBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                return child;
            } else if (child.children.length && maxDepth !== 1) {
                var childMatch = getChildBySelector(child, selector, maxDepth - 1);
                if (childMatch) {
                    return childMatch;
                }
            }
        }
        return null;
    };

    function getChildrenBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var matches = [];
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                matches.push(child);
            }
            if (child.children.length && maxDepth !== 1) {
                var childMatch = getChildrenBySelector(child, selector, maxDepth - 1);
                if (childMatch) {
                    childMatch.forEach(function (match) {
                        matches.push(match);
                    });
                }
            }
        }
        if (matches.length) {
            return matches;
        } else {
            return null;
        }
    };

    function getScrollableChild(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var currentDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (element.scrollHeight > element.clientHeight) {
            return element;
        }
        for (var i = 0; i < element.children.length && maxDepth > currentDepth; i++) {
            var child = element.children[i];
            var childMatch = getScrollableChild(child, maxDepth, currentDepth += currentDepth);
            if (childMatch) {
                return childMatch;
            }
        }
        return null;
    };

    function clearClass(string, elements) {
        var className, allOfClass;
        if (string.charAt(0) === ".") {
            className = string.slice(1);
        } else {
            className = string;
        }
        if (elements === undefined) {
            allOfClass = toArray(document.querySelectorAll("." + className));
        } else {
            allOfClass = toArray(elements);
        }
        allOfClass.forEach(function (element) {
            element.classList.remove(className);
        });
    };

    function contentWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-left")) + parseInt(elementStyle.getPropertyValue("padding-right"));
        return element.clientWidth - elementPadding;
    };

    function contentHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-top")) + parseInt(elementStyle.getPropertyValue("padding-bottom"));
        return element.clientHeight - elementPadding;
    };

    function marginWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-left")) + parseInt(elementStyle.getPropertyValue("margin-right"));
        return element.clientWidth + elementMargin;
    };

    function marginHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-top")) + parseInt(elementStyle.getPropertyValue("margin-bottom"));
        return element.clientHeight + elementMargin;
    };

    function pushState(hash) {
        window.history.pushState({ hasFocus: hash}, hash.slice(1), hash);
    };

    function executeQueue(array, time) {
        window.setTimeout(function () {
            while (array.length > 0) {
                array.shift().call();
            }
        }, time);
    };

    function parseBoolean(string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
    };

    function distToBottom(element) {
        return Math.floor(element.getBoundingClientRect().bottom - window.innerHeight);
    };

/*
 * Scrolling
 */

    var pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    var smoothLinks = [];

    toArray(document.querySelectorAll("[data-smooth-scroll]")).forEach(function (element) {
        smoothLinks.push(new SmoothLink(element));
    });

    var pageScroller = zenscroll.createScroller(page, 1000, 9);

    function SmoothLink(link) {
        this.element = link;
        this.target = document.querySelector(link.hash);
    };

    SmoothLink.prototype.scroll = function () {
        var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        pageScroller.to(this.target, dur, offset);
    };

    function receivesSmoothScroll(element) {
        for (var i=0; i < smoothLinks.length; i++) {
            var link = smoothLinks[i];
            if (element === link.target) {
                return true;
            }
        };
        return false;
    }

/*
 * Fullscreen
 */

    var lockHeightElements = toArray(document.querySelectorAll("[data-force-fullscreen]"));

    function lockHeight(element) {
        var height = element.clientHeight;
        if (element.clientHeight != height) {
            if (element.getAttribute("data-force-fullscreen") === "min") {
                element.style.minHeight = height.toString() + "px";
            } else if (element.getAttribute("data-force-fullscreen") === "max") {
                element.style.maxHeight = height.toString() + "px";
            } else {
                element.style.height = height.toString() + "px";
            }
        }
    };

    function lockHeightAll() {
        lockHeightElements.forEach(function (element) {
            lockHeight(element);
        });
    };

/*
 * Projects
 */

    var projectView = document.querySelector("[data-project-view]");
    var buttonElements = toArray(document.querySelectorAll("[data-project-button]"));
    var projects = [];
    var projectQueue = [];
    var projectsDrawn = 0;
    var justClicked = false;
    var projectTransitionTime = Number("{{ site.project_transition_time }}".slice(1)) * 1000;
    var projectScroller = zenscroll.createScroller(page, projectTransitionTime, 0);

    if (!projectTransitionTime) {
        projectTransitionTime = 1000;
    }

    buttonElements.forEach(function (button, index) {
        var newProject = new Project(document.querySelector(button.hash));
        var newProjectButton = new ProjectButton(button);
        newProject.button = newProjectButton;
        newProjectButton.project = newProject;
        projects.push(newProject);
    });

    function Project(element) {
        this.id = element.id;
        this.index = Number(element.getAttribute("data-index")); // could set when created
        this.body = element;
        this.content = getChildBySelector(element, "[data-project-content]");
        this.canvas = getChildBySelector(element, "[data-project-background]");
        this.frame = getChildBySelector(element, "iframe");
        this.dummyFrame = document.createElement("div");
    };

    function ProjectButton(button) {
        this.hash = button.hash;
        this.body = button;
        this.content = getChildBySelector(button, "[data-project-button-content]");
    };

    Project.prototype.drawBg = function () {
        var canvas = this.canvas;
        var ctx = canvas.getContext("2d");
        var w = this.body.clientWidth;
        var h = this.content.scrollHeight;
        canvas.width = w;
        canvas.height = h;
        drawImageProp(ctx, this.image, 0, 0, w, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillRect(0, 0, w, h);
        stackBlurCanvasRGBA(canvas, 0, 0, w, h, 100); // requires modified function; takes canvas object, not canvas id
        projectsDrawn += 1;
        if (projectsDrawn == projects.length) {
            primeProjectView();
        }
    }

    Project.prototype.prime = function () {
        this.body.classList.remove("full-width", "target-display", this.id + "-img");
        this.unsetFrame();
        this.close();
        this.image = new Image();
        this.image.onload = this.drawBg.bind(this);
        this.image.src = this.canvas.getAttribute("data-image");
    };

    Project.prototype.open = function () {
        projectView.classList.remove("hidden");
        var contentHeight = this.content.scrollHeight;
        this.body.classList.add("t-open-project", "translate-x-none");
        this.body.classList.remove("no-height", "translate-x-left", "translate-x-right");
        this.button.body.classList.add("flip-x");
        this.body.style.minHeight = contentHeight.toString() + "px";
        this.state = "open";
        projectQueue.push(this.resetFrame.bind(this));
        expandProjectView(contentHeight);
    };

    Project.prototype.close = function () {
        if (this.state != "closed") {
            this.body.classList.add("no-height");
            this.body.classList.remove("t-open-project", "translate-x-none");
            this.button.body.classList.remove("flip-x");
            this.state = "closed";
            projectQueue.push(function () {
                this.unsetFrame();
                this.body.style.minHeight = null;
            }.bind(this));
        }
    };

    Project.prototype.slideLeft = function() {
        this.body.classList.add("translate-x-left");
        this.body.classList.remove("translate-x-right");
    };

    Project.prototype.slideRight = function () {
        this.body.classList.add("translate-x-right");
        this.body.classList.remove("translate-x-left");
    };

    Project.prototype.center = function () {
        this.body.classList.remove("translate-x-left", "translate-x-right");
    };

    Project.prototype.unsetFrame = function () {
        if (this.frame && this.body.contains(this.frame)) {
            this.frame.parentNode.replaceChild(this.dummyFrame, this.frame);
        }
    };

    Project.prototype.resetFrame = function () {
        if (this.frame && this.body.contains(this.dummyFrame)) {
            this.dummyFrame.parentNode.replaceChild(this.frame, this.dummyFrame);
        }
    };

    function getProject(property, value) {
        for (var i=0; i < projects.length; i++) {
            var project = projects[i];
            if (project[property] == value) {
                return project;
            }
        }
        return null;
    }

    function primeProjectView() {
        projectView.classList.add("hidden", "no-height", "expand-children");
    };

    function expandProjectView(height) {
        window.setTimeout(function () {
            projectView.style.height = height.toString() + "px";
        }, 0);
    };

    function closeProjectView() {
        projectView.style.height = "";
        projectQueue.push(function () {
            projectView.classList.add("hidden");
        });
    };

    function focusProject(target) {
        target.open();
        projects.forEach(function (project) {
            if (project.index != target.index) {
                if (project.index < target.index) {
                    project.slideLeft();
                } else {
                    project.slideRight();
                }
                project.close();
            }
        });
        projectScroller.toY(pagePos(projectView).top, projectTransitionTime);
        executeQueue(projectQueue, projectTransitionTime);
    };

    function closeProjects() {
        projects.forEach(function (project) {
            project.close();
            project.center();
        });
        closeProjectView();
        executeQueue(projectQueue, projectTransitionTime);
    };

/*
 * Analytics
 */

    analyticsObjects = [];

    toArray(document.querySelectorAll("[data-analytics-category][data-analytics-action][data-analytics-label]")).forEach(function (element) {
        analyticsObjects.push(new AnalyticsEventObj(element));
    });

    function AnalyticsEventObj(element) {
        this.element = element;
        this.category = element.getAttribute("data-analytics-category");
        this.action = element.getAttribute("data-analytics-action");
        this.label = element.getAttribute("data-analytics-label");
        this.new_tab = element.getAttribute("target") == "_blank";
    };

    if (jekyllEnv == 'production') {
        AnalyticsEventObj.prototype.send = function () {
            var callback = arguments.length > 0 && arguments[0] != undefined ? arguments[0] : function(){};
            ga("send", "event", this.category, this.action, this.label, {
                "hitCallback": callback
            });
        }
    } else {
        AnalyticsEventObj.prototype.send = function (callback) {
            var cbString = callback ? ', {\n    "hitCallback": ' + callback + '\n}' : '';
            console.log('Google Analytics Event: ga("send", "event", "%s", "%s", "%s"%s)', this.category, this.action, this.label, cbString);
            callback ? callback() : undefined;
        }
    }

    AnalyticsEventObj.prototype.addListener = function () {
        if (this.element instanceof HTMLIFrameElement && this.action == "click") {
            this.listener = iFrameClickEventListener.bind(null, this);
            window.addEventListener("blur", this.listener, passive);
        } else if (this.action == "click") {
            this.listener = linkClickEventListener.bind(null, this)
            this.element.addEventListener("click", this.listener);
        } else if (this.action == "view") {
            this.listener = scrollToViewEventListener.bind(null, this);
            window.addEventListener("scroll", this.listener, passive);
        }
    };

    function linkClickEventListener(eventObj, event) {
        if (window.origin == eventObj.element.origin || eventObj.new_tab) {
            eventObj.send();
        } else {
            event.preventDefault();
            var linkFollowed = false;
            function followLink() {
                if (!linkFollowed) {
                    linkFollowed = true;
                    window.open(eventObj.element.href, eventObj.element.target);
                }
            }
            window.setTimeout(followLink, 1000);
            eventObj.send(followLink);
        }
    };

    function scrollToViewEventListener(eventObj) {
        if (distToBottom(eventObj.element) <= 0) {
            eventObj.send();
            window.removeEventListener("scroll", eventObj.listener, passive);
        }
    };

    function iFrameClickEventListener(eventObj) {
        window.setTimeout(function () {
            if (document.activeElement === eventObj.element) {
                eventObj.send();
                eventObj.element.addEventListener("mouseout", function refocus() {
                    window.focus();
                    this.removeEventListener("mouseout", refocus, passive);
                }, passive);
                window.removeEventListener("blur", eventObj.listener, passive);
            }
        }, 0);
    };

/*
 * Event Listeners
 */

    var passive = false;

    try {
        var options = Object.defineProperty({}, "passive", {
            get: function() {
                passive = { passive: true };
            }
        });

        window.addEventListener("test", null, options);
    } catch(err) {}

    function addProjectListeners() {
        projects.forEach(function (project) {
            project.prime();
            project.button.body.addEventListener("click", function (event) {
                event.preventDefault();
                if (!justClicked) {
                    justClicked = true;
                    projectQueue.push(function () {
                        justClicked = false;
                    });
                    var open = getProject("state", "open");
                    if (open === project) {
                        closeProjects();
                        pushState("/");
                    } else {
                        focusProject(project);
                        pushState(project.button.hash);
                    }
                }
            });
        });

        if (window.location.hash) {
            var currentProject = getProject("id", window.location.hash.slice(1));
            if (currentProject) {
                window.addEventListener("load", function () {
                    focusProject(currentProject);
                });
            }
        }

        window.addEventListener("popstate", function (event) {
            if (event.state) {
                var target = getProject("id", event.state.hasFocus.slice(1));
                var open = getProject("state", "open");
                if (target) {
                    focusProject(target);
                }
            } else {
                closeProjects();
                projectScroller.toY(0, projectTransitionTime);
            }
        }, passive);

        var initWidth = document.documentElement.clientWidth;
        var start = true, end;
        window.addEventListener("resize", function (event) {
            var newWidth = document.documentElement.clientWidth;
            var open = getProject("state", "open");
            if (newWidth != initWidth && open) {
                if (start) {
                    projectView.classList.add("t-none");
                    start = false;
                }
                projectView.style.height = open.content.scrollHeight.toString() + "px";
                open.drawBg();
                initWidth = newWidth;
                window.clearTimeout(end);
                end = window.setTimeout(function () {
                    projectView.classList.remove("t-none");
                    start = true;
                    projects.forEach(function (project) {
                        project.drawBg();
                    });
                }, 200);
            }
        }, passive);
    };

    function addSmoothScrollListeners() {
        smoothLinks.forEach(function (link) {
            link.element.addEventListener("click", function (event) {
                event.preventDefault();
                link.scroll();
            });
        });
        window.addEventListener("popstate", function (event) {
            if (event.state) {
                var target = document.querySelector(event.state.hasFocus);
                if (receivesSmoothScroll(target)) {
                    pageScroller.to(target);
                }
            } else {
                pageScroller.toY(0);
            }
        }, passive);
    };

    function addOrientationChangeListener() {
        var initOrientation = window.innerHeight > window.innerWidth;
        if (lockHeightElements.length > 0) {
            window.addEventListener("resize", function () {
                var newOrientation = window.innerHeight > window.innerWidth;
                if (newOrientation != initOrientation) {
                    lockHeightAll();
                }
                initOrientation = newOrientation;
            }, passive);
        }
    };

    var elementsToHideOnScroll = toArray(document.querySelectorAll("[data-hide-on-scroll]"));

    function addHideOnScrollListener() {
        win.addEventListener("scroll", function hideOnScroll() {
            var stop = this.removeEventListener.bind(this, "scroll", hideOnScroll, false);
            if (elementsToHideOnScroll.length == 0) {
                stop();
            } else {
                elementsToHideOnScroll.forEach(function (element, i) {
                    if (element.getBoundingClientRect().bottom < 0) {
                        element.style.display = "none";
                        elementsToHideOnScroll.splice(i, 1);
                    }
                });
            }
        }, passive);
    };

    objectFitImages();

    if (projects.length > 0) {
        addProjectListeners();
    }

    if (smoothLinks.length > 0 && pageScrollBehavior != "smooth") {
        addSmoothScrollListeners();
    }

    if (lockHeightElements.length > 0) {
        addOrientationChangeListener();
        forceFullscreenAll();
    }

    if (elementsToHideOnScroll.length > 0) {
        addHideOnScrollListener();
    }

    if (analyticsObjects.length > 0 && hasGoogleAnalytics) {
        analyticsObjects.forEach(function (object) {
            object.addListener();
        });
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
