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
 * iFrames
 */

    function unsetSrc(element) {
        var source = element.getAttribute("src");
        if (source) {
            var clone = element.cloneNode(false);
            clone.setAttribute("data-src", source);
            clone.setAttribute("src", "");
            element.parentNode.replaceChild(clone, element);
        }
    };

    function unsetSrcOfProject(project) {
        var target = getChildBySelector(project, "iframe");
        if (target) {
            unsetSrc(target);
        };
    }

    function unsetSrcAll(array) {
        array.forEach(function (element) {
            unsetSrc(element);
        });
    };

    function resetSrc(element) {
        var source = element.getAttribute("data-src");
        if (source) {
            var clone = element.cloneNode(false);
            clone.setAttribute("src", source);
            element.parentNode.replaceChild(clone, element);
        }
    };

    function resetSrcOfProject(project) {
        var target = getChildBySelector(project, "iframe");
        if (target) {
            resetSrc(target);
        };
    };

/*
 * Projects
 */

    var projectView = document.querySelector("[data-project-view]");
    var projects = toArray(document.querySelectorAll("[data-project]"));
    var projectButtons = toArray(document.querySelectorAll('[data-script="project-button"]'));
    var projectTransitionTime = getTransitionTime(document.querySelector("[data-project]"));

    function primeProjects() {
        projectView.classList.add("no-height", "expand-children");
        projects.forEach(function (project) {
            project.classList.remove("full-width", "target-display");
            project.classList.add("no-height");
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

    function closeProject(project) {
        project.classList.add("no-height");
        project.classList.remove("t-open-project", "translate-x-none");
        project.setAttribute("data-project-state", "closed");
    };

    function slideProjectLeft(project) {
        project.classList.add("translate-x-left");
        project.classList.remove("translate-x-right");
    };

    function slideProjectRight(project) {
        project.classList.add("translate-x-right");
        project.classList.remove("translate-x-left");
    };

    var justClicked = false;

    function openProject(target) {
        if (justClicked) {
            return false;
        }

        var open = document.querySelector('[data-project-state="open"]');
        var targetIndex = Number(target.getAttribute("data-index"));
        var targetHeight = getChildBySelector(target, "[data-project-content]").scrollHeight;

        target.setAttribute("data-project-state", "open");
        target.classList.add("t-open-project", "translate-x-none");
        target.classList.remove("no-height", "translate-x-left", "translate-x-right");

        projects.forEach(function (project) {
            var projectIndex = Number(project.getAttribute("data-index"));
            if (projectIndex != targetIndex) {
                if (projectIndex < targetIndex) {
                    slideProjectLeft(project);
                } else {
                    slideProjectRight(project);
                }
                closeProject(project);
            }
        });

        if (target === open) {
            closeProjectView();
            closeProject(target);
            clearClass("translate-x-left", projects);
            clearClass("translate-x-right", projects);
        } else {
            expandProjectView(targetHeight);
        }

        justClicked = true;

        window.setTimeout(function () {
            resetSrcOfProject(target);
            if (open) {
                unsetSrcOfProject(open);
            }
            justClicked = false;
        }, projectTransitionTime);
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
        unsetSrcAll(toArray(document.getElementsByTagName("iframe")));
        if (window.location.hash) {
            var open = document.querySelector(window.location.hash);
            resetSrcOfProject(open);
            openProject(open);
        }

        projectButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                openProject(document.querySelector(button.hash));
                pushState(button.hash);
            });
        });

        window.addEventListener("popstate", function (event) {
            if (event.state) {
                var target = document.querySelector(event.state.hasFocus);
                if (target.hasAttribute("data-project")) {
                    openProject(target);
                }
            } else {
                var open = document.querySelector('[data-project-state="open"]');
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
