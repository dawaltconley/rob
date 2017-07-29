---
---

{% unless jekyll.environment == "development" %}
(function () {
{% endunless %}

    var page = document.querySelector(".parallax-page");
    var win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") == "none") {
        page = document.body;
        win = window;
    }

/*
 * General-purpose functions
 */

    function toArray(collection) {
        return Array.prototype.slice.call(collection);
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
        var ancestor = element;
        while (ancestor != document.body) {
            ancestor = ancestor.parentElement;
            if (Sizzle.matchesSelector(ancestor, selector)) {
                return ancestor;
            }
        }
        return null;
    };

    function getChildBySelector(element, selector) {
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                return child;
            } else if (child.children.length) {
                var childMatch = getChildBySelector(child, selector);
                if (childMatch) {
                    return childMatch;
                }
            }
        }
        return null;
    };

    function getChildrenBySelector(element, selector) {
        var matches = [];
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                matches.push(child);
            }
            if (child.children.length) {
                var childMatch = getChildrenBySelector(child, selector);
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

    function parseBoolean(string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
    };

/*
 * Scrolling
 */

    var pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    var smoothLinks = toArray(document.querySelectorAll("data-smooth-scroll"));

    var pageScroller = zenscroll.createScroller(page, 999, 0);

    function getHash(element) {
        //should remove, not using
        var elementClass = Object.prototype.toString.call(element);
        if (elementClass == "[object SVGAElement]") {
            var link = element.href.baseVal;
            return link.slice(link.search("#"));
        } else if (elementClass == "[object HTMLAnchorElement]") {
            return element.hash;
        } else {
            return null;
        }
    };

    function receivesSmoothScroll(element) {
        smoothLinks.forEach(function (link) {
            var linkTarget = document.querySelector(link.hash);
            if (element === linkTarget) {
                return true;
            }
        });
        return false;
    }

    function smoothScrollTo(element) {
        var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        pageScroller.toY(pagePos(element).top, dur, offset);
    };

    function smoothScrollToHref(link) {
        var hash = link.hash;
        var target = document.querySelector(hash);
        pushState(hash);
        smoothScrollTo(target);
    };

/*
 * Fullscreen
 */

    var fullscreenElements = toArray(document.querySelectorAll('[data-script="force-fullscreen"]'));

    function forceFullscreen(element) {
        var viewHeight = window.innerHeight;
        if (element.clientHeight != viewHeight) {
            element.style.height = viewHeight.toString() + "px";
        }
    };

    function forceFullscreenAll() {
        fullscreenElements.forEach(function (element) {
            forceFullscreen(element);
        });
    };

/*
 * Projects
 */

    var projectView = document.querySelector("[data-project-view]");
    var buttonElements = toArray(document.querySelectorAll("[data-project-button]"));
    var projects = Array(buttonElements.length);
    var projectButtons = Array(buttonElements.length);

    buttonElements.forEach(function (button, index) {
        var newProject = new Project(document.querySelector(button.hash));
        var newProjectButton = new ProjectButton(button);
        newProject.button = newProjectButton;
        newProjectButton.project = newProject;
        projects[index] = newProject;
        projectButtons[index] = newProjectButton;
    });

    function Project(element) {
        this.id = element.id;
        this.index = Number(element.getAttribute("data-index")); // could set when created
        this.body = element;
        this.content = getChildBySelector(element, "[data-project-content]");
        this.frame = getChildBySelector(element, "iframe");
        this.dummyFrame = document.createElement("div");
        this.transitionTime = getTransitionTime(element);
    };

    function ProjectButton(button) {
        this.hash = button.hash;
        this.body = button;
        this.content = getChildBySelector(button, "[data-project-button-content]");
        this.state = "normal";
    };

    Project.prototype.prime = function () {
        this.body.classList.remove("full-width", "target-display");
        this.unsetFrame();
        this.close();
    };

    Project.prototype.open = function () {
        this.body.classList.add("t-open-project", "translate-x-none");
        this.body.classList.remove("no-height", "translate-x-left", "translate-x-right");
        this.state = "open";
    };

    Project.prototype.close = function () {
        this.body.classList.add("no-height");
        this.body.classList.remove("t-open-project", "translate-x-none");
        this.state = "closed";
    };

    Project.prototype.slideLeft = function() {
        this.body.classList.add("translate-x-left");
        this.body.classList.remove("translate-x-right");
    };

    Project.prototype.slideRight = function () {
        this.body.classList.add("translate-x-right");
        this.body.classList.remove("translate-x-left");
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

    ProjectButton.prototype.flip = function () {
        if (this.state == "flipped") {
            this.content.classList.remove("flip-x");
            this.state = "normal";
        } else {
            this.content.classList.add("flip-x");
            this.state = "flipped";
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

    function getProjectButton(property, value) {
        for (var i=0; i < projectButtons.length; i++) {
            var button = projectButtons[i];
            if (button[property] == value) {
                return button;
            }
        }
        return null;
    }

    function primeProjects() {
        projectView.classList.add("no-height", "expand-children");
        projects.forEach(function (project) {
            project.prime();
        });
    };

    function expandProjectView(height) {
        projectView.classList.add("margin-l-v");
        projectView.classList.remove("margin-m-v");
        projectView.style.height = height.toString() + "px";
    };

    function closeProjectView() {
        projectView.classList.add("margin-m-v");
        projectView.classList.remove("margin-l-v");
        projectView.style.height = "";
    };

    var justClicked = false;

    function openProject(target) {
        if (justClicked) {
            return false;
        }

        var open = getProject("state", "open");
        var targetHeight = target.content.scrollHeight;

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

        if (target === open) {
            closeProjectView();
            target.close();
            clearClass("translate-x-left", projects);
            clearClass("translate-x-right", projects);
        } else {
            expandProjectView(targetHeight);
        }

        justClicked = true;

        window.setTimeout(function () {
            target.resetFrame();
            if (open) {
                open.unsetFrame();
            }
            justClicked = false;
        }, target.transitionTime);
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
        primeProjects();
        if (window.location.hash) {
            var currentProject = getProject("id", window.location.hash);
            if (currentProject) {
                currentProject.resetFrame;
                currentProject.open();
            }
        }

        projectButtons.forEach(function (button) {
            button.body.addEventListener("click", function (event) {
                var openButton = getProjectButton("state", "flipped");
                event.preventDefault();
                button.flip();
                if (openButton && openButton !== button) {
                    openButton.flip();
                }
                openProject(button.project);
                pushState(button.hash);
            });
        });

        window.addEventListener("popstate", function (event) {
            if (event.state) {
                var target = getProject("id", event.state.hasFocus);
                if (target) {
                    openProject(target);
                }
            } else {
                var open = getProject("state", "open");
                if (open) {
                    openProject(open); // should make seperate function for closing all projects
                }
            }
        }, passive);

        var initWidth = document.documentElement.clientWidth;
        var start = true, end;
        window.addEventListener("resize", function (event) {
            var newWidth = document.documentElement.clientWidth;
            var open = document.querySelector('[data-project-state="open"]');
            if (newWidth != initWidth && open) {
                var openHeight = getChildBySelector(open, "[data-project-content]").scrollHeight;
                if (start) {
                    projectView.classList.add("t-none");
                    start = false;
                }
                projectView.style.height = openHeight.toString() + "px";
                initWidth = newWidth;
                window.clearTimeout(end);
                end = window.setTimeout(function () {
                    projectView.classList.remove("t-none");
                    start = true;
                }, 200);
            }
        }, passive);
    };

    function addSmoothScrollListeners() {
        smoothLinks.forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                smoothScrollToHref(link);
            });
        });
        window.addEventListener("popstate", function (event) {
            if (event.state) {
                var target = document.querySelector(event.state.hasFocus);
                if (recievesSmoothScroll(target)) {
                    smoothScrollTo(target);
                }
            } else {
                pageScroller.toY(0);
            }
        }, passive);
    };

    function addOrientationChangeListener() {
        var initOrientation = window.innerHeight > window.innerWidth;
        if (fullscreenElements.length > 0) {
            window.addEventListener("resize", function () {
                var newOrientation = window.innerHeight > window.innerWidth;
                if (newOrientation != initOrientation) {
                    forceFullscreenAll();
                }
                initOrientation = newOrientation;
            }, passive);
        }
    };

    if (projects.length > 0) {
        addProjectListeners();
    }

    if (smoothLinks.length > 0 && pageScrollBehavior != "smooth") {
        addSmoothScrollListeners();
    }

    if (fullscreenElements.lenth > 0) {
        addOrientationChangeListener();
        window.onload = function () {
            forceFullscreenAll();
        };
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
